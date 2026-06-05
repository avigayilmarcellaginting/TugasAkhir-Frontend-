<script setup>
import { ref, onMounted } from 'vue'
import { useShift } from '../../../composables/useShift'
import StartShiftModal from './StartShiftModal.vue'
import EndShiftModal from './EndShiftModal.vue'
import { computed } from 'vue'

const props = defineProps({
    user: Object
})
const emit = defineEmits(['navigate'])

const userName = computed(() => props.user?.name || 'Kasir')
const workHours = computed(() => {
    if (props.user?.work_start_at && props.user?.work_end_at) {
        const duration = calculateDuration(props.user.work_start_at, props.user.work_end_at)
        return `${props.user.work_start_at.substring(0, 5)} - ${props.user.work_end_at.substring(0, 5)} (${duration})`
    }
    return '--:-- - --:--'
})

const calculateDuration = (startStr, endStr) => {
    const start = startStr.split(':')
    const end = endStr.split(':')
    let hours = parseInt(end[0]) - parseInt(start[0])
    let mins = parseInt(end[1]) - parseInt(start[1])
    
    if (mins < 0) {
        hours -= 1
        mins += 60
    }
    if (hours < 0) hours += 24
    
    return `${hours} Jam${mins > 0 ? ' ' + mins + 'm' : ''}`
}

const { currentShift, isLoading, fetchCurrentShift, startShift, endShift, formatCurrency } = useShift()
const isStartModalOpen = ref(false)
const isEndModalOpen = ref(false)

onMounted(() => {
    fetchCurrentShift()
})

const handleStart = async (cash) => {
    const success = await startShift(cash)
    if (success) isStartModalOpen.value = false
}

const handleEnd = async (cash, notes) => {
    const success = await endShift(cash, notes)
    if (success) isEndModalOpen.value = false
}
</script>
<template>
    <div class="space-y-6">
        <!-- Personal Stats -->
        <div class="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 text-center">
            <div class="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600">
                <i class="ri-user-star-line text-4xl"></i>
            </div>
            <h3 class="text-lg font-bold text-slate-800">Semangat Kerja, {{ userName }}!</h3>
            <div class="mt-1 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 w-fit mx-auto px-3 py-1 rounded-full border border-slate-100">
                <i class="ri-time-line text-brand-500"></i>
                <span>Jadwal: {{ workHours }}</span>
            </div>
            <p v-if="currentShift?.id" class="text-sm text-slate-500 mt-3">Sesi shift Anda sedang berjalan.</p>
            <p v-else class="text-sm text-red-500 mt-3 font-medium">Shift belum dimulai. Silakan buka kasir.</p>

            <!-- Lateness Warning -->
            <div v-if="currentShift?.id && currentShift?.lateness_minutes > 0" class="mt-4 p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
                <i class="ri-error-warning-fill text-xl"></i>
                <div class="text-left">
                    <p class="text-[10px] font-bold uppercase tracking-wider">Keterlambatan</p>
                    <p class="text-xs font-semibold">Terlambat {{ currentShift.lateness_minutes }} Menit</p>
                </div>
            </div>
            
            <div v-if="currentShift?.id" class="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Sales</p>
                    <p class="text-xl font-bold text-slate-900">{{ formatCurrency(currentShift.cash_sales || 0) }}</p>
                </div>
                <div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaksi</p>
                    <p class="text-xl font-bold text-slate-900">{{ currentShift.transactions_count || 0 }} Nota</p>
                </div>
            </div>
            
            <div v-else class="mt-8 pt-6 border-t border-slate-50">
                <button @click="isStartModalOpen = true" class="w-full bg-brand-50 text-brand-600 rounded-2xl py-3 font-bold flex items-center justify-center gap-2 hover:bg-brand-100 transition">
                    <i class="ri-play-circle-line"></i>
                    Buka Kasir (Mulai Shift)
                </button>
            </div>
        </div>

        <!-- Quick Access to POS -->
        <button v-if="currentShift?.id" @click="emit('navigate', '/pos')" class="w-full bg-brand-600 text-white rounded-[24px] p-6 shadow-xl shadow-brand-500/20 flex items-center gap-4 active:scale-[0.98] transition">
            <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
                <i class="ri-store-2-line"></i>
            </div>
            <div class="text-left">
                <h4 class="font-bold text-lg">Buka POS</h4>
                <p class="text-white/70 text-sm">Input pesanan pelanggan</p>
            </div>
            <i class="ri-arrow-right-s-line ml-auto text-2xl opacity-50"></i>
        </button>

        <!-- Current Shift Info / End Shift -->
        <div v-if="currentShift?.id" class="bg-slate-900 text-white p-5 rounded-[24px] flex items-center justify-between gap-4">
            <div class="flex items-center gap-4 text-left">
                <div class="p-3 bg-white/10 rounded-xl">
                    <i class="ri-time-line text-2xl"></i>
                </div>
                <div>
                    <p class="text-white/50 text-[10px] font-bold uppercase tracking-wider">Jadwal Kerja</p>
                    <p class="font-bold text-sm">{{ workHours }}</p>
                </div>
            </div>
            <button @click="isEndModalOpen = true" class="px-4 py-2 bg-red-500 text-white text-xs font-bold rounded-xl hover:bg-red-600 transition">
                Akhiri Shift
            </button>
        </div>

        <!-- Modals -->
        <StartShiftModal 
            :isOpen="isStartModalOpen" 
            :isLoading="isLoading"
            @close="isStartModalOpen = false"
            @start="handleStart"
        />

        <EndShiftModal 
            :isOpen="isEndModalOpen" 
            :isLoading="isLoading"
            :shift="currentShift"
            :formatCurrency="formatCurrency"
            @close="isEndModalOpen = false"
            @end="handleEnd"
        />
    </div>
</template>
