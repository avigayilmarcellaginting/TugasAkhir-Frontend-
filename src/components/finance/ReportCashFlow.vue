<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const dates = ref({
    start_date: new Date().toISOString().slice(0, 10).slice(0, 8) + '01',
    end_date: new Date().toISOString().slice(0, 10)
})

const branches = ref([])
const selectedBranch = ref(null)
const report = ref(null)
const isLoading = ref(false)

const fetchBranches = async () => {
    try {
        const response = await axios.get(`${API_URL}/branches`)
        branches.value = response.data
    } catch (e) {
        console.error(e)
    }
}

const fetchReport = async () => {
    isLoading.value = true
    try {
        const params = {
            start_date: dates.value.start_date,
            end_date: dates.value.end_date,
            branch_id: selectedBranch.value
        }
        const response = await axios.get(`${API_URL}/reports/cash-flow`, { params })
        report.value = response.data
    } catch (e) {
        console.error(e)
    } finally {
        isLoading.value = false
    }
}

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)
}

onMounted(() => {
    fetchBranches()
    fetchReport()
})

watch([dates.value, selectedBranch], () => {
    fetchReport()
}, { deep: true })
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6">
      
      <!-- Filters -->
      <div class="flex flex-col gap-3 mb-6">
          <div>
              <label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Cabang</label>
              <select v-model="selectedBranch" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 font-medium text-slate-700 text-sm">
                  <option :value="null">Semua Cabang (Konsolidasi)</option>
                  <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
              </select>
          </div>
          <div class="grid grid-cols-2 gap-2">
              <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Dari</label>
                  <input v-model="dates.start_date" type="date" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 font-medium text-slate-700 text-sm">
              </div>
              <div>
                  <label class="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Sampai</label>
                  <input v-model="dates.end_date" type="date" class="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 font-medium text-slate-700 text-sm">
              </div>
          </div>
          <div class="flex items-end">
               <button @click="fetchReport" class="w-full py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition text-sm">
                   <i class="ri-refresh-line mr-1"></i> Muat Ulang
               </button>
          </div>
      </div>

      <div v-if="isLoading" class="text-center py-12 text-slate-400 animate-pulse">
          Memuat laporan...
      </div>

      <div v-else-if="report" class="space-y-6">
          
          <!-- Operating Activities -->
          <div class="border rounded-xl overflow-x-auto">
              <div class="bg-slate-50 px-4 md:px-6 py-3 border-b border-slate-100">
                  <h3 class="font-bold text-slate-800 text-sm md:text-base">Aktivitas Operasional</h3>
              </div>
              <table class="w-full text-sm text-left min-w-[400px]">
                  <tbody class="divide-y divide-slate-100">
                      <tr>
                          <td class="px-4 md:px-6 py-3 font-medium">Kas Masuk dari Penjualan</td>
                          <td class="px-4 md:px-6 py-3 text-right text-green-600">+ {{ formatCurrency(report.operating_activities.cash_in_sales) }}</td>
                      </tr>
                      <tr>
                          <td class="px-4 md:px-6 py-3 font-medium">Kas Keluar untuk Beban</td>
                          <td class="px-4 md:px-6 py-3 text-right text-red-600">- {{ formatCurrency(report.operating_activities.cash_out_expenses) }}</td>
                      </tr>
                      <tr class="bg-slate-50/50">
                          <td class="px-4 md:px-6 py-4 font-bold">Arus Kas Bersih Operasional</td>
                          <td :class="['px-4 md:px-6 py-4 text-right font-bold', report.operating_activities.net_cash_flow >= 0 ? 'text-green-600' : 'text-red-600']">
                              {{ formatCurrency(report.operating_activities.net_cash_flow) }}
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>

          <!-- Summary -->
          <div class="bg-slate-900 text-white rounded-xl p-6 text-center">
              <p class="text-slate-400 text-sm mb-1 uppercase tracking-widest font-bold">Kenaikan/Penurunan Kas Bersih</p>
              <h2 class="text-3xl font-bold">{{ formatCurrency(report.net_increase_cash) }}</h2>
          </div>

      </div>
  </div>
</template>
