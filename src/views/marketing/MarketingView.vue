<script setup>
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { usePromotions } from '../../composables/usePromotions'

const { promotions, fetchPromotions, createPromotion, updatePromotion, isLoading } = usePromotions()
const showAddPromo = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const branches = ref([])
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const form = ref({
    name: '',
    type: 'percentage',
    value: '',
    start_date: '',
    end_date: '',
    min_purchase: 0,
    is_active: true,
    branch_id: null
})

const fetchBranches = async () => {
    try {
        const response = await axios.get(`${API_URL}/branches`)
        branches.value = response.data
    } catch (error) {
        console.error('Error fetching branches:', error)
    }
}

onMounted(() => {
    fetchPromotions()
    fetchBranches()
})

const toggleAddPromo = () => {
    showAddPromo.value = !showAddPromo.value
    if (!showAddPromo.value) resetForm()
    else {
        isEditing.value = false
        editingId.value = null
    }
}

const editPromotion = (promo) => {
    form.value = {
        name: promo.name,
        type: promo.type,
        value: promo.value,
        start_date: promo.start_date.split('T')[0],
        end_date: promo.end_date.split('T')[0],
        min_purchase: promo.min_purchase,
        is_active: Boolean(promo.is_active),
        branch_id: promo.branch_id || null
    }
    editingId.value = promo.id
    isEditing.value = true
    showAddPromo.value = true
}

const resetForm = () => {
     form.value = {
        name: '',
        type: 'percentage',
        value: '',
        start_date: '',
        end_date: '',
        min_purchase: 0,
        is_active: true,
        branch_id: null
    }
    isEditing.value = false
    editingId.value = null
}

const submitPromo = async () => {
    try {
        if (isEditing.value) {
            await updatePromotion(editingId.value, form.value)
        } else {
            await createPromotion(form.value)
        }
        showAddPromo.value = false
        resetForm()
    } catch (e) {
        // Error handled in composable
    }
}

const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(date)
}

const formatValue = (type, value) => {
    if (type === 'percentage') return `${Number(value)}%`
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

const getStatus = (promo) => {
    if (!promo.is_active) return { label: 'Non-Aktif', class: 'bg-slate-100 text-slate-500' }
    const now = new Date()
    const start = new Date(promo.start_date)
    const end = new Date(promo.end_date)
    
    if (now < start) return { label: 'Pending', class: 'bg-yellow-100 text-yellow-700' }
    if (now > end) return { label: 'Berakhir', class: 'bg-red-100 text-red-700' }
    return { label: 'Aktif', class: 'bg-green-100 text-green-700' }
}
</script>

<template>
  <div id="view-marketing" class="view-section pt-6 px-4 pb-24 slide-up">
       <header class="mb-6">
           <h2 class="text-2xl font-bold text-slate-900">Marketing</h2>
           <p class="text-sm text-slate-500">Buat promo menarik untuk pelanggan</p>
      </header>

      <!-- Create Promo CTA -->
      <div class="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-5 text-white shadow-lg shadow-brand-500/20 mb-6 relative overflow-hidden">
          <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div class="relative z-10">
              <h3 class="font-bold text-lg mb-1">Buat Promo Baru</h3>
              <p class="text-brand-50 text-sm mb-4">Tingkatkan penjualan dengan diskon menarik.</p>
              <button @click="toggleAddPromo" class="bg-white text-brand-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition">
                  + Tambah Promo
              </button>
          </div>
      </div>

      <!-- Active Campaigns -->
      <h3 class="font-bold text-slate-800 mb-3">Daftar Promo</h3>
      
      <div v-if="isLoading && promotions.length === 0" class="text-center py-10 text-slate-500">
          Loading...
      </div>

      <div v-else-if="promotions.length === 0" class="text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
          <p>Belum ada promo dibuat</p>
      </div>

      <div v-else class="space-y-3 pb-24">
          <div v-for="promo in promotions" :key="promo.id" @click="editPromotion(promo)" class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden cursor-pointer hover:border-brand-500 transition-colors">
              <div class="flex justify-between items-start mb-2">
                  <div>
                      <div class="flex gap-2 mb-1">
                          <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', getStatus(promo).class]">
                              {{ getStatus(promo).label }}
                          </span>
                          <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full uppercase', promo.branch ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700']">
                              {{ promo.branch ? promo.branch.name : 'Global' }}
                          </span>
                      </div>
                      <h4 class="font-bold text-slate-900 mt-1">{{ promo.name }}</h4>
                  </div>
                  <div class="bg-slate-100 p-2 rounded-lg">
                      <i class="ri-percent-line text-slate-500"></i>
                  </div>
              </div>
              <div class="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <div class="flex items-center gap-1">
                       <i class="ri-calendar-line"></i>
                       <span>{{ formatDate(promo.start_date) }} - {{ formatDate(promo.end_date) }}</span>
                  </div>
                   <div class="flex items-center gap-1">
                       <i class="ri-coupon-3-line"></i>
                       <span>{{ formatValue(promo.type, promo.value) }}</span>
                  </div>
              </div>
          </div>
      </div>

      <!-- Add Promo Sheet -->
      <Teleport to="body">
          <div v-if="showAddPromo" class="fixed inset-0 z-[60]">
               <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="toggleAddPromo"></div>
                <div class="absolute bottom-0 left-0 right-0 bg-white shadow-2xl transform transition-transform duration-300 ease-out h-[90vh] flex flex-col animate-slide-up rounded-t-3xl">
                    <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10 rounded-t-3xl" style="padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);">
                        <h2 class="font-bold text-lg text-slate-900">{{ isEditing ? 'Edit Promo' : 'Buat Promo Baru' }}</h2>
                        <button @click="toggleAddPromo" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition">
                            <i class="ri-close-line text-xl"></i>
                        </button>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-6 space-y-5">
                         <!-- Preview -->
                         <div class="bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl p-6 text-white text-center mb-4 shadow-lg shadow-brand-500/20">
                            <p class="text-sm opacity-90 mb-1">Preview Diskon</p>
                            <h3 class="text-3xl font-bold">{{ form.value ? formatValue(form.type, form.value) : '0%' }}</h3>
                            <p class="text-sm font-medium mt-2 bg-white/20 inline-block px-3 py-1 rounded-lg">{{ form.name || 'Nama Promo' }}</p>
                         </div>
                         
                         <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">Nama Promo</label>
                            <input v-model="form.name" type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition font-medium text-slate-800" placeholder="Contoh: Flash Sale Lebaran">
                         </div>

                         <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">Cabang (Opsional)</label>
                            <select v-model="form.branch_id" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition bg-white font-medium text-slate-800">
                                <option :value="null">Semua Cabang (Global)</option>
                                <option v-for="branch in branches" :key="branch.id" :value="branch.id">
                                    {{ branch.name }}
                                </option>
                            </select>
                            <p class="text-xs text-slate-400 mt-1">Pilih cabang spesifik atau biarkan kosong untuk semua cabang.</p>
                         </div>

                         <div class="grid grid-cols-2 gap-4">
                             <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">Tipe Diskon</label>
                                <select v-model="form.type" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition bg-white font-medium text-slate-800">
                                    <option value="percentage">Persentase (%)</option>
                                    <option value="fixed">Nominal (Rp)</option>
                                </select>
                             </div>
                             <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">Nilai Diskon</label>
                                <input v-model="form.value" type="number" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition font-medium text-slate-800" placeholder="0">
                             </div>
                         </div>

                         <div class="grid grid-cols-2 gap-4">
                             <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">Mulai</label>
                                <input v-model="form.start_date" type="date" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition font-medium text-slate-800">
                             </div>
                             <div>
                                <label class="block text-sm font-bold text-slate-700 mb-2">Selesai</label>
                                <input v-model="form.end_date" type="date" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition font-medium text-slate-800">
                             </div>
                         </div>

                         <div>
                            <label class="block text-sm font-bold text-slate-700 mb-2">Minimal Pembelian (Opsional)</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                                <input v-model="form.min_purchase" type="number" class="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition font-medium text-slate-800" placeholder="0">
                            </div>
                         </div>

                         <div v-if="isEditing" class="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                             <div>
                                 <h4 class="font-bold text-slate-800 text-sm">Status Promo</h4>
                                 <p class="text-xs text-slate-500">{{ form.is_active ? 'Promo aktif dan bisa digunakan' : 'Promo dinonaktifkan sementara' }}</p>
                             </div>
                             <button @click="form.is_active = !form.is_active" :class="['w-12 h-7 rounded-full transition-colors relative', form.is_active ? 'bg-green-500' : 'bg-slate-300']">
                                 <div :class="['absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-sm transition-transform', form.is_active ? 'translate-x-5' : 'translate-x-0']"></div>
                             </button>
                         </div>
                    </div>

                     <div class="p-4 border-t border-slate-100 bg-white" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);">
                        <button @click="submitPromo" :disabled="isLoading" class="w-full bg-slate-900 text-white rounded-xl py-3 font-bold shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition hover:bg-slate-800 disabled:opacity-50">
                            <span v-if="isLoading">Menyimpan...</span>
                            <span v-else>{{ isEditing ? 'Simpan Perubahan' : 'Terbitkan Promo' }}</span>
                        </button>
                    </div>
                </div>
          </div>
      </Teleport>
  </div>
</template>

<style scoped>
.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>

