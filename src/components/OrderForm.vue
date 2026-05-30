<template>
  <div class="card order-form-card">
    <h3>Buat Pre-Order Baru</h3>

    <!-- Menu selector -->
    <div class="form-group">
      <label>Pilih Menu</label>
      <div v-if="isLoadingMenus" class="loading-small">Memuat menu...</div>
      <div v-else class="menu-selector">
        <div
          v-for="menu in menus"
          :key="menu.id"
          class="menu-option"
          :class="{ selected: isSelected(menu.id) }"
          @click="toggleMenu(menu)"
        >
          <img
            :src="`http://localhost:8000${menu.image_url}`"
            :alt="menu.name"
            @error="handleImageError"
          />
          <div class="menu-option-info">
            <span class="menu-option-name">{{ menu.name }}</span>
            <span class="menu-option-price">Rp {{ formatPrice(menu.price) }}</span>
          </div>
          <div v-if="isSelected(menu.id)" class="qty-control" @click.stop>
            <button class="qty-btn" @click="decreaseQty(menu.id)">−</button>
            <span class="qty-value">{{ getQty(menu.id) }}</span>
            <button class="qty-btn" @click="increaseQty(menu.id)">+</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Order summary -->
    <div v-if="selectedItems.length > 0" class="order-summary">
      <h4>Ringkasan Order</h4>
      <div v-for="item in selectedItems" :key="item.menu_id" class="summary-row">
        <span>{{ item.name }} × {{ item.quantity }}</span>
        <span>Rp {{ formatPrice(item.price * item.quantity) }}</span>
      </div>
      <div class="summary-total">
        <span>Total</span>
        <span>Rp {{ formatPrice(totalPrice) }}</span>
      </div>
    </div>

    <!-- Notes -->
    <div class="form-group">
      <label>Catatan (opsional)</label>
      <textarea v-model="notes" rows="2" placeholder="Contoh: Tanpa bawang, extra pedas..."></textarea>
    </div>

    <!-- Payment proof -->
    <div class="form-group">
      <label>Bukti Pembayaran (opsional, bisa upload belakangan)</label>
      <input type="file" @change="onFileChange" accept="image/*" />
    </div>

    <div v-if="errorMessage" class="error-alert">{{ errorMessage }}</div>

    <div class="form-actions">
      <button @click="$emit('cancel')" class="btn-secondary">Batal</button>
      <button @click="submitOrder" :disabled="isSaving || selectedItems.length === 0" class="btn-primary">
        {{ isSaving ? 'Memproses...' : 'Buat Order' }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrderForm',
  emits: ['cancel', 'order-created'],
  data() {
    return {
      menus: [],
      isLoadingMenus: true,
      isSaving: false,
      errorMessage: '',
      notes: '',
      paymentProof: null,
      selectedItems: [], // [{ menu_id, name, price, quantity }]
    };
  },
  computed: {
    totalPrice() {
      return this.selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },
  },
  methods: {
    async fetchMenus() {
      try {
        const res = await fetch('http://localhost:8000/api/menus', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        this.menus = Array.isArray(data) ? data : data.data || [];
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoadingMenus = false;
      }
    },
    isSelected(menuId) {
      return this.selectedItems.some((i) => i.menu_id === menuId);
    },
    getQty(menuId) {
      return this.selectedItems.find((i) => i.menu_id === menuId)?.quantity || 0;
    },
    toggleMenu(menu) {
      if (this.isSelected(menu.id)) {
        this.selectedItems = this.selectedItems.filter((i) => i.menu_id !== menu.id);
      } else {
        this.selectedItems.push({ menu_id: menu.id, name: menu.name, price: Number(menu.price), quantity: 1 });
      }
    },
    increaseQty(menuId) {
      const item = this.selectedItems.find((i) => i.menu_id === menuId);
      if (item) item.quantity++;
    },
    decreaseQty(menuId) {
      const item = this.selectedItems.find((i) => i.menu_id === menuId);
      if (!item) return;
      if (item.quantity <= 1) {
        this.selectedItems = this.selectedItems.filter((i) => i.menu_id !== menuId);
      } else {
        item.quantity--;
      }
    },
    onFileChange(e) {
      this.paymentProof = e.target.files[0];
    },
    async submitOrder() {
      if (this.selectedItems.length === 0) return;
      this.isSaving = true;
      this.errorMessage = '';

      const formData = new FormData();
      if (this.notes) formData.append('notes', this.notes);
      if (this.paymentProof) formData.append('payment_proof', this.paymentProof);
      this.selectedItems.forEach((item, idx) => {
        formData.append(`items[${idx}][menu_id]`, item.menu_id);
        formData.append(`items[${idx}][quantity]`, item.quantity);
      });

      try {
        const res = await fetch('http://localhost:8000/api/orders', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
          },
          body: formData,
        });
        const result = await res.json();
        if (res.ok) {
          this.$emit('order-created', result.order);
        } else {
          this.errorMessage = result.message || 'Gagal membuat order.';
        }
      } catch (e) {
        this.errorMessage = 'Tidak dapat terhubung ke server.';
      } finally {
        this.isSaving = false;
      }
    },
    formatPrice(v) {
      return Number(v).toLocaleString('id-ID');
    },
    handleImageError(e) {
      e.target.src = 'https://via.placeholder.com/60x60?text=No+Img';
    },
  },
  mounted() {
    this.fetchMenus();
  },
};
</script>

<style scoped>
.order-form-card {
  margin-bottom: 2rem;
}

.order-form-card h3 {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.loading-small {
  color: var(--text-secondary);
  font-size: 0.875rem;
  padding: 0.5rem 0;
}

.menu-selector {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

.menu-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border: 1.5px solid var(--border);
  border-radius: 12px;
  cursor: pointer;
  transition: var(--transition);
  background: #f5f5f7;
}

.menu-option:hover {
  border-color: var(--primary);
  background: rgba(0, 113, 227, 0.04);
}

.menu-option.selected {
  border-color: var(--primary);
  background: rgba(0, 113, 227, 0.07);
}

.menu-option img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  object-fit: cover;
  flex-shrink: 0;
}

.menu-option-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.menu-option-name {
  font-weight: 600;
  font-size: 0.95rem;
}

.menu-option-price {
  font-size: 0.875rem;
  color: var(--primary);
  font-weight: 500;
}

.qty-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.qty-btn {
  background: var(--primary);
  color: white;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-value {
  font-weight: 700;
  font-size: 1rem;
  min-width: 20px;
  text-align: center;
}

.order-summary {
  background: #f5f5f7;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
}

.order-summary h4 {
  font-size: 0.875rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  margin-bottom: 0.4rem;
  color: var(--text-secondary);
}

.summary-total {
  display: flex;
  justify-content: space-between;
  font-weight: 700;
  font-size: 1rem;
  color: var(--text-primary);
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.error-alert {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.05);
}
</style>
