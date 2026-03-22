<template>
  <div>
    <!-- KPI Cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon">👥</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ data.kpi?.total_employees || 0 }}</span>
          <span class="kpi-label">Employés actifs</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💡</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ data.today?.total_assembled || 0 }}</span>
          <span class="kpi-label">Ampoules aujourd'hui</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon">💰</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ formatAmount(data.today?.total_salary) }}</span>
          <span class="kpi-label">Salaires du jour</span>
        </div>
      </div>
      <div class="kpi-card" :class="{ 'kpi-alert': data.kpi?.low_stock_count > 0 }">
        <div class="kpi-icon">📦</div>
        <div class="kpi-info">
          <span class="kpi-value">{{ data.kpi?.low_stock_count || 0 }}</span>
          <span class="kpi-label">Alertes stock</span>
        </div>
      </div>
    </div>

    <!-- Alertes stock faible -->
    <div v-if="data.low_stock_alerts?.length > 0" class="card mt-2">
      <h3 class="section-title">⚠️ Alertes Stock Faible</h3>
      <div class="alerts-grid">
        <div
          v-for="m in data.low_stock_alerts"
          :key="m.id"
          class="alert alert-warning"
        >
          <strong>{{ m.display_name }}</strong> :
          {{ m.current_stock }} / {{ m.alert_threshold }} {{ m.unit }}
        </div>
      </div>
    </div>

    <div class="grid-2 mt-2">
      <!-- Stock matériaux -->
      <div class="card">
        <h3 class="section-title">📦 Stock Matériaux</h3>
        <table>
          <thead>
            <tr>
              <th>Matériau</th>
              <th>Stock</th>
              <th>État</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in data.materials" :key="m.id">
              <td>{{ m.display_name }}</td>
              <td>{{ m.current_stock }} {{ m.unit }}</td>
              <td>
                <span class="badge"
                  :class="m.is_low_stock ? 'badge-danger' : 'badge-success'">
                  {{ m.is_low_stock ? '⚠️ Faible' : '✅ OK' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Top employés -->
      <div class="card">
        <h3 class="section-title">🏆 Top Employés du Mois</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Employé</th>
              <th>Ampoules</th>
              <th>Salaire</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(e, i) in data.top_employees" :key="e.employee_id">
              <td>{{ i + 1 }}</td>
              <td>{{ e.employee?.first_name }} {{ e.employee?.last_name }}</td>
              <td>{{ e.dataValues?.total_assembled || 0 }}</td>
              <td>{{ formatAmount(e.dataValues?.total_salary) }}</td>
            </tr>
            <tr v-if="!data.top_employees?.length">
              <td colspan="4" class="text-center">Aucune donnée</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Production du jour -->
    <div class="card mt-2">
      <h3 class="section-title">🏭 Production d'aujourd'hui</h3>
      <table>
        <thead>
          <tr>
            <th>Employé</th>
            <th>Assemblées</th>
            <th>Endommagées</th>
            <th>Salaire</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in data.today_productions" :key="p.id">
            <td>{{ p.employee?.first_name }} {{ p.employee?.last_name }}</td>
            <td>{{ p.assembled_count }}</td>
            <td>
              <span :class="p.damaged_count > 0 ? 'badge badge-danger' : ''">
                {{ p.damaged_count }}
              </span>
            </td>
            <td>{{ formatAmount(p.daily_salary) }}</td>
          </tr>
          <tr v-if="!data.today_productions?.length">
            <td colspan="4" class="text-center">Aucune production aujourd'hui</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Graphique 7 jours -->
    <div class="card mt-2">
      <h3 class="section-title">📈 Production 7 derniers jours</h3>
      <div class="chart-container">
        <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { dashboardService } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const data    = ref({});
const loading = ref(true);

const fetchDashboard = async () => {
  try {
    const res = await dashboardService.get();
    data.value = res.data;
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const formatAmount = (val) => {
  if (!val) return '0 FCFA';
  return `${parseFloat(val).toLocaleString()} FCFA`;
};

const chartData = computed(() => {
  if (!data.value.weekly_chart) return null;
  return {
    labels: data.value.weekly_chart.map(d => d.date),
    datasets: [
      {
        label: 'Assemblées',
        data: data.value.weekly_chart.map(d => d.assembled),
        backgroundColor: '#2563eb'
      },
      {
        label: 'Endommagées',
        data: data.value.weekly_chart.map(d => d.damaged),
        backgroundColor: '#dc2626'
      }
    ]
  };
});

const chartOptions = {
  responsive: true,
  plugins: { legend: { position: 'top' } }
};

onMounted(fetchDashboard);
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 8px;
}

.kpi-card {
  background: white;
  border-radius: var(--radius);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow);
}

.kpi-alert { border-left: 4px solid var(--warning); }
.kpi-icon  { font-size: 36px; }

.kpi-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
}

.kpi-label {
  font-size: 13px;
  color: var(--text-light);
}

.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.chart-container { height: 300px; }
.alerts-grid { display: flex; flex-direction: column; gap: 8px; }

@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .grid-2   { grid-template-columns: 1fr; }
}
</style>