import axios from 'axios';

// ================================================
// CONFIGURATION DE BASE
// ================================================

// URL de base du backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// ================================================
// INTERCEPTEUR DE REQUÊTE
// Ajoute automatiquement le token à chaque requête
// ================================================
api.interceptors.request.use(
  (config) => {
    // Récupère le token stocké
    const token = localStorage.getItem('token');

    if (token) {
      // Ajoute le token dans le header
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ================================================
// INTERCEPTEUR DE RÉPONSE
// Gère les erreurs globalement
// ================================================
api.interceptors.response.use(
  // Réponse OK → retourne directement les données
  (response) => response.data,

  // Erreur → gestion centralisée
  (error) => {
    const message = error.response?.data?.message || 'Erreur serveur';
    const status  = error.response?.status;

    // Token expiré → redirige vers login
    if (status === 401) {
       if (!window.location.pathname.includes('/login')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
    return Promise.reject({ message, status });
  }
);

// ================================================
// SERVICES PAR MODULE
// ================================================

// AUTH
export const authService = {
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/password', data)
};

// EMPLOYÉS
export const employeeService = {
  getAll:  (params) => api.get('/employees', { params }),
  getOne:  (id)     => api.get(`/employees/${id}`),
  create:  (data)   => api.post('/employees', data),
  update:  (id, data) => api.put(`/employees/${id}`, data),
  delete:  (id)     => api.delete(`/employees/${id}`)
};

// MATÉRIAUX
export const materialService = {
  getAll:          (params)   => api.get('/materials', { params }),
  addStock:        (id, data) => api.put(`/materials/${id}/add`, data),
  withdraw:        (data)     => api.post('/materials/withdraw', data),
  getLogs:         (id, params) => api.get(`/materials/${id}/logs`, { params }),
  updateThreshold: (id, data) => api.put(`/materials/${id}/threshold`, data)
};

// PRODUCTIONS
export const productionService = {
  getAll:   (params) => api.get('/productions', { params }),
  getToday: ()       => api.get('/productions/today'),
  getWeekly: ()      => api.get('/productions/weekly'),
  create:   (data)   => api.post('/productions', data),
  update:   (id, data) => api.put(`/productions/${id}`, data),
  delete:   (id)     => api.delete(`/productions/${id}`)
};

// PAIEMENTS
export const paymentService = {
  getAll:      (params)     => api.get('/payments', { params }),
  getSummary:  (employeeId) => api.get(`/payments/summary/${employeeId}`),
  create:      (data)       => api.post('/payments', data),
  markAsPaid:  (id)         => api.put(`/payments/${id}/pay`),
  confirm:     (id)         => api.put(`/payments/${id}/confirm`),
  delete:      (id)         => api.delete(`/payments/${id}`)
};

// DASHBOARD
export const dashboardService = {
  get: () => api.get('/dashboard')
};

export default api;