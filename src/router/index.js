import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import AuthView from '../views/auth/AuthView.vue'
import DashboardView from '../views/dashboard/DashboardView.vue'
import PosView from '../views/pos/PosView.vue'
import InventoryView from '../views/inventory/InventoryView.vue'
import MarketingView from '../views/marketing/MarketingView.vue'
import EmployeesView from '../views/employees/EmployeesView.vue'
import ExpensesView from '../views/expenses/ExpensesView.vue'
import ReportsView from '../views/reports/ReportsView.vue'
import SettingsView from '../views/settings/SettingsView.vue'
import OnboardingView from '../views/onboarding/OnboardingView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
      meta: { guestOnly: true }
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: { guestOnly: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/pos',
      name: 'pos',
      component: PosView,
      meta: { requiresAuth: true, permission: 'module-pos' }
    },
    {
      path: '/inventory',
      name: 'inventory',
      component: InventoryView,
      meta: { requiresAuth: true, permission: 'module-inventory' }
    },
    {
      path: '/marketing',
      name: 'marketing',
      component: MarketingView,
      meta: { requiresAuth: true, permission: 'module-marketing' }
    },
    {
      path: '/employees',
      name: 'employees',
      component: EmployeesView,
      meta: { requiresAuth: true, permission: 'module-employees' }
    },
    {
      path: '/expenses',
      name: 'expenses',
      component: ExpensesView,
      meta: { requiresAuth: true, permission: 'module-expenses' }
    },
    {
      path: '/transactions',
      name: 'transactions',
      component: () => import('../views/transactions/TransactionHistoryView.vue'),
      meta: { requiresAuth: true, permission: 'module-pos' }
    },
    {
      path: '/reports',
      name: 'reports',
      component: ReportsView,
      meta: { requiresAuth: true, permission: 'module-reports' }
    },
    {
      path: '/finance',
      name: 'finance',
      component: () => import('../views/finance/FinanceView.vue'),
      meta: { requiresAuth: true, permission: 'module-reports' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const { isAuthenticated, isInitialized, checkAuth, user, can } = useAuth()
  
  // Initialize auth if not done yet
  if (!isInitialized.value) {
    await checkAuth()
  }

  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding') === 'true'

  // If user hasn't seen onboarding and is not authenticated, redirect to onboarding 
  // unless they are already going there
  if (!isAuthenticated.value && !hasSeenOnboarding && to.name !== 'onboarding') {
    next({ name: 'onboarding' })
    return
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: 'auth' })
    return
  } 
  
  if (to.meta.guestOnly && isAuthenticated.value) {
    next({ name: 'dashboard' })
    return
  }

  // Check for permission requirements
  if (to.meta.permission) {
    if (!can(to.meta.permission)) {
      // Redirect to dashboard if user doesn't have required permission
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router
