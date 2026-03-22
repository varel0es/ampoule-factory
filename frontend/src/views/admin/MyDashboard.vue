<template>
  <div>
    <!-- Résumé financier -->
    <div class="kpi-grid mb-3" v-if="summary">
      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ formatAmount(summary.total_earned) }}</span>
          <span class="kpi-label">Total gagné</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">✅</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ formatAmount(summary.total_paid) }}</span>
          <span class="kpi-label">Déjà payé</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">⏳</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ formatAmount(summary.total_pending) }}</span>
          <span class="kpi-label">En attente</span>
        </div>
      </div>
      <div class="kpi-card kpi-highlight">
        <div class="kpi-icon">💳</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ formatAmount(summary.balance_due) }}</span>
          <span class="kpi-label">Reste à recevoir</span>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <!-- Mes productions récentes -->
      <div class="card">
        <h3 class="section-title">🏭 Mes productions récentes</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Assemblées</th>
              <th>Endommagées</th>
              <th>Salaire</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in productions" :key="p.id">
              <td>{{ p.production_date }}</td>
              <td>{{ p.assembled_count }}</td>
              <td>
                <span :class="p.damaged_count > 0 ? 'badge badge-danger' : ''">
                  {{ p.damaged_count }}
                </span>
              </td>
              <td><strong>{{ formatAmount(p.daily_salary) }}</strong></td>
            </tr>
            <tr v-if="!productions.length">
              <td colspan="4" class="text-center">Aucune production</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mes paiements -->
      <div class="card">
        <h3 class="section-title">💰 Mes paiements</h3>
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in payments" :key="p.id">
              <td>{{ p.period_start }}</td>
              <td><strong>{{ formatAmount(p.amount) }}</strong></td>
              <td>
                <span class="badge" :class="statusClass(p.status)">
                  {{ statusLabel(p.status) }}
                </span>
              </td>
              <td>
                <button
                  v-if="p.status === 'paid'"
                  class="btn btn-success btn-sm"
                  @click="confirmPayment(p.id)">
                  ✅ Confirmer
                </button>
              </td>
            </tr>
            <tr v-if="!payments.length">
              <td colspan="4" class="text-center">Aucun paiement</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '../../stores/auth';
import { productionService, paymentService } from '../../services/api';

const authStore  = useAuthStore();
const summary    = ref(null);
const productions = ref([]);
const payments   = ref([]);

const formatAmount = (v) => v ? `${parseFloat(v).toLocaleString()} FCFA` : '0 FCFA';

const statusClass = (s) => ({
  pending: 'badge-warning', paid: 'badge-primary', confirmed: 'badge-success'
}[s] || '');

const statusLabel = (s) => ({
  pending: '⏳ En attente', paid: '💳 Payé', confirmed: '✅ Confirmé'
}[s] || s);

const fetchData = async () => {
  const empId = authStore.employeeId;
  if (!empId) return;

  try {
    const [prodRes, payRes, sumRes] = await Promise.all([
      productionService.getAll({ limit: 10 }),
      paymentService.getAll({ limit: 20 }),
      paymentService.getSummary(empId)
    ]);
    productions.value = prodRes.data.productions;
    payments.value    = payRes.data.payments;
    summary.value     = sumRes.data.summary;
  } catch (err) { console.error(err); }
};

const confirmPayment = async (id) => {
  if (!confirm('Confirmer la réception de ce paiement ?')) return;
  try {
    await paymentService.confirm(id);
    fetchData();
  } catch (err) { alert(err.message); }
};

onMounted(fetchData);
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
.kpi-highlight { border-left: 4px solid var(--primary); }
.kpi-icon  { font-size: 32px; }
.kpi-value { display: block; font-size: 22px; font-weight: 700; }
.kpi-label { font-size: 12px; color: var(--text-light); }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.section-title {
  font-size: 15px; font-weight: 600;
  margin-bottom: 16px; padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
.btn-sm { padding: 4px 8px; font-size: 12px; }
.mb-3   { margin-bottom: 24px; }
@media (max-width: 768px) {
  .kpi-grid, .grid-2 { grid-template-columns: repeat(2, 1fr); }
}
</style>