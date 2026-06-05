<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'

const route = useRoute()
const router = useRouter()
const { can, isOwner } = useAuth()
    
const isActive = (path) => route.path === path
const navigateTo = (path) => {
    router.push(path)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 pt-3 pb-1 flex items-start z-40 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.03)] overflow-x-auto no-scrollbar gap-2 px-4" style="padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0px));" id="main-nav">
      <button v-if="can('dashboard-admin') || can('dashboard-cashier') || can('dashboard-staff')" @click="navigateTo('/')" :class="['nav-item flex-shrink-0 flex flex-col items-center gap-1 w-16 transition duration-300', isActive('/') ? 'active text-brand-500' : 'text-slate-400']">
          <i class="ri-home-4-line text-2xl mb-[-2px]"></i>
          <span class="text-[10px] font-medium">Beranda</span>
      </button>
      <button v-if="can('module-pos')" @click="navigateTo('/pos')" :class="['nav-item flex-shrink-0 flex flex-col items-center gap-1 w-16 transition duration-300', isActive('/pos') ? 'active text-brand-500' : 'text-slate-400']">
          <i class="ri-store-2-line text-2xl mb-[-2px]"></i>
          <span class="text-[10px] font-medium">Kasir</span>
      </button>
      <button v-if="can('module-inventory')" @click="navigateTo('/inventory')" :class="['nav-item flex-shrink-0 flex flex-col items-center gap-1 w-16 transition duration-300', isActive('/inventory') ? 'active text-brand-500' : 'text-slate-400']">
          <i class="ri-box-3-line text-2xl mb-[-2px]"></i>
          <span class="text-[10px] font-medium">Stok</span>
      </button>
      <button v-if="can('module-marketing')" @click="navigateTo('/marketing')" :class="['nav-item flex-shrink-0 flex flex-col items-center gap-1 w-16 transition duration-300', isActive('/marketing') ? 'active text-brand-500' : 'text-slate-400']">
          <i class="ri-megaphone-line text-2xl mb-[-2px]"></i>
          <span class="text-[10px] font-medium">Promo</span>
      </button>
      <button v-if="can('module-pos') && !isOwner" @click="navigateTo('/transactions')" :class="['nav-item flex-shrink-0 flex flex-col items-center gap-1 w-16 transition duration-300', isActive('/transactions') ? 'active text-brand-500' : 'text-slate-400']">
          <i class="ri-file-list-3-line text-2xl mb-[-2px]"></i>
          <span class="text-[10px] font-medium">Transaksi</span>
      </button>
      <button v-if="can('module-reports')" @click="navigateTo('/finance')" :class="['nav-item flex-shrink-0 flex flex-col items-center gap-1 w-16 transition duration-300', isActive('/finance') ? 'active text-brand-500' : 'text-slate-400']">
          <i class="ri-pie-chart-2-line text-2xl mb-[-2px]"></i>
          <span class="text-[10px] font-medium">Laporan</span>
      </button>
      <button v-if="can('module-expenses') && !isOwner" @click="navigateTo('/expenses')" :class="['nav-item flex-shrink-0 flex flex-col items-center gap-1 w-16 transition duration-300', isActive('/expenses') ? 'active text-brand-500' : 'text-slate-400']">
          <i class="ri-wallet-line text-2xl mb-[-2px]"></i>
          <span class="text-[10px] font-medium">Pengeluaran</span>
      </button>
      <button v-if="can('module-employees')" @click="navigateTo('/employees')" :class="['nav-item flex-shrink-0 flex flex-col items-center gap-1 w-16 transition duration-300', isActive('/employees') ? 'active text-brand-500' : 'text-slate-400']">
          <i class="ri-settings-4-line text-2xl mb-[-2px]"></i>
          <span class="text-[10px] font-medium">Admin</span>
      </button>
      <button @click="navigateTo('/settings')" :class="['nav-item flex-shrink-0 flex flex-col items-center gap-1 w-16 transition duration-300', isActive('/settings') ? 'active text-brand-500' : 'text-slate-400']">
          <i class="ri-user-line text-2xl mb-[-2px]"></i>
          <span class="text-[10px] font-medium">Akun</span>
      </button>
  </nav>
</template>
