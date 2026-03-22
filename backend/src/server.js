// Charge les variables .env en premier
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import de la connexion BDD
const { sequelize } = require('./models');

// Création de l'application Express
const app = express();
const PORT = process.env.PORT || 5000;

// ================================================
// MIDDLEWARES GLOBAUX
// (s'appliquent à toutes les requêtes)
// ================================================

// Sécurise les headers HTTP
app.use(helmet());

// Autorise le frontend (port 3000) à appeler le backend (port 5000)
app.use(cors({
  origin: function(origin, callback) {
    // Accepte tous les localhost (peu importe le port)
    if (!origin || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS')); 
         }
  },
  credentials: true
}));

// Limite à 100 requêtes par 15 minutes par IP
// Protège contre les attaques par force brute
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Trop de requêtes. Réessayez dans 15 minutes.'
  }
});
app.use('/api', limiter);

// Affiche les requêtes dans le terminal (utile en dev)
app.use(morgan('dev'));

// Permet de lire le JSON dans les requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================================================
// ROUTES
// ================================================
const authRoutes = require('./routes/auth.routes');
const employeeRoutes = require('./routes/employee.routes');
const materialRoutes = require('./routes/material.routes');
const productionRoutes = require('./routes/production.routes');
const paymentRoutes    = require('./routes/payment.routes');
const dashboardRoutes  = require('./routes/dashboard.routes');

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/productions', productionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
// Route de test pour vérifier que le serveur tourne
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🏭 API Usine Ampoules - Serveur opérationnel'
  });
});

// ================================================
// GESTION DES ERREURS GLOBALE
// ================================================

// Route inconnue → 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.path}`
  });
});

// Erreur serveur → 500
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err.message);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// ================================================
// DÉMARRAGE DU SERVEUR
// ================================================

const start = async () => {
  try {
    // Test de connexion à la BDD
    await sequelize.authenticate();
    console.log('✅ Connexion BDD établie');

    // Synchronise les models (ne recrée pas les tables)
    await sequelize.sync({ alter: false });
    console.log('✅ Models synchronisés');

    // Démarre le serveur
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Serveur démarré !');
      console.log(`📡 URL : http://localhost:${PORT}`);
      console.log('');
    });

  } catch (err) {
    console.error('❌ Impossible de démarrer :', err.message);
    process.exit(1);
  }
};

start();
