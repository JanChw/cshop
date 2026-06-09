import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('../pages/LoginPage.vue'), meta: { layout: false } },
  { path: '/', component: () => import('../pages/DashboardPage.vue') },
  { path: '/products/new', component: () => import('../pages/ProductFormPage.vue') },
  { path: '/products/:id/edit', component: () => import('../pages/ProductFormPage.vue') },
  { path: '/products', component: () => import('../pages/ProductsPage.vue') },
  { path: '/orders', component: () => import('../pages/OrdersPage.vue') },
  { path: '/categories', component: () => import('../pages/CategoriesPage.vue') },
  { path: '/users', component: () => import('../pages/UsersPage.vue') },
  { path: '/staff', component: () => import('../pages/StaffPage.vue') },
  { path: '/analytics', component: () => import('../pages/AnalyticsPage.vue') },
  { path: '/settings', component: () => import('../pages/SettingsPage.vue') },
  { path: '/backups', component: () => import('../pages/BackupsPage.vue') },
  { path: '/roles', component: () => import('../pages/RolesPage.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
