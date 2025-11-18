import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/DashboardShell.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'devices',
          component: () => import('@/views/DeviceManagementView.vue'),
          meta: {
            requiresAuth: true,
            title: '离线设备管理',
            subtitle: 'Open2FA 配置中心',
            menuKey: 'devices'
          }
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  if (!authStore.initialized) {
    await authStore.restoreSession();
  }
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } });
    return;
  }
  if (to.name === 'login' && authStore.isAuthenticated) {
    next({ name: 'devices' });
    return;
  }
  next();
});

export default router;
