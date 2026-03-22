<template>
  <div class="login-page">
    <div class="login-card">

      <!-- Logo -->
      <div class="login-header">
        <span class="login-logo">💡</span>
        <h1>Usine Ampoules</h1>
        <p>Connectez-vous pour continuer</p>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="alert alert-danger">
        {{ error }}
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="handleLogin">

        <div class="form-group">
          <label>Email</label>
          <input
            v-model="form.email"
            type="email"
            class="form-control"
            placeholder="admin@usine.com"
            required
          />
        </div>

        <div class="form-group">
          <label>Mot de passe</label>
          <input
            v-model="form.password"
            type="password"
            class="form-control"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          class="btn btn-primary w-full"
          :disabled="loading"
        >
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>

      </form>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router    = useRouter();
const authStore = useAuthStore();

// Données du formulaire
const form = ref({
  email:    '',
  password: ''
});

const loading = ref(false);
const error   = ref('');

// Soumission du formulaire
const handleLogin = async () => {
  loading.value = true;
  error.value   = '';

  try {
    await authStore.login(form.value.email, form.value.password);

    // Redirige selon le rôle
    if (authStore.isAdmin) {
      router.push('/dashboard');
    } else {
      router.push('/my-dashboard');
    }

  } catch (err) {
    error.value = err.message || 'Erreur de connexion';
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
  color: var(--text);
  margin-bottom: 8px;
}

.login-header p {
  color: var(--text-light);
  font-size: 14px;
}

.btn-primary {
  margin-top: 8px;
  padding: 12px;
  font-size: 15px;
}
</style>