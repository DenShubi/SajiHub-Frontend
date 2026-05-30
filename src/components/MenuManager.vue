<template>
  <div class="menu-manager">
    <div class="header-actions">
      <h2>Menu Management</h2>
      <button v-if="userRole === 'Admin'" @click="showAddForm = !showAddForm" class="btn-primary">
        {{ showAddForm ? 'Cancel' : '+ Add New Menu' }}
      </button>
    </div>

    <!-- Create Menu Form (Admin Only) -->
    <transition name="fade">
      <div v-if="showAddForm && userRole === 'Admin'" class="card form-card">
        <h3>Create New Menu Item</h3>
        <form @submit.prevent="saveMenu" class="menu-form">
          <div class="form-row">
            <div class="form-group">
              <label>Name</label>
              <input v-model="newMenu.name" placeholder="Nasi Goreng" required />
            </div>
            <div class="form-group">
              <label>Price (Rp)</label>
              <input v-model="newMenu.price" type="number" placeholder="25000" required />
            </div>
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="newMenu.description" rows="3" placeholder="Delicious fried rice..."></textarea>
          </div>
          
          <div class="form-group upload-section">
            <label>Menu Image</label>
            <div class="file-input-wrapper">
              <input type="file" @change="onFileChange" accept="image/*" required />
            </div>
          </div>
          
          <button type="submit" :disabled="isSaving" class="btn-submit">
            {{ isSaving ? 'Saving...' : 'Save Menu Item' }}
          </button>
        </form>
      </div>
    </transition>

    <!-- Menu List -->
    <div class="menu-grid">
      <div v-if="isLoading" class="loading">Loading menus...</div>
      <div v-else-if="menus.length === 0" class="empty-state">No menu items found.</div>
      
      <div v-for="menu in menus" :key="menu.id" class="card menu-card" @click="goToDetail(menu.id)">
        <div class="menu-image">
          <img :src="`http://localhost:8000${menu.image_url}`" :alt="menu.name" @error="handleImageError" />
        </div>
        <div class="menu-content">
          <h4>{{ menu.name }}</h4>
          <p class="price">Rp {{ formatPrice(menu.price) }}</p>
          <p class="description">{{ truncateText(menu.description, 60) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MenuManager',
  data() {
    return {
      menus: [],
      userRole: '',
      showAddForm: false,
      isLoading: true,
      isSaving: false,
      newMenu: {
        name: '',
        price: '',
        description: '',
        image: null
      }
    };
  },
  methods: {
    // READ (GET LIST)
    async getMenus() {
      this.isLoading = true;
      try {
        const response = await fetch('http://localhost:8000/api/menus', {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });
        const result = await response.json();
        // Since we updated the backend to public /menus, it returns the array directly
        this.menus = Array.isArray(result) ? result : (result.data || []);
      } catch (error) {
        console.error("Failed to load menus:", error);
      } finally {
        this.isLoading = false;
      }
    },

    // Handle File Input
    onFileChange(event) {
      this.newMenu.image = event.target.files[0];
    },

    // CREATE (POST)
    async saveMenu() {
      if (!this.newMenu.image) {
        alert("Please select an image!");
        return;
      }

      this.isSaving = true;
      const formData = new FormData();
      formData.append('name', this.newMenu.name);
      formData.append('price', this.newMenu.price);
      formData.append('description', this.newMenu.description || '');
      formData.append('image', this.newMenu.image);

      try {
        const response = await fetch('http://localhost:8000/api/menus', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          },
          body: formData
        });

        const result = await response.json();

        if (response.ok) {
          this.showAddForm = false;
          this.resetForm();
          this.getMenus(); // Refresh list
        } else {
          alert("Failed to create menu: " + (result.message || "Unknown error"));
        }
      } catch (error) {
        console.error("Save error:", error);
        alert("An error occurred while saving.");
      } finally {
        this.isSaving = false;
      }
    },

    goToDetail(id) {
      this.$router.push(`/menu/${id}`);
    },

    resetForm() {
      this.newMenu = { name: '', price: '', description: '', image: null };
      // Reset file input via DOM if needed, but Vue re-render usually clears it when v-if toggles
    },

    formatPrice(value) {
      return Number(value).toLocaleString('id-ID');
    },

    truncateText(text, length) {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    },

    handleImageError(e) {
      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
    }
  },
  mounted() {
    this.userRole = localStorage.getItem('role');
    this.getMenus();
  }
};
</script>

<style scoped>
.menu-manager {
  width: 100%;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.form-card {
  margin-bottom: 2rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.menu-form {
  margin-top: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.file-input-wrapper input {
  padding: 0.5rem 0;
  background: transparent;
  border: none;
}

.btn-submit {
  width: 100%;
  margin-top: 1rem;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.menu-card {
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
  border-color: var(--primary);
}

.menu-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f5f5f7;
}

.menu-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.menu-card:hover .menu-image img {
  transform: scale(1.05);
}

.menu-content {
  padding: 1.25rem;
}

.menu-content h4 {
  margin-bottom: 0.25rem;
  font-size: 1.1rem;
}

.price {
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 0.75rem;
  font-size: 1.25rem;
}

.description {
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
}

.loading, .empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}
</style>
