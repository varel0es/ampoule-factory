<template>
  <div class="app-layout">

    <!-- SIDEBAR -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">

      <!-- Logo -->
      <div class="sidebar-logo">
        <span class="logo-icon">💡</span>
        <span class="logo-text" v-show="!sidebarCollapsed">
          Usine Ampoules
        </span>
      </div>

      <!-- Menu Admin -->
      <nav v-if="authStore.isAdmin" class="sidebar-nav">
        <RouterLink to="/dashboard"   class="nav-item">
          <span class="nav-icon">📊</span>
          <span class="nav-text" v-show="!sidebarCollapsed">Dashboard</span>
        </RouterLink>
        <RouterLink to="/employees"   class="nav-item">
          <span class="nav-icon">👥</span>
          <span class="nav-text" v-show="!sidebarCollapsed">Employés</span>
        </RouterLink>
        <RouterLink to="/materials"   class="nav-item">
          <span class="nav-icon">📦</span>
          <span class="nav-text" v-show="!sidebarCollapsed">Matériaux</span>
        </RouterLink>
        <RouterLink to="/productions" class="nav-item">
          <span class="nav-icon">🏭</span>
          <span class="nav-text" v-show="!sidebarCollapsed">Production</span>
        </RouterLink>
        <RouterLink to="/payments"    class="nav-item">
          <span class="nav-icon">💰</span>
          <span class="nav-text" v-show="!sidebarCollapsed">Paiements</span>
        </RouterLink>
      </nav>

      <!-- Menu Employé -->
      <nav v-else class="sidebar-nav">
        <RouterLink to="/my-dashboard" class="nav-item">
          <span class="nav-icon">👤</span>
          <span class="nav-text" v-show="!sidebarCollapsed">Mon Espace</span>
        </RouterLink>
      </nav>

      <!-- Bouton collapse -->
      <button class="collapse-btn" @click="sidebarCollapsed = !sidebarCollapsed">
        {{ sidebarCollapsed ? '→' : '←' }}
      </button>

    </aside>

    <!-- CONTENU PRINCIPAL -->
    <div class="main-content">

      <!-- NAVBAR -->
      <header class="navbar">
        <div class="navbar-left">
          <h2 class="page-title">{{ pageTitle }}</h2>
        </div>
        <div class="navbar-right">
          <!-- Info utilisateur -->
          <div class="user-info">
            <span class="user-avatar">
              {{ userInitials }}
            </span>
            <div class="user-details" v-show="!isMobile">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role badge"
                :class="authStore.isAdmin ? 'badge-primary' : 'badge-success'">
                {{ authStore.isAdmin ? 'Admin' : 'Employé' }}
              </span>
            </div>
          </div>

          <!-- Bouton déconnexion -->
          <button class="btn btn-outline btn-sm" @click="logout">
            🚪 Déconnexion
          </button>
        </div>
      </header>

      <!-- PAGE COURANTE -->
      <main class="page-content">
        <RouterView />
      </main>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth';

const authStore = useAuthStore();
const route     = useRoute();
const router    = useRouter();

// Sidebar collapsed ou non
const sidebarCollapsed = ref(false);
const isMobile         = ref(window.innerWidth < 768);

// Titre de la page selon la route
const pageTitle = computed(() => {
  const titles = {
    'dashboard':    '📊 Tableau de bord',
    'employees':    '👥 Gestion des employés',
    'materials':    '📦 Gestion des matériaux',
    'productions':  '🏭 Production journalière',
    'payments':     '💰 Gestion des paiements',
    'my-dashboard': '👤 Mon espace'
  };
  return titles[route.name] || 'Usine Ampoules';
});

// Initiales de l'utilisateur pour l'avatar
const userInitials = computed(() => {
  if (authStore.isAdmin) return 'AD';
  const emp = authStore.user?.employee;
  if (!emp) return '?';
  return `${emp.first_name[0]}${emp.last_name[0]}`.toUpperCase();
});

// Nom affiché dans la navbar
const userName = computed(() => {
  if (authStore.isAdmin) return 'Administrateur';
  const emp = authStore.user?.employee;
  return emp ? `${emp.first_name} ${emp.last_name}` : 'Utilisateur';
});

// Déconnexion
const logout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

/* ========================
   SIDEBAR
   ======================== */
.sidebar {
  width: 240px;
  min-height: 100vh;
  background: var(--sidebar-bg);
  color: var(--sidebar-text);
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
}

.sidebar.collapsed {
  width: 60px;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  font-weight: 700;
  font-size: 16px;
  color: white;
}

.logo-icon { font-size: 24px; }

.sidebar-nav {
  flex: 1;
  padding: 16px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: var(--sidebar-text);
  text-decoration: none;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255,255,255,0.1);
  color: white;
}

.nav-item.router-link-active {
  background: rgba(37, 99, 235, 0.3);
  border-left-color: var(--primary);
  color: white;
}

.nav-icon { font-size: 18px; min-width: 20px; }

.collapse-btn {
  margin: 16px;
  padding: 8px;
  background: rgba(255,255,255,0.1);
  border: none;
  border-radius: var(--radius);
  color: white;
  cursor: pointer;
  font-size: 16px;
}

.collapse-btn:hover {
  background: rgba(255,255,255,0.2);
}

/* ========================
   CONTENU PRINCIPAL
   ======================== */
.main-content {
  flex: 1;
  margin-left: 240px;
  transition: margin-left 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.sidebar.collapsed ~ .main-content {
  margin-left: 60px;
}

/* ========================
   NAVBAR
   ======================== */
.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 64px;
  background: white;
  box-shadow: var(--shadow);
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  font-size: 13px;
}

.user-role {
  font-size: 11px;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}

/* ========================
   PAGE CONTENT
   ======================== */
.page-content {
  flex: 1;
  padding: 24px;
  background: var(--bg);
}

/* ========================
   RESPONSIVE MOBILE
   ======================== */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }

  .main-content {
    margin-left: 60px;
  }
}
</style>