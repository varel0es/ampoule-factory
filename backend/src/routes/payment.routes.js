const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Résumé financier d'un employé
// Admin voit tout, employé voit le sien (vérifié dans le controller)
router.get('/summary/:employee_id', authenticate, paymentController.getSummary);

// Liste des paiements
router.get('/',        authenticate, paymentController.getAll);

// Créer un paiement → admin seulement
router.post('/',       authenticate, isAdmin, paymentController.create);

// Marquer comme payé → admin seulement
router.put('/:id/pay', authenticate, isAdmin, paymentController.markAsPaid);

// Confirmer réception → employé concerné
router.put('/:id/confirm', authenticate, paymentController.confirm);

// Supprimer → admin seulement
router.delete('/:id',  authenticate, isAdmin, paymentController.delete);

module.exports = router;