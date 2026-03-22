const jwt = require('jsonwebtoken');
const { User, Employee } = require('../models');

// Fonction utilitaire pour créer un token JWT
const createToken = (user) => {
  return jwt.sign(
    {
      id: user.id,              // ID du compte
      role: user.role,          // admin ou employee
      employee_id: user.employee_id  // lien vers l'employé
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ================================================
// POST /api/auth/login
// ================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Vérification des champs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis.'
      });
    }

    // 2. Cherche l'utilisateur avec son profil employé
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    // 3. Utilisateur existe ?
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // 4. Compte actif ?
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    // 5. Mot de passe correct ?
    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect.'
      });
    }

    // 6. Crée le token JWT
    const token = createToken(user);

    // 7. Renvoie le token et les infos utilisateur
    res.json({
      success: true,
      message: 'Connexion réussie.',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          employee: user.employee
        }
      }
    });

  } catch (err) {
    console.error('Erreur login :', err.message);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  }
};

// ================================================
// GET /api/auth/me
// Retourne le profil de l'utilisateur connecté
// ================================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Employee,
        as: 'employee'
      }]
    });

    res.json({
      success: true,
      data: { user }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  }
};

// ================================================
// PUT /api/auth/password
// Changer son mot de passe
// ================================================
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Ancien et nouveau mot de passe requis.'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit faire au moins 6 caractères.'
      });
    }

    // Récupère l'utilisateur avec son mot de passe
    const user = await User.findByPk(req.user.id);

    // Vérifie l'ancien mot de passe
    const isValid = await user.verifyPassword(current_password);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel incorrect.'
      });
    }

    // Met à jour (le hook beforeSave chiffre automatiquement)
    user.password = new_password;
    await user.save();

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès.'
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Erreur serveur.'
    });
  }
};