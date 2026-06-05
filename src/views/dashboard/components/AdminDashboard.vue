<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import axios from 'axios'
import { useAuth } from '../../../composables/useAuth'
import { useBranch } from '../../../composables/useBranch'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const props = defineProps({
    userName: String,
    currentBranchName: String,
    tenantName: String
})

const emit = defineEmits(['navigate'])
const { can } = useAuth()
const { selectedBranchId } = useBranch()

const isLoading = ref(true)
const data = ref(null)

const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value || 0)
}

const fetchDashboard = async () => {
    isLoading.value = true
    try {
        const params = {}
        if (selectedBranchId.value) params.branch_id = selectedBranchId.value
        const response = await axios.get(`${API_URL}/dashboard/admin`, { params })
        data.value = response.data
    } catch (e) {
        console.error('Failed to fetch dashboard:', e)
    } finally {
        isLoading.value = false
    }
}

// Quick action items, filtered by permission
const quickActions = computed(() => {
    const all = [
        { label: 'Kasir', icon: 'ri-store-2-line', path: '/pos', permission: 'module-pos', bg: 'bg-brand-100', text: 'text-brand-600' },
        { label: 'Stok', icon: 'ri-box-3-line', path: '/inventory', permission: 'module-inventory', bg: 'bg-orange-100', text: 'text-orange-600' },
        { label: 'Laporan', icon: 'ri-bar-chart-line', path: '/finance', permission: 'module-reports', bg: 'bg-blue-100', text: 'text-blue-600' },
        { label: 'Karyawan', icon: 'ri-team-line', path: '/employees', permission: 'module-employees', bg: 'bg-violet-100', text: 'text-violet-600' },
        { label: 'Promo', icon: 'ri-megaphone-line', path: '/marketing', permission: 'module-marketing', bg: 'bg-pink-100', text: 'text-pink-600' },
        { label: 'Riwayat', icon: 'ri-history-line', path: '/transactions', permission: 'module-pos', bg: 'bg-teal-100', text: 'text-teal-600' },
    ]
    return all.filter(a => can(a.permission))
})

onMounted(fetchDashboard)

watch(selectedBranchId, () => {
    fetchDashboard()
})
</script>

<template>
    <div class="space-y-5">

        <!-- Loading Skeleton -->
        <div v-if="isLoading" class="space-y-4 animate-pulse">
            <div class="h-28 bg-slate-200 rounded-2xl"></div>
            <div class="grid grid-cols-2 gap-3">
                <div class="h-20 bg-slate-200 rounded-2xl"></div>
                <div class="h-20 bg-slate-200 rounded-2xl"></div>
            </div>
        </div>

        <template v-else-if="data">
            <!-- Revenue Card -->
            <div class="bg-gradient-to-br from-brand-500 to-brand-600 p-5 rounded-2xl shadow-lg shadow-brand-500/20 text-white">
                <div class="flex items-center gap-2 mb-1.5 opacity-90">
                    <i class="ri-wallet-3-line"></i>
                    <span class="text-xs font-bold uppercase tracking-wider">Omset Hari Ini</span>
                </div>
                <p class="text-3xl font-bold mb-2">{{ formatCurrency(data.today_revenue) }}</p>
                <div class="flex items-center gap-1.5 text-xs">
                    <span :class="[
                        'flex items-center gap-0.5 px-2 py-0.5 rounded-lg font-bold',
                        data.revenue_change >= 0 ? 'bg-white/20' : 'bg-red-400/30'
                    ]">
                        <i :class="data.revenue_change >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'"></i>
                        {{ Math.abs(data.revenue_change) }}%
                    </span>
                    <span class="opacity-70">dari kemarin</span>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-3 gap-2.5">
                <!-- Net Profit -->
                <div class="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div class="flex items-center gap-1 text-green-500 mb-1.5">
                        <i class="ri-hand-coin-line text-sm"></i>
                        <span class="text-[10px] font-bold uppercase tracking-wider">Laba</span>
                    </div>
                    <p class="text-sm md:text-lg font-bold text-slate-900">{{ formatCurrency(data.today_net_profit) }}</p>
                </div>

                <!-- Transactions -->
                <div class="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div class="flex items-center gap-1 text-purple-500 mb-1.5">
                        <i class="ri-file-list-3-line text-sm"></i>
                        <span class="text-[10px] font-bold uppercase tracking-wider">Transaksi</span>
                    </div>
                    <p class="text-sm md:text-lg font-bold text-slate-900">{{ data.today_transactions }} <span class="text-xs text-slate-400 font-normal">Nota</span></p>
                </div>

                <!-- Expenses -->
                <div class="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div class="flex items-center gap-1 text-red-500 mb-1.5">
                        <i class="ri-money-dollar-circle-line text-sm"></i>
                        <span class="text-[10px] font-bold uppercase tracking-wider">Pengeluaran</span>
                    </div>
                    <p class="text-sm md:text-lg font-bold text-slate-900">{{ formatCurrency(data.today_expenses) }}</p>
                </div>
            </div>

            <!-- Quick Actions -->
            <div>
                <h3 class="font-bold text-slate-800 mb-3 text-sm">Aksi Cepat</h3>
                <div class="grid grid-cols-4 md:grid-cols-6 gap-2 text-center">
                    <button
                        v-for="action in quickActions"
                        :key="action.path"
                        @click="emit('navigate', action.path)"
                        class="flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 transition active:scale-95"
                    >
                        <div :class="[action.bg, action.text, 'w-10 h-10 rounded-full flex items-center justify-center text-xl']">
                            <i :class="action.icon"></i>
                        </div>
                        <span class="text-[10px] font-medium text-slate-600">{{ action.label }}</span>
                    </button>
                </div>
            </div>

            <!-- Recent Transactions -->
            <div v-if="data.recent_transactions?.length">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-slate-800 text-sm">Transaksi Terbaru</h3>
                    <button @click="emit('navigate', '/transactions')" class="text-xs font-semibold text-brand-600">Lihat Semua</button>
                </div>
                <div class="space-y-2">
                    <div v-for="tx in data.recent_transactions" :key="tx.id"
                         class="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2 mb-0.5">
                                <span class="text-xs font-bold text-slate-800">{{ tx.code }}</span>
                                <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium uppercase">{{ tx.payment_method }}</span>
                            </div>
                            <p class="text-[11px] text-slate-400">{{ tx.cashier }} • {{ tx.time }}</p>
                        </div>
                        <div class="font-bold text-sm text-green-600 whitespace-nowrap ml-3">+ {{ formatCurrency(tx.total) }}</div>
                    </div>
                </div>
            </div>

            <!-- Low Stock Warning -->
            <div v-if="data.low_stock_products?.length">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="font-bold text-slate-800 text-sm">⚠️ Stok Menipis</h3>
                    <button @click="emit('navigate', '/inventory')" class="text-xs font-semibold text-brand-600">Lihat Semua</button>
                </div>
                <div class="space-y-2">
                    <div v-for="product in data.low_stock_products" :key="product.id"
                         :class="[product.stock === 0 ? 'bg-red-100 border-red-200' : 'bg-amber-50 border-amber-100']"
                         class="border rounded-xl p-3 flex items-center gap-3">
                        <div :class="[product.stock === 0 ? 'text-red-500' : 'text-amber-500']"
                             class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg shadow-sm flex-shrink-0">
                            <i :class="product.stock === 0 ? 'ri-close-circle-line' : 'ri-alert-line'"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-bold text-slate-900 text-sm truncate">{{ product.name }}</h4>
                            <p :class="[product.stock === 0 ? 'text-red-600' : 'text-amber-600']" class="text-xs font-medium">
                                {{ product.stock === 0 ? 'Stok Habis!' : `Sisa ${product.stock} unit` }}
                            </p>
                        </div>
                        <button @click="emit('navigate', '/inventory')" 
                                :class="[product.stock === 0 ? 'text-red-500 border-red-200' : 'text-amber-600 border-amber-200']"
                                class="px-3 py-1.5 bg-white text-xs font-bold rounded-lg shadow-sm border flex-shrink-0">
                            Restock
                        </button>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>
