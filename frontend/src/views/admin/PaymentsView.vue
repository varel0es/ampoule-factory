<template>
  <div>
    <!-- Filtres -->
    <div class="flex justify-between items-center mb-2">
      <div class="flex gap-2">
        <select v-model="filters.employee_id"
          class="form-control" @change="fetchPayments">
          <option value="">Tous les employés</option>
          <option v-for="e in employees" :key="e.id" :value="e.id">
            {{ e.first_name }} {{ e.last_name }}
          </option>
        </select>
        <select v-model="filters.status"
          class="form-control" @change="fetchPayments">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="paid">Payé</option>
          <option value="confirmed">Confirmé</option>
        </select>
      </div>
      <button class="btn btn-primary" @click="openModal()">
        + Nouveau paiement
      </button>
    </div>

    <!-- Tableau -->
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Employé</th>
              <th>Période</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Payé le</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id">
              <td>{{ p.employee?.first_name }} {{ p.employee?.last_name }}</td>
              <td>{{ p.period_start }} → {{ p.period_end }}</td>
              <td><strong>{{ formatAmount(p.amount) }}</strong></td>
              <td>
                <span class="badge" :class="statusClass(p.status)">
                  {{ statusLabel(p.status) }}
                </span>
              </td>
              <td>{{ p.paid_at ? formatDate(p.paid_at) : '—' }}</td>
              <td>
                <button
                  v-if="p.status === 'pending'"
                  class="btn btn-success btn-sm"
                  @click="markPaid(p.id)">
                  ✅ Payer
                </button>
                <button
                  v-if="p.status === 'pending'"
                  class="btn btn-danger btn-sm ml-1"
                  @click="deletePayment(p.id)">
                  🗑️
                </button>
                <span v-if="p.status !== 'pending'" class="badge badge-secondary">
                  Finalisé
                </span>
              </td>
            </tr>
            <tr v-if="!payments.length">
              <td colspan="6" class="text-center">Aucun paiement trouvé</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Créer paiement -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>Nouveau paiement</h3>
          <button @click="closeModal">✕</button>
        </div>
        <div v-if="modalError" class="alert alert-danger">{{ modalError }}</div>

        <div class="form-group">
          <label>Employé *</label>
          <select v-model="form.employee_id" class="form-control"
            @change="loadSummary">
            <option value="">Sélectionner...</option>
            <option v-for="e in employees" :key="e.id" :value="e.id">
              {{ e.first_name }} {{ e.last_name }}
            </option>
          </select>
        </div>

        <!-- Résumé financier de l'employé -->
        <div v-if="summary" class="summary-box">
          <div class="summary-row">
            <span>Total gagné</span>
            <strong>{{ formatAmount(summary.total_earned) }}</strong>
          </div>
          <div class="summary-row">
            <span>Déjà payé</span>
            <strong class="text-success">{{ formatAmount(summary.total_paid) }}</strong>
          </div>
          <div class="summary-row">
            <span>En attente</span>
            <strong class="text-warning">{{ formatAmount(summary.total_pending) }}</strong>
          </div>
          <div class="summary-row border-top">
            <span>Reste à payer</span>
            <strong class="text-danger">{{ formatAmount(summary.balance_due) }}</strong>
          </div>
        </div>

        <div class="form-group">
          <label>Montant *</label>
          <input v-model="form.amount" type="number"
            min="0" class="form-control" />
        </div>
        <div class="form-group">
          <label>Période début *</label>
          <input v-model="form.period_start" type="date" class="form-control" />
        </div>
        <div class="form-group">
          <label>Période fin *</label>
          <input v-model="form.period_end" type="date" class="form-control" />
        </div>
        <div class="form-group">
          <label>Notes</label>
          <input v-model="form.notes" class="form-control" />
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">Annuler</button>
          <button class="btn btn-primary" @click="save" :disabled="saving">
            {{ saving ? 'Enregistrement...' : 'Créer paiement' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { paymentService, employeeService } from '../../services/api';

const payments  = ref([]);
const employees = ref([]);
const filters   = ref({ employee_id: '', status: '' });
const showModal = ref(false);
const saving    = ref(false);
const modalError = ref('');
const summary   = ref(null);

const form = ref({
  employee_id: '', amount: '',
  period_start: '', period_end: '', notes: ''
});

const formatAmount = (v) => v ? `${parseFloat(v).toLocaleString()} FCFA` : '0 FCFA';
const formatDate   = (d) => new Date(d).toLocaleDateString('fr-FR');

const statusClass = (s) => ({
  pending:   'badge-warning',
  paid:      'badge-primary',
  confirmed: 'badge-success'
}[s] || 'badge-secondary');

const statusLabel = (s) => ({
  pending:   '⏳ En attente',
  paid:      '💳 Payé',
  confirmed: '✅ Confirmé'
}[s] || s);

const fetchPayments = async () => {
  try {
    const res = await paymentService.getAll(filters.value);
    payments.value = res.data.payments;
  } catch (err) { console.error(err); }
};

const fetchEmployees = async () => {
  try {
    const res = await employeeService.getAll({ status: 'true', limit: 100 });
    employees.value = res.data.employees;
  } catch (err) { console.error(err); }
};

const loadSummary = async () => {
  if (!form.value.employee_id) return;
  try {
    const res = await paymentService.getSummary(form.value.employee_id);
    summary.value = res.data.summary;
    // Pré-rempli le montant avec le reste à payer
    form.value.amount = res.data.summary.balance_due;
  } catch (err) { console.error(err); }
};

const openModal = () => {
  form.value = { employee_id: '', amount: '', period_start: '', period_end: '', notes: '' };
  summary.value = null;
  modalError.value = '';
  showModal.value = true;
};

const closeModal = () => { showModal.value = false; };

const save = async () => {
  saving.value = true;
  modalError.value = '';
  try {
    await paymentService.create(form.value);
    closeModal();
    fetchPayments();
  } catch (err) {
    modalError.value = err.message;
  } finally {
    saving.value = false;
  }
};

const markPaid = async (id) => {
  if (!confirm('Marquer ce paiement comme effectué ?')) return;
  try {
    await paymentService.markAsPaid(id);
    fetchPayments();
  } catch (err) { alert(err.message); }
};

const deletePayment = async (id) => {
  if (!confirm('Supprimer ce paiement ?')) return;
  try {
    await paymentService.delete(id);
    fetchPayments();
  } catch (err) { alert(err.message); }
};

onMounted(() => { fetchPayments(); fetchEmployees(); });
</script>

<style scoped>
.ml-1 { margin-left: 8px; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.text-success { color: var(--success); }
.text-warning { color: var(--warning); }
.text-danger  { color: var(--danger);  }
.summary-box {
  background: #f8fafc; border: 1px solid var(--border);
  border-radius: var(--radius); padding: 16px; margin-bottom: 16px;
}
.summary-row {
  display: flex; justify-content: space-between;
  padding: 6px 0; font-size: 14px;
}
.border-top { border-top: 1px solid var(--border); padding-top: 10px; margin-top: 4px; }
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
</style>