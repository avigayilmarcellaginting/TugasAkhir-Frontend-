<script setup>
import { useToast } from '../composables/useToast'

const { isVisible, message, type, hideToast } = useToast()

const getIcon = () => {
    switch (type.value) {
        case 'success': return 'ri-checkbox-circle-fill'
        case 'error': return 'ri-error-warning-fill'
        default: return 'ri-information-fill'
    }
}

const getBgColor = () => {
    switch (type.value) {
        case 'success': return 'bg-green-600'
        case 'error': return 'bg-red-600'
        default: return 'bg-slate-800'
    }
}
</script>

<template>
    <Transition name="toast">
        <div v-if="isVisible" 
            class="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl text-white pointer-events-auto cursor-pointer border border-white/10 backdrop-blur-md"
            :class="getBgColor()"
            @click="hideToast">
            <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <i :class="getIcon()" class="text-xl"></i>
            </div>
            <p class="text-sm font-bold flex-1">{{ message }}</p>
            <i class="ri-close-line text-lg opacity-50"></i>
        </div>
    </Transition>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.toast-enter-from {
  opacity: 0;
  transform: translate(-50%, -40px) scale(0.9);
}

.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, -40px) scale(0.9);
}
</style>
