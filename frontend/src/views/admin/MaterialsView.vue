<template>
  <div>
    <!-- Stock Cards -->
    <div class="materials-grid">
      <div v-for="m in materials" :key="m.id"
        class="material-card"
        :class="{ 'low-stock': m.is_low_stock }">
        <div class="material-header">
          <h3>{{ m.display_name }}</h3>
          <span class="badge"
            :class="m.is_low_stock ? 'badge-danger' : 'badge-success'">
            {{ m.is_low_stock ? '⚠️ Faible' : '✅ OK' }}
          </span>
        </div>
        <div class="material-stock">
          <span class="stock-value">{{ m.current_stock }}</span>
          <span class="stock-unit">{{ m.unit }}</span>
        </div>
        <div class="material-threshold">
          Seuil d'alerte : {{ m.alert_threshold }} {{ m.unit }}
        </div>
        <div class="material-actions">
          <button class="btn btn-success btn-sm" @click="openAddModal(m)">
            + Ajouter stock
          </button>
          <button class="btn btn-outline btn-sm" @click="viewLogs(m)">
            📋 Historique
          </button>
        </div>
      </div>
    </div>

    <!-- Retrait journalier -->
    <div class="card mt-2">
      <h3 class="section-title">📤 Retrait journalier</h3>
      <div class="withdraw-grid">
        <div v-for="m in materials" :key="m.id" class="form-group">
          <label>{{ m.display_name }}</label>
          <input
            v-model="withdrawals[m.id]"
            type="number" min="0"
            class="form-control"
            :placeholder="`Stock: ${m.current_stock}`"
          />
        </div>
      </div>
      <div class="form-group">
        <label>Note</label>
        <input v-model="withdrawNote" class="form-control"
          placeholder="Ex: Production du jour" />
      </div>
      <button class="btn btn-warning" @click="doWithdraw" :disabled="withdrawing">
        {{ withdrawing ? 'Enregistrement...' : '📤 Enregistrer les retraits' }}
      </button>
      <div v-if="withdrawSuccess" class="alert alert-success mt-1">
        {{ withdrawSuccess }}
      </div>
      <div v-if="withdrawError" class="alert alert-danger mt-1">
        {{ withdrawError }}
      </div>
    </div>

    <!-- Modal Ajouter stock -->
    <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal=false">
      <div class="modal">
        <div class="modal-header">
          <h3>Ajouter stock — {{ selectedMaterial?.display_name }}</h3>
          <button @click="showAddModal=false">✕</button>
        </div>
        <div class="form-group">
          <label>Quantité à ajouter</label>
          <input v-model="addForm.quantity" type="number"
            min="1" class="form-control" />
        </div>
        <div class="form-group">
          <label>Note</label>
          <input v-model="addForm.note" class="form-control"
            placeholder="Ex: Livraison du fournisseur" />
        </div>
        <div v-if="addError" class="alert alert-danger">{{ addError }}</div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showAddModal=false">Annuler</button>
          <button class="btn btn-success" @click="confirmAddStock" :disabled="adding">
            {{ adding ? 'Ajout...' : 'Ajouter' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Historique -->
    <div v-if="showLogsModal" class="modal-overlay" @click.self="showLogsModal=false">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3>Historique — {{ selectedMaterial?.display_name }}</h3>
          <button @click="showLogsModal=false">✕</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Quantité</th>
              <th>Avant</th>
              <th>Après</th>
              <th>Note</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td>{{ log.log_date }}</td>
              <td>
                <span class="badge"
                  :class="log.type==='add' ? 'badge-success' : 'badge-warning'">
                  {{ log.type === 'add' ? '➕ Ajout' : '➖ Retrait' }}
                </span>
              </td>
              <td>{{ log.quantity }}</td>
              <td>{{ log.stock_before }}</td>
              <td>{{ log.stock_after }}</td>
              <td>{{ log.note || '—' }}</td>
            </tr>
            <tr v-if="!logs.length">
              <td colspan="6" class="text-center">Aucun historique</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { materialService } from '../../services/api';

const materials      = ref([]);
const withdrawals    = ref({});
const withdrawNote   = ref('');
const withdrawing    = ref(false);
const withdrawSuccess = ref('');
const withdrawError  = ref('');
const showAddModal   = ref(false);
const showLogsModal  = ref(false);
const selectedMaterial = ref(null);
const logs           = ref([]);
const adding         = ref(false);
const addError       = ref('');
const addForm        = ref({ quantity: '', note: '' });

const fetchMaterials = async () => {
  try {
    const res = await materialService.getAll();
    materials.value = res.data.materials;
  } catch (err) { console.error(err); }
};

const openAddModal = (m) => {
  selectedMaterial.value = m;
  addForm.value = { quantity: '', note: '' };
  addError.value = '';
  showAddModal.value = true;
};

const confirmAddStock = async () => {
  adding.value = true;
  addError.value = '';
  try {
    await materialService.addStock(selectedMaterial.value.id, addForm.value);
    showAddModal.value = false;
    fetchMaterials();
  } catch (err) {
    addError.value = err.message;
  } finally {
    adding.value = false;
  }
};

const viewLogs = async (m) => {
  selectedMaterial.value = m;
  try {
    const res = await materialService.getLogs(m.id);
    logs.value = res.data.logs;
    showLogsModal.value = true;
  } catch (err) { console.error(err); }
};

const doWithdraw = async () => {
  withdrawing.value = true;
  withdrawSuccess.value = '';
  withdrawError.value = '';
  try {
    const items = Object.entries(withdrawals.value)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ material_id: parseInt(id), quantity: parseInt(qty) }));

    if (!items.length) {
      withdrawError.value = 'Entrez au moins une quantité.';
      return;
    }

    await materialService.withdraw({ withdrawals: items, note: withdrawNote.value });
    withdrawSuccess.value = 'Retraits enregistrés avec succès !';
    withdrawals.value = {};
    withdrawNote.value = '';
    fetchMaterials();
  } catch (err) {
    withdrawError.value = err.message;
  } finally {
    withdrawing.value = false;
  }
};

onMounted(fetchMaterials);
</script>

<style scoped>
.materials-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.material-card {
  background: white;
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
  border-left: 4px solid var(--success);
}
.material-card.low-stock { border-left-color: var(--danger); }
.material-header {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 12px;
}
.material-header h3 { font-size: 15px; font-weight: 600; }
.stock-value { font-size: 32px; font-weight: 700; color: var(--text); }
.stock-unit  { font-size: 14px; color: var(--text-light); margin-left: 4px; }
.material-threshold { font-size: 12px; color: var(--text-light); margin: 8px 0; }
.material-actions { display: flex; gap: 8px; margin-top: 12px; }
.withdraw-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.section-title {
  font-size: 15px; font-weight: 600;
  margin-bottom: 16px; padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.btn-sm { padding: 6px 10px; font-size: 12px; }
.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: white; border-radius: var(--radius);
  padding: 24px; width: 100%; max-width: 480px;
  max-height: 90vh; overflow-y: auto;
}
.modal-lg { max-width: 700px; }
.modal-header {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 20px;
}
.modal-header button { background: none; border: none; font-size: 18px; cursor: pointer; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
@media (max-width: 768px) {
  .materials-grid, .withdraw-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>