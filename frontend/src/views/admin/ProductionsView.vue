<template>
  <div>
    <!-- Résumé du jour -->
    <div class="kpi-grid mb-3" v-if="todaySummary">
      <div class="kpi-card">
        <div class="kpi-icon">👥</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ todaySummary.total_employees }}</span>
          <span class="kpi-label">Employés aujourd'hui</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💡</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ todaySummary.total_assembled }}</span>
          <span class="kpi-label">Ampoules assemblées</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">❌</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ todaySummary.total_damaged }}</span>
          <span class="kpi-label">Ampoules endommagées</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ formatAmount(todaySummary.total_salary) }}</span>
          <span class="kpi-label">Total salaires</span>
        </div>
      </div>
    </div>

    <!-- Filtres + bouton -->
    <div class="flex justify-between items-center mb-2">
      <div class="flex gap-2">
        <input v-model="filters.date" type="date"
          class="form-control" @change="fetchProductions" />
        <select v-model="filters.employee_id"
          class="form-control" @change="fetchProductions">
          <option value="">Tous les employés</option>
          <option v-for="e in employees" :key="e.id" :value="e.id">
            {{ e.first_name }} {{ e.last_name }}
          </option>
        </select>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        + Nouvelle production
      </button>
    </div>

    <!-- Tableau -->
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Employé</th>
              <th>Assemblées</th>
              <th>Endommagées</th>
              <th>Salaire</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in productions" :key="p.id">
              <td>{{ p.production_date }}</td>
              <td>{{ p.employee?.first_name }} {{ p.employee?.last_name }}</td>
              <td>{{ p.assembled_count }}</td>
              <td>
                <span :class="p.damaged_count > 0 ? 'badge badge-danger' : ''">
                  {{ p.damaged_count }}
                </span>
              </td>
              <td><strong>{{ formatAmount(p.daily_salary) }}</strong></td>
              <td>
                <button class="btn btn-outline btn-sm" @click="openModal(p)">✏️</button>
                <button class="btn btn-danger btn-sm ml-1"
                  @click="deleteProduction(p.id)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!productions.length">
              <td colspan="6" class="text-center">Aucune production trouvée</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editing ? 'Modifier production' : 'Nouvelle production' }}</h3>
          <button @click="closeModal">✕</button>
        </div>
        <div v-if="modalError" class="alert alert-danger">{{ modalError }}</div>

        <div v-if="!editing">
          <div class="form-group">
            <label>Employé *</label>
            <select v-model="form.employee_id" class="form-control">
              <option value="">Sélectionner...</option>
              <option v-for="e in employees" :key="e.id" :value="e.id">
                {{ e.first_name }} {{ e.last_name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Date *</label>
            <input v-model="form.production_date" type="date" class="form-control" />
          </div>
        </div>

        <div class="form-group">
          <label>Ampoules assemblées *</label>
          <input v-model="form.assembled_count" type="number"
            min="0" class="form-control" />
        </div>
        <div class="form-group">
          <label>Ampoules endommagées *</label>
          <input v-model="form.damaged_count" type="number"
            min="0" class="form-control" />
        </div>

        <!-- Aperçu du salaire calculé -->
        <div class="salary-preview">
          <span>Salaire estimé :</span>
          <strong>{{ previewSalary }} FCFA</strong>
        </div>

        <div class="form-group">
          <label>Notes</label>
          <input v-model="form.notes" class="form-control" />
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">Annuler</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { productionService, employeeService } from '../../services/api';

const productions = ref([]);
const employees   = ref([]);
const todaySummary = ref(null);
const showModal   = ref(false);
const editing     = ref(null);
const saving      = ref(false);
const modalError  = ref('');
const filters     = ref({ date: '', employee_id: '' });

const form = ref({
  employee_id: '', production_date: '',
  assembled_count: 0, damaged_count: 0, notes: ''
});

// Calcul aperçu salaire en temps réel
const previewSalary = computed(() => {
  const s = (form.value.assembled_count * 15) - (form.value.damaged_count * 500);
  return Math.max(0, s).toLocaleString();
});

const formatAmount = (v) => v ? `${parseFloat(v).toLocaleString()} FCFA` : '0 FCFA';

const fetchProductions = async () => {
  try {
    const res = await productionService.getAll(filters.value);
    productions.value = res.data.productions;
  } catch (err) { console.error(err); }
};

const fetchToday = async () => {
  try {
    const res = await productionService.getToday();
    todaySummary.value = res.data;
  } catch (err) { console.error(err); }
};

const fetchEmployees = async () => {
  try {
    const res = await employeeService.getAll({ status: 'true', limit: 100 });
    employees.value = res.data.employees;
  } catch (err) { console.error(err); }
};

const openModal = (p = null) => {
  editing.value = p;
  modalError.value = '';
  const today = new Date().toISOString().split('T')[0];
  form.value = p
    ? { assembled_count: p.assembled_count, damaged_count: p.damaged_count, notes: p.notes }
    : { employee_id: '', production_date: today, assembled_count: 0, damaged_count: 0, notes: '' };
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const save = async () => {
  saving.value = true;
  modalError.value = '';
  try {
    if (editing.value) {
      await productionService.update(editing.value.id, form.value);
    } else {
      await productionService.create(form.value);
    }
    closeModal();
    fetchProductions();
    fetchToday();
  } catch (err) {
    modalError.value = err.message;
  } finally {
    saving.value = false;
  }
};

const deleteProduction = async (id) => {
  if (!confirm('Supprimer cette production ?')) return;
  try {
    await productionService.delete(id);
    fetchProductions();
    fetchToday();
  } catch (err) { alert(err.message); }
};

onMounted(() => {
  fetchProductions();
  fetchToday();
  fetchEmployees();
});
</script>

<style scoped>
.kpi-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
}
.kpi-card {
  background: white; border-radius: var(--radius);
  padding: 20px; display: flex; align-items: center;
  gap: 16px; box-shadow: var(--shadow);
}
.kpi-icon  { font-size: 32px; }
.kpi-value { display: block; font-size: 24px; font-weight: 700; }
.kpi-label { font-size: 12px; color: var(--text-light); }
.mb-3 { margin-bottom: 24px; }
.ml-1 { margin-left: 8px; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.salary-preview {
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: var(--radius); padding: 12px 16px;
  margin-bottom: 16px; display: flex;
  justify-content: space-between; align-items: center;
}
.salary-preview strong { font-size: 18px; color: var(--success); }
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal {
  background: white; border-radius: var(--radius);
  padding: 24px; width: 100%; max-width: 480px;
  max-height: 90vh; overflow-y: auto;
}
.modal-header {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 20px;
}
.modal-header button { background: none; border: none; font-size: 18px; cursor: pointer; }
.modal-footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
@media (max-width: 768px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
</style>