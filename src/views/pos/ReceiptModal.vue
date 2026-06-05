<script setup>
import { computed, ref } from 'vue'
import PrinterService from '../../services/PrinterService.js'

const props = defineProps({
  isOpen: Boolean,
  transaction: Object
})

const emit = defineEmits(['close'])

const branchName = computed(() => props.transaction?.branch?.name || 'KasirPro UMKM')
const cashierName = computed(() => props.transaction?.user?.name || 'Kasir')

const date = computed(() => {
    if (!props.transaction?.created_at) return ''
    return new Date(props.transaction.created_at).toLocaleString('id-ID')
})

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number)
}

// BT Printer States
const showPrinterSettings = ref(false)
const isScanning = ref(false)
const isConnecting = ref(false)
const isPrinting = ref(false)
const devices = ref([])
const selectedDevice = ref(null)
const isConnected = ref(false)
const paperSize = ref('58mm') // 58mm or 80mm
const errorMsg = ref('')

const toggleSettings = () => {
    showPrinterSettings.value = !showPrinterSettings.value
    if (showPrinterSettings.value && devices.value.length === 0) {
        scanBluetooth()
    }
}

const scanBluetooth = async () => {
    try {
        errorMsg.value = ''
        isScanning.value = true
        devices.value = await PrinterService.getDevices()
    } catch (err) {
        errorMsg.value = err.message
    } finally {
        isScanning.value = false
    }
}

const connectToDevice = async () => {
    if (!selectedDevice.value) return;
    try {
        errorMsg.value = ''
        isConnecting.value = true
        await PrinterService.connect(selectedDevice.value)
        isConnected.value = await PrinterService.isConnected()
    } catch (err) {
        errorMsg.value = err.message
    } finally {
        isConnecting.value = false
    }
}

const disconnectDevice = async () => {
    await PrinterService.disconnect()
    isConnected.value = false
}

const printReceiptBluetooth = async () => {
    try {
        errorMsg.value = ''
        isPrinting.value = true
        await PrinterService.printReceipt(props.transaction, paperSize.value)
    } catch (err) {
        errorMsg.value = err.message
    } finally {
        isPrinting.value = false
    }
}

const printReceipt = () => {
    window.print()
}

// Handle close
const handleClose = () => {
    showPrinterSettings.value = false
    emit('close')
}
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center px-4" style="padding-top: calc(1rem + env(safe-area-inset-top, 0px)); padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px));">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="handleClose"></div>
    
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden flex flex-col max-h-full">
        
        <!-- Receipt Content (Printable Area) -->
        <div id="receipt-content" class="p-6 overflow-y-auto bg-white flex-1 min-h-0">
            
            <div class="text-center mb-6 border-b border-dashed border-slate-300 pb-6">
                <div class="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                    K
                </div>
                <h2 class="font-bold text-lg text-slate-900 leading-tight uppercase tracking-wider">{{ branchName }}</h2>
                <p class="text-xs text-slate-500 mt-1">Struk Pembayaran</p>
                <p class="text-xs text-slate-400 mt-0.5 mb-1">{{ date }}</p>
                <p v-if="transaction?.customer_name" class="text-xs font-bold text-slate-800 mt-1 uppercase">Pel: {{ transaction.customer_name }}</p>
                <p v-if="transaction?.customer_phone" class="text-[10px] text-slate-500">Telp: {{ transaction.customer_phone }}</p>
                
                <div class="flex justify-between items-center mt-2 border-t border-dashed border-slate-300 pt-2">
                    <span class="text-xs font-bold uppercase bg-slate-100 px-2 py-0.5 rounded">{{ transaction?.dining_option === 'dine_in' ? 'Makan Ditempat' : 'Bawa Pulang' }}</span>
                    <span v-if="transaction?.table_number" class="text-xs font-bold">Meja: {{ transaction.table_number }}</span>
                </div>
            </div>

            <div class="space-y-3 mb-6">
                <div v-for="detail in transaction?.details" :key="detail.id" class="flex justify-between items-start text-sm">
                    <div class="flex-1 pr-2">
                        <p class="text-slate-800 font-medium leading-tight">{{ detail.product?.name || 'Item' }}</p>
                        <p class="text-xs text-slate-500 mt-0.5">{{ detail.quantity }} x {{ formatRupiah(detail.price) }}</p>
                    </div>
                    <span class="text-slate-900 font-semibold whitespace-nowrap">{{ formatRupiah(detail.subtotal) }}</span>
                </div>
            </div>

            <div class="border-t border-dashed border-slate-300 pt-4 space-y-2 mb-6">
                <div class="flex justify-between text-xs text-slate-500 mb-2 pt-2 border-t border-dashed border-slate-200" v-if="transaction?.discount_amount > 0">
                    <span>Subtotal</span>
                    <span>{{ formatRupiah(transaction?.subtotal || 0) }}</span>
                </div>
                <div class="flex justify-between text-xs text-red-500 mb-2" v-if="transaction?.discount_amount > 0">
                    <span>
                        Diskon
                        <span v-if="transaction?.promotion?.type === 'percentage'" class="text-[10px] ml-1">({{ Number(transaction.promotion.value) }}%)</span>
                        <span v-else-if="transaction?.promotion?.type === 'fixed'" class="text-[10px] ml-1">({{ formatRupiah(transaction.promotion.value) }})</span>
                    </span>
                    <span>-{{ formatRupiah(transaction?.discount_amount) }}</span>
                </div>
                <div class="flex justify-between items-center text-sm">
                    <span class="text-slate-500 font-bold">Total</span>
                    <span class="font-bold text-slate-900 text-lg">{{ formatRupiah(transaction?.total_amount || 0) }}</span>
                </div>
                <div class="flex justify-between text-xs text-slate-500">
                    <span>Tunai</span>
                    <span>{{ formatRupiah(transaction?.cash_amount || 0) }}</span>
                </div>
                <div class="flex justify-between text-xs text-slate-500">
                    <span>Kembali</span>
                    <span>{{ formatRupiah(transaction?.change_amount || 0) }}</span>
                </div>
            </div>

            <div class="text-center text-xs text-slate-400">
                <p>Terima kasih atas kunjungan Anda!</p>
                <p class="mt-1 font-medium">Kasir: {{ cashierName }}</p>
                <p class="mt-0.5 font-mono text-[10px]">{{ transaction?.transaction_code }}</p>
            </div>
        </div>

        <!-- Printer Settings -->
        <div v-show="showPrinterSettings" class="p-4 bg-slate-50 border-t border-slate-200 print:hidden text-sm flex-shrink-0 overflow-y-auto">
            <h3 class="font-bold text-slate-800 mb-3 flex justify-between items-center">
                <span>Pengaturan Printer BT</span>
                <button @click="toggleSettings" class="text-slate-400 hover:text-slate-600 bg-slate-200/50 p-1 rounded-full w-6 h-6 flex items-center justify-center">
                    <i class="ri-close-line"></i>
                </button>
            </h3>
            
            <div v-if="errorMsg" class="bg-red-50 text-red-600 p-2 rounded-lg text-xs mb-3 border border-red-100">
                {{ errorMsg }}
            </div>

            <div class="space-y-4">
                <!-- Ukuran Kertas -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-2">1. Ukuran Kertas</label>
                    <div class="flex gap-2">
                        <label class="flex-1 flex items-center justify-center p-2 rounded-lg border border-slate-200 cursor-pointer transition" :class="{'bg-slate-900 text-white border-slate-900': paperSize === '58mm', 'bg-white text-slate-600 hover:bg-slate-50': paperSize !== '58mm'}">
                            <input type="radio" v-model="paperSize" value="58mm" class="hidden">
                            <span>58mm <span class="text-[10px] opacity-70 block font-normal">(Mini)</span></span>
                        </label>
                        <label class="flex-1 flex items-center justify-center p-2 rounded-lg border border-slate-200 cursor-pointer transition" :class="{'bg-slate-900 text-white border-slate-900': paperSize === '80mm', 'bg-white text-slate-600 hover:bg-slate-50': paperSize !== '80mm'}">
                            <input type="radio" v-model="paperSize" value="80mm" class="hidden">
                            <span>80mm <span class="text-[10px] opacity-70 block font-normal">(Standar)</span></span>
                        </label>
                    </div>
                </div>

                <!-- Perangkat Bluetooth -->
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-xs font-semibold text-slate-600">2. Koneksi Perangkat</label>
                        <button @click="scanBluetooth" :disabled="isScanning" class="text-xs text-blue-600 hover:text-blue-700 font-medium">
                            {{ isScanning ? 'Mencari...' : 'Pindai Ulang' }}
                        </button>
                    </div>
                    
                    <div v-if="isConnected" class="flex gap-2 mb-2">
                        <div class="flex-1 p-2 bg-green-50 text-green-700 rounded-lg text-xs font-medium border border-green-200 flex items-center">
                            <i class="ri-bluetooth-line mr-2"></i> Terhubung
                        </div>
                        <button @click="disconnectDevice" class="px-3 py-2 bg-white rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100">
                            Putus
                        </button>
                    </div>
                    <div v-else class="flex gap-2">
                        <select v-model="selectedDevice" class="flex-1 p-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white w-full truncate">
                            <option value="null" disabled>Pilih Perangkat</option>
                            <option v-for="device in devices" :key="device.address" :value="device.address">
                                {{ device.name || 'Unknown' }}
                            </option>
                        </select>
                        <button @click="connectToDevice" :disabled="!selectedDevice || isConnecting" class="px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50">
                            {{ isConnecting ? '...' : 'Connect' }}
                        </button>
                    </div>
                </div>
                
                <button v-if="isConnected" @click="printReceiptBluetooth" :disabled="isPrinting" class="w-full py-3 mt-2 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg shadow-blue-600/20">
                    <i class="ri-printer-cloud-line text-lg"></i> {{ isPrinting ? 'Mengirim Data...' : 'Uji Cetak Bluetooth' }}
                </button>
            </div>
        </div>

        <!-- Actions (Hidden in Print) -->
        <div class="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 print:hidden" v-show="!showPrinterSettings">
            <button @click="handleClose" class="py-3 px-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white transition" title="Tutup">
                <i class="ri-close-line text-lg"></i>
            </button>
            <button @click="toggleSettings" class="py-3 px-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-white transition" :class="{'text-blue-600 border-blue-200 bg-blue-50': isConnected}" title="Pengaturan Printer">
                <i class="ri-settings-3-line text-lg"></i>
            </button>
            <button v-if="isConnected" @click="printReceiptBluetooth" class="flex-1 py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                <i class="ri-bluetooth-line"></i> Cetak Struk
            </button>
            <button v-else @click="printReceipt" class="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2">
                <i class="ri-printer-line"></i> Cetak Browser
            </button>
        </div>
    </div>
  </div>
</template>

<style scoped>
@media print {
  body * {
    visibility: hidden;
  }
  #receipt-content, #receipt-content * {
    visibility: visible;
  }
  #receipt-content {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: auto;
    margin: 0;
    padding: 0;
    box-shadow: none;
  }
}
</style>
