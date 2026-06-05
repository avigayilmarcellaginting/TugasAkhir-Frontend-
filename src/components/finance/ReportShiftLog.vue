<script setup>
import { ref, onMounted, watch } from 'vue'
import axios from 'axios'
import { useBranch } from '../../composables/useBranch'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const { branches, fetchBranches } = useBranch()

const shifts = ref([])
const isLoading = ref(false)
const filters = ref({
    start_date: new Date().toISOString().slice(0, 10).slice(0, 8) + '01',
    end_date: new Date().toISOString().slice(0, 10),
    branch_id: null
})

const fetchShifts = async () => {
    isLoading.value = true
    try {
        const response = await axios.get(`${API_URL}/reports/shifts`, { params: filters.value })
        shifts.value = response.data
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
    fetchShifts()
})

watch(filters, () => {
    fetchShifts()
}, { deep: true })
</script>

<template>
  <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h3 class="font-bold text-lg text-slate-800">Laporan Shift & Kasir</h3>
          
          <!-- Filters -->
          <div class="flex flex-col md:flex-row gap-3 w-full md:w-auto">
               <select v-model="filters.branch_id" class="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-500">
                  <option :value="null">Semua Cabang</option>
                  <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
              </select>
              <div class="flex items-center gap-2">
                  <input v-model="filters.start_date" type="date" class="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-500">
                  <span class="text-slate-400">-</span>
                  <input v-model="filters.end_date" type="date" class="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-slate-500">
              </div>
          </div>
      </div>

      <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
              <thead>
                  <tr class="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <th class="p-3">Staff / Kasir</th>
                      <th class="p-3">Cabang</th>
                      <th class="p-3">Waktu</th>
                      <th class="p-3 text-right">Jual (Kotor)</th>
                      <th class="p-3 text-right">Diskon</th>
                      <th class="p-3 text-right">Jual (Bersih)</th>
                      <th class="p-3 text-right">Tunai Masuk</th>
                      <th class="p-3 text-right">Selisih Kas</th>
                  </tr>
              </thead>
              <tbody class="text-sm text-slate-700">
                  <tr v-if="shifts.length === 0">
                      <td colspan="8" class="p-8 text-center text-slate-400">Belum ada data shift yang selesai.</td>
                  </tr>
                  <tr v-for="shift in shifts" :key="shift.id" class="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td class="p-3 font-semibold">{{ shift.staff_name }}</td>
                      <td class="p-3">{{ shift.branch_name }}</td>
                      <td class="p-3 text-slate-500 text-xs">
                          <div>{{ shift.start_time.split(' ')[0] }} {{ shift.start_time.split(' ')[1] }} {{ shift.start_time.split(' ')[2] }}</div>
                          <div class="text-[10px]">{{ shift.start_time.split(' ')[3] }} - {{ shift.end_time.split(' ')[3] }}</div>
                      </td>
                      <td class="p-3 text-right font-medium">{{ formatCurrency(shift.gross_sales) }}</td>
                      <td class="p-3 text-right text-red-500">{{ shift.total_discount > 0 ? '-' : '' }}{{ formatCurrency(shift.total_discount) }}</td>
                      <td class="p-3 text-right font-bold text-slate-900">{{ formatCurrency(shift.net_sales) }}</td>
                      <td class="p-3 text-right font-medium text-green-600">+ {{ formatCurrency(shift.cash_sales) }}</td>
                      <td class="p-3 text-right font-bold" :class="shift.variance < 0 ? 'text-red-500' : (shift.variance > 0 ? 'text-green-500' : 'text-slate-400')">
                          {{ shift.variance > 0 ? '+' : '' }}{{ formatCurrency(shift.variance) }}
                      </td>
                  </tr>
              </tbody>
          </table>
      </div>
  </div>
</template>
