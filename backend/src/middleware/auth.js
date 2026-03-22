const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ================================================
// MIDDLEWARE : Vérifie que l'utilisateur est connecté
// ================================================
const authenticate = async (req, res, next) => {
  try {
    // 1. Récupère le token dans le header de la requête
    // Le header ressemble à : Authorization: Bearer eyJhbGc...
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Accès refusé. Token manquant.'
      });
    }

    // 2. Extrait le token (enlève "Bearer ")
    const token = authHeader.split(' ')[1];

    // 3. Vérifie et décode le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Si le token est invalide ou expiré, jwt.verify lance une erreur

    // 4. Récupère l'utilisateur depuis la BDD
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur introuvable ou désactivé.'
      });
    }

    // 5. Attache l'utilisateur à la requête
    // Ainsi les controllers peuvent accéder à req.user
    req.user = user;

    // 6. Passe au prochain middleware ou controller
    next();

  } catch (err) {
    // Token expiré
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expirée. Reconnectez-vous.'
      });
    }
    // Token invalide
    return res.status(401).json({
      success: false,
      message: 'Token invalide.'
    });
  }
};

// ================================================
// MIDDLEWARE : Vérifie que l'utilisateur est admin
// ================================================
const isAdmin = (req, res, next) => {
  // Ce middleware s'utilise APRÈS authenticate
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs.'
    });
  }
  next();
};

// ================================================
// MIDDLEWARE : Vérifie que c'est le bon employé ou admin
// ================================================
const isOwnerOrAdmin = (req, res, next) => {
  // Un employé ne peut voir que SES données
  // Un admin peut voir TOUT
  const requestedId = parseInt(req.params.employee_id || req.params.id);

  if (req.user.role === 'admin' || req.user.employee_id === requestedId) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Accès non autorisé.'
  });
};

module.exports = { authenticate, isAdmin, isOwnerOrAdmin };