<template>
  <div id="app-wrapper">
    <header class="navbar" v-if="isAuthenticated">
      <div class="nav-brand">
        <h2>SajiHub</h2>
      </div>
      <div class="nav-links">
        <router-link to="/dashboard" class="nav-item">Menu</router-link>

        <!-- Member: link ke pesanan saya -->
        <router-link v-if="role === 'Member'" to="/orders" class="nav-item">
          Pesanan Saya
        </router-link>

        <!-- Admin: link ke kelola order -->
        <router-link v-if="role === 'Admin'" to="/admin/orders" class="nav-item">
          Kelola Order
        </router-link>

        <button @click="logout" class="btn-logout">Logout</button>
      </div>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'App',
  computed: {
    isAuthenticated() {
      return this.$route.name !== 'login' && this.$route.name !== 'register' && !!localStorage.getItem('token');
    },
    role() {
      return localStorage.getItem('role');
    }
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      this.$router.push('/login');
    }
  }
}
</script>

<style scoped>
#app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--bg-card);
  border-bottom: 1px solid var(--border);
}

.nav-brand h2 {
  margin: 0;
  color: var(--primary);
  font-weight: 700;
  letter-spacing: -0.5px;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.nav-item {
  color: var(--text-primary);
  font-weight: 500;
}

.nav-item.router-link-active {
  color: var(--primary);
}

.btn-logout {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
  padding: 0.5rem 1rem;
}

.btn-logout:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
