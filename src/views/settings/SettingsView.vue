<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'
import axios from 'axios'

const { user, logout, checkAuth } = useAuth()
const { showToast } = useToast()
const { ask } = useConfirm()
const loading = ref(false)
const upgrading = ref(false)

const isProfileModalOpen = ref(false)
const isBillingModalOpen = ref(false)

const profile = ref({
    name: '',
    email: '',
    password: ''
})

onMounted(() => {
    if (user.value) {
        profile.value.name = user.value.name
        profile.value.email = user.value.email
    }
})

const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
}

const handleUpdate = async () => {
    loading.value = true

    try {
        const response = await axios.put(`${import.meta.env.VITE_API_URL}/auth/profile`, profile.value)
        showToast('Profil berhasil diperbarui!', 'success')
        profile.value.password = ''
        // Update user data in auth state
        await checkAuth()
    } catch (error) {
        let msg = error.response?.data?.message || 'Gagal memperbarui profil'
        if (error.response?.data?.email) msg = error.response.data.email[0]
        showToast(msg, 'error')
    } finally {
        loading.value = false
        isProfileModalOpen.value = false
    }
}

const handleLogout = async () => {
    const ok = await ask('Apakah Anda yakin ingin keluar dari aplikasi?')
    if (ok) {
        await logout()
    }
}

const handleUpgrade = async (planType) => {
    // Only allow owner to upgrade
    if (user.value?.roles?.[0]?.slug !== 'owner') {
        showToast('Hanya Owner yang dapat mengubah paket langganan.', 'error')
        return
    }

    if (user.value?.tenant?.plan === planType) {
        showToast(`Anda sudah berada di paket ${planType.toUpperCase()}`, 'info')
        return
    }

    const ok = await ask(`Lanjutkan upgrade langganan ke paket ${planType.toUpperCase()}? (Simulasi)`)
    if (!ok) return

    upgrading.value = true
    try {
        await axios.post(`${import.meta.env.VITE_API_URL}/tenant/upgrade`, { plan: planType })
        showToast(`Berhasil upgrade ke paket ${planType.toUpperCase()}!`, 'success')
        await checkAuth()
    } catch (error) {
        showToast(error.response?.data?.message || 'Gagal melakukan upgrade', 'error')
    } finally {
        upgrading.value = false
        isBillingModalOpen.value = false
    }
}

const openWhatsApp = () => {
    const phoneNumber = '6281234567890' // Ganti jika ada nomor khusus
    const message = encodeURIComponent(`Halo Support Team, saya ${user.value?.name} dari ${user.value?.tenant?.name || 'bisnis saya'} butuh bantuan terkait Stabio Kasir.`)
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
}
</script>

<template>
  <div id="view-settings" class="view-section pt-6 px-4 pb-24 slide-up">
      <header class="mb-6">
          <h2 class="text-2xl font-bold text-slate-900">Pengaturan</h2>
          <p class="text-sm text-slate-500">Kelola akun dan preferensi Anda</p>
      </header>

      <!-- Profile Card -->
      <div v-if="user" class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center mb-6">
          <div class="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-brand-500/20">
              {{ getInitials(user.name) }}
          </div>
          <h3 class="text-xl font-bold text-slate-900">{{ user.name }}</h3>
          <p class="text-brand-600 font-medium text-sm">{{ user.roles?.[0]?.name || 'Staff' }}</p>
          <div class="mt-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 uppercase tracking-widest font-bold">
              {{ user.tenant?.name }} <span class="mx-1 opacity-30">•</span> {{ user.branch?.name || (user.roles?.[0]?.slug === 'owner' ? 'Owner / Semua Cabang' : 'Pusat') }}
          </div>
      </div>

      <!-- Menu List -->
      <div class="bg-white rounded-3xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
          <!-- Account Menu -->
          <div @click="isProfileModalOpen = true" class="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer active:bg-slate-100">
              <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <i class="ri-user-settings-line text-xl"></i>
                  </div>
                  <div>
                      <h4 class="font-bold text-slate-800 text-sm">Informasi Akun</h4>
                      <p class="text-[10px] text-slate-500 font-medium mt-0.5">Ubah nama, email, dan password</p>
                  </div>
              </div>
              <i class="ri-arrow-right-s-line text-slate-400 text-xl"></i>
          </div>

          <!-- Billing Menu -->
          <div v-if="user?.roles?.[0]?.slug === 'owner'" @click="isBillingModalOpen = true" class="flex items-center justify-between p-4 border-b border-slate-50 hover:bg-slate-50 transition cursor-pointer active:bg-slate-100">
              <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                      <i class="ri-vip-crown-line text-xl"></i>
                  </div>
                  <div>
                      <h4 class="font-bold text-slate-800 text-sm">Billing & Berlangganan</h4>
                      <p class="text-[10px] text-slate-500 font-medium mt-0.5">Kelola paket langganan Anda</p>
                  </div>
              </div>
              <div class="flex items-center gap-2">
                  <span class="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded-md uppercase tracking-widest">{{ user?.tenant?.plan || 'Free' }}</span>
                  <i class="ri-arrow-right-s-line text-slate-400 text-xl"></i>
              </div>
          </div>

          <!-- WhatsApp Support Menu -->
          <div @click="openWhatsApp" class="flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer active:bg-slate-100">
              <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                      <i class="ri-whatsapp-line text-xl"></i>
                  </div>
                  <div>
                      <h4 class="font-bold text-slate-800 text-sm">Pusat Bantuan</h4>
                      <p class="text-[10px] text-slate-500 font-medium mt-0.5">Hubungi Support WhatsApp</p>
                  </div>
              </div>
              <i class="ri-external-link-line text-slate-400 text-lg"></i>
          </div>
      </div>

      <!-- Actions -->
      <button @click="handleLogout" 
          class="w-full bg-white text-red-500 border border-red-100 font-bold py-4 rounded-2xl active:scale-95 transition flex items-center justify-center gap-2">
          <i class="ri-logout-box-r-line"></i>
          Keluar dari Aplikasi
      </button>

      <div class="mt-8 text-center">
          <p class="text-[10px] text-slate-300 uppercase tracking-[0.2em] font-bold">Stabio Kasir v1.0.0</p>
      </div>

      <!-- Info Akun Modal -->
      <Teleport to="body">
          <div v-if="isProfileModalOpen" class="fixed inset-0 z-[70]">
              <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isProfileModalOpen = false"></div>
              <div class="absolute bottom-0 left-0 right-0 bg-white h-[75dvh] rounded-t-3xl shadow-2xl animate-modal-up flex flex-col overflow-hidden">
                  <div class="p-4 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20" style="padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);">
                      <h3 class="font-bold text-lg text-slate-800 ml-1">Update Informasi Akun</h3>
                      <button @click="isProfileModalOpen = false" class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"><i class="ri-close-line text-xl"></i></button>
                  </div>
                  
                  <div class="flex-1 overflow-y-auto p-6 space-y-6">
                      <div>
                          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                          <input v-model="profile.name" type="text" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 outline-none transition text-sm font-bold text-slate-800">
                      </div>
                      <div>
                          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email</label>
                          <input v-model="profile.email" type="email" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 outline-none transition text-sm font-bold text-slate-800">
                      </div>
                      <div>
                          <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Ganti Password (Opsional)</label>
                          <input v-model="profile.password" type="password" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-brand-500 outline-none transition text-sm font-bold text-slate-800 placeholder-slate-400" placeholder="Kosongkan jika tidak diganti">
                      </div>
                  </div>

                  <div class="p-6 border-t border-slate-50 bg-white sticky bottom-0 z-20" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);">
                      <button @click="handleUpdate" :disabled="loading" class="w-full bg-brand-600 text-white py-3 rounded-xl font-black text-sm shadow-xl shadow-brand-500/20 active:scale-[0.98] transition hover:bg-brand-700 disabled:opacity-50">
                          <i v-if="loading" class="ri-loader-4-line animate-spin mr-2"></i>
                          {{ loading ? 'Menyimpan...' : 'Simpan Perubahan' }}
                      </button>
                  </div>
              </div>
          </div>
      </Teleport>

      <!-- Billing Info Modal -->
      <Teleport to="body">
          <div v-if="isBillingModalOpen" class="fixed inset-0 z-[70]">
              <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isBillingModalOpen = false"></div>
              <div class="absolute bottom-0 left-0 right-0 bg-white h-[85dvh] rounded-t-3xl shadow-2xl animate-modal-up flex flex-col overflow-hidden">
                  <div class="p-4 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20" style="padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);">
                      <h3 class="font-bold text-lg text-slate-800 ml-1">Pilih Paket Langganan</h3>
                      <button @click="isBillingModalOpen = false" class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"><i class="ri-close-line text-xl"></i></button>
                  </div>
                  
                  <div class="flex-1 overflow-y-auto p-4 space-y-4" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 2rem);">
                      <p class="text-xs text-slate-500 mb-2 px-1">Tingkatkan paket untuk merekrut lebih banyak karyawan dan membuka fitur laporan lengkap.</p>
                      
                      <!-- Free Plan -->
                      <div class="relative p-5 rounded-3xl border-2 transition-all" :class="user?.tenant?.plan === 'free' ? 'border-brand-500 bg-brand-50' : 'border-slate-100 bg-white'">
                          <div v-if="user?.tenant?.plan === 'free'" class="absolute -top-3 right-4 bg-brand-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">Aktif Sekarang</div>
                          <div class="flex items-center gap-4 mb-3">
                              <div class="w-12 h-12 rounded-full flex items-center justify-center" :class="user?.tenant?.plan === 'free' ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'">
                                  <i class="ri-seedling-line text-2xl"></i>
                              </div>
                              <div>
                                  <h4 class="font-black text-lg text-slate-800">Free</h4>
                                  <p class="font-bold text-slate-500 text-sm">Rp 0 <span class="text-xs font-medium">/ bulan</span></p>
                              </div>
                          </div>
                          <ul class="text-xs text-slate-600 space-y-2 mb-4 font-medium">
                              <li class="flex items-center gap-2"><i class="ri-check-line text-green-500"></i>1 Kasir & 1 Cabang</li>
                              <li class="flex items-center gap-2"><i class="ri-check-line text-green-500"></i>Fitur Dasar POS</li>
                              <li class="flex items-center gap-2 text-slate-400"><i class="ri-close-line"></i>Laporan Keuangan Terbatas</li>
                          </ul>
                          <button v-if="user?.tenant?.plan !== 'free'" @click="handleUpgrade('free')" :disabled="upgrading" class="w-full py-2 rounded-xl text-xs font-bold font-slate-700 bg-slate-100 active:scale-95 transition">
                              Downgrade ke Free
                          </button>
                      </div>

                      <!-- Pro Plan -->
                      <div class="relative p-5 rounded-3xl border-2 transition-all" :class="user?.tenant?.plan === 'pro' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white'">
                          <div v-if="user?.tenant?.plan === 'pro'" class="absolute -top-3 right-4 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">Aktif Sekarang</div>
                          <div class="flex items-center gap-4 mb-3">
                              <div class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20" :class="user?.tenant?.plan === 'pro' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'">
                                  <i class="ri-rocket-line text-2xl"></i>
                              </div>
                              <div>
                                  <h4 class="font-black text-lg text-slate-800">Pro</h4>
                                  <p class="font-bold text-blue-600 text-sm">Rp 99.000 <span class="text-xs font-medium text-slate-500">/ bulan</span></p>
                              </div>
                          </div>
                          <ul class="text-xs text-slate-600 space-y-2 mb-4 font-medium">
                              <li class="flex items-center gap-2"><i class="ri-check-line text-green-500"></i>Hingga 5 Karyawan</li>
                              <li class="flex items-center gap-2"><i class="ri-check-line text-green-500"></i>Support Multi-Cabang</li>
                              <li class="flex items-center gap-2"><i class="ri-check-line text-green-500"></i>Laporan Keuangan Lengkap</li>
                          </ul>
                          <button v-if="user?.tenant?.plan !== 'pro'" @click="handleUpgrade('pro')" :disabled="upgrading" class="w-full py-3 rounded-xl text-sm font-bold text-white bg-blue-600 shadow-lg shadow-blue-600/20 active:scale-95 transition">
                              Upgrade ke Pro
                          </button>
                      </div>

                      <!-- Bisnis Plan -->
                      <div class="relative p-5 rounded-3xl border-2 transition-all overflow-hidden" :class="user?.tenant?.plan === 'business' ? 'border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50' : 'border-slate-100 bg-white'">
                          <div v-if="user?.tenant?.plan === 'business'" class="absolute -top-3 right-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">Aktif Sekarang</div>
                          <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-400/10 to-transparent rounded-bl-full pointer-events-none"></div>
                          
                          <div class="flex items-center gap-4 mb-3 relative z-10">
                              <div class="w-12 h-12 rounded-full flex items-center justify-center shadow-lg shadow-amber-500/20" :class="user?.tenant?.plan === 'business' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' : 'bg-amber-100 text-amber-600'">
                                  <i class="ri-vip-crown-fill text-2xl"></i>
                              </div>
                              <div>
                                  <h4 class="font-black text-lg text-slate-800">Bisnis</h4>
                                  <p class="font-bold text-amber-600 text-sm">Rp 199.000 <span class="text-xs font-medium text-slate-500">/ bulan</span></p>
                              </div>
                          </div>
                          <ul class="text-xs text-slate-600 space-y-2 mb-4 font-medium relative z-10">
                              <li class="flex items-center gap-2"><i class="ri-check-line text-green-500"></i>Jumlah Karyawan Unlimited</li>
                              <li class="flex items-center gap-2"><i class="ri-check-line text-green-500"></i>Manajemen Cabang Unlimited</li>
                              <li class="flex items-center gap-2"><i class="ri-check-line text-green-500"></i>Prioritas Support WhatsApp 24/7</li>
                          </ul>
                          <button v-if="user?.tenant?.plan !== 'business'" @click="handleUpgrade('business')" :disabled="upgrading" class="w-full py-3 rounded-xl text-sm font-black text-white bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30 active:scale-95 transition relative z-10">
                              Upgrade ke Bisnis
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </Teleport>
  </div>
</template>

<style scoped>
.slide-up {
  animation: slide-up 0.4s ease-out forwards;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
