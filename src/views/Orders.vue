<template>
  <div class="container">
    <div class="page-header">
      <div>
        <h1>Pesanan Saya</h1>
        <p class="subtitle">Riwayat dan status pre-order kamu</p>
      </div>
      <button @click="showForm = !showForm" class="btn-primary">
        {{ showForm ? 'Tutup Form' : '+ Buat Order Baru' }}
      </button>
    </div>

    <!-- Create Order Form -->
    <transition name="fade">
      <OrderForm
        v-if="showForm"
        @cancel="showForm = false"
        @order-created="onOrderCreated"
      />
    </transition>

    <!-- Order List -->
    <div v-if="isLoading" class="state-info">Memuat pesanan...</div>
    <div v-else-if="orders.length === 0" class="state-info empty">
      Belum ada pesanan. Klik <strong>Buat Order Baru</strong> untuk mulai!
    </div>
    <div v-else class="orders-grid">
      <OrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        @click="goToDetail"
      />
    </div>
  </div>
</template>

<script>
import OrderForm from '../components/OrderForm.vue';
import OrderCard from '../components/OrderCard.vue';

export default {
  name: 'Orders',
  components: { OrderForm, OrderCard },
  data() {
    return {
      orders: [],
      isLoading: true,
      showForm: false,
    };
  },
  methods: {
    async fetchOrders() {
      this.isLoading = true;
      try {
        const res = await fetch('http://localhost:8000/api/orders', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        this.orders = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoading = false;
      }
    },
    onOrderCreated(order) {
      this.showForm = false;
      this.fetchOrders();
    },
    goToDetail(id) {
      this.$router.push(`/orders/${id}`);
    },
  },
  mounted() {
    this.fetchOrders();
  },
};
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.orders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.25rem;
}

.state-info {
  text-align: center;
  padding: 4rem;
  color: var(--text-secondary);
  font-size: 1rem;
}

.state-info.empty {
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}

.btn-primary {
  background: var(--primary);
  color: white;
  white-space: nowrap;
}
</style>
