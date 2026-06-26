import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('../pages/LoginPage.vue'), meta: { layout: false, requiresAuth: false } },
  { path: '/forgot-password', component: () => import('../pages/ForgotPasswordPage.vue'), meta: { layout: false, requiresAuth: false } },
  { path: '/', component: () => import('../pages/DashboardPage.vue'), meta: { requiresAuth: true } },
  { path: '/products/new', component: () => import('../pages/ProductFormPage.vue'), meta: { requiresAuth: true } },
  { path: '/products/:id/edit', component: () => import('../pages/ProductFormPage.vue'), meta: { requiresAuth: true } },
  { path: '/products/trash', component: () => import('../pages/TrashProductsPage.vue'), meta: { requiresAuth: true } },
  { path: '/products', component: () => import('../pages/ProductsPage.vue'), meta: { requiresAuth: true } },
  { path: '/orders', component: () => import('../pages/OrdersPage.vue'), meta: { requiresAuth: true } },
  { path: '/orders/:id', component: () => import('../pages/OrderDetailPage.vue'), meta: { requiresAuth: true } },
  { path: '/categories', component: () => import('../pages/CategoriesPage.vue'), meta: { requiresAuth: true } },
  { path: '/users', component: () => import('../pages/UsersPage.vue'), meta: { requiresAuth: true } },
  { path: '/staff', component: () => import('../pages/StaffPage.vue'), meta: { requiresAuth: true } },
  { path: '/analytics', component: () => import('../pages/AnalyticsPage.vue'), meta: { requiresAuth: true } },
  { path: '/inventory', component: () => import('../pages/InventoryPage.vue'), meta: { requiresAuth: true } },
  { path: '/settings', component: () => import('../pages/SettingsPage.vue'), meta: { requiresAuth: true } },
  { path: '/backups', component: () => import('../pages/BackupsPage.vue'), meta: { requiresAuth: true } },
  { path: '/roles', component: () => import('../pages/RolesPage.vue'), meta: { requiresAuth: true } },
  { path: '/home-content', component: () => import('../pages/HomeContentPage.vue'), meta: { requiresAuth: true } },
  { path: '/design-content', component: () => import('../pages/DesignContentPage.vue'), meta: { requiresAuth: true } },
  { path: '/stickers', component: () => import('../pages/StickersPage.vue'), meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('cshop_admin_token')
  if (to.meta.requiresAuth !== false && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router
