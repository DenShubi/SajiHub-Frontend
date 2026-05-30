import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Register from '../views/Register.vue'
import Dashboard from '../views/Dashboard.vue'
import MenuDetail from '../components/MenuDetail.vue'
import Orders from '../views/Orders.vue'
import OrderDetail from '../views/OrderDetail.vue'
import AdminOrders from '../views/AdminOrders.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: Login
    },
    {
      path: '/register',
      name: 'register',
      component: Register
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    {
      path: '/menu/:id',
      name: 'menu-detail',
      component: MenuDetail,
      meta: { requiresAuth: true }
    },
    {
      path: '/orders',
      name: 'orders',
      component: Orders,
      meta: { requiresAuth: true }
    },
    {
      path: '/orders/:id',
      name: 'order-detail',
      component: OrderDetail,
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/orders',
      name: 'admin-orders',
      component: AdminOrders,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if ((to.name === 'login' || to.name === 'register') && token) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
