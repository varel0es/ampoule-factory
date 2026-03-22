const { Payment, Employee, Production, sequelize } = require('../models');
const { Op } = require('sequelize');

// ================================================
// GET /api/payments
// Liste les paiements avec filtres
// ================================================
exports.getAll = async (req, res) => {
  try {
    const {
      page        = 1,
      limit       = 20,
      employee_id,
      status,
      from,
      to
    } = req.query;

    const where = {};

    // Employé ne voit que SES paiements
    if (req.user.role === 'employee') {
      where.employee_id = req.user.employee_id;
    } else if (employee_id) {
      where.employee_id = employee_id;
    }

    // Filtre par statut
    if (status) where.status = status;

    // Filtre par période
    if (from && to) {
      where.period_start = { [Op.between]: [from, to] };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name']
      }],
      order: [['created_at', 'DESC']],
      limit:  parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        payments: rows,
        pagination: {
          total: count,
          page:  parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (err) {
    console.error('Erreur getAll payments :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// GET /api/payments/summary/:employee_id
// Résumé financier complet d'un employé
// ================================================
exports.getSummary = async (req, res) => {
  try {
    const { employee_id } = req.params;

    // Vérifie les droits d'accès
    if (
      req.user.role === 'employee' &&
      req.user.employee_id !== parseInt(employee_id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé.'
      });
    }

    // Total des salaires gagnés (toutes productions)
    const totalEarned = await Production.sum('daily_salary', {
      where: { employee_id }
    }) || 0;

    // Total déjà payé
    const totalPaid = await Payment.sum('amount', {
      where: {
        employee_id,
        status: { [Op.in]: ['paid', 'confirmed'] }
      }
    }) || 0;

    // Total en attente de paiement
    const totalPending = await Payment.sum('amount', {
      where: { employee_id, status: 'pending' }
    }) || 0;

    // Reste à payer
    const balanceDue = totalEarned - totalPaid - totalPending;

    // Derniers paiements
    const recentPayments = await Payment.findAll({
      where: { employee_id },
      order: [['created_at', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_earned:   parseFloat(totalEarned),
          total_paid:     parseFloat(totalPaid),
          total_pending:  parseFloat(totalPending),
          balance_due:    parseFloat(balanceDue)
        },
        recent_payments: recentPayments
      }
    });

  } catch (err) {
    console.error('Erreur getSummary :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// POST /api/payments
// Créer un paiement pour un employé
// ================================================
exports.create = async (req, res) => {
  try {
    const {
      employee_id,
      amount,
      period_start,
      period_end,
      notes
    } = req.body;

    // Validations
    if (!employee_id || !amount || !period_start || !period_end) {
      return res.status(400).json({
        success: false,
        message: 'Employé, montant et période obligatoires.'
      });
    }

    if (parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Le montant doit être supérieur à 0.'
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

    const payment = await Payment.create({
      employee_id,
      amount:       parseFloat(amount),
      period_start,
      period_end,
      notes:        notes || null,
      status:       'pending'
    });

    // Récupère avec les infos employé
    const created = await Payment.findByPk(payment.id, {
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Paiement créé avec succès.',
      data: { payment: created }
    });

  } catch (err) {
    console.error('Erreur create payment :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// PUT /api/payments/:id/pay
// Admin marque le paiement comme effectué
// ================================================
exports.markAsPaid = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [{
        model: Employee,
        as: 'employee',
        attributes: ['id', 'first_name', 'last_name']
      }]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement introuvable.'
      });
    }

    // Vérifie que le paiement est en attente
    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Ce paiement est déjà "${payment.status}".`
      });
    }

    await payment.update({
      status:  'paid',
      paid_at: new Date()
    });

    res.json({
      success: true,
      message: `Paiement de ${payment.amount} FCFA marqué comme effectué.`,
      data: { payment }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// PUT /api/payments/:id/confirm
// Employé confirme la réception du paiement
// ================================================
exports.confirm = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement introuvable.'
      });
    }

    // Vérifie que c'est bien le paiement de cet employé
    if (payment.employee_id !== req.user.employee_id) {
      return res.status(403).json({
        success: false,
        message: 'Ce paiement ne vous appartient pas.'
      });
    }

    // On ne peut confirmer que ce qui est payé
    if (payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Ce paiement n\'a pas encore été effectué.'
      });
    }

    await payment.update({
      status:       'confirmed',
      confirmed_at: new Date()
    });

    res.json({
      success: true,
      message: 'Réception du paiement confirmée. Merci !',
      data: { payment }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// DELETE /api/payments/:id
// Supprimer un paiement (seulement si pending)
// ================================================
exports.delete = async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Paiement introuvable.'
      });
    }

    // On ne peut supprimer que les paiements en attente
    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Impossible de supprimer un paiement déjà effectué.'
      });
    }

    await payment.destroy();

    res.json({
      success: true,
      message: 'Paiement supprimé.'
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};