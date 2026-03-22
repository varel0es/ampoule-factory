const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Toutes ces routes nécessitent d'être connecté ET admin
router.get('/',     authenticate, isAdmin, employeeController.getAll);
router.get('/:id',  authenticate, isAdmin, employeeController.getOne);
router.post('/',    authenticate, isAdmin, employeeController.create);
router.put('/:id',  authenticate, isAdmin, employeeController.update);
router.delete('/:id', authenticate, isAdmin, employeeController.delete);

module.exports = router;