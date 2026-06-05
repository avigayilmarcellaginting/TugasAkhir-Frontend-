<script setup>
import { ref, onMounted, computed } from 'vue'
import ExpenseList from '../../components/finance/ExpenseList.vue'
import ReportProfitLoss from '../../components/finance/ReportProfitLoss.vue'
import ReportCashFlow from '../../components/finance/ReportCashFlow.vue'
import ReportShiftLog from '../../components/finance/ReportShiftLog.vue'
import { useAuth } from '../../composables/useAuth'

const { can, user } = useAuth()
const activeTab = ref('')

// Define tabs with their specific permissions
const allTabs = [
    { id: 'summary', label: 'Ringkasan & Laba Rugi', shortLabel: 'Laba Rugi', icon: 'ri-pie-chart-2-line', permission: 'view-profit-loss', isPro: true },
    { id: 'cashflow', label: 'Arus Kas', shortLabel: 'Arus Kas', icon: 'ri-exchange-dollar-line', permission: 'module-reports' },
    { id: 'shifts', label: 'Laporan Shift', shortLabel: 'Shift', icon: 'ri-time-line', permission: 'module-reports' },
    { id: 'expenses', label: 'Pengeluaran', shortLabel: 'Pengeluaran', icon: 'ri-file-list-3-line', permission: 'module-expenses', isPro: true }
]

// Determine which tabs are locked based on permissions
const tabs = computed(() => {
    return allTabs.map(tab => ({
        ...tab,
        locked: !can(tab.permission)
    }))
})

const currentTab = computed(() => {
    return tabs.value.find(t => t.id === activeTab.value)
})

onMounted(() => {
    if (tabs.value.length > 0) {
        activeTab.value = tabs.value[0].id
    }
})
</script>

<template>
  <div class="view-section pt-6 px-4 pb-24 slide-up">
      <header class="mb-6">
          <h2 class="text-2xl font-bold text-slate-900">Laporan Keuangan</h2>
          <p class="text-sm text-slate-500">Pantau performa bisnis dan arus kas</p>
      </header>

      <!-- Tabs -->
      <div class="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar -mx-4 px-4">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
                'flex-shrink-0 flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all border relative',
                activeTab === tab.id 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
            ]"
          >
              <i :class="tab.icon"></i>
              <span class="hidden md:inline">{{ tab.label }}</span>
              <span class="md:hidden">{{ tab.shortLabel || tab.label }}</span>
              
              <!-- Lock/Upgrade Badge -->
              <span v-if="tab.locked" class="ml-0.5 text-[10px] bg-amber-100 text-amber-700 px-1 py-0.5 rounded-md border border-amber-200 uppercase tracking-wide">
                  PRO
              </span>
          </button>
      </div>

      <!-- Content -->
      <div class="space-y-6">
          <Transition name="fade" mode="out-in">
              <!-- Locked State CTA -->
              <div v-if="currentTab?.locked" key="locked" class="bg-white rounded-3xl p-8 text-center border-2 border-dashed border-slate-200">
                  <div class="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                      <i class="ri-vip-crown-2-line text-4xl"></i>
                  </div>
                  <h3 class="text-xl font-bold text-slate-900 mb-2">Fitur {{ currentTab.label }} Terkunci</h3>
                  <p class="text-slate-500 mb-8 max-w-md mx-auto">
                      Upgrade ke paket <span class="font-bold text-slate-900">PRO</span> atau <span class="font-bold text-slate-900">BUSINESS</span> untuk mengakses fitur ini dan maksimalkan pengelolaan bisnis Anda.
                  </p>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto text-left mb-8">
                      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <i class="ri-checkbox-circle-fill text-green-500 text-xl"></i>
                          <span class="text-sm font-medium text-slate-700">Laporan Laba Rugi Detail</span>
                      </div>
                      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <i class="ri-checkbox-circle-fill text-green-500 text-xl"></i>
                          <span class="text-sm font-medium text-slate-700">Manajemen Pengeluaran</span>
                      </div>
                      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <i class="ri-checkbox-circle-fill text-green-500 text-xl"></i>
                          <span class="text-sm font-medium text-slate-700">Export Laporan Excel</span>
                      </div>
                      <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                          <i class="ri-checkbox-circle-fill text-green-500 text-xl"></i>
                          <span class="text-sm font-medium text-slate-700">Multi Cabang / Outlet</span>
                      </div>
                  </div>

                  <button class="bg-brand-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition active:scale-95">
                      Lihat Pilihan Paket
                  </button>
              </div>

              <!-- Actual Content -->
              <div v-else-if="activeTab === 'summary'" key="summary">
                  <ReportProfitLoss />
              </div>
              <div v-else-if="activeTab === 'cashflow'" key="cashflow">
                  <ReportCashFlow />
              </div>
              <div v-else-if="activeTab === 'shifts'" key="shifts">
                  <ReportShiftLog />
              </div>
              <div v-else-if="activeTab === 'expenses'" key="expenses">
                  <ExpenseList />
              </div>
          </Transition>
      </div>
  </div>
</template>

<style scoped>
.slide-up {
  animation: slide-up 0.4s ease-out forwards;
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
