const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Voir les matériaux → admin et employé peuvent voir
router.get('/', authenticate, materialController.getAll);

// Ajouter stock → admin seulement
router.put('/:id/add', authenticate, isAdmin, materialController.addStock);

// Retrait journalier → admin seulement
router.post('/withdraw', authenticate, isAdmin, materialController.withdraw);

// Historique → admin seulement
router.get('/:id/logs', authenticate, isAdmin, materialController.getLogs);

// Modifier seuil alerte → admin seulement
router.put('/:id/threshold', authenticate, isAdmin, materialController.updateThreshold);

module.exports = router;