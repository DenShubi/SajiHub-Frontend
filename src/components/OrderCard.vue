<template>
  <div class="order-card card" @click="$emit('click', order.id)">
    <div class="order-header">
      <div>
        <span class="order-id">#{{ order.id }}</span>
        <span class="order-date">{{ formatDate(order.created_at) }}</span>
      </div>
      <span class="status-badge" :class="statusClass(order.status)">
        {{ order.status }}
      </span>
    </div>

    <div class="order-items">
      <span v-for="(item, idx) in order.items" :key="item.id">
        {{ item.menu?.name || 'Menu' }} ×{{ item.quantity }}<span v-if="idx < order.items.length - 1">, </span>
      </span>
    </div>

    <div class="order-footer">
      <span class="order-total">Rp {{ formatPrice(order.total_price) }}</span>
      <span v-if="!order.payment_proof_url" class="no-proof">Bukti bayar belum diupload</span>
      <span v-else class="has-proof">✓ Bukti bayar tersedia</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrderCard',
  props: {
    order: {
      type: Object,
      required: true,
    },
  },
  emits: ['click'],
  methods: {
    formatPrice(v) {
      return Number(v).toLocaleString('id-ID');
    },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    },
    statusClass(status) {
      const map = {
        Pending: 'status-pending',
        Confirmed: 'status-confirmed',
        Cooking: 'status-cooking',
        Ready: 'status-ready',
        Completed: 'status-completed',
        Cancelled: 'status-cancelled',
      };
      return map[status] || 'status-pending';
    },
  },
};
</script>

<style scoped>
.order-card {
  padding: 1.25rem 1.5rem;
  cursor: pointer;
  transition: var(--transition);
}

.order-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--primary);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.order-id {
  font-weight: 700;
  font-size: 1rem;
  margin-right: 0.75rem;
}

.order-date {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.3rem 0.75rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.status-pending   { background: #fff3cd; color: #856404; }
.status-confirmed { background: #cce5ff; color: #004085; }
.status-cooking   { background: #ffe5d0; color: #8a3800; }
.status-ready     { background: #d4edda; color: #155724; }
.status-completed { background: #e2e3e5; color: #383d41; }
.status-cancelled { background: #f8d7da; color: #721c24; }

.order-items {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid var(--border);
}

.order-total {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.no-proof {
  font-size: 0.8rem;
  color: var(--danger);
}

.has-proof {
  font-size: 0.8rem;
  color: #155724;
}
</style>
