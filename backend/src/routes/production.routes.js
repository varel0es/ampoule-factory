const express = require('express');
const router = express.Router();
const productionController = require('../controllers/productionController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Résumé du jour → admin seulement
router.get('/today',   authenticate, isAdmin, productionController.getToday);

// Graphique 7 jours → admin seulement
router.get('/weekly',  authenticate, isAdmin, productionController.getWeekly);

// Liste des productions → admin voit tout, employé voit le sien
router.get('/',        authenticate, productionController.getAll);

// Créer → admin seulement
router.post('/',       authenticate, isAdmin, productionController.create);

// Modifier → admin seulement
router.put('/:id',     authenticate, isAdmin, productionController.update);

// Supprimer → admin seulement
router.delete('/:id',  authenticate, isAdmin, productionController.delete);

module.exports = router;