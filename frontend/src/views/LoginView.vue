<template>
  <div class="login-page">
    <div class="login-card">

      <div class="login-header">
        <span class="login-logo">💡</span>
        <h1>Usine Ampoules</h1>
        <p>Connectez-vous pour continuer</p>
      </div>

      <div v-if="error" class="error-message">
        ❌ {{ error }}
      </div>

      <div class="form-group">
        <label>Email</label>
        <input
          v-model="form.email"
          type="text"
          class="form-control"
          placeholder="exemple@email.com"
        />
      </div>

      <div class="form-group">
        <label>Mot de passe</label>
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

      <button
        type="button"
        @click="handleLogin"
        class="btn btn-primary btn-full"
        :disabled="loading"
      >
        {{ loading ? 'Connexion en cours...' : 'Se connecter' }}
      </button>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router    = useRouter();
const authStore = useAuthStore();

const form = ref({ email: '', password: '' });
const loading      = ref(false);
const error        = ref('');
const showPassword = ref(false);

const handleLogin = async () => {
  error.value = '';

  if (!form.value.email || !form.value.password) {
    error.value = 'Veuillez remplir tous les champs.';
    return;
  }

  loading.value = true;

  try {
    await authStore.login(form.value.email, form.value.password);

    if (authStore.isAdmin) {
      router.push('/dashboard');
    } else {
      router.push('/my-dashboard');
    }

  } catch (err) {
    error.value = 'Adresse email ou mot de passe incorrect.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e293b 0%, #2563eb 100%);
}

.login-card {
  background: white;
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  font-size: 48px;
  display: block;
  margin-bottom: 12px;
}

.login-header h1 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
}

.login-header p {
  color: #64748b;
  font-size: 14px;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  border-left: 4px solid #dc2626;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 6px;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
}

.input-password {
  position: relative;
  display: flex;
  align-items: center;
}

.input-password .form-control {
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

.btn-full {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  margin-top: 8px;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-full:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-full:hover:not(:disabled) {
  background: #1d4ed8;
}
</style>
