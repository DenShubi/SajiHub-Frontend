<template>
  <div class="dashboard-container">
    <div class="welcome-section">
      <h1>Welcome back, {{ userRole }}</h1>
      <p>Manage your culinary offerings and discover new tastes.</p>
    </div>

    <!-- Integrate the Menu Manager Component -->
    <MenuManager />
  </div>
</template>

<script>
import MenuManager from '../components/MenuManager.vue';

export default {
  name: 'Dashboard',
  components: {
    MenuManager
  },
  data() {
    return {
      userRole: ''
    };
  },
  mounted() {
    this.userRole = localStorage.getItem('role') || 'User';
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.welcome-section {
  margin-bottom: 3rem;
}

.welcome-section h1 {
  font-size: 3rem;
  color: var(--text-primary);
  font-weight: 700;
  letter-spacing: -0.04em;
  margin-bottom: 0.5rem;
}

.welcome-section p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}
</style>
