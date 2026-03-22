require('dotenv').config();
const { sequelize, User, Material } = require('../models');

const seed = async () => {
  try {
    // Synchronise les models avec la BDD
    // force: true = recrée les tables (attention en production !)
    await sequelize.sync({ force: true });
    console.log('✅ Tables créées');

    // Créer le compte admin
    await User.create({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: 'admin',
      employee_id: null
    });
    console.log('✅ Compte admin créé');

    // Créer les 4 matériaux de base
    await Material.bulkCreate([
      {
        name: 'culot',
        display_name: 'Culot',
        current_stock: 1000,
        alert_threshold: 200,
        unit: 'pièces'
      },
      {
        name: 'plot',
        display_name: 'Plot',
        current_stock: 1000,
        alert_threshold: 200,
        unit: 'pièces'
      },
      {
        name: 'plaque',
        display_name: 'Plaque',
        current_stock: 1000,
        alert_threshold: 200,
        unit: 'pièces'
      },
      {
        name: 'tete_ronde',
        display_name: 'Tête ronde',
        current_stock: 1000,
        alert_threshold: 200,
        unit: 'pièces'
      }
    ]);
    console.log('✅ Matériaux créés');

    console.log('');
    console.log('🎉 Base de données initialisée avec succès !');
    console.log('📧 Admin email    :', process.env.ADMIN_EMAIL);
    console.log('🔑 Admin password :', process.env.ADMIN_PASSWORD);

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
  }
};

seed();