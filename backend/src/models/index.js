const sequelize = require('../config/database');

const User        = require('./User');
const Employee    = require('./Employee');
const Material    = require('./Material');
const MaterialLog = require('./MaterialLog');
const Production  = require('./Production');
const Payment     = require('./Payment');

// ================================================
// ASSOCIATIONS
// ================================================

// User ↔ Employee
Employee.hasOne(User, {
  foreignKey: 'employee_id',
  as: 'user'
});
User.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// Employee ↔ Production
Employee.hasMany(Production, {
  foreignKey: 'employee_id',
  as: 'productions'
});
Production.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// Employee ↔ Payment
Employee.hasMany(Payment, {
  foreignKey: 'employee_id',
  as: 'payments'
});
Payment.belongsTo(Employee, {
  foreignKey: 'employee_id',
  as: 'employee'
});

// Material ↔ MaterialLog
Material.hasMany(MaterialLog, {
  foreignKey: 'material_id',
  as: 'logs'
});
MaterialLog.belongsTo(Material, {
  foreignKey: 'material_id',
  as: 'material'
});

// ================================================
// EXPORTS
// ================================================
module.exports = {
  sequelize,
  User,
  Employee,
  Material,
  MaterialLog,
  Production,
  Payment
};