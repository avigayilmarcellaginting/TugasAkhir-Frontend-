<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuth } from '../../composables/useAuth'
import { useToast } from '../../composables/useToast'

const { user, isInitialized } = useAuth()
const { showToast } = useToast()

const router = useRouter()
const isLogin = ref(true)
const isLoading = ref(false)
const currentRegStep = ref(1)

// Form Data for Registration
const registerForm = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
  business_name: '',
  business_email: '',
  business_phone: '',
  business_address: '',
  plan: 'FREE'
})

// Form Data for Login
const loginForm = reactive({
  email: '',
  password: ''
})

const nextStep = () => {
    // Basic validation for step 1
    if (currentRegStep.value === 1) {
        if (!registerForm.business_name || !registerForm.business_email) {
            showToast('Nama dan Email Usaha wajib diisi.', 'error')
            return
        }
    }
    currentRegStep.value++
}

const prevStep = () => {
    currentRegStep.value--
}

const handleLogin = async () => {
  isLoading.value = true
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/login`, loginForm)
    user.value = response.data.user
    isInitialized.value = true
    router.push('/')
  } catch (error) {
    showToast(error.response?.data?.error || 'Login gagal. Periksa email dan password Anda.', 'error')
  } finally {
    isLoading.value = false
  }
}

const handleRegister = async () => {
  isLoading.value = true
  try {
    const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/register`, registerForm)
    user.value = response.data.user
    isInitialized.value = true
    router.push('/')
  } catch (error) {
    const data = error.response?.data
    let msg = 'Registrasi gagal. Silakan coba lagi.'
    if (typeof data === 'object') {
       msg = Object.values(data).flat().join(', ')
    }
    showToast(msg, 'error')
  } finally {
    isLoading.value = false
  }
}

const toggleAuth = () => {
    isLogin.value = !isLogin.value
    currentRegStep.value = 1
}
</script>

<template>
  <div id="view-auth" class="view-section absolute inset-0 z-50 bg-white">
    <div class="min-h-screen flex flex-col justify-center px-6 pt-12 lg:px-8 overflow-y-auto no-scrollbar" style="padding-bottom: calc(3rem + env(safe-area-inset-bottom, 0px));">
      <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div class="w-16 h-16 rounded-2xl bg-brand-500 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-brand-500/30 mx-auto mb-4">
          K
        </div>
        <h2 class="text-3xl font-bold tracking-tight text-slate-900">KasirPro UMKM</h2>
        <p class="mt-2 text-sm text-slate-500">Kelola usaha Anda dengan mudah dan profesional</p>
      </div>


      <div v-if="isLogin" id="auth-login" class="mt-10 sm:mx-auto sm:w-full sm:max-w-md transition-opacity duration-300">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium leading-6 text-slate-900">Email Address</label>
            <div class="mt-2">
              <input v-model="loginForm.email" id="email" name="email" type="email" autocomplete="email" required class="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6">
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <label for="password" class="block text-sm font-medium leading-6 text-slate-900">Password</label>
              <div class="text-sm">
                <a href="#" class="font-semibold text-brand-600 hover:text-brand-500">Lupa password?</a>
              </div>
            </div>
            <div class="mt-2">
              <input v-model="loginForm.password" id="password" name="password" type="password" autocomplete="current-password" required class="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm sm:leading-6">
            </div>
          </div>

          <div>
            <button type="submit" :disabled="isLoading" class="flex w-full justify-center rounded-xl bg-brand-600 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-brand-500 active:scale-[0.98] transition mb-3 disabled:opacity-70 disabled:cursor-not-allowed">
                {{ isLoading ? 'Memuat...' : 'Masuk Ke Dashboard' }}
            </button>
          </div>
        </form>

        <p class="mt-10 text-center text-sm text-slate-500">
          Belum punya akun?
          <button @click="toggleAuth" class="font-semibold leading-6 text-brand-600 hover:text-brand-500">Daftar Gratis Sekarang</button>
        </p>
      </div>

      <div v-else id="auth-register" class="mt-10 sm:mx-auto sm:w-full sm:max-w-md transition-opacity duration-300 no-scrollbar">
        
        <!-- Step Indicator -->
        <div class="flex items-center justify-center mb-8 gap-4">
            <div class="flex items-center gap-2">
                <div :class="currentRegStep >= 1 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors">1</div>
                <span :class="currentRegStep >= 1 ? 'text-brand-600 font-semibold' : 'text-slate-400'" class="text-xs transition-colors">Usaha</span>
            </div>
            <div class="h-px w-8 bg-slate-200"></div>
            <div class="flex items-center gap-2">
                <div :class="currentRegStep >= 2 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-400'" class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors">2</div>
                <span :class="currentRegStep >= 2 ? 'text-brand-600 font-semibold' : 'text-slate-400'" class="text-xs transition-colors">Owner</span>
            </div>
        </div>

        <form @submit.prevent="handleRegister" class="space-y-4">
          
          <!-- Step 1: Informasi Usaha -->
          <div v-if="currentRegStep === 1" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div class="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
                <p class="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-4">Langkah 1: Profil Usaha</p>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium leading-6 text-slate-900">Nama Usaha</label>
                        <input v-model="registerForm.business_name" type="text" required class="mt-1 block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm" placeholder="Contoh: Kopi Kenangan">
                    </div>
                    <div>
                        <label class="block text-sm font-medium leading-6 text-slate-900">Email Bisnis</label>
                        <input v-model="registerForm.business_email" type="email" required class="mt-1 block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm" placeholder="bisnis@email.com">
                    </div>
                    <div>
                        <label class="block text-sm font-medium leading-6 text-slate-900">Telepon</label>
                        <input v-model="registerForm.business_phone" type="text" class="mt-1 block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm" placeholder="0812...">
                    </div>
                    <div>
                        <label class="block text-sm font-medium leading-6 text-slate-900">Alamat</label>
                        <textarea v-model="registerForm.business_address" rows="2" class="mt-1 block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm"></textarea>
                    </div>
                </div>
            </div>
            <button type="button" @click="nextStep" class="flex w-full justify-center rounded-xl bg-brand-600 px-3 py-4 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-brand-500 active:scale-[0.98] transition">
                Lanjut ke Data Owner <i class="ri-arrow-right-line ml-2"></i>
            </button>
          </div>

          <!-- Step 2: Informasi Pemilik -->
          <div v-if="currentRegStep === 2" class="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div class="bg-brand-50/50 p-5 rounded-2xl border border-brand-100">
                <p class="text-xs font-bold text-brand-600 uppercase tracking-widest mb-4">Langkah 2: Profil Pemilik</p>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium leading-6 text-slate-900">Nama Lengkap</label>
                        <input v-model="registerForm.name" type="text" required class="mt-1 block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm">
                    </div>
                    <div>
                        <label class="block text-sm font-medium leading-6 text-slate-900">Email Login</label>
                        <input v-model="registerForm.email" type="email" required class="mt-1 block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium leading-6 text-slate-900">Password</label>
                            <input v-model="registerForm.password" type="password" required class="mt-1 block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium leading-6 text-slate-900">Konfirmasi</label>
                            <input v-model="registerForm.password_confirmation" type="password" required class="mt-1 block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-brand-600 sm:text-sm">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex gap-3">
                <button type="button" @click="prevStep" class="flex w-24 justify-center rounded-xl bg-white border border-slate-200 px-3 py-4 text-sm font-semibold leading-6 text-slate-600 shadow-sm hover:bg-slate-50 transition">
                    Kembali
                </button>
                <button type="submit" :disabled="isLoading" class="flex-1 flex justify-center rounded-xl bg-brand-600 px-3 py-4 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-brand-500 active:scale-[0.98] transition disabled:opacity-70 disabled:cursor-not-allowed">
                    {{ isLoading ? 'Memuat...' : 'Daftar & Masuk' }}
                </button>
            </div>
          </div>
        </form>

        <p class="mt-10 text-center text-sm text-slate-500">
          Sudah punya akun?
          <button @click="toggleAuth" class="font-semibold leading-6 text-brand-600 hover:text-brand-500">Masuk disini</button>
        </p>
      </div>
    </div>
  </div>
</template>

