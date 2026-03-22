const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Quel employé
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  // Montant à payer
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },

  // Période couverte
  period_start: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  period_end: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  // État du paiement
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'confirmed'),
    defaultValue: 'pending'
    // pending  = en attente de paiement
    // paid     = payé par l'admin
    // confirmed = confirmé par l'employé
  },

  // Quand a été payé
  paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Quand l'employé a confirmé
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Notes
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {
  tableName: 'payments',
  timestamps: true
});

module.exports = Payment;