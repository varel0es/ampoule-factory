const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Production = sequelize.define('Production', {
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

  // Quelle journée
  production_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },

  // Nombre d'ampoules assemblées
  assembled_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // Nombre d'ampoules endommagées
  damaged_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },

  // Salaire calculé automatiquement
  daily_salary: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },

  // Notes optionnelles
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {
  tableName: 'productions',
  timestamps: true,

  // Un employé ne peut avoir qu'une seule entrée par jour
  indexes: [
    {
      unique: true,
      fields: ['employee_id', 'production_date']
    }
  ],

  hooks: {
    // Calcule automatiquement le salaire avant chaque sauvegarde
    beforeSave: (production) => {
      // Formule : (assemblées × 15) - (endommagées × 500)
      const salary =
        (production.assembled_count * 15) -
        (production.damaged_count * 500);

      // Le salaire ne peut pas être négatif
      production.daily_salary = Math.max(0, salary);
    }
  }
});

module.exports = Production;