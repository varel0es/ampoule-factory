const { Production, Employee, sequelize } = require('../models');
const { Op } = require('sequelize');

// ================================================
// GET /api/productions
// Liste les productions avec filtres
// ================================================
exports.getAll = async (req, res) => {
  try {
    const {
      page        = 1,
      limit       = 20,
      employee_id,
      date,
      from,
      to
    } = req.query;

    const where = {};

    // Un employé ne voit que SES productions
    if (req.user.role === 'employee') {
      where.employee_id = req.user.employee_id;
    } else if (employee_id) {
      // Admin peut filtrer par employé
      where.employee_id = employee_id;
    }

    // Filtre par date exacte
    if (date) {
      where.production_date = date;
    }

    // Filtre par période
    if (from && to) {
      where.production_date = { [Op.between]: [from, to] };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Production.findAndCountAll({
      where,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name']
      }],
      order: [['production_date', 'DESC']],
      limit:  parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        productions: rows,
        pagination: {
          total: count,
          page:  parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (err) {
    console.error('Erreur getAll productions :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// GET /api/productions/today
// Résumé de la production du jour
// ================================================
exports.getToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const productions = await Production.findAll({
      where: { production_date: today },
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name']
      }],
      order: [['created_at', 'DESC']]
    });

    // Calcule les totaux du jour
    const summary = {
      date:            today,
      total_employees: productions.length,
      total_assembled: productions.reduce((sum, p) => sum + p.assembled_count, 0),
      total_damaged:   productions.reduce((sum, p) => sum + p.damaged_count, 0),
      total_salary:    productions.reduce((sum, p) => sum + parseFloat(p.daily_salary), 0),
      productions
    };

    res.json({ success: true, data: summary });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// GET /api/productions/weekly
// Données pour le graphique des 7 derniers jours
// ================================================
exports.getWeekly = async (req, res) => {
  try {
    // Génère les 7 derniers jours
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // Pour chaque jour récupère les totaux
    const chartData = await Promise.all(
      days.map(async (date) => {
        const productions = await Production.findAll({
          where: { production_date: date }
        });

        return {
          date,
          assembled: productions.reduce((s, p) => s + p.assembled_count, 0),
          damaged:   productions.reduce((s, p) => s + p.damaged_count, 0),
          salary:    productions.reduce((s, p) => s + parseFloat(p.daily_salary), 0)
        };
      })
    );

    res.json({ success: true, data: { chart: chartData } });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// POST /api/productions
// Enregistrer la production d'un employé
// ================================================
exports.create = async (req, res) => {
  try {
    const {
      employee_id,
      production_date,
      assembled_count,
      damaged_count,
      notes
    } = req.body;

    // Validation des champs obligatoires
    if (!employee_id || !production_date) {
      return res.status(400).json({
        success: false,
        message: 'Employé et date obligatoires.'
      });
    }

    if (assembled_count === undefined || damaged_count === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Nombre d\'ampoules assemblées et endommagées obligatoires.'
      });
    }

    // Vérifie que l'employé existe
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé introuvable.'
      });
    }

    // Vérifie qu'il n'y a pas déjà une entrée ce jour
    const existing = await Production.findOne({
      where: { employee_id, production_date }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Une production existe déjà pour ${employee.first_name} 
                  le ${production_date}. Utilisez la modification.`
      });
    }

    // Crée la production
    // Le salaire est calculé automatiquement par le hook beforeSave
    const production = await Production.create({
      employee_id,
      production_date,
      assembled_count: parseInt(assembled_count),
      damaged_count:   parseInt(damaged_count),
      notes:           notes || null
    });

    // Récupère avec les infos de l'employé
    const created = await Production.findByPk(production.id, {
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Production enregistrée avec succès.',
      data: { production: created }
    });

  } catch (err) {
    console.error('Erreur create production :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// PUT /api/productions/:id
// Modifier une production
// ================================================
exports.update = async (req, res) => {
  try {
    const { assembled_count, damaged_count, notes } = req.body;

    const production = await Production.findByPk(req.params.id);

    if (!production) {
      return res.status(404).json({
        success: false,
        message: 'Production introuvable.'
      });
    }

    // Met à jour
    // Le hook recalcule automatiquement le salaire
    await production.update({
      assembled_count: parseInt(assembled_count),
      damaged_count:   parseInt(damaged_count),
      notes:           notes || production.notes
    });

    res.json({
      success: true,
      message: 'Production mise à jour.',
      data: { production }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// DELETE /api/productions/:id
// Supprimer une production
// ================================================
exports.delete = async (req, res) => {
  try {
    const production = await Production.findByPk(req.params.id);

    if (!production) {
      return res.status(404).json({
        success: false,
        message: 'Production introuvable.'
      });
    }

    await production.destroy();

    res.json({
      success: true,
      message: 'Production supprimée.'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};