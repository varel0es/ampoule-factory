const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Nom interne : culot, plot, plaque, tete_ronde
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },

  // Nom affiché à l'écran : "Tête ronde"
  display_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  // Stock actuel
  current_stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // Seuil d'alerte stock faible
  alert_threshold: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },

  // Unité de mesure
  unit: {
    type: DataTypes.STRING(20),
    defaultValue: 'pièces'
  }

}, {
  tableName: 'materials',
  timestamps: true
});

module.exports = Material;