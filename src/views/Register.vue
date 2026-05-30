<template>
  <div class="auth-container">
    <div class="card auth-card">
      <div class="auth-header">
        <h2>Create Account</h2>
        <p>Join SajiHub today</p>
      </div>
      
      <form @submit.prevent="handleRegister" class="auth-form">
        <div class="form-group">
          <label>Full Name</label>
          <input v-model="name" type="text" placeholder="John Doe" required />
        </div>
        
        <div class="form-group">
          <label>Email Address</label>
          <input v-model="email" type="email" placeholder="john@example.com" required />
        </div>
        
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </div>
        
        <div class="form-group">
          <label>Confirm Password</label>
          <input v-model="password_confirmation" type="password" placeholder="••••••••" required />
        </div>
        
        <div class="form-group">
          <label>Role</label>
          <select v-model="role">
            <option value="Member">Member</option>
            <option value="Admin">Admin</option>
          </select>
        </div>
        
        <div v-if="errorMessage" class="error-alert">
          {{ errorMessage }}
        </div>
        
        <button type="submit" class="btn-block" :disabled="isLoading">
          {{ isLoading ? 'Registering...' : 'Sign Up' }}
        </button>
        
        <div class="auth-footer">
          Already have an account? <router-link to="/login">Login here</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Register',
  data() {
    return {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
      role: 'Member',
      isLoading: false,
      errorMessage: ''
    };
  },
  methods: {
    async handleRegister() {
      this.isLoading = true;
      this.errorMessage = '';
      
      if (this.password !== this.password_confirmation) {
        this.errorMessage = "Passwords do not match!";
        this.isLoading = false;
        return;
      }
      
      try {
        const response = await fetch('http://localhost:8000/api/register', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: this.name,
            email: this.email,
            password: this.password,
            password_confirmation: this.password_confirmation,
            role: this.role
          })
        });

        const result = await response.json();

        if (response.ok) {
          localStorage.setItem('token', result.access_token);
          localStorage.setItem('role', result.user.role);
          this.$router.push('/dashboard');
        } else {
          this.errorMessage = result.message || "Registration failed.";
        }
      } catch (error) {
        console.error("Register error:", error);
        this.errorMessage = "Failed to connect to the server.";
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
/* Inherits container styles from Login via scoped overlap or global classes */
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
  margin-bottom: 1.25rem;
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
