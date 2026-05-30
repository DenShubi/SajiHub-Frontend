<template>
  <div class="container">
    <div class="header-actions">
      <button @click="$router.push('/dashboard')" class="btn-back">
        &larr; Back to Dashboard
      </button>
    </div>

    <div v-if="isLoading" class="loading">
      Loading details...
    </div>

    <div v-else-if="!menu" class="error-state">
      Menu item not found.
    </div>

    <div v-else class="detail-grid">
      <div class="detail-image-col">
        <div class="image-wrapper">
          <img :src="`http://localhost:8000${menu.image_url}`" :alt="menu.name" @error="handleImageError" />
        </div>
      </div>
      
      <div class="detail-content-col">
        <div class="card detail-card">
          <template v-if="!isEditing">
            <h1>{{ menu.name }}</h1>
            <div class="price-tag">Rp {{ formatPrice(menu.price) }}</div>
            
            <div class="meta-info">
              <p><strong>Description:</strong></p>
              <p class="desc-text">{{ menu.description || 'No description provided.' }}</p>
              
              <p class="dates">
                Added: {{ formatDate(menu.created_at) }}
              </p>
            </div>

            <div v-if="userRole === 'Admin'" class="admin-actions">
              <hr />
              <h3>Admin Zone</h3>
              <p class="warning-text">Manage this menu item.</p>
              <div class="action-buttons">
                <button @click="startEdit" class="btn-primary">Edit Menu Item</button>
                <button @click="confirmDelete" :disabled="isDeleting" class="btn-danger">
                  {{ isDeleting ? 'Deleting...' : 'Delete Menu Item' }}
                </button>
              </div>
            </div>
          </template>

          <template v-else>
            <h2>Edit Menu Item</h2>
            <form @submit.prevent="submitEdit" class="edit-form">
              <div class="form-group">
                <label>Name</label>
                <input v-model="editForm.name" required />
              </div>
              <div class="form-group">
                <label>Price (Rp)</label>
                <input v-model="editForm.price" type="number" required />
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea v-model="editForm.description" rows="3"></textarea>
              </div>
              <div class="form-group upload-section">
                <label>Menu Image (Required)</label>
                <div class="file-input-wrapper">
                  <input type="file" @change="onEditFileChange" accept="image/*" required />
                </div>
              </div>
              <div class="action-buttons edit-actions">
                <button type="submit" :disabled="isUpdating" class="btn-primary">
                  {{ isUpdating ? 'Updating...' : 'Save Changes' }}
                </button>
                <button type="button" @click="cancelEdit" class="btn-secondary" :disabled="isUpdating">
                  Cancel
                </button>
              </div>
            </form>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MenuDetail',
  data() {
    return {
      menu: null,
      userRole: '',
      isLoading: true,
      isDeleting: false,
      isEditing: false,
      isUpdating: false,
      editForm: {
        name: '',
        price: '',
        description: '',
        image: null
      }
    };
  },
  methods: {
    // READ DETAIL (GET)
    async getMenuDetail() {
      const menuId = this.$route.params.id;
      try {
        const response = await fetch(`http://localhost:8000/api/menus/${menuId}`, {
          headers: { 
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // Fallback if backend returns item directly or nested in data
          this.menu = result.menu || result.data || result;
        } else {
          console.error("Failed to fetch menu details");
        }
      } catch (error) {
        console.error("Fetch detail error:", error);
      } finally {
        this.isLoading = false;
      }
    },

    // UPDATE
    startEdit() {
      this.editForm = {
        name: this.menu.name,
        price: this.menu.price,
        description: this.menu.description,
        image: null
      };
      this.isEditing = true;
    },
    cancelEdit() {
      this.isEditing = false;
    },
    onEditFileChange(event) {
      this.editForm.image = event.target.files[0];
    },
    async submitEdit() {
      if (!this.editForm.image) {
        alert("Image is required to update the menu item.");
        return;
      }
      this.isUpdating = true;
      const formData = new FormData();
      formData.append('name', this.editForm.name);
      formData.append('price', this.editForm.price);
      formData.append('description', this.editForm.description || '');
      formData.append('image', this.editForm.image);
      formData.append('_method', 'PUT');

      try {
        const response = await fetch(`http://localhost:8000/api/menus/${this.menu.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          },
          body: formData
        });

        const result = await response.json();
        
        if (response.ok) {
          alert("Menu item updated successfully.");
          this.isEditing = false;
          this.getMenuDetail();
        } else {
          alert("Failed to update: " + (result.message || "Unknown error"));
        }
      } catch (error) {
        console.error("Update error:", error);
        alert("An error occurred while updating.");
      } finally {
        this.isUpdating = false;
      }
    },

    // DELETE
    async confirmDelete() {
      if (!confirm("Are you sure you want to delete this menu item?")) {
        return;
      }

      this.isDeleting = true;
      try {
        const response = await fetch(`http://localhost:8000/api/menus/${this.menu.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          alert("Menu item deleted successfully.");
          this.$router.push('/dashboard');
        } else {
          const result = await response.json();
          alert("Failed to delete: " + (result.message || "Unknown error"));
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("An error occurred while deleting.");
      } finally {
        this.isDeleting = false;
      }
    },

    formatPrice(value) {
      return Number(value).toLocaleString('id-ID');
    },

    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString('id-ID', {
        year: 'numeric', month: 'long', day: 'numeric'
      });
    },

    handleImageError(e) {
      e.target.src = 'https://via.placeholder.com/600x400?text=No+Image';
    }
  },
  mounted() {
    this.userRole = localStorage.getItem('role');
    this.getMenuDetail();
  }
};
</script>

<style scoped>
.header-actions {
  margin-bottom: 2rem;
}

.btn-back {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-primary);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

.image-wrapper {
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--border);
  aspect-ratio: 4/3;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-card h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
}

.price-tag {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2rem;
}

.meta-info {
  flex: 1;
}

.desc-text {
  color: var(--text-secondary);
  font-size: 1.1rem;
  line-height: 1.7;
  margin-bottom: 1.5rem;
}

.dates {
  font-size: 0.875rem;
  color: var(--text-secondary);
  opacity: 0.7;
}

.admin-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
}

.admin-actions hr {
  border: none;
  border-top: 1px solid var(--border);
  margin-bottom: 1.5rem;
}

.admin-actions h3 {
  font-size: 1.25rem;
  color: var(--danger);
  margin-bottom: 0.5rem;
}

.warning-text {
  color: var(--text-secondary);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.edit-actions {
  margin-top: 2rem;
}

.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.edit-form {
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

.loading, .error-state {
  text-align: center;
  padding: 4rem;
  font-size: 1.2rem;
  color: var(--text-secondary);
}
</style>
