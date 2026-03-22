const { Employee, Material, Production, Payment, sequelize } = require('../models');
const { Op } = require('sequelize');

// ================================================
// GET /api/dashboard
// Toutes les statistiques pour le tableau de bord admin
// ================================================
exports.getDashboard = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Date du premier jour du mois courant
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    const monthStart = firstDayOfMonth.toISOString().split('T')[0];

    // ============================================
    // 1. STATISTIQUES EMPLOYÉS
    // ============================================
    const totalEmployees = await Employee.count({
      where: { is_active: true }
    });

    // ============================================
    // 2. PRODUCTION DU JOUR
    // ============================================
    const todayProductions = await Production.findAll({
      where: { production_date: today },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name']
      }]
    });

    const todayStats = {
      total_employees: todayProductions.length,
      total_assembled: todayProductions.reduce(
        (sum, p) => sum + p.assembled_count, 0
      ),
      total_damaged: todayProductions.reduce(
        (sum, p) => sum + p.damaged_count, 0
      ),
      total_salary: todayProductions.reduce(
        (sum, p) => sum + parseFloat(p.daily_salary), 0
      )
    };

    // ============================================
    // 3. STATISTIQUES DU MOIS
    // ============================================
    const monthProductions = await Production.findAll({
      where: {
        production_date: { [Op.between]: [monthStart, today] }
      }
    });

    const monthStats = {
      total_assembled: monthProductions.reduce(
        (sum, p) => sum + p.assembled_count, 0
      ),
      total_damaged: monthProductions.reduce(
        (sum, p) => sum + p.damaged_count, 0
      ),
      total_salary: monthProductions.reduce(
        (sum, p) => sum + parseFloat(p.daily_salary), 0
      )
    };

    // ============================================
    // 4. MATÉRIAUX ET ALERTES STOCK
    // ============================================
    const materials = await Material.findAll();

    const materialsWithAlert = materials.map(m => ({
      ...m.toJSON(),
      is_low_stock: m.current_stock <= m.alert_threshold
    }));

    const lowStockAlerts = materialsWithAlert.filter(m => m.is_low_stock);

    // ============================================
    // 5. PAIEMENTS EN ATTENTE
    // ============================================
    const pendingPayments = await Payment.count({
      where: { status: 'pending' }
    });

    const pendingAmount = await Payment.sum('amount', {
      where: { status: 'pending' }
    }) || 0;

    // ============================================
    // 6. TOP EMPLOYÉS DU MOIS
    // ============================================
    const topEmployees = await Production.findAll({
      where: {
        production_date: { [Op.between]: [monthStart, today] }
      },
      attributes: [
        'employee_id',
        [sequelize.fn('SUM', sequelize.col('assembled_count')), 'total_assembled'],
        [sequelize.fn('SUM', sequelize.col('daily_salary')),   'total_salary']
      ],
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name']
      }],
      group: [
        'employee_id',
        'employee.id',
        'employee.first_name',
        'employee.last_name'
      ],
      order: [[sequelize.literal('total_assembled'), 'DESC']],
      limit: 5
    });

    // ============================================
    // 7. GRAPHIQUE 7 DERNIERS JOURS
    // ============================================
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    const weeklyChart = await Promise.all(
      days.map(async (date) => {
        const prods = await Production.findAll({
          where: { production_date: date }
        });
        return {
          date,
          assembled: prods.reduce((s, p) => s + p.assembled_count, 0),
          damaged:   prods.reduce((s, p) => s + p.damaged_count, 0),
          salary:    prods.reduce((s, p) => s + parseFloat(p.daily_salary), 0)
        };
      })
    );

    // ============================================
    // RÉPONSE FINALE
    // ============================================
    res.json({
      success: true,
      data: {
        // Chiffres clés
        kpi: {
          total_employees:  totalEmployees,
          pending_payments: pendingPayments,
          pending_amount:   parseFloat(pendingAmount),
          low_stock_count:  lowStockAlerts.length
        },

        // Production
        today:  todayStats,
        month:  monthStats,

        // Matériaux
        materials:       materialsWithAlert,
        low_stock_alerts: lowStockAlerts,

        // Classement
        top_employees: topEmployees,

        // Graphique
        weekly_chart: weeklyChart,

        // Productions du jour détaillées
        today_productions: todayProductions
      }
    });

  } catch (err) {
    console.error('Erreur dashboard :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};