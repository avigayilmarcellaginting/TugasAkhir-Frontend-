<script setup>
import { RouterView, useRoute } from 'vue-router'
import BottomNav from './components/BottomNav.vue'
import Toast from './components/Toast.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import { computed, onMounted } from 'vue'
import { useAuth } from './composables/useAuth'

const route = useRoute()
const { isAuthenticated, checkAuth } = useAuth()

onMounted(() => {
  checkAuth()
})

const showBottomNav = computed(() => {
  return route.path !== '/auth' && isAuthenticated.value
})
</script>

<template>
  <div id="app-container" class="pb-20">
    <RouterView />
    <BottomNav v-if="showBottomNav" />
    <Toast />
    <ConfirmModal />
  </div>
</template>

<style scoped></style>
