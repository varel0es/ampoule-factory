<template>
  <div>
    <!-- Header -->
    <div class="flex justify-between items-center mb-3">
      <input
        v-model="search"
        @input="fetchEmployees"
        class="form-control"
        style="max-width:300px"
        placeholder="🔍 Rechercher un employé..."
      />
      <button class="btn btn-primary" @click="openModal()">
        + Nouvel employé
      </button>
    </div>

    <!-- Tableau -->
    <div class="card">
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom complet</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="emp in employees" :key="emp.id">
              <td>#{{ emp.id }}</td>
              <td>{{ emp.first_name }} {{ emp.last_name }}</td>
              <td>{{ emp.phone || '—' }}</td>
              <td>{{ emp.user?.email || '—' }}</td>
              <td>
                <span class="badge"
                  :class="emp.is_active ? 'badge-success' : 'badge-danger'">
                  {{ emp.is_active ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td>
                <button class="btn btn-outline btn-sm"
                  @click="openModal(emp)">✏️</button>
                <button class="btn btn-danger btn-sm ml-1"
                  @click="deleteEmployee(emp.id)">🗑️</button>
              </td>
            </tr>
            <tr v-if="!employees.length">
              <td colspan="6" class="text-center">Aucun employé trouvé</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button
          v-for="p in pagination.pages" :key="p"
          :class="{ active: p === pagination.page }"
          @click="changePage(p)"
        >{{ p }}</button>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <h3>{{ editingEmployee ? 'Modifier employé' : 'Nouvel employé' }}</h3>
          <button @click="closeModal">✕</button>
        </div>

        <div v-if="modalError" class="alert alert-danger">{{ modalError }}</div>

        <div class="form-group">
          <label>Prénom *</label>
          <input v-model="form.first_name" class="form-control" />
        </div>

        <div class="form-group">
          <label>Nom *</label>
          <input v-model="form.last_name" class="form-control" />
        </div>

        <div class="form-group">
          <label>Téléphone</label>
          <input v-model="form.phone" class="form-control" />
        </div>

        <!-- Champs uniquement à la création -->
        <div v-if="!editingEmployee">
          <div class="form-group">
            <label>Email *</label>
            <input
              v-model="form.email"
              type="email"
              class="form-control"
              placeholder="exemple@email.com"
            />
            <small
              v-if="form.email && !isValidEmail"
              class="text-danger">
              ⚠️ Format email invalide
            </small>
          </div>

          <div class="form-group">
            <label>Mot de passe *</label>
            <div class="input-password">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                placeholder="••••••••"
              />
              <button
                type="button"
                class="toggle-password"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Champ statut uniquement à la modification -->
        <div v-if="editingEmployee" class="form-group">
          <label>Statut</label>
          <select v-model="form.is_active" class="form-control">
            <option :value="true">Actif</option>
            <option :value="false">Inactif</option>
          </select>
        </div>

        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">Annuler</button>
          <button class="btn btn-primary" @click="saveEmployee" :disabled="saving">
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { employeeService } from '../../services/api';

const employees       = ref([]);
const search          = ref('');
const pagination      = ref({ page: 1, pages: 1 });
const showModal       = ref(false);
const editingEmployee = ref(null);
const saving          = ref(false);
const modalError      = ref('');
const showPassword    = ref(false);

const form = ref({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  password: '',
  is_active: true
});

// Validation email
const isValidEmail = computed(() => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(form.value.email);
});

const fetchEmployees = async (page = 1) => {
  try {
    const res = await employeeService.getAll({
      search: search.value,
      page
    });
    employees.value  = res.data.employees;
    pagination.value = res.data.pagination;
  } catch (err) {
    console.error(err);
  }
};

const openModal = (emp = null) => {
  editingEmployee.value = emp;
  modalError.value      = '';
  showPassword.value    = false;
  form.value = emp ? {
    first_name: emp.first_name,
    last_name:  emp.last_name,
    phone:      emp.phone || '',
    is_active:  emp.is_active
  } : {
    first_name: '',
    last_name:  '',
    phone:      '',
    email:      '',
    password:   '',
    is_active:  true
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveEmployee = async () => {
  // Validation email
  if (!editingEmployee.value && !isValidEmail.value) {
    modalError.value = 'Veuillez entrer une adresse email valide.';
    return;
  }

  saving.value     = true;
  modalError.value = '';

  try {
    if (editingEmployee.value) {
      await employeeService.update(editingEmployee.value.id, form.value);
    } else {
      await employeeService.create(form.value);
    }
    closeModal();
    fetchEmployees();
  } catch (err) {
    modalError.value = err.message;
  } finally {
    saving.value = false;
  }
};

const deleteEmployee = async (id) => {
  if (!confirm('Désactiver cet employé ?')) return;
  try {
    await employeeService.delete(id);
    fetchEmployees();
  } catch (err) {
    alert(err.message);
  }
};

const changePage = (p) => fetchEmployees(p);

onMounted(fetchEmployees);
</script>

<style scoped>
.ml-1 { margin-left: 8px; }
.mb-3 { margin-bottom: 24px; }
.btn-sm { padding: 4px 8px; font-size: 12px; }
.text-danger { color: var(--danger); font-size: 12px; display: block; margin-top: 4px; }

.input-password {
  position: relative;
  display: flex;
  align-items: center;
}

.input-password .form-control {
  width: 100%;
  padding-right: 48px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 0;
  z-index: 10;
}

.toggle-password:hover { opacity: 0.7; }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center;
  justify-content: center; z-index: 1000;
}

.modal {
  background: white;
  border-radius: var(--radius);
  padding: 24px; width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex; justify-content: space-between;
  align-items: center; margin-bottom: 20px;
}

.modal-header h3 { font-size: 18px; font-weight: 600; }

.modal-header button {
  background: none; border: none;
  font-size: 18px; cursor: pointer;
}

.modal-footer {
  display: flex; justify-content: flex-end;
  gap: 8px; margin-top: 20px;
}
</style>