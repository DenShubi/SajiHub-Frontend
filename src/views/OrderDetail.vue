<template>
  <div class="container">
    <div class="back-row">
      <button @click="$router.push('/orders')" class="btn-back">&larr; Kembali</button>
    </div>

    <div v-if="isLoading" class="state-info">Memuat detail...</div>
    <div v-else-if="!order" class="state-info">Order tidak ditemukan.</div>

    <div v-else class="detail-layout">
      <!-- Left: info & items -->
      <div class="detail-main">
        <div class="card">
          <div class="order-title-row">
            <h2>Order #{{ order.id }}</h2>
            <span class="status-badge" :class="statusClass(order.status)">{{ order.status }}</span>
          </div>
          <p class="order-date">{{ formatDate(order.created_at) }}</p>

          <!-- Status stepper -->
          <div class="stepper">
            <div
              v-for="(step, idx) in steps"
              :key="step"
              class="step"
              :class="{
                active: order.status === step,
                done: stepIndex > idx,
                cancelled: order.status === 'Cancelled'
              }"
            >
              <div class="step-dot"></div>
              <span class="step-label">{{ step }}</span>
            </div>
          </div>

          <!-- Items -->
          <h4 class="section-title">Item Pesanan</h4>
          <div class="items-list">
            <div v-for="item in order.items" :key="item.id" class="item-row">
              <span>{{ item.menu?.name || 'Menu #' + item.menu_id }}</span>
              <span class="item-qty">×{{ item.quantity }}</span>
              <span class="item-subtotal">Rp {{ formatPrice(item.price * item.quantity) }}</span>
            </div>
          </div>
          <div class="total-row">
            <span>Total</span>
            <span class="total-amount">Rp {{ formatPrice(order.total_price) }}</span>
          </div>

          <div v-if="order.notes" class="notes-box">
            <strong>Catatan:</strong> {{ order.notes }}
          </div>
        </div>
      </div>

      <!-- Right: payment proof & actions -->
      <div class="detail-sidebar">

        <!-- Payment Proof -->
        <div class="card proof-card">
          <h4>Bukti Pembayaran</h4>
          <div v-if="order.payment_proof_url" class="proof-image-wrap">
            <img :src="`http://localhost:8000${order.payment_proof_url}`" alt="Bukti Pembayaran" />
          </div>
          <p v-else class="no-proof-text">Belum ada bukti pembayaran.</p>

          <!-- Upload proof form — only when status allows -->
          <div v-if="canUploadProof" class="upload-form">
            <label class="upload-label">
              {{ order.payment_proof_url ? 'Ganti Bukti Pembayaran' : 'Upload Bukti Pembayaran' }}
            </label>
            <input type="file" @change="onProofChange" accept="image/*" />
            <div v-if="proofError" class="error-alert">{{ proofError }}</div>
            <button
              @click="uploadProof"
              :disabled="!proofFile || isUploading"
              class="btn-upload"
            >
              {{ isUploading ? 'Mengupload...' : 'Upload' }}
            </button>
          </div>
        </div>

        <!-- Cancel order — only when Pending -->
        <div v-if="order.status === 'Pending'" class="card cancel-card">
          <h4>Batalkan Order</h4>
          <p>Order hanya bisa dibatalkan selama masih berstatus <strong>Pending</strong>.</p>
          <button @click="cancelOrder" :disabled="isCancelling" class="btn-danger">
            {{ isCancelling ? 'Membatalkan...' : 'Batalkan Order' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrderDetail',
  data() {
    return {
      order: null,
      isLoading: true,
      proofFile: null,
      isUploading: false,
      isCancelling: false,
      proofError: '',
      steps: ['Pending', 'Confirmed', 'Cooking', 'Ready', 'Completed'],
    };
  },
  computed: {
    stepIndex() {
      return this.steps.indexOf(this.order?.status);
    },
    canUploadProof() {
      return this.order && ['Pending', 'Confirmed'].includes(this.order.status);
    },
  },
  methods: {
    async fetchOrder() {
      const id = this.$route.params.id;
      try {
        const res = await fetch(`http://localhost:8000/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
          },
        });
        const data = await res.json();
        this.order = res.ok ? data : null;
      } catch (e) {
        this.order = null;
      } finally {
        this.isLoading = false;
      }
    },
    onProofChange(e) {
      this.proofFile = e.target.files[0];
      this.proofError = '';
    },
    async uploadProof() {
      if (!this.proofFile) return;
      this.isUploading = true;
      this.proofError = '';

      const formData = new FormData();
      formData.append('payment_proof', this.proofFile);

      try {
        const res = await fetch(`http://localhost:8000/api/orders/${this.order.id}/upload-proof`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
          },
          body: formData,
        });
        const result = await res.json();
        if (res.ok) {
          this.proofFile = null;
          this.fetchOrder();
        } else {
          this.proofError = result.message || 'Gagal upload bukti.';
        }
      } catch (e) {
        this.proofError = 'Tidak dapat terhubung ke server.';
      } finally {
        this.isUploading = false;
      }
    },
    async cancelOrder() {
      if (!confirm('Yakin ingin membatalkan order ini?')) return;
      this.isCancelling = true;
      try {
        const res = await fetch(`http://localhost:8000/api/orders/${this.order.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            Accept: 'application/json',
          },
        });
        if (res.ok) {
          this.$router.push('/orders');
        } else {
          const result = await res.json();
          alert(result.message || 'Gagal membatalkan order.');
        }
      } catch (e) {
        alert('Tidak dapat terhubung ke server.');
      } finally {
        this.isCancelling = false;
      }
    },
    statusClass(status) {
      const map = {
        Pending: 'status-pending', Confirmed: 'status-confirmed',
        Cooking: 'status-cooking', Ready: 'status-ready',
        Completed: 'status-completed', Cancelled: 'status-cancelled',
      };
      return map[status] || 'status-pending';
    },
    formatPrice(v) { return Number(v).toLocaleString('id-ID'); },
    formatDate(d) {
      if (!d) return '';
      return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    },
  },
  mounted() { this.fetchOrder(); },
};
</script>

<style scoped>
.back-row { margin-bottom: 1.5rem; }

.btn-back {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border);
}
.btn-back:hover { background: rgba(0,0,0,0.04); color: var(--text-primary); }

.state-info { text-align: center; padding: 4rem; color: var(--text-secondary); }

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 1.5rem;
  align-items: start;
}

@media (max-width: 768px) {
  .detail-layout { grid-template-columns: 1fr; }
}

.order-title-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.order-title-row h2 { margin: 0; font-size: 1.75rem; }

.order-date { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.5rem; }

/* Stepper */
.stepper {
  display: flex;
  gap: 0;
  margin-bottom: 2rem;
  position: relative;
}
.stepper::before {
  content: '';
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  height: 2px;
  background: var(--border);
  z-index: 0;
}
.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  position: relative;
  z-index: 1;
}
.step-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--border);
  border: 3px solid var(--bg-card);
  transition: var(--transition);
}
.step.done .step-dot { background: var(--primary); }
.step.active .step-dot { background: var(--primary); box-shadow: 0 0 0 4px rgba(0,113,227,0.2); }
.step.cancelled .step-dot { background: var(--danger); }
.step-label { font-size: 0.7rem; color: var(--text-secondary); text-align: center; }
.step.active .step-label, .step.done .step-label { color: var(--primary); font-weight: 600; }

/* Items */
.section-title { font-size: 0.875rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }

.items-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }

.item-row {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
}
.item-row span:first-child { flex: 1; }
.item-qty { color: var(--text-secondary); min-width: 30px; }
.item-subtotal { font-weight: 600; min-width: 100px; text-align: right; }

.total-row {
  display: flex;
  justify-content: space-between;
  padding-top: 0.75rem;
  font-weight: 700;
  font-size: 1.1rem;
}
.total-amount { color: var(--primary); }

.notes-box {
  margin-top: 1rem;
  background: #f5f5f7;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  color: var(--text-secondary);
}

/* Sidebar */
.proof-card, .cancel-card { padding: 1.5rem; }
.proof-card h4, .cancel-card h4 { margin-bottom: 0.75rem; }
.cancel-card p { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1rem; }

.proof-image-wrap {
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 1rem;
  border: 1px solid var(--border);
}
.proof-image-wrap img { width: 100%; display: block; }
.no-proof-text { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem; }

.upload-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 0.5rem; }

.error-alert {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
  font-size: 0.8rem;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.btn-upload {
  background: var(--primary);
  color: white;
  width: 100%;
  margin-top: 0.5rem;
}
.btn-upload:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

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

.detail-sidebar { display: flex; flex-direction: column; gap: 1.25rem; }
</style>
