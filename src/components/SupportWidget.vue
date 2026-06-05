<script setup>
import { computed } from 'vue'
import { useAuth } from '../composables/useAuth'

const { user, can } = useAuth()

// Check if user has WhatsApp support feature
// Since we don't have a direct "feature flag" list in user object yet, 
// we will infer it from the plan or permissions. 
// PRO/BUSINESS plans have 'support_whatsapp'.
// We can use a permission check if we added one, or check if they have 'view-profit-loss' which is PRO+? 
// Or better, just check if they are NOT free? 
// Actually, SubscriptionService says PRO/BUSINESS have 'support_whatsapp'.
// Use 'view-profit-loss' as a proxy for PRO+ for now, or just show it for everyone but with a lock if Free?
// User asked: "WhatsApp Support munculkan button saja widget bantuan sesuai dengan paket"
// So if package allows -> show button. If not -> hidden? Or show but locked?
// "munculkan button saja widget bantuan sesuai dengan paket" -> "Show the help widget button according to the package"
// likely means: Show it if they have the package.

const showWidget = computed(() => {
    // Show only for PRO/BUSINESS
    // We can check if they have a permission that is exclusive to PRO/BUSINESS
    return can('view-profit-loss') // This is unique to PRO+
})

const openWhatsApp = () => {
    const phoneNumber = '6281234567890' // Replace with actual support number
    const message = encodeURIComponent(`Halo Support Team, saya ${user.value?.name} dari ${user.value?.tenant?.name || 'bisnis saya'} butuh bantuan.`)
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank')
}
</script>

<template>
  <div v-if="showWidget" class="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-50">
      <button 
        @click="openWhatsApp"
        class="flex items-center gap-2 bg-[#25D366] text-white p-3 md:px-4 md:py-3 rounded-full shadow-lg hover:shadow-xl hover:bg-[#20bd5a] transition transform hover:-translate-y-1 active:scale-95"
      >
          <i class="ri-whatsapp-line text-2xl"></i>
          <span class="font-bold pr-1 hidden md:block">Bantuan</span>
      </button>
  </div>
</template>
