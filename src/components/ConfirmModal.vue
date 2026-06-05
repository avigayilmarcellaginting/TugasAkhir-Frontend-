<script setup>
import { useConfirm } from '../composables/useConfirm'

const { isVisible, message, onConfirm, onCancel } = useConfirm()
</script>

<template>
    <div v-if="isVisible" class="fixed inset-0 z-[10000] flex items-center justify-center p-6">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="onCancel"></div>
        
        <!-- Modal Content -->
        <Transition name="confirm">
            <div v-if="isVisible" class="relative w-full max-w-xs bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 flex flex-col items-center">
                <div class="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
                    <i class="ri-question-line text-3xl text-amber-500"></i>
                </div>
                
                <h3 class="text-lg font-bold text-slate-900 text-center mb-2">Konfirmasi</h3>
                <p class="text-slate-500 text-sm text-center mb-8 px-2">{{ message }}</p>
                
                <div class="flex flex-col w-full gap-2">
                    <button @click="onConfirm" 
                        class="w-full bg-brand-500 text-white font-bold py-4 rounded-2xl active:scale-95 transition shadow-lg shadow-brand-500/20">
                        Ya, Lanjutkan
                    </button>
                    <button @click="onCancel" 
                        class="w-full bg-slate-50 text-slate-500 font-bold py-4 rounded-2xl active:scale-95 transition">
                        Batal
                    </button>
                </div>
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.confirm-enter-active,
.confirm-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
