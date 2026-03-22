const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialLog = sequelize.define('MaterialLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Quel matériau concerné
  material_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // Type de mouvement : ajout ou retrait
  type: {
    type: DataTypes.ENUM('add', 'withdraw'),
    allowNull: false
  },

  // Quantité concernée
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // Stock avant l'opération (pour l'historique)
  stock_before: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // Stock après l'opération
  stock_after: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // Note optionnelle
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  // Qui a fait cette opération
  recorded_by: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // Date du mouvement
  log_date: {
    type: DataTypes.DATEONLY,  // Juste la date, pas l'heure
    allowNull: false
  }

}, {
  tableName: 'material_logs',
  timestamps: true
});

module.exports = MaterialLog;