const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MaterialLog = sequelize.define('MaterialLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  material_id: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.ENUM('add', 'withdraw'), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  stock_before: { type: DataTypes.INTEGER, allowNull: false },
  stock_after: { type: DataTypes.INTEGER, allowNull: false },
  note: { type: DataTypes.TEXT, allowNull: true },
  recorded_by: { type: DataTypes.INTEGER, allowNull: true },
  log_date: { type: DataTypes.DATEONLY, allowNull: false }
}, {
  tableName: 'material_logs',
  timestamps: false
});

module.exports = MaterialLog;
