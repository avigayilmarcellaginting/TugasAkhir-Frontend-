<script setup>
import { ref } from 'vue'

const props = defineProps({
    isOpen: Boolean,
    isLoading: Boolean
})

const emit = defineEmits(['close', 'start'])
const startingCash = ref(0)

const submit = () => {
    emit('start', startingCash.value)
    startingCash.value = 0
}
</script>

<template>
    <Teleport to="body">
        <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="emit('close')"></div>
            <div class="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-zoom-in">
                <div class="p-8 text-center">
                    <div class="w-16 h-16 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <i class="ri-wallet-3-line"></i>
                    </div>
                    <h3 class="text-xl font-bold text-slate-900 mb-2">Mulai Shift Baru</h3>
                    <p class="text-sm text-slate-500 mb-8">Masukkan jumlah modal awal yang ada di laci kasir saat ini.</p>
                    
                    <div class="space-y-4">
                        <div class="text-left">
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Modal Awal (Cash)</label>
                            <div class="relative text-2xl font-bold">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">Rp</span>
                                <input 
                                    v-model="startingCash" 
                                    type="number" 
                                    class="w-full pl-14 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition text-slate-900"
                                    placeholder="0"
                                    autofocus
                                >
                            </div>
                        </div>

                        <button 
                            @click="submit" 
                            :disabled="isLoading"
                            class="w-full bg-brand-600 text-white rounded-2xl py-4 font-bold shadow-lg shadow-brand-500/20 active:scale-[0.98] transition disabled:opacity-50"
                        >
                            <span v-if="!isLoading">Buka Kasir Sekarang</span>
                            <i v-else class="ri-loader-4-line animate-spin"></i>
                        </button>
                        
                        <button @click="emit('close')" class="w-full py-2 text-sm font-bold text-slate-400 hover:text-slate-600 transition">
                            Batal
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.animate-zoom-in {
    animation: zoom-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes zoom-in {
    from { opacity: 0; transform: scale(0.9); }
    to { opacity: 1; transform: scale(1); }
}
</style>
