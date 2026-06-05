<script setup>
import { ref, computed } from 'vue'
import { useCart } from '../composables/useCart'
import { useToast } from '../composables/useToast'
import { useAuth } from '../composables/useAuth'
import { usePromotions } from '../composables/usePromotions'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

const { cartItems, cartTotal, removeFromCart, addToCart, formatRupiah, clearCart, checkout } = useCart()
const { showToast } = useToast()
const { user } = useAuth()
const { promotions, fetchPromotions } = usePromotions()

const selectedPromo = ref(null)

const discountAmount = computed(() => {
    if (!selectedPromo.value) return 0
    if (selectedPromo.value.min_purchase && cartTotal.value < selectedPromo.value.min_purchase) return 0
    
    if (selectedPromo.value.type === 'percentage') {
        return Math.floor(cartTotal.value * (selectedPromo.value.value / 100))
    } else {
        return Math.min(selectedPromo.value.value, cartTotal.value)
    }
})

const finalTotal = computed(() => Math.max(0, cartTotal.value - discountAmount.value))

// Fetch promos when opening (or just mount)
import { onMounted, watch } from 'vue'
import { useBranch } from '../composables/useBranch'

const { selectedBranchId } = useBranch()

onMounted(() => {
    fetchPromotions(true, selectedBranchId.value) // active only, current branch
})

// Optional: Refetch if branch changes (though usually app reloads or route changes)
watch(selectedBranchId, (newId) => {
    if (newId) fetchPromotions(true, newId)
})

const close = () => {
    emit('close')
}

const step = ref('cart') // 'cart', 'info', 'payment'
const customerForm = ref({
    name: 'Pelanggan Umum',
    phone: '',
    table_number: '',
    dining_option: 'dine_in', // dine_in, take_away
    notes: '',
})
const paymentForm = ref({
    method: 'cash',
    cash_amount: 0
})

const changeAmount = computed(() => {
    if (paymentForm.value.method !== 'cash') return 0
    return Math.max(0, paymentForm.value.cash_amount - finalTotal.value)
})

const isProcessing = ref(false)

const processPayment = async () => {
    if (cartItems.value.length === 0) return
    
    // Validate Cash Amount
    if (paymentForm.value.method === 'cash' && paymentForm.value.cash_amount < finalTotal.value) {
        showToast('Jumlah uang tunai kurang!', 'error')
        return
    }

    isProcessing.value = true
    try {
        const payload = {
            items: cartItems.value.map(item => ({
                product_id: item.id,
                quantity: item.quantity
            })),
            payment_method: paymentForm.value.method,
            cash_amount: paymentForm.value.method === 'cash' ? paymentForm.value.cash_amount : 0,
            change_amount: changeAmount.value,
            customer_name: customerForm.value.name,
            customer_phone: customerForm.value.phone,
            table_number: customerForm.value.dining_option === 'dine_in' ? customerForm.value.table_number : null,
            dining_option: customerForm.value.dining_option,
            notes: customerForm.value.notes,
            branch_id: user.value?.branch_id || 1, // Fallback to 1
            promotion_id: selectedPromo.value?.id || null,
        }
        
        const response = await checkout(payload)
        // showToast('Transaksi Berhasil!', 'success') // Handled by parent or receipt
        emit('payment-success', response.transaction)
        
        // Reset forms
        step.value = 'cart'
        customerForm.value = { 
            name: 'Pelanggan Umum', 
            phone: '', 
            table_number: '', 
            dining_option: 'dine_in', 
            notes: '' 
        }
        paymentForm.value = { method: 'cash', cash_amount: 0 }
        selectedPromo.value = null
        
        close()
    } catch (error) {
        console.error('Checkout error:', error)
        let msg = 'Transaksi Gagal'
        if (error.response?.data?.message) msg += ': ' + error.response.data.message
        showToast(msg, 'error')
    } finally {
        isProcessing.value = false
    }
}

const canIncreaseQuantity = (item) => {
    if (!item.track_stock) return true
    return item.quantity < (item.stock ?? 0)
}

const setCashAmount = (amount) => {
    paymentForm.value.cash_amount = amount
}

const nextStep = () => {
    if (step.value === 'cart') {
        if (cartItems.value.length === 0) return
        step.value = 'info'
    } else if (step.value === 'info') {
        if (!customerForm.value.name) {
            showToast('Nama pelanggan harus diisi', 'error')
            return
        }
        step.value = 'payment'
    }
}

const prevStep = () => {
    if (step.value === 'payment') step.value = 'info'
    else if (step.value === 'info') step.value = 'cart'
}
</script>

<template>
    <div v-if="isOpen" class="fixed inset-0 z-[60]">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" @click="close"></div>
        <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transform transition-transform duration-300 ease-out h-[85vh] flex flex-col animate-slide-up">
            
            <!-- Header -->
            <div class="p-4 border-b border-slate-100 flex items-center justify-between bg-white rounded-t-3xl relative z-10" style="padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);">
                <div class="flex items-center gap-3">
                    <button v-if="step !== 'cart'" @click="prevStep" class="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 hover:bg-slate-100 transition active:scale-95">
                        <i class="ri-arrow-left-line text-lg"></i>
                    </button>
                    <h2 class="font-bold text-lg text-slate-900">
                        {{ step === 'cart' ? 'Keranjang Saya' : (step === 'info' ? 'Info Pelanggan' : 'Pembayaran') }}
                    </h2>
                </div>
                <button @click="close" class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition active:scale-95">
                    <i class="ri-close-line text-xl"></i>
                </button>
            </div>

            <!-- Content Area -->
            <div class="flex-1 overflow-y-auto p-4 space-y-4">
                
                <!-- Step 1: Cart Items -->
                <div v-if="step === 'cart'" class="h-full flex flex-col">
                    <div v-if="cartItems.length === 0" class="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
                        <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <i class="ri-shopping-basket-2-line text-3xl text-slate-300"></i>
                        </div>
                        <h3 class="font-semibold text-slate-900">Keranjang Kosong</h3>
                        <p class="text-sm text-slate-500 mt-1">Belum ada item yang dipilih</p>
                    </div>

                    <div v-else class="space-y-3 pb-20">
                        <div v-for="item in cartItems" :key="item.id" class="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-50 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div class="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                                <img v-if="item.image" :src="item.image" class="w-full h-full object-cover">
                                <div v-else class="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                     <i class="ri-image-line"></i>
                                </div>
                            </div>
                            <div class="flex-1">
                                <h4 class="font-medium text-slate-800 text-sm leading-tight mb-1">{{ item.name }}</h4>
                                <p class="text-brand-600 font-bold text-sm">{{ formatRupiah(item.price) }}</p>
                            </div>
                            <div class="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                                <button @click="removeFromCart(item.id)" class="w-6 h-6 rounded-md bg-white shadow-sm flex items-center justify-center text-slate-600 active:scale-90 transition">
                                    <i class="ri-subtract-line text-xs"></i>
                                </button>
                                <span class="font-bold text-sm w-4 text-center text-slate-700">{{ item.quantity }}</span>
                                <button @click="addToCart(item)" :disabled="!canIncreaseQuantity(item)" class="w-6 h-6 rounded-md bg-brand-500 text-white shadow-sm flex items-center justify-center active:scale-90 transition disabled:opacity-50 disabled:cursor-not-allowed">
                                    <i class="ri-add-line text-xs"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Customer Info -->
                <div v-else-if="step === 'info'" class="space-y-6 animate-in slide-in-from-right duration-300">
                    <!-- Dining Option -->
                    <div class="bg-slate-100 p-1 rounded-xl flex">
                        <button @click="customerForm.dining_option = 'dine_in'" :class="['flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300', customerForm.dining_option === 'dine_in' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500']">
                            Makan Ditempat
                        </button>
                        <button @click="customerForm.dining_option = 'take_away'" :class="['flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-300', customerForm.dining_option === 'take_away' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500']">
                            Bawa Pulang
                        </button>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nama Pelanggan <span class="text-red-500">*</span></label>
                        <input v-model="customerForm.name" type="text" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-brand-500 outline-none transition font-bold text-sm text-slate-800 placeholder-slate-300" placeholder="Contoh: Budi">
                    </div>

                    <div v-if="customerForm.dining_option === 'dine_in'" class="animate-in fade-in slide-in-from-top-1 duration-200">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nomor Meja</label>
                        <input v-model="customerForm.table_number" type="text" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-brand-500 outline-none transition font-bold text-sm text-slate-800 placeholder-slate-300" placeholder="Contoh: 5">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">No. HP (Opsional)</label>
                        <input v-model="customerForm.phone" type="tel" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-brand-500 outline-none transition font-bold text-sm text-slate-800 placeholder-slate-300" placeholder="08...">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Catatan Tambahan (Opsional)</label>
                        <textarea v-model="customerForm.notes" rows="2" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-brand-500 outline-none transition font-medium text-sm text-slate-700 placeholder-slate-300" placeholder="Contoh: Jangan terlalu pedas..."></textarea>
                    </div>
                </div>

                <!-- Step 3: Payment -->
                <div v-else-if="step === 'payment'" class="space-y-6 animate-in slide-in-from-right duration-300">
                   <!-- Total Display -->
                   <div class="bg-slate-900 text-white p-5 rounded-2xl shadow-lg shadow-slate-900/20 text-center relative overflow-hidden">
                       <!-- Background Pattern -->
                       <div class="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-8 -mt-8"></div>
                       
                       <div class="relative z-10">
                           <p class="text-slate-400 text-[10px] font-medium uppercase tracking-widest mb-1">Total Tagihan</p>
                           <h3 class="text-3xl font-black mb-2">{{ formatRupiah(finalTotal) }}</h3>
                           
                           <div v-if="discountAmount > 0" class="inline-flex items-center gap-2 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-bold">
                               <i class="ri-coupon-3-fill"></i>
                               <span>Hemat {{ formatRupiah(discountAmount) }}</span>
                           </div>
                       </div>
                   </div>

                   <!-- Promo Selection -->
                   <div v-if="promotions.length > 0">
                       <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Voucher & Promo</label>
                       <div class="space-y-2">
                           <div v-for="promo in promotions" :key="promo.id" 
                                @click="selectedPromo = selectedPromo?.id === promo.id ? null : promo"
                                :class="['p-3 rounded-xl border flex items-center justify-between transition cursor-pointer', 
                                    selectedPromo?.id === promo.id ? 'bg-brand-50 border-brand-500 ring-1 ring-brand-500' : 'bg-white border-slate-100 hover:border-slate-200']">
                               <div>
                                   <div class="flex items-center gap-2">
                                       <span class="font-bold text-slate-900 text-sm">{{ promo.name }}</span>
                                       <span v-if="promo.type === 'percentage'" class="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">{{ Number(promo.value) }}%</span>
                                       <span v-else class="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">{{ formatRupiah(promo.value) }}</span>
                                   </div>
                                    <p v-if="promo.min_purchase > 0" class="text-[10px] text-slate-500 mt-0.5">Min. belanja {{ formatRupiah(promo.min_purchase) }}</p>
                               </div>
                               <div :class="['w-5 h-5 rounded-full border flex items-center justify-center', 
                                   selectedPromo?.id === promo.id ? 'bg-brand-500 border-brand-500' : 'border-slate-300']">
                                   <i v-if="selectedPromo?.id === promo.id" class="ri-check-line text-white text-xs"></i>
                               </div>
                           </div>
                       </div>
                   </div>

                   <!-- Payment Method Tabs -->
                   <div class="bg-slate-100 p-1.5 rounded-2xl flex">
                       <button @click="paymentForm.method = 'cash'" :class="['flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300', paymentForm.method === 'cash' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400']">Tunai (Cash)</button>
                       <button disabled :class="['flex-1 py-3 rounded-xl text-xs font-bold transition-all duration-300 opacity-50 cursor-not-allowed text-slate-400']">QRIS / Transfer (Soon)</button>
                   </div>

                   <!-- Cash Input Section -->
                   <div v-if="paymentForm.method === 'cash'" class="space-y-4">
                       <div>
                           <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Uang Diterima</label>
                           <div class="relative">
                               <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">Rp</span>
                               <input v-model="paymentForm.cash_amount" type="number" class="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:border-brand-500 outline-none transition font-black text-lg text-slate-800 placeholder-slate-300" placeholder="0">
                           </div>
                       </div>

                       <!-- Quick Amount Suggestions -->
                       <div class="grid grid-cols-3 gap-2">
                           <button @click="setCashAmount(finalTotal)" class="py-2 px-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-100 hover:bg-slate-100 transition">Uang Pas</button>
                           <button @click="setCashAmount(10000)" class="py-2 px-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-100 hover:bg-slate-100 transition">10.000</button>
                           <button @click="setCashAmount(20000)" class="py-2 px-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-100 hover:bg-slate-100 transition">20.000</button>
                           <button @click="setCashAmount(50000)" class="py-2 px-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-100 hover:bg-slate-100 transition">50.000</button>
                           <button @click="setCashAmount(100000)" class="py-2 px-3 rounded-xl bg-slate-50 text-slate-600 text-xs font-bold border border-slate-100 hover:bg-slate-100 transition">100.000</button>
                       </div>

                       <!-- Change Display -->
                       <div class="flex justify-between items-center p-4 rounded-2xl bg-green-50 text-green-700 border border-green-100">
                           <span class="font-bold text-sm">Kembalian</span>
                           <span class="font-black text-lg">{{ formatRupiah(changeAmount) }}</span>
                       </div>
                   </div>
                </div>

            </div>

            <!-- Footer Actions -->
            <div class="p-4 border-t border-slate-100 bg-white shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.05)]" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);">
                <div v-if="step === 'cart'" class="flex justify-between items-center mb-4">
                    <span class="text-slate-500 font-medium">Total Pembayaran</span>
                    <span class="text-xl font-bold text-brand-600">{{ formatRupiah(cartTotal) }}</span>
                </div>

                <button 
                    v-if="step === 'cart'" 
                    @click="nextStep" 
                    :disabled="cartItems.length === 0" 
                    class="w-full bg-brand-600 text-white rounded-xl py-3 font-bold text-base shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span>Lanjut Pembayaran</span>
                    <i class="ri-arrow-right-line"></i>
                </button>

                <button 
                    v-else-if="step === 'info'" 
                    @click="nextStep" 
                    class="w-full bg-slate-900 text-white rounded-xl py-3 font-bold text-base shadow-lg shadow-slate-900/30 flex items-center justify-center gap-2 active:scale-[0.98] transition hover:bg-slate-800">
                    <span>Pilih Metode Bayar</span>
                    <i class="ri-arrow-right-line"></i>
                </button>

                <button 
                    v-else-if="step === 'payment'" 
                    @click="processPayment" 
                    :disabled="isProcessing || (paymentForm.method === 'cash' && paymentForm.cash_amount < finalTotal)" 
                    class="w-full bg-brand-600 text-white rounded-xl py-3 font-bold text-base shadow-lg shadow-brand-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span v-if="isProcessing">Memproses...</span>
                    <span v-else>Bayar Sekarang</span>
                    <i v-if="!isProcessing" class="ri-check-line"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-slide-up {
  animation: slide-up 0.3s ease-out forwards;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}
</style>
