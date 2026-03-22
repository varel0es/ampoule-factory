// On importe Sequelize
const { Sequelize } = require('sequelize');

// On charge les variables du fichier .env
require('dotenv').config();

// On crée la connexion
const sequelize = new Sequelize(
  process.env.DB_NAME,      // ampoule_factory
  process.env.DB_USER,      // factory_user
  process.env.DB_PASSWORD,  // ton mot de passe
  {
    host: process.env.DB_HOST,  // localhost
    dialect: 'mysql',           // MariaDB est compatible mysql
    logging: false,             // Désactive les logs SQL (trop verbeux)
    pool: {
      max: 5,       // Maximum 5 connexions simultanées
      min: 0,       // Minimum 0 connexion inactive
      acquire: 30000, // Timeout connexion : 30 secondes
      idle: 10000     // Ferme une connexion inactive après 10 secondes
    }
  }
);

module.exports = sequelize;