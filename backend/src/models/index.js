const sequelize = require('../config/database');

// Import de tous les models
const User       = require('./User');
const Employee   = require('./Employee');
const Material   = require('./Material');
const MaterialLog = require('./MaterialLog');
const Production = require('./Production');
const Payment    = require('./Payment');

// =============================================
// ASSOCIATIONS (relations entre les tables)
// =============================================

// Un employé possède un compte utilisateur
Employee.hasOne(User, {
  foreignKey: 'employee_id',
  as: 'user'
});
User.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// Un employé a plusieurs productions
Employee.hasMany(Production, {
  foreignKey: 'employee_id',
  as: 'productions'
});
Production.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// Un employé a plusieurs paiements
Employee.hasMany(Payment, {
  foreignKey: 'employee_id',
  as: 'payments'
});
Payment.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// Un matériau a plusieurs logs
Material.hasMany(MaterialLog, {
  foreignKey: 'material_id',
  as: 'logs'
});
MaterialLog.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material'
});

// Export de tout
module.exports = {
  sequelize,
  User,
  Employee,
  Material,
  MaterialLog,
  Production,
  Payment
};