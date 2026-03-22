const { Material, MaterialLog, sequelize } = require('../models');
const { Op } = require('sequelize');

// ================================================
// GET /api/materials
// Liste tous les matériaux avec état du stock
// ================================================
exports.getAll = async (req, res) => {
  try {
    const materials = await Material.findAll({
      order: [['name', 'ASC']]
    });

    // Ajoute un indicateur d'alerte pour chaque matériau
    const materialsWithAlert = materials.map(m => ({
      ...m.toJSON(),
      is_low_stock: m.current_stock <= m.alert_threshold
    }));

    res.json({
      success: true,
      data: { materials: materialsWithAlert }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// PUT /api/materials/:id/add
// Ajouter du stock
// ================================================
exports.addStock = async (req, res) => {
  // Transaction pour garder stock et log synchronisés
  const t = await sequelize.transaction();

  try {
    const { quantity, note } = req.body;

    // Validation
    if (!quantity || parseInt(quantity) <= 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Quantité invalide.'
      });
    }

    // Trouve le matériau
    const material = await Material.findByPk(req.params.id, {
      transaction: t
    });

    if (!material) {
      await t.rollback();
      return res.status(404).json({
        success: false,
        message: 'Matériau introuvable.'
      });
    }

    // Calcule le nouveau stock
    const stockBefore = material.current_stock;
    const stockAfter  = stockBefore + parseInt(quantity);

    // Met à jour le stock
    await material.update(
      { current_stock: stockAfter },
      { transaction: t }
    );

    // Enregistre le log
    await MaterialLog.create({
      material_id:  material.id,
      type:         'add',
      quantity:     parseInt(quantity),
      stock_before: stockBefore,
      stock_after:  stockAfter,
      note:         note || null,
      recorded_by:  req.user.id,
      log_date:     new Date().toISOString().split('T')[0]
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: `${quantity} ${material.unit} ajoutés au stock de ${material.display_name}.`,
      data: {
        material: {
          ...material.toJSON(),
          current_stock: stockAfter
        }
      }
    });

  } catch (err) {
    await t.rollback();
    console.error('Erreur addStock :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// POST /api/materials/withdraw
// Retrait journalier de plusieurs matériaux
// ================================================
exports.withdraw = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    // withdrawals = tableau de { material_id, quantity }
    const { withdrawals, note } = req.body;

    if (!withdrawals || withdrawals.length === 0) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: 'Aucun matériau spécifié.'
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const results = [];

    // Traite chaque matériau un par un
    for (const item of withdrawals) {
      const material = await Material.findByPk(
        item.material_id,
        { transaction: t }
      );

      if (!material) continue;

      // Vérifie que le stock est suffisant
      if (material.current_stock < parseInt(item.quantity)) {
        await t.rollback();
        return res.status(400).json({
          success: false,
          message: `Stock insuffisant pour ${material.display_name}. 
                    Disponible : ${material.current_stock} ${material.unit}.`
        });
      }

      const stockBefore = material.current_stock;
      const stockAfter  = stockBefore - parseInt(item.quantity);

      // Met à jour le stock
      await material.update(
        { current_stock: stockAfter },
        { transaction: t }
      );

      // Enregistre le log
      await MaterialLog.create({
        material_id:  material.id,
        type:         'withdraw',
        quantity:     parseInt(item.quantity),
        stock_before: stockBefore,
        stock_after:  stockAfter,
        note:         note || null,
        recorded_by:  req.user.id,
        log_date:     today
      }, { transaction: t });

      results.push({
        material:    material.display_name,
        quantity:    item.quantity,
        stock_after: stockAfter,
        is_low:      stockAfter <= material.alert_threshold
      });
    }

    await t.commit();

    res.json({
      success: true,
      message: 'Retraits enregistrés avec succès.',
      data: { results }
    });

  } catch (err) {
    await t.rollback();
    console.error('Erreur withdraw :', err.message);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// GET /api/materials/:id/logs
// Historique des mouvements d'un matériau
// ================================================
exports.getLogs = async (req, res) => {
  try {
    const {
      page  = 1,
      limit = 20,
      from,
      to,
      type
    } = req.query;

    const where = { material_id: req.params.id };

    // Filtre par type (add ou withdraw)
    if (type) where.type = type;

    // Filtre par période
    if (from && to) {
      where.log_date = { [Op.between]: [from, to] };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await MaterialLog.findAndCountAll({
      where,
      order: [['log_date', 'DESC'], ['created_at', 'DESC']],
      limit:  parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        logs: rows,
        pagination: {
          total: count,
          page:  parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// ================================================
// PUT /api/materials/:id/threshold
// Modifier le seuil d'alerte
// ================================================
exports.updateThreshold = async (req, res) => {
  try {
    const { threshold } = req.body;

    const material = await Material.findByPk(req.params.id);

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Matériau introuvable.'
      });
    }

    await material.update({ alert_threshold: parseInt(threshold) });

    res.json({
      success: true,
      message: 'Seuil d\'alerte mis à jour.',
      data: { material }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};