const { User, Employee, Production, Payment, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');

// ================================================
// GET /api/employees
// Liste tous les employés avec pagination et recherche
// ================================================
exports.getAll = async (req, res) => {
  try {
    // Récupère les paramètres de la requête
    // Ex: /api/employees?search=jean&page=1&limit=10
    const {
      search = '',
      page = 1,
      limit = 10,
      status
    } = req.query;

    // Construction du filtre de recherche
    const where = {};

    // Filtre par nom ou prénom
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.like]: `%${search}%` } },
        { last_name:  { [Op.like]: `%${search}%` } },
        { phone:      { [Op.like]: `%${search}%` } }
      ];
    }

    // Filtre par statut actif/inactif
    if (status !== undefined) {
      where.is_active = status === 'true';
    }

    // Calcul de l'offset pour la pagination
    // Page 1 → offset 0, Page 2 → offset 10, etc.
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Requête avec pagination
    const { count, rows } = await Employee.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'is_active']
        // On exclut le mot de passe
      }],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        employees: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (err) {
    console.error('Erreur getAll employees :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// GET /api/employees/:id
// Un seul employé avec ses stats
// ================================================
exports.getOne = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'is_active']
      }]
    });

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé introuvable.'
      });
    }

    res.json({ success: true, data: { employee } });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// POST /api/employees
// Créer un employé + son compte utilisateur
// ================================================
exports.create = async (req, res) => {
  // Transaction : si une étape échoue, tout est annulé
  const t = await sequelize.transaction();

  try {
    const { first_name, last_name, phone, email, password } = req.body;

    // Validation basique
    if (!first_name || !last_name) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Prénom et nom obligatoires.'
      });
    }

    if (!email || !password) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe obligatoires.'
      });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé.'
      });
    }

    // 1. Créer l'employé
    const employee = await Employee.create(
      { first_name, last_name, phone },
      { transaction: t }
    );

    // 2. Créer son compte utilisateur
    await User.create(
      {
        email: email.toLowerCase(),
        password,           // sera chiffré par le hook beforeSave
        role: 'employee',
        employee_id: employee.id
      },
      { transaction: t }
    );

    // 3. Valider la transaction
    await t.commit();

    // Récupère l'employé avec son compte
    const created = await Employee.findByPk(employee.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'email'] }]
    });

    res.status(201).json({
      success: true,
      message: 'Employé créé avec succès.',
      data: { employee: created }
    });

  } catch (err) {
    await t.rollback();
    console.error('Erreur create employee :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// PUT /api/employees/:id
// Modifier un employé
// ================================================
exports.update = async (req, res) => {
  try {
    const { first_name, last_name, phone, is_active } = req.body;

    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé introuvable.'
      });
    }

    // Met à jour seulement les champs envoyés
    await employee.update({
      first_name: first_name || employee.first_name,
      last_name:  last_name  || employee.last_name,
      phone:      phone      || employee.phone,
      is_active:  is_active  !== undefined ? is_active : employee.is_active
    });

    // Si on désactive l'employé, désactive aussi son compte
    if (is_active === false) {
      await User.update(
        { is_active: false },
        { where: { employee_id: employee.id } }
      );
    }

    res.json({
      success: true,
      message: 'Employé mis à jour.',
      data: { employee }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// DELETE /api/employees/:id
// Suppression douce (désactivation)
// ================================================
exports.delete = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employé introuvable.'
      });
    }

    // Suppression douce : on désactive, on ne supprime pas
    // L'historique de production et paiements est préservé
    await employee.update({ is_active: false });
    await User.update(
      { is_active: false },
      { where: { employee_id: employee.id } }
    );

    res.json({
      success: true,
      message: 'Employé désactivé avec succès.'
    });

  } catch (err) {
     console.error('Erreur getAll employees :', err.message);
     console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};