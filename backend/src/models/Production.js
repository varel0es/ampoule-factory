const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Production = sequelize.define('Production', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  employee_id: { type: DataTypes.INTEGER, allowNull: false },
  production_date: { type: DataTypes.DATEONLY, allowNull: false },
  assembled_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  damaged_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  daily_salary: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'productions',
  timestamps: false,
  indexes: [{ unique: true, fields: ['employee_id', 'production_date'] }],
  hooks: {
    beforeSave: (production) => {
      const salary = (production.assembled_count * 15) - (production.damaged_count * 500);
      production.daily_salary = Math.max(0, salary);
    }
  }
});

module.exports = Production;
