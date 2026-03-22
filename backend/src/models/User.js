const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  // Identifiant unique, auto-incrémenté
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },

  // Email de connexion, doit être unique
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true  // Sequelize vérifie le format email
    }
  },

  // Mot de passe (sera chiffré automatiquement)
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },

  // Rôle : admin ou employee
  role: {
    type: DataTypes.ENUM('admin', 'employee'),
    defaultValue: 'employee'
  },

  // Lien vers l'employé (null si admin)
  employee_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // Compte actif ou non
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }

}, {
  tableName: 'users',  // Nom exact de la table dans la BDD
  timestamps: true,    // Ajoute created_at et updated_at automatiquement

  // HOOKS : fonctions qui s'exécutent automatiquement
  hooks: {
    // Avant de sauvegarder : chiffre le mot de passe
    beforeSave: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
        // 12 = niveau de complexité du chiffrement
      }
    }
  }
});

// Méthode pour vérifier un mot de passe
User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Méthode pour cacher le mot de passe dans les réponses JSON
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.password;  // On ne renvoie jamais le mot de passe
  return values;
};

module.exports = User;