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
  font-size: 2.5rem;
  background: linear-gradient(to right, var(--text-primary), var(--text-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.welcome-section p {
  color: var(--text-secondary);
  font-size: 1.1rem;
}
</style>
