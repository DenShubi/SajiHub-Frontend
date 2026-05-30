<template>
  <div class="container">
    <div class="page-header">
      <div>
        <h1>Kelola Semua Order</h1>
        <p class="subtitle">Update status dan pantau semua pesanan masuk</p>
      </div>
      <!-- Filter by status -->
      <select v-model="filterStatus" class="filter-select">
        <option value="">Semua Status</option>
        <option v-for="s in allStatuses" :key="s" :value="s">{{ s }}</option>
      </select>
    </div>

    <div v-if="isLoading" class="state-info">Memuat semua order...</div>
    <div v-else-if="filteredOrders.length === 0" class="state-info empty">Tidak ada order.</div>

    <div v-else class="orders-table-wrap card">
      <table class="orders-table">
        <thead>
          <tr>
            <th>#ID</th>
            <th>Member</th>
            <th>Item</th>
            <th>Total</th>
            <th>Bukti Bayar</th>
            <th>Status</th>
            <th>Ubah Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order.id">
            <td class="td-id" @click="goToDetail(order.id)">#{{ order.id }}</td>
            <td>
              <span class="member-name">{{ order.user?.name || '-' }}</span>
              <span class="member-email">{{ order.user?.email || '' }}</span>
            </td>
            <td class="td-items">
              <span v-for="(item, idx) in order.items" :key="item.id">
                {{ item.menu?.name || 'Menu' }} ×{{ item.quantity }}<span v-if="idx < order.items.length - 1">, </span>
              </span>
            </td>
            <td class="td-total">Rp {{ formatPrice(order.total_price) }}</td>
            <td class="td-proof">
              <a
                v-if="order.payment_proof_url"
                :href="`http://localhost:8000${order.payment_proof_url}`"
                target="_blank"
                class="proof-link"
              >Lihat</a>
              <span v-else class="no-proof">—</span>
            </td>
            <td>
              <span class="status-badge" :class="statusClass(order.status)">{{ order.status }}</span>
            </td>
            <td class="td-action">
              <select
                v-if="order.status !== 'Completed' && order.status !== 'Cancelled'"
                v-model="pendingStatus[order.id]"
                class="status-select"
              >
                <option disabled value="">Pilih...</option>
                <option v-for="s in nextStatuses(order.status)" :key="s" :value="s">{{ s }}</option>
              </select>
              <button
                v-if="pendingStatus[order.id]"
                @click="updateStatus(order.id)"
                :disabled="updatingId === order.id"
                class="btn-update"
              >
                {{ updatingId === order.id ? '...' : 'Update' }}
              </button>
              <span v-if="order.status === 'Completed' || order.status === 'Cancelled'" class="final-label">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AdminOrders',
  data() {
    return {
      orders: [],
      isLoading: true,
      filterStatus: '',
      pendingStatus: {}, // { [order.id]: selectedNewStatus }
      updatingId: null,
      allStatuses: ['Pending', 'Confirmed', 'Cooking', 'Ready', 'Completed', 'Cancelled'],
    };
  },
  computed: {
    filteredOrders() {
      if (!this.filterStatus) return this.orders;
      return this.orders.filter((o) => o.status === this.filterStatus);
    },
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
        // Init pendingStatus map
        this.orders.forEach((o) => { this.pendingStatus[o.id] = ''; });
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoading = false;
      }
    },
    nextStatuses(current) {
      const transitions = {
        Pending: ['Confirmed', 'Cancelled'],
        Confirmed: ['Cooking', 'Cancelled'],
        Cooking: ['Ready', 'Cancelled'],
        Ready: ['Completed', 'Cancelled'],
        Completed: [],
        Cancelled: [],
      };
      return transitions[current] || [];
    },
    async updateStatus(orderId) {
      const newStatus = this.pendingStatus[orderId];
      if (!newStatus) return;
      this.updatingId = orderId;
      try {
        const res = await fetch(`http://localhost:8000/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });
        const result = await res.json();
        if (res.ok) {
          // Update locally without re-fetch
          const order = this.orders.find((o) => o.id === orderId);
          if (order) order.status = newStatus;
          this.pendingStatus[orderId] = '';
        } else {
          alert(result.message || 'Gagal update status.');
        }
      } catch (e) {
        alert('Tidak dapat terhubung ke server.');
      } finally {
        this.updatingId = null;
      }
    },
    goToDetail(id) {
      this.$router.push(`/orders/${id}`);
    },
    formatPrice(v) { return Number(v).toLocaleString('id-ID'); },
    statusClass(status) {
      const map = {
        Pending: 'status-pending', Confirmed: 'status-confirmed',
        Cooking: 'status-cooking', Ready: 'status-ready',
        Completed: 'status-completed', Cancelled: 'status-cancelled',
      };
      return map[status] || 'status-pending';
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
  gap: 1rem;
}
.page-header h1 { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.04em; margin-bottom: 0.25rem; }
.subtitle { color: var(--text-secondary); font-size: 1rem; }

.filter-select {
  width: auto;
  min-width: 160px;
  margin-bottom: 0;
  padding: 0.65rem 1rem;
  font-size: 0.9rem;
}

.state-info { text-align: center; padding: 4rem; color: var(--text-secondary); }
.state-info.empty {
  background: var(--bg-card);
  border-radius: var(--radius);
  border: 1px dashed var(--border);
}

.orders-table-wrap { padding: 0; overflow-x: auto; }

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.orders-table th {
  text-align: left;
  padding: 0.9rem 1rem;
  border-bottom: 2px solid var(--border);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  white-space: nowrap;
}

.orders-table td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.orders-table tr:last-child td { border-bottom: none; }
.orders-table tr:hover td { background: rgba(0, 113, 227, 0.03); }

.td-id {
  font-weight: 700;
  color: var(--primary);
  cursor: pointer;
  white-space: nowrap;
}
.td-id:hover { text-decoration: underline; }

.member-name { display: block; font-weight: 600; }
.member-email { display: block; font-size: 0.78rem; color: var(--text-secondary); }

.td-items { max-width: 200px; color: var(--text-secondary); }
.td-total { font-weight: 600; white-space: nowrap; }

.proof-link { color: var(--primary); font-weight: 500; }
.no-proof { color: var(--text-secondary); }

.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.status-pending   { background: #fff3cd; color: #856404; }
.status-confirmed { background: #cce5ff; color: #004085; }
.status-cooking   { background: #ffe5d0; color: #8a3800; }
.status-ready     { background: #d4edda; color: #155724; }
.status-completed { background: #e2e3e5; color: #383d41; }
.status-cancelled { background: #f8d7da; color: #721c24; }

.td-action { white-space: nowrap; }

.status-select {
  width: 120px;
  padding: 0.4rem 0.6rem;
  font-size: 0.8rem;
  margin-bottom: 0;
  display: inline-block;
}

.btn-update {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
  margin-left: 0.5rem;
  background: var(--primary);
  color: white;
  border-radius: 8px;
}
.btn-update:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.final-label { color: var(--text-secondary); }
</style>
