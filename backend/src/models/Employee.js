const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Employee = sequelize.define('Employee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Prénom
  first_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  // Nom de famille
  last_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },

  // Numéro de téléphone
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },

  // Actif ou non (suppression douce)
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }

}, {
  tableName: 'employees',
  timestamps: true,

  // GETTER : propriété calculée automatiquement
  getterMethods: {
    full_name() {
      return `${this.first_name} ${this.last_name}`;
    }
  }
});

module.exports = Employee;