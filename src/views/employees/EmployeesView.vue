<script setup>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useEmployee } from '../../composables/useEmployee'
import { useBranch } from '../../composables/useBranch'
import { useAuth } from '../../composables/useAuth'
import { usePermission } from '../../composables/usePermission'
import { useToast } from '../../composables/useToast'

const router = useRouter()
const { employees, fetchEmployees, createEmployee, updateEmployee } = useEmployee()
const { branches, fetchBranches } = useBranch()
const { allPermissions, fetchAllPermissions } = usePermission()
const { logout, user } = useAuth()
const { showToast } = useToast()

const showAddEmployee = ref(false)
const isLoading = ref(false)
const isEditing = ref(false)
const editingId = ref(null)

const newEmployee = ref({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    branch_id: '',
    work_start_at: '08:00',
    work_end_at: '17:00',
    permissions: []
})

onMounted(async () => {
    await Promise.all([
        fetchEmployees(),
        fetchBranches(),
        fetchAllPermissions()
    ])
    // Default branch to first one if available
    if (branches.value.length > 0) {
        newEmployee.value.branch_id = branches.value[0].id
    }
})

const toggleAddEmployee = () => {
    showAddEmployee.value = !showAddEmployee.value
    if (!showAddEmployee.value) {
        isEditing.value = false
        editingId.value = null
        newEmployee.value = {
            name: '',
            email: '',
            password: '',
            role: 'cashier',
            branch_id: branches.value[0]?.id || '',
            permissions: []
        }
    }
}

const handleAddEmployee = async () => {
    isLoading.value = true
    try {
        if (isEditing.value) {
            await updateEmployee(editingId.value, newEmployee.value)
            showToast('Karyawan berhasil diperbarui.', 'success')
        } else {
            await createEmployee(newEmployee.value)
            showToast('Karyawan berhasil ditambahkan.', 'success')
        }
        showAddEmployee.value = false
        // Reset form
        newEmployee.value = {
            name: '',
            email: '',
            password: '',
            role: 'cashier',
            branch_id: branches.value[0]?.id || '',
            permissions: []
        }
        isEditing.value = false
        editingId.value = null
    } catch (error) {
        showToast(error.response?.data?.message || 'Gagal menyimpan data.', 'error')
    } finally {
        isLoading.value = false
    }
}

const openEditModal = (employee) => {
    isEditing.value = true
    editingId.value = employee.id
    newEmployee.value = {
        name: employee.name,
        email: employee.email,
        password: '', // Keep empty unless changing
        role: employee.roles?.[0]?.slug || 'cashier',
        branch_id: employee.branch_id,
        work_start_at: employee.work_start_at?.substring(0, 5) || '08:00',
        work_end_at: employee.work_end_at?.substring(0, 5) || '17:00',
        permissions: employee.direct_permissions?.map(p => p.slug) || []
    }
    showAddEmployee.value = true
}


const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}
</script>

<template>
  <div id="view-employees" class="view-section pt-6 px-4 pb-24 slide-up">
       <header class="flex justify-between items-center mb-6">
           <div>
               <h2 class="text-2xl font-bold text-slate-900">Karyawan</h2>
               <p class="text-sm text-slate-500">Manajemen staff dan jadwal</p>
          </div>
           <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <i class="ri-settings-4-line"></i>
          </div>
      </header>

      <!-- Employee List -->
      <div class="grid grid-cols-1 gap-3 pb-24">
          <div v-for="emp in employees" :key="emp.id" 
              @click="emp.id !== user.id ? openEditModal(emp) : null"
              class="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 transition group"
              :class="emp.id !== user.id ? 'cursor-pointer hover:border-brand-500' : 'opacity-80'">
              <div class="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-lg">
                  {{ getInitials(emp.name) }}
              </div>
              <div class="flex-1">
                  <h4 class="font-bold text-slate-900 group-hover:text-brand-600 transition">{{ emp.name }} {{ emp.id === user.id ? '(Anda)' : '' }}</h4>
                  <p class="text-xs text-slate-500">{{ emp.roles?.[0]?.name || 'Staff' }} • {{ emp.branch?.name || 'Semua Cabang' }}</p>
              </div>
               <div v-if="emp.id !== user.id" class="text-slate-300 group-hover:text-brand-500 transition">
                  <i class="ri-edit-line text-lg"></i>
               </div>
          </div>
          
          <button @click="toggleAddEmployee" class="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 text-slate-400 font-medium hover:border-brand-500 hover:text-brand-500 transition mt-2">
              + Tambah Karyawan Baru
          </button>
 
      </div>

       <!-- Add Employee Sheet (Placeholder) -->
      <Teleport to="body">
          <div v-if="showAddEmployee" class="fixed inset-0 z-[60]">
               <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="toggleAddEmployee"></div>
                <div class="absolute bottom-0 left-0 right-0 bg-white shadow-2xl transform transition-transform duration-300 ease-out h-[100dvh] flex flex-col animate-slide-up">
                     <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white" style="padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);">
                        <h2 class="font-bold text-lg text-slate-900">{{ isEditing ? 'Edit Akun Karyawan' : 'Tambah Anggota Tim' }}</h2>
                        <button @click="toggleAddEmployee" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition">
                            <i class="ri-close-line text-xl"></i>
                        </button>
                    </div>
                    <div class="flex-1 overflow-y-auto p-6 space-y-5">
                         <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                            <input v-model="newEmployee.name" type="text" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition" placeholder="Nama Karyawan">
                         </div>
                         
                         <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Email Login</label>
                            <input v-model="newEmployee.email" type="email" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition" placeholder="email@karyawan.com">
                         </div>

                         <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">
                               Password {{ isEditing ? '(Kosongkan jika tidak diubah)' : '' }}
                            </label>
                            <input v-model="newEmployee.password" type="password" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition" placeholder="Min 6 karakter">
                         </div>

                          <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Assign ke Cabang</label>
                            <select v-model="newEmployee.branch_id" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition bg-white">
                                <option v-for="branch in branches" :key="branch.id" :value="branch.id">{{ branch.name }}</option>
                            </select>
                         </div>

                          <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Posisi / Role</label>
                            <select v-model="newEmployee.role" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition bg-white">
                                <option value="cashier">Kasir (Cashier)</option>
                                <option value="admin">Admin</option>
                            </select>
                         </div>

                         <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Mulai Kerja</label>
                                <input v-model="newEmployee.work_start_at" type="time" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition bg-white">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-slate-700 mb-1">Selesai Kerja</label>
                                <input v-model="newEmployee.work_end_at" type="time" class="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 outline-none transition bg-white">
                            </div>
                         </div>

                         <div v-if="allPermissions.length > 0">
                            <label class="block text-sm font-medium text-slate-700 mb-2 mt-2">Daftar Modul (Hak Akses)</label>
                            <div class="grid grid-cols-1 gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <label v-for="permission in allPermissions.filter(p => !['dashboard-staff', 'action-delete-transaction'].includes(p.slug))" :key="permission.id" class="flex items-center gap-3 cursor-pointer group">
                                    <div class="relative flex items-center">
                                        <input type="checkbox" :value="permission.slug" v-model="newEmployee.permissions" class="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer transition">
                                    </div>
                                    <div class="flex flex-col">
                                        <span class="text-xs font-bold text-slate-800 group-hover:text-brand-600 transition">{{ permission.name }}</span>
                                        <span class="text-[10px] text-slate-500 leading-tight">{{ permission.description }}</span>
                                    </div>
                                </label>
                            </div>
                         </div>
                    </div>
                    <div class="p-4 border-t border-slate-100 bg-white pb-12">
                        <button @click="handleAddEmployee" :disabled="isLoading" class="w-full bg-brand-600 text-white rounded-xl py-3 font-bold shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-70">
                            {{ isLoading ? 'Menyimpan...' : 'Simpan Data' }}
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
