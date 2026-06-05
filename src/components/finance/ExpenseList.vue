<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import axios from 'axios'
import { useBranch } from '../../composables/useBranch'
import { useAuth } from '../../composables/useAuth'
import { useShift } from '../../composables/useShift'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const { branches, fetchBranches } = useBranch()
const { user, isOwner, can } = useAuth()
// Rename isLoading to avoid conflict or use alias
const { currentShift, fetchCurrentShift, isLoading: isShiftLoading } = useShift()

const expenses = ref([])
const isLoading = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const showModal = ref(false)

// Role checks
// isOwner is already reactive from useAuth
const isCashier = computed(() => !isOwner.value)

// Categories
const allCategories = ['Operasional', 'Gaji Karyawan', 'Sewa', 'Listrik & Air', 'Maintenance', 'Pemasaran', 'Bahan Baku', 'Lainnya']
const cashierCategories = ['Operasional', 'Bahan Baku', 'Lainnya'] // Restricted list for cashiers
const categories = computed(() => isOwner.value ? allCategories : cashierCategories)

const filters = ref({
    start_date: new Date().toISOString().slice(0, 10).slice(0, 8) + '01',
    end_date: new Date().toISOString().slice(0, 10),
    branch_id: null
})

const form = ref({
    name: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    category: 'Operasional',
    branch_id: null,
    description: ''
})

const totalExpenses = computed(() => {
    return expenses.value.reduce((sum, item) => sum + Number(item.amount), 0)
})

const fetchExpenses = async () => {
    isLoading.value = true
    try {
        // Enforce restrictions for non-owners/cashiers
        const params = { ...filters.value }
        
        if (isCashier.value) {
            const today = new Date().toISOString().slice(0, 10)
            params.start_date = today
            params.end_date = today
            // If user has a branch_id assigned, force it. 
            // Assuming user object has branch_id. If not, we might need to rely on backend or context.
            if (user.value?.branch_id) {
                params.branch_id = user.value.branch_id
            }
        }

        const response = await axios.get(`${API_URL}/expenses`, { params })
        expenses.value = response.data
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

const submitExpense = async () => {
    try {
        // Enforce branch for cashier
        if (isCashier.value && user.value?.branch_id) {
            form.value.branch_id = user.value.branch_id
        }

        if (isEditing.value) {
            await axios.put(`${API_URL}/expenses/${editingId.value}`, form.value)
        } else {
            await axios.post(`${API_URL}/expenses`, form.value)
        }
        showModal.value = false
        resetForm()
        fetchExpenses()
    } catch (e) {
        alert('Gagal menyimpan pengeluaran')
        console.error(e)
    }
}

const editExpense = (expense) => {
    form.value = {
        name: expense.name,
        amount: expense.amount,
        date: expense.date,
        category: expense.category,
        branch_id: expense.branch_id || null,
        description: expense.description || ''
    }
    editingId.value = expense.id
    isEditing.value = true
    showModal.value = true
}

const deleteExpense = async (id) => {
    if (!confirm('Hapus pengeluaran ini?')) return
    try {
        await axios.delete(`${API_URL}/expenses/${id}`)
        fetchExpenses()
    } catch (e) {
        console.error(e)
    }
}

const openAddModal = () => {
    resetForm()
    // For cashier, lock date to today
    if (isCashier.value) {
        form.value.date = new Date().toISOString().slice(0, 10)
        // Auto select branch
         if (user.value?.branch_id) {
            form.value.branch_id = user.value.branch_id
        }
    }
    showModal.value = true
}

const resetForm = () => {
    form.value = {
        name: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        category: categories.value[0],
        branch_id: null,
        description: ''
    }
    isEditing.value = false
    editingId.value = null
}

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(async () => {
    await fetchBranches()
    await fetchCurrentShift() 
    // Initialize filters for cashier
    if (isCashier.value) {
        const today = new Date().toISOString().slice(0, 10)
        filters.value.start_date = today
        filters.value.end_date = today
        if (user.value?.branch_id) {
            filters.value.branch_id = user.value.branch_id
        }
    }
    fetchExpenses()
})

watch(filters, () => {
    fetchExpenses()
}, { deep: true })
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
      <div class="flex justify-between items-center mb-4 md:mb-6">
          <h3 class="font-bold text-base md:text-lg text-slate-800">Daftar Pengeluaran</h3>
          <button @click="openAddModal" class="bg-slate-900 text-white px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold shadow-lg hover:bg-slate-800 transition whitespace-nowrap">
              + Catat
          </button>
      </div>

      <!-- Summary -->
      <div class="mb-4 md:mb-6 p-4 bg-red-50 rounded-xl border border-red-100 flex justify-between items-center">
          <div>
              <p class="text-xs font-bold text-red-600 uppercase mb-1">
                  {{ isCashier ? 'Total Pengeluaran Hari Ini' : 'Total Pengeluaran' }}
              </p>
              <h2 class="text-xl md:text-2xl font-bold text-slate-800">{{ formatCurrency(totalExpenses) }}</h2>
          </div>
          <div class="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
              <i class="ri-wallet-3-line text-xl"></i>
          </div>
      </div>

      <!-- Filters (Hidden for Cashier) -->
       <div v-if="isOwner" class="flex flex-col gap-3 mb-4 md:mb-6 bg-slate-50 p-3 md:p-4 rounded-xl">
          <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Cabang</label>
              <select v-model="filters.branch_id" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
                  <option :value="null">Semua Cabang</option>
                  <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
              </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
              <div>
                   <label class="block text-xs font-bold text-slate-500 mb-1">Dari</label>
                   <input v-model="filters.start_date" type="date" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
              </div>
              <div>
                   <label class="block text-xs font-bold text-slate-500 mb-1">Sampai</label>
                   <input v-model="filters.end_date" type="date" class="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm">
              </div>
          </div>
      </div>

      <!-- List -->
      <div v-if="isLoading" class="text-center py-10 text-slate-400">Loading...</div>
      <div v-else-if="expenses.length === 0" class="text-center py-10 text-slate-400 border border-dashed rounded-xl">
          Belum ada data pengeluaran
      </div>
      <div v-else class="space-y-3">
          <div v-for="expense in expenses" :key="expense.id" class="p-3 md:p-4 border border-slate-100 rounded-xl hover:border-slate-300 transition group">
              <!-- Top: badges -->
              <div class="flex flex-wrap items-center gap-1.5 mb-2">
                  <span class="text-[10px] md:text-xs font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wide">{{ expense.category }}</span>
                  <span v-if="expense.branch" class="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md uppercase tracking-wide">{{ expense.branch.name }}</span>
                  <span class="text-[10px] md:text-xs text-slate-400">• {{ formatDate(expense.date) }}</span>
              </div>
              <!-- Middle: name + description -->
              <div class="flex justify-between items-start gap-2">
                  <div class="min-w-0 flex-1">
                      <h4 class="font-bold text-slate-800 text-sm md:text-base">{{ expense.name }}</h4>
                      <p v-if="expense.description" class="text-xs md:text-sm text-slate-500 line-clamp-1">{{ expense.description }}</p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                      <div class="font-bold text-red-600 text-sm md:text-base whitespace-nowrap">- {{ formatCurrency(expense.amount) }}</div>
                      <!-- Actions: Only visible to Owner -->
                      <button v-if="isOwner" @click="editExpense(expense)" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 opacity-0 group-hover:opacity-100 md:opacity-0 transition flex-shrink-0">
                          <i class="ri-pencil-line text-sm"></i>
                      </button>
                  </div>
              </div>
          </div>
      </div>

      <!-- Modal -->
      <Teleport to="body">
          <div v-if="showModal" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
               <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="showModal = false"></div>
               <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-scale-up">
                   <div class="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                       <h3 class="font-bold text-slate-800">{{ isEditing ? 'Edit Pengeluaran' : 'Catat Pengeluaran Baru' }}</h3>
                       <button @click="showModal = false" class="text-slate-400 hover:text-slate-600"><i class="ri-close-line text-xl"></i></button>
                   </div>
                   <div class="p-6 space-y-4">
                       <div>
                           <label class="block text-sm font-bold text-slate-700 mb-1">Nama Pengeluaran</label>
                           <input v-model="form.name" type="text" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-slate-500 outline-none" placeholder="Contoh: Token Listrik">
                       </div>
                       
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div :class="{ 'md:col-span-2': isCashier }">
                                <label class="block text-sm font-bold text-slate-700 mb-1">Jumlah (Rp)</label>
                                <input v-model="form.amount" type="number" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-slate-500 outline-none" placeholder="0">
                           </div>
                           <div v-if="!isCashier">
                                <label class="block text-sm font-bold text-slate-700 mb-1">Tanggal</label>
                                <input v-model="form.date" type="date" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-slate-500 outline-none">
                           </div>
                       </div>

                       <div class="grid grid-cols-1 gap-4">
                           <div>
                                <label class="block text-sm font-bold text-slate-700 mb-1">Kategori</label>
                                <select v-model="form.category" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-slate-500 outline-none bg-white">
                                    <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                                </select>
                           </div>
                           <div v-if="isOwner">
                                <label class="block text-sm font-bold text-slate-700 mb-1">Cabang</label>
                                <select v-model="form.branch_id" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-slate-500 outline-none bg-white">
                                    <option :value="null">Global (Semua Cabang)</option>
                                    <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                                </select>
                           </div>
                       </div>

                       <div>
                           <label class="block text-sm font-bold text-slate-700 mb-1">Keterangan (Opsional)</label>
                           <textarea v-model="form.description" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-slate-500 outline-none h-20 resize-none"></textarea>
                       </div>

                       <button @click="submitExpense" class="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition mt-2">
                           {{ isEditing ? 'Simpan Perubahan' : 'Simpan Pengeluaran' }}
                       </button>
                   </div>
               </div>
          </div>
      </Teleport>

      <!-- Shift Block Overlay for Cashier -->
      <div v-if="isCashier && !isShiftLoading && !currentShift" class="fixed inset-0 z-[60] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
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

<style scoped>
.animate-scale-up {
  animation: scale-up 0.2s ease-out forwards;
}

@keyframes scale-up {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
