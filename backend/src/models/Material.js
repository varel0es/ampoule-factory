const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Material = sequelize.define('Material', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  display_name: { type: DataTypes.STRING(100), allowNull: false },
  current_stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  alert_threshold: { type: DataTypes.INTEGER, defaultValue: 100 },
  unit: { type: DataTypes.STRING(20), defaultValue: 'pièces' }
}, {
  tableName: 'materials',
  timestamps: false
});

module.exports = Material;
