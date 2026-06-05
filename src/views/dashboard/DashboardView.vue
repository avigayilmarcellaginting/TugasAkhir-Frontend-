<script setup>
import { useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useBranch } from '../../composables/useBranch'
import { useToast } from '../../composables/useToast'
import { onMounted } from 'vue'

// Components
import AdminDashboard from './components/AdminDashboard.vue'
import CashierDashboard from './components/CashierDashboard.vue'


const router = useRouter()
const { user, can, isOwner } = useAuth()
const { branches, fetchBranches, createBranch, selectedBranchId, selectedBranch, setSelectedBranch } = useBranch()
const { showToast } = useToast()
const showBranchSwitcher = ref(false)
const showAddBranch = ref(false)

const userName = computed(() => user.value?.name || 'User')
const tenantName = computed(() => user.value?.tenant?.name || 'Bisnis Saya')
const currentBranchName = computed(() => {
    if (selectedBranch.value) return selectedBranch.value.name
    return user.value?.branch?.name || 'Pusat'
})

onMounted(() => {
    fetchBranches()
})

const navigateTo = (path) => {
    router.push(path)
}

const toggleBranchSwitcher = () => {
    showBranchSwitcher.value = !showBranchSwitcher.value
}

const toggleAddBranch = () => {
    showAddBranch.value = !showAddBranch.value
    // Close branch switcher if opening add branch
    if (showAddBranch.value) {
        showBranchSwitcher.value = false
    }
}


const newBranch = ref({
    name: '',
    address: ''
})

const handleAddBranch = async () => {
    try {
        await createBranch(newBranch.value)
        showAddBranch.value = false
        newBranch.value = { name: '', address: '' }
    } catch (error) {
        showToast(error.response?.data?.message || 'Gagal membuat cabang.', 'error')
    }
}

const switchBranch = (id) => {
    setSelectedBranch(id)
    showBranchSwitcher.value = false
    // Ideally reload data for current view if needed, but reactivity should handle it via store/composables
    // If on POS view, it might need to refetch products. Product fetch is in useInventory which we will update next.
}
</script>

<template>
  <div id="view-dashboard" class="view-section pt-6 px-4 pb-24 slide-up">
    <header class="flex justify-between items-center mb-6">
          <div>
              <h1 class="text-2xl font-bold text-slate-900">Halo, {{ userName }} 👋</h1>
              <div v-if="isOwner" @click="toggleBranchSwitcher" class="flex items-center gap-1 text-sm text-slate-500 cursor-pointer hover:text-brand-600 transition">
                <p>{{ currentBranchName }} - {{ tenantName }}</p>
                <i class="ri-arrow-down-s-line"></i>
              </div>
              <div v-else class="flex items-center gap-1 text-sm text-slate-500">
                <p>{{ currentBranchName }} - {{ tenantName }}</p>
              </div>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
                <img :src="`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=0ea5e9&color=fff`" alt="Profile">
            </div>
          </div>
    </header>

    <!-- Dynamic Dashboards based on Role/Permission -->
    <AdminDashboard 
        v-if="can('dashboard-admin')" 
        :userName="userName" 
        :tenantName="tenantName" 
        :currentBranchName="currentBranchName"
        @navigate="navigateTo"
    />

    <CashierDashboard 
        v-else-if="can('dashboard-cashier')" 
        :user="user" 
        @navigate="navigateTo"
    />



    <div v-else class="text-center py-20 opacity-50">
        <i class="ri-lock-2-line text-4xl mb-4"></i>
        <p>Anda tidak memiliki akses ke dashboard.</p>
    </div>


    <!-- Branch Switcher Sheet -->
    <Teleport to="body">
        <div v-if="showBranchSwitcher" class="fixed inset-0 z-[60]">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="toggleBranchSwitcher"></div>
            <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out h-[60vh] flex flex-col animate-slide-up">
                <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-3xl relative z-10">
                    <h2 class="font-bold text-lg text-slate-900">Pilih Cabang / Outlet</h2>
                    <button @click="toggleBranchSwitcher" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition">
                        <i class="ri-close-line text-xl"></i>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-2">
                    <div v-for="branch in branches" :key="branch.id" 
                         @click="switchBranch(branch.id)"
                         :class="selectedBranchId === branch.id ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-100 bg-white hover:bg-slate-50'"
                         class="p-3 rounded-xl border flex items-center justify-between cursor-pointer transition">
                        <div>
                            <h4 class="font-bold text-sm">{{ branch.name }}</h4>
                            <p class="text-xs" :class="selectedBranchId === branch.id ? 'text-brand-600' : 'text-slate-500'">{{ branch.address || 'Tanpa Alamat' }}</p>
                        </div>
                        <i v-if="selectedBranchId === branch.id" class="ri-check-line text-brand-600 text-xl"></i>
                    </div>
                </div>
                <div class="p-4 border-t border-slate-100 bg-white pb-8">
                    <button v-if="isOwner" @click="toggleAddBranch" class="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-medium hover:border-brand-500 hover:text-brand-500 transition">
                        + Tambah Cabang Baru
                    </button>
                </div>
            </div>
        </div>
    </Teleport>

    <!-- Add Branch Sheet -->
    <Teleport to="body">
        <div v-if="showAddBranch" class="fixed inset-0 z-[65]">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="toggleAddBranch"></div>
            <div class="absolute bottom-0 left-0 right-0 bg-white shadow-2xl transform transition-transform duration-300 ease-out h-[100dvh] flex flex-col animate-slide-up">
                <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
                    <h2 class="font-bold text-lg text-slate-900">Tambah Cabang Baru</h2>
                    <button @click="toggleAddBranch" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition">
                        <i class="ri-close-line text-xl"></i>
                    </button>
                </div>
                <div class="p-6 space-y-4 pb-12">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Nama Cabang / Outlet</label>
                        <input v-model="newBranch.name" type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition" placeholder="Contoh: Cabang Bekasi">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                        <textarea v-model="newBranch.address" rows="3" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition" placeholder="Contoh: Ruko Grand Galaxy City..."></textarea>
                    </div>
                    <button @click="handleAddBranch" class="w-full bg-brand-600 text-white rounded-xl py-3 font-bold shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition">
                        Simpan Cabang
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
  </div>
</template>
