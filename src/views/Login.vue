<template>
  <div class="auth-container">
    <div class="card auth-card">
      <div class="auth-header">
        <h2>Welcome Back</h2>
        <p>Login to manage your SajiHub</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label>Email Address</label>
          <input v-model="email" type="email" placeholder="admin@sajihub.com" required />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </div>
        
        <div v-if="errorMessage" class="error-alert">
          {{ errorMessage }}
        </div>
        
        <button type="submit" class="btn-block" :disabled="isLoading">
          {{ isLoading ? 'Logging in...' : 'Sign In' }}
        </button>
        
        <div class="auth-footer">
          Don't have an account? <router-link to="/register">Register here</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      isLoading: false,
      errorMessage: ''
    };
  },
  methods: {
    async handleLogin() {
      this.isLoading = true;
      this.errorMessage = '';
      
      try {
        const response = await fetch('http://localhost:8000/api/login', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: this.email,
            password: this.password
          })
        });

        const result = await response.json();

        if (response.ok) {
          // Backend Sanctum auth structure based on previous implementation
          localStorage.setItem('token', result.access_token);
          localStorage.setItem('role', result.user.role);
          this.$router.push('/dashboard');
        } else {
          this.errorMessage = result.message || "Invalid credentials.";
        }
      } catch (error) {
        console.error("Login error:", error);
        this.errorMessage = "Failed to connect to the server.";
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 2rem;
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 2.5rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 2rem;
}

.auth-header h2 {
  font-size: 1.75rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(to right, var(--primary), #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.auth-header p {
  color: var(--text-secondary);
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.error-alert {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-block {
  width: 100%;
  padding: 0.875rem;
  font-size: 1rem;
}

.btn-block:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.auth-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}
</style>
