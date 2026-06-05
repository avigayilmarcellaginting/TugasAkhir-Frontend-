<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCart } from '../../composables/useCart'
import { useInventory } from '../../composables/useInventory'
import { useBranch } from '../../composables/useBranch'
import CartSheet from '../../components/CartSheet.vue'
import ReceiptModal from './ReceiptModal.vue'


import { useShift } from '../../composables/useShift'

const { addToCart, cartCount, cartTotal, formatRupiah } = useCart()
const { products, fetchProducts, categories, fetchCategories, isLoading: isInventoryLoading } = useInventory()
const { selectedBranch, fetchBranches } = useBranch()
const { currentShift, fetchCurrentShift, isLoading: isShiftLoading } = useShift() // Use shared shift state
import { useAuth } from '../../composables/useAuth'
const { isOwner } = useAuth()

const currentBranchName = computed(() => selectedBranch.value?.name || 'Cabang Belum Dipilih')

const isCartOpen = ref(false)
const isReceiptOpen = ref(false)
const lastTransaction = ref(null)
const searchQuery = ref('')
const selectedCategory = ref(null) // Object or null for 'Semua'
const isSearchVisible = ref(false)

onMounted(async () => {
    await fetchBranches()
    await fetchCurrentShift() // Check shift status
    fetchCategories()
    fetchProducts()
})

const filteredProducts = computed(() => {
    return products.value.filter(product => {
        const matchesCategory = !selectedCategory.value || product.category_id == selectedCategory.value.id
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                              (product.code && product.code.toLowerCase().includes(searchQuery.value.toLowerCase()))
        return matchesCategory && matchesSearch
    })
})

const handleAddToCart = (product) => {
    addToCart(product)
}

const toggleCart = () => {
    isCartOpen.value = !isCartOpen.value
}

const toggleSearch = () => {
    isSearchVisible.value = !isSearchVisible.value
}

const selectCategory = (category) => {
    selectedCategory.value = category
}

const isOutOfStock = (product) => {
    if (!product.track_stock) return false
    return (product.stock ?? 0) <= 0
}

const handlePaymentSuccess = (transaction) => {
    lastTransaction.value = transaction
    isReceiptOpen.value = true
    fetchProducts()
}
</script>

<template>
  <div id="view-pos" class="view-section transition-opacity duration-300">
      <!-- Header (POS specific) -->
      <header class="fixed left-0 right-0 z-40 glass-effect border-b border-white/50 px-4 py-3 shadow-sm transition-all duration-300" style="top: var(--safe-top, 0px);">
          <div class="flex items-center justify-between w-full max-w-full gap-4">
              <div class="flex items-center gap-3 flex-shrink-0">
                  <div class="cursor-pointer">
                      <h1 class="font-bold text-lg leading-tight text-slate-900">Cabang / Outlet</h1>
                      <div class="flex items-center gap-1 text-xs text-slate-500 font-medium hover:text-brand-600 transition">
                          <p>{{ currentBranchName }}</p>
                      </div>
                  </div>
              </div>
              
              <!-- Search Bar (Desktop) -->
              <div class="hidden md:flex flex-1 max-w-md">
                  <div class="relative w-full group">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <i class="ri-search-line text-slate-400 group-focus-within:text-brand-500 transition"></i>
                      </div>
                      <input v-model="searchQuery" type="text" class="block w-full pl-10 pr-3 py-2 border-0 rounded-full leading-5 bg-slate-100/50 text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-brand-500 focus:shadow-md transition sm:text-sm" placeholder="Cari menu, kode produk...">
                  </div>
              </div>

              <button @click="toggleSearch" class="md:hidden w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition active:scale-95 tap-highlight-transparent">
                  <i class="ri-search-line text-lg"></i>
              </button>
              
              <!-- Mobile Search Bar (Hidden by default) -->
              <div v-if="isSearchVisible" id="mobile-search-bar" class="absolute top-16 left-0 right-0 bg-white p-4 shadow-lg border-b border-slate-100 z-50 animate-slide-down">
                  <div class="relative w-full">
                      <i class="ri-search-line absolute left-3 top-3 text-slate-400"></i>
                      <input v-model="searchQuery" id="mobile-search-input" type="text" class="w-full bg-slate-50 pl-10 pr-4 py-2.5 rounded-xl border-none outline-none focus:ring-2 focus:ring-brand-500 transition" placeholder="Cari produk...">
                  </div>
              </div>
          </div>

          <!-- Categories -->
          <div class="mt-3 overflow-x-auto no-scrollbar pb-1 w-full max-w-full mx-auto">
              <div class="flex gap-3 px-1">
                  <button @click="selectCategory(null)" :class="['category-pill whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium border transition tap-highlight-transparent', selectedCategory === null ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-50']">
                      Semua
                  </button>
                  <button v-for="category in categories" :key="category.id" @click="selectCategory(category)" :class="['category-pill whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium border transition tap-highlight-transparent', selectedCategory?.id === category.id ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'bg-transparent text-slate-500 border-transparent hover:bg-slate-50']">
                      {{ category.name }}
                  </button>
              </div>
          </div>
      </header>

      <!-- Main Content -->
      <main class="pt-36 px-4 w-full max-w-full mx-auto pb-32">
          <!-- Skeleton Loading -->
          <div v-if="isInventoryLoading && filteredProducts.length === 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              <div v-for="n in 6" :key="'skel-'+n" class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 animate-pulse">
                  <div class="w-full h-32 rounded-xl bg-slate-200 mb-3"></div>
                  <div class="h-4 bg-slate-200 rounded-lg w-3/4 mb-2"></div>
                  <div class="h-3 bg-slate-100 rounded-lg w-1/2 mb-3"></div>
                  <div class="flex justify-between items-center">
                      <div class="h-4 bg-slate-200 rounded-lg w-1/3"></div>
                      <div class="w-8 h-8 rounded-full bg-slate-200"></div>
                  </div>
              </div>
          </div>

          <!-- Products Grid -->
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6" id="product-grid">
              <div v-for="(product, index) in filteredProducts" :key="product.id" 
                  class="flex flex-col bg-white p-3 rounded-2xl shadow-sm border border-slate-100 h-full product-card"
                  :style="{ animationDelay: `${index * 40}ms` }">
                  <div class="w-full h-32 rounded-xl bg-slate-100 overflow-hidden mb-3 relative">
                      <img v-if="product.image" :src="product.image" loading="lazy" class="w-full h-full object-cover transition-opacity duration-300" @load="$event.target.style.opacity = 1" style="opacity: 0">
                      <div v-else class="w-full h-full flex items-center justify-center text-slate-300">
                          <i class="ri-image-line text-3xl"></i>
                      </div>
                      <div v-if="isOutOfStock(product)" class="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span class="text-white font-bold text-xs bg-red-500 px-2 py-1 rounded-full">Habis</span>
                      </div>
                  </div>
                  <h3 class="font-bold text-slate-900 text-sm mb-1 leading-tight line-clamp-2 min-h-[2.5rem]">{{ product.name }}</h3>
                  <p class="text-xs text-slate-500 mb-3">{{ product.category?.name || 'Umum' }}</p>
                  <div class="mt-auto flex justify-between items-center">
                      <span class="font-bold text-brand-600 text-sm">{{ formatRupiah(product.price) }}</span>
                      <button @click="handleAddToCart(product)" :disabled="isOutOfStock(product)" class="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center hover:bg-brand-500 hover:text-white transition active:scale-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                          <i class="ri-add-line"></i>
                      </button>
                  </div>
              </div>
          </div>
      </main>

      <!-- Floating Cart Bar (POS Only) -->
      <div v-show="cartCount > 0" class="fixed left-1/2 -translate-x-1/2 z-30 transform transition-all duration-500 ease-out w-full px-4 max-w-lg" style="bottom: calc(5rem + var(--safe-bottom, 0px));">
          <div class="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl p-3 pl-4 shadow-floating flex items-center justify-between cursor-pointer active:scale-[0.98] transition border border-white/10" @click="toggleCart">
              <div class="flex items-center gap-3">
                  <div class="bg-brand-500 w-10 h-10 rounded-xl flex items-center justify-center font-bold relative shadow-lg shadow-brand-500/30">
                      <span id="cart-count">{{ cartCount }}</span>
                  </div>
                  <div>
                      <p class="text-[10px] text-slate-300 uppercase tracking-wider font-semibold">Total Pesanan</p>
                      <p class="font-bold text-lg leading-none mt-0.5" id="cart-total">{{ formatRupiah(cartTotal) }}</p>
                  </div>
              </div>
              <div class="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20 transition">
                  <span class="text-sm font-medium">Lihat</span>
                  <i class="ri-arrow-right-line"></i>
              </div>
          </div>
      </div>

      <CartSheet :is-open="isCartOpen" @close="isCartOpen = false" @payment-success="handlePaymentSuccess" />
      
      <ReceiptModal 
          :is-open="isReceiptOpen" 
          :transaction="lastTransaction" 
          @close="isReceiptOpen = false" 
      />

      <!-- Shift Block Overlay -->
      <div v-if="!isOwner && !isShiftLoading && !currentShift" class="fixed inset-0 z-[60] bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div class="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <i class="ri-lock-2-line text-4xl"></i>
          </div>
          <h2 class="text-2xl font-bold text-slate-900 mb-2">Akses Terkunci</h2>
          <p class="text-slate-500 mb-8 max-w-xs mx-auto">Anda belum memulai shift. Silakan buka kasir melalui Dashboard untuk memulai.</p>
          <router-link to="/" class="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition">
              Kembali ke Dashboard
          </router-link>
      </div>

  </div>
</template>

<style scoped>
.product-card {
  animation: card-in 0.35s ease-out both;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
