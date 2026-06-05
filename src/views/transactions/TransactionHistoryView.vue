<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'
import { useAuth } from '../../composables/useAuth'
import { useShift } from '../../composables/useShift'
import { useBranch } from '../../composables/useBranch'
import ReceiptModal from '../pos/ReceiptModal.vue'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const { user, isOwner } = useAuth()
const { currentShift, fetchCurrentShift, isLoading: isShiftLoading } = useShift()
const { selectedBranchId } = useBranch()

const transactions = ref([])
const isLoading = ref(false)
const selectedTransaction = ref(null)
const isReceiptOpen = ref(false)

const fetchTransactions = async () => {
    isLoading.value = true
    try {
        const today = new Date().toISOString().slice(0, 10)
        let params = {
            start_date: today + ' 00:00:00',
            end_date: today + ' 23:59:59',
        }

        // For owners: use the selected branch from switcher (or show all if none selected)
        // For cashiers: use their assigned branch
        const branchId = isOwner.value ? selectedBranchId.value : user.value?.branch_id
        if (branchId) params.branch_id = branchId
        
        const response = await axios.get(`${API_URL}/transactions`, { params })
        transactions.value = response.data.data
    } catch (e) {
        console.error('Error fetching transactions:', e)
    } finally {
        isLoading.value = false
    }
}

const openReceipt = (transaction) => {
    selectedTransaction.value = transaction
    isReceiptOpen.value = true
}

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
    await fetchCurrentShift()
    fetchTransactions()
})

const { can } = useAuth()

const exportExcel = () => {
    // Implement export logic here
    alert('Fitur Export Excel akan segera hadir!')
}

const showUpgradeModal = () => {
    alert('Fitur Export Excel hanya tersedia untuk paket PRO dan BUSINESS. Silakan upgrade paket Anda.')
}
</script>

<template>
  <div id="view-transactions" class="view-section pt-6 px-4 pb-24 slide-up">
      <header class="flex justify-between items-center mb-6">
           <div>
               <h1 class="text-2xl font-bold text-slate-900">Riwayat Transaksi</h1>
               <p class="text-sm text-slate-500">Hari ini</p>
           </div>
           <div class="flex gap-2">
               <!-- Export Button -->
               <button class="h-10 px-4 rounded-xl flex items-center gap-2 font-bold transition border"
                    :class="[
                        can('export-excel') 
                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' 
                            : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'
                    ]"
                    @click="can('export-excel') ? exportExcel() : showUpgradeModal()"
               >
                   <i class="ri-file-excel-line text-lg" :class="{ 'text-green-600': can('export-excel') }"></i>
                   <span class="hidden md:inline">Export</span>
                   <i v-if="!can('export-excel')" class="ri-lock-fill text-xs ml-1"></i>
               </button>

               <button @click="fetchTransactions" class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition">
                   <i class="ri-refresh-line text-xl" :class="{ 'animate-spin': isLoading }"></i>
               </button>
           </div>
      </header>

      <div v-if="isLoading" class="text-center py-20 text-slate-400">Loading...</div>
      
      <div v-else-if="transactions.length === 0" class="text-center py-20 opacity-50">
          <div class="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <i class="ri-file-list-3-line text-4xl"></i>
          </div>
          <p class="text-slate-500">Belum ada transaksi hari ini.</p>
      </div>

      <div v-else class="space-y-4">
          <div v-for="trx in transactions" :key="trx.id" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group">
              <div>
                  <div class="flex items-center gap-2 mb-1">
                      <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{{ trx.transaction_code }}</span>
                      <span class="text-xs text-slate-400">• {{ formatDate(trx.created_at) }}</span>
                  </div>
                  <h4 class="font-bold text-slate-900 text-lg">{{ formatCurrency(trx.total_amount) }}</h4>
                  <p class="text-xs text-slate-500">{{ trx.payment_method === 'cash' ? 'Tunai' : 'Non-Tunai' }} • {{ trx.items_count || trx.details?.length || 0 }} Item</p>
              </div>
              <button @click="openReceipt(trx)" class="bg-brand-50 text-brand-600 px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-100 transition flex items-center gap-1">
                  <i class="ri-printer-line"></i>
                  Cetak
              </button>
          </div>
      </div>

      <Teleport to="body">
          <ReceiptModal 
              :is-open="isReceiptOpen" 
              :transaction="selectedTransaction" 
              @close="isReceiptOpen = false" 
          />
      </Teleport>

      <!-- Shift Block Overlay -->
      <div v-if="!isOwner && !isShiftLoading && !currentShift" class="fixed inset-0 z-[60] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div class="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <i class="ri-lock-2-line text-4xl"></i>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Akses Terkunci</h2>
          <p class="text-slate-500 mb-8 max-w-xs mx-auto">Anda belum memulai shift. Silakan buka kasir melalui Dashboard untuk memulai.</p>
          <router-link to="/" class="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition">
              Kembali ke Dashboard
          </router-link>
      </div>
  </div>
</template>
