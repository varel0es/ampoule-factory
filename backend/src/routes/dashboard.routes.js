const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate, isAdmin } = require('../middleware/auth');

// Dashboard → admin seulement
router.get('/', authenticate, isAdmin, dashboardController.getDashboard);

module.exports = router;