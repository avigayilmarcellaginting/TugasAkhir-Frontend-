<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const dates = ref({
    start_date: new Date().toISOString().slice(0, 10).slice(0, 8) + '01', // First day of current month
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
        const response = await axios.get(`${API_URL}/reports/profit-loss`, { params })
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

import { useAuth } from '../../composables/useAuth'
const { can } = useAuth()

const exportExcel = () => {
    alert('Fitur Export Excel akan segera hadir!')
}

const showUpgradeModal = () => {
    alert('Fitur Export Excel hanya tersedia untuk paket PRO dan BUSINESS. Silakan upgrade paket Anda.')
}
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
          <div class="flex gap-2">
               <!-- Export Button -->
               <button class="flex-1 py-2.5 rounded-xl font-bold transition border flex items-center justify-center gap-2 text-sm"
                    :class="[
                        can('export-excel') 
                            ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' 
                            : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'
                    ]"
                    @click="can('export-excel') ? exportExcel() : showUpgradeModal()"
               >
                   <i class="ri-file-excel-line text-lg" :class="{ 'text-green-600': can('export-excel') }"></i>
                   Export
                   <i v-if="!can('export-excel')" class="ri-lock-fill text-xs"></i>
               </button>

               <button @click="fetchReport" class="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition">
                   <i class="ri-refresh-line"></i>
               </button>
          </div>
      </div>

      <div v-if="isLoading" class="text-center py-12 text-slate-400 animate-pulse">
          Memuat laporan...
      </div>

      <div v-else-if="report" class="space-y-6">
          <!-- Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p class="text-xs font-bold text-green-600 uppercase mb-1">Pendapatan Bersih (Revenue)</p>
                  <h3 class="text-xl font-bold text-slate-900">{{ formatCurrency(report.revenue) }}</h3>
              </div>
              <div class="p-4 bg-red-50 rounded-xl border border-red-100">
                   <p class="text-xs font-bold text-red-600 uppercase mb-1">HPP (COGS)</p>
                   <h3 class="text-xl font-bold text-slate-900">{{ formatCurrency(report.cogs) }}</h3>
              </div>
              <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
                   <p class="text-xs font-bold text-blue-600 uppercase mb-1">Laba Kotor (Gross Profit)</p>
                   <h3 class="text-xl font-bold text-slate-900">{{ formatCurrency(report.gross_profit) }}</h3>
              </div>
          </div>

          <!-- P&L Table -->
          <div class="border rounded-xl overflow-hidden overflow-x-auto">
              <table class="w-full text-sm text-left min-w-[600px]">
                  <thead class="bg-slate-50 text-slate-500 font-bold border-b">
                      <tr>
                          <th class="px-6 py-3">Keterangan</th>
                          <th class="px-6 py-3 text-right">Nilai</th>
                      </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                      <tr>
                          <td class="px-6 py-3 font-medium">Total Penjualan</td>
                          <td class="px-6 py-3 text-right text-slate-900">{{ formatCurrency(report.revenue) }}</td>
                      </tr>
                      <tr>
                          <td class="px-6 py-3 font-medium text-red-600">Harga Pokok Penjualan (HPP)</td>
                          <td class="px-6 py-3 text-right text-red-600">- {{ formatCurrency(report.cogs) }}</td>
                      </tr>
                      <tr class="bg-slate-50/50">
                          <td class="px-6 py-3 font-bold">Laba Kotor</td>
                          <td class="px-6 py-3 text-right font-bold text-slate-900">{{ formatCurrency(report.gross_profit) }}</td>
                      </tr>
                      
                      <!-- Expenses -->
                      <tr>
                          <td colspan="2" class="px-6 py-4 font-bold text-slate-400 uppercase text-xs tracking-wider">Pengeluaran Operasional</td>
                      </tr>
                      <tr v-if="report.expense_breakdown.length === 0">
                          <td colspan="2" class="px-6 py-3 text-center text-slate-400 italic">Tidak ada pengeluaran dicatat</td>
                      </tr>
                      <tr v-for="exp in report.expense_breakdown" :key="exp.category">
                          <td class="px-6 py-2 pl-10">{{ exp.category }}</td>
                          <td class="px-6 py-2 text-right text-red-600">- {{ formatCurrency(exp.total) }}</td>
                      </tr>
                      <tr class="bg-slate-50/50 border-t-2 border-slate-100">
                          <td class="px-6 py-4 font-bold text-lg">Laba Bersih</td>
                          <td :class="['px-6 py-4 text-right font-bold text-lg', report.net_profit >= 0 ? 'text-green-600' : 'text-red-600']">
                              {{ formatCurrency(report.net_profit) }}
                          </td>
                      </tr>
                  </tbody>
              </table>
          </div>
      </div>
  </div>
</template>
