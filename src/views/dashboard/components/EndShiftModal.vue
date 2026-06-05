<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
    isOpen: Boolean,
    isLoading: Boolean,
    shift: Object,
    formatCurrency: Function
})

const emit = defineEmits(['close', 'end'])
const actualCash = ref(0)
const notes = ref('')

const variance = computed(() => {
    return actualCash.value - (props.shift?.expected_ending_cash || 0)
})

const submit = () => {
    emit('end', actualCash.value, notes.value)
}
</script>

<template>
    <Teleport to="body">
        <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="emit('close')"></div>
            <div class="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-zoom-in">
                <div class="p-8">
                    <div class="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                        <i class="ri-hand-coin-line"></i>
                    </div>
                    <div class="text-center mb-8">
                        <h3 class="text-xl font-bold text-slate-900 mb-1">Akhiri Shift</h3>
                        <p class="text-sm text-slate-500">Hitung uang fisik di laci Anda.</p>
                    </div>
                    
                    <div class="space-y-6">
                        <!-- Summary Info -->
                        <div class="bg-slate-50 p-4 rounded-2xl space-y-3">
                            <div class="space-y-1 pb-3 border-b border-slate-200">
                                <div class="flex justify-between text-xs">
                                    <span class="text-slate-500">Total Penjualan (Kotor)</span>
                                    <span class="font-bold text-slate-900">{{ formatCurrency(shift?.gross_sales || 0) }}</span>
                                </div>
                                <div class="flex justify-between text-xs text-red-500">
                                    <span>Total Diskon</span>
                                    <span>-{{ formatCurrency(shift?.total_discount || 0) }}</span>
                                </div>
                                <div class="flex justify-between text-xs font-bold pt-1">
                                    <span class="text-slate-700">Penjualan Bersih</span>
                                    <span class="text-slate-900">{{ formatCurrency(shift?.net_sales || 0) }}</span>
                                </div>
                            </div>
                            
                            <div class="space-y-1">
                                <div class="flex justify-between text-xs">
                                    <span class="text-slate-500">Modal Awal</span>
                                    <span class="font-bold text-slate-900">{{ formatCurrency(shift?.starting_cash || 0) }}</span>
                                </div>
                                <div class="flex justify-between text-xs">
                                    <span class="text-slate-500">Penerimaan Tunai</span>
                                    <span class="font-bold text-slate-900">{{ formatCurrency(shift?.cash_sales || 0) }}</span>
                                </div>
                            </div>

                            <div class="flex justify-between text-sm border-t border-slate-200 pt-3">
                                <span class="font-bold text-slate-700">Estimasi Kas di Laci</span>
                                <span class="font-extrabold text-brand-600 text-base">{{ formatCurrency(shift?.expected_ending_cash) }}</span>
                            </div>
                            
                            <!-- Variance Live Calculation -->
                            <div v-if="actualCash > 0" class="flex justify-between text-xs pt-1">
                                <span class="text-slate-500">Selisih</span>
                                <span :class="variance >= 0 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'">
                                    {{ variance >= 0 ? '+' : '' }}{{ formatCurrency(variance) }}
                                </span>
                            </div>
                        </div>

                        <div class="text-left">
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Total Uang Fisik</label>
                            <div class="relative text-2xl font-bold">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">Rp</span>
                                <input 
                                    v-model="actualCash" 
                                    type="number" 
                                    class="w-full pl-14 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition text-slate-900"
                                    placeholder="0"
                                    autofocus
                                >
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 px-1">Catatan (Pilihan)</label>
                            <textarea 
                                v-model="notes" 
                                rows="2"
                                class="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-500 transition text-sm text-slate-900"
                                placeholder="Misal: ada selisih uang 2rb karena..."
                            ></textarea>
                        </div>

                        <button 
                            @click="submit" 
                            :disabled="isLoading"
                            class="w-full bg-slate-900 text-white rounded-2xl py-4 font-bold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition disabled:opacity-50"
                        >
                            <span v-if="!isLoading">Tutup Shift & Cetak Laporan</span>
                            <i v-else class="ri-loader-4-line animate-spin"></i>
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
