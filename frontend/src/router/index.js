import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/', redirect: '/login' },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { guest: true }
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/admin/DashboardView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/employees',
    name: 'employees',
    component: () => import('../views/admin/EmployeesView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/materials',
    name: 'materials',
    component: () => import('../views/admin/MaterialsView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/productions',
    name: 'productions',
    component: () => import('../views/admin/ProductionsView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/payments',
    name: 'payments',
    component: () => import('../views/admin/PaymentsView.vue'),
    meta: { requiresAuth: true, role: 'admin' }
  },
  {
    path: '/my-dashboard',
    name: 'my-dashboard',
    component: () => import('../views/admin/MyDashboard.vue'),
    meta: { requiresAuth: true, role: 'employee' }
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});
router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login';
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return auth.isAdmin ? '/dashboard' : '/my-dashboard';
  }

  if (to.meta.role && auth.user?.role !== to.meta.role) {
    return auth.isAdmin ? '/dashboard' : '/my-dashboard';
  }

  return true;
});

export default router;