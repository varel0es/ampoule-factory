import { defineStore } from 'pinia';
import { authService } from '../services/api';

export const useAuthStore = defineStore('auth', {
  // ============================================
  // STATE : les données stockées
  // ============================================
  state: () => ({
    user:  JSON.parse(localStorage.getItem('user'))  || null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null
  }),

  // ============================================
  // GETTERS : données calculées
  // ============================================
  getters: {
    // Est-ce que l'utilisateur est connecté ?
    isAuthenticated: (state) => !!state.token,

    // Est-ce que c'est un admin ?
    isAdmin: (state) => state.user?.role === 'admin',

    // Est-ce que c'est un employé ?
    isEmployee: (state) => state.user?.role === 'employee',

    // L'ID de l'employé connecté
    employeeId: (state) => state.user?.employee?.id
  },

  // ============================================
  // ACTIONS : les fonctions
  // ============================================
  actions: {
    // Connexion
    async login(email, password) {
      this.loading = true;
      this.error   = null;

      try {
        const response = await authService.login({ email, password });

        // Stocke le token et l'utilisateur
        this.token = response.data.token;
        this.user  = response.data.user;

        // Persiste dans localStorage
        localStorage.setItem('token', this.token);
        localStorage.setItem('user',  JSON.stringify(this.user));

        return response;

      } catch (err) {
        this.error = err.message;
        throw err;
      } finally {
        this.loading = false;
      }
    },

    // Déconnexion
    logout() {
      this.token = null;
      this.user  = null;

      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },

    // Récupère le profil à jour
    async fetchMe() {
      try {
        const response = await authService.getMe();
        this.user = response.data.user;
        localStorage.setItem('user', JSON.stringify(this.user));
      } catch (err) {
        this.logout();
      }
    }
  }
});