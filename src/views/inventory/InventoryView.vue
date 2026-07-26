<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '../../composables/useAuth'
import { useInventory } from '../../composables/useInventory'
import { useBranch } from '../../composables/useBranch'
import { useToast } from '../../composables/useToast'

const { showToast } = useToast()

const { can, user, isOwner } = useAuth()
const { 
    categories, products, isLoading, 
    fetchCategories, saveCategory, deleteCategory,
    fetchProducts, saveProduct, updateStock 
} = useInventory()
const { branches, fetchBranches } = useBranch()

const currentTab = ref('products') // 'products' or 'categories'
const searchQuery = ref('')
const selectedCategoryId = ref('all')

const isCategoryModalOpen = ref(false)
const categoryForm = ref({ id: null, name: '' })

const isProductModalOpen = ref(false)
const productForm = ref({
    id: null,
    category_id: null,
    name: '',
    sku: '',
    price: 0,
    description: '',
    track_stock: true
})

const isStockModalOpen = ref(false)
const stockForm = ref({
    product_id: null,
    product_name: '',
    branch_id: null,
    stock: 0,
    type: 'set'
})

onMounted(async () => {
    await Promise.all([
        fetchCategories('all'),
        fetchProducts('all'),
        fetchBranches()
    ])
    
    // Default branch for stock form
    if (user.value?.branch_id) {
        stockForm.value.branch_id = user.value.branch_id
    } else if (branches.value.length > 0) {
        stockForm.value.branch_id = branches.value[0].id
    }
})

const filteredProducts = computed(() => {
    return products.value.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                             (p.sku && p.sku.toLowerCase().includes(searchQuery.value.toLowerCase()))
        const matchesCategory = selectedCategoryId.value === 'all' || p.category_id == selectedCategoryId.value
        return matchesSearch && matchesCategory
    })
})

const lowStockCount = computed(() => {
    return products.value.filter(p => {
        if (!p.track_stock) return false
        // Check if stock <= 5
        return (p.stock ?? 0) <= 5
    }).length
})

// Categories Actions
const openAddCategory = () => {
    categoryForm.value = { 
        id: null, 
        name: '', 
        branch_id: user.value?.branch_id // Default to current branch, but can be changed to null for Global
    }
    isCategoryModalOpen.value = true
}

const openEditCategory = (cat) => {
    categoryForm.value = { ...cat }
    isCategoryModalOpen.value = true
}

const handleSaveCategory = async () => {
    const success = await saveCategory(categoryForm.value)
    if (success) {
        isCategoryModalOpen.value = false
        fetchCategories('all')
    }
}

const handleDeleteCategory = async (id) => {
    const success = await deleteCategory(id)
    if (success) fetchCategories('all')
}

// Products Actions
const imagePreview = ref(null)
const imageFile = ref(null)

const compressImage = (file, maxWidth = 1024, quality = 0.7) => {
    return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height
                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob((blob) => {
                    const compressed = new File([blob], file.name, { type: 'image/jpeg' })
                    resolve(compressed)
                }, 'image/jpeg', quality)
            }
            img.src = e.target.result
        }
        reader.readAsDataURL(file)
    })
}

const onFileChange = async (e) => {
    let file = e.target.files[0]
    if (!file) return
    
    // Auto-compress if > 1MB
    if (file.size > 1024 * 1024) {
        file = await compressImage(file)
    }
    
    imageFile.value = file
    const reader = new FileReader()
    reader.onload = (ev) => {
        imagePreview.value = ev.target.result
    }
    reader.readAsDataURL(file)
}

const openAddProduct = () => {
    productForm.value = {
        id: null,
        category_id: categories.value.length > 0 ? categories.value[0].id : null,
        branch_id: user.value?.branch_id,
        name: '',
        sku: '',
        price: 0,
        cost_price: 0,
        description: '',
        track_stock: true,
        image: null
    }
    imagePreview.value = null
    imageFile.value = null
    isProductModalOpen.value = true
}

const openEditProduct = (prod) => {
    productForm.value = { ...prod }
    imagePreview.value = prod.image
    imageFile.value = null
    isProductModalOpen.value = true
}

const handleSaveProduct = async () => {
    // Merge image file into form data
    const dataToSend = { ...productForm.value }
    if (imageFile.value) {
        dataToSend.image = imageFile.value
    }
    
    const success = await saveProduct(dataToSend)
    if (success) {
        isProductModalOpen.value = false
        fetchProducts('all') // Refresh the list
    }
}
 
const openStockUpdate = (prod) => {
    stockForm.value = {
        product_id: prod.id,
        product_name: prod.name,
        branch_id: user.value?.branch_id,
        stock: 0,
        type: 'set'
    }
    isStockModalOpen.value = true
}

const handleUpdateStock = async () => {
    const success = await updateStock(stockForm.value.product_id, stockForm.value)
    if (success) {
        isStockModalOpen.value = false
        fetchProducts('all') // Refresh to show new stock
    }
}

const getStockForDisplay = (product) => {
    if (!product.track_stock) return '∞'
    return product.stock ?? 0
}

const formatCurrency = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number)
}
</script>

<template>
  <div id="view-inventory" class="view-section pt-6 px-4 pb-24 slide-up">
        <header class="flex justify-between items-center mb-6 text-slate-800">
            <div>
                <h2 class="text-2xl font-bold">Manajemen Produk</h2>
                <p class="text-xs text-slate-500 font-medium">Kelola produk & stok real-time</p>
            </div>
            <div class="flex gap-2">
                <button v-if="can('module-inventory')" @click="currentTab === 'products' ? openAddProduct() : openAddCategory()" class="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-95 transition">
                    <i class="ri-add-line text-xl"></i>
                </button>
            </div>
        </header>

        <!-- Tabs -->
        <div class="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
            <button @click="currentTab = 'products'" :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300', currentTab === 'products' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500']">Produk</button>
            <button @click="currentTab = 'categories'" :class="['flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300', currentTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500']">Kategori</button>
        </div>

        <div v-if="currentTab === 'products'">
            <!-- Stats -->
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 group active:scale-95 transition">
                    <div class="flex items-center gap-2 text-blue-600 mb-2">
                        <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
                            <i class="ri-box-3-line"></i>
                        </div>
                        <span class="text-[10px] font-bold uppercase tracking-wider">Total Produk</span>
                    </div>
                    <p class="text-2xl font-bold text-slate-900">{{ products.length }}</p>
                </div>
                <div class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 group active:scale-95 transition">
                    <div class="flex items-center gap-2 text-orange-500 mb-2">
                        <div class="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center">
                            <i class="ri-alert-line"></i>
                        </div>
                        <span class="text-[10px] font-bold uppercase tracking-wider">Stok Menipis</span>
                    </div>
                    <p class="text-2xl font-bold text-slate-900">{{ lowStockCount }}</p>
                </div>
            </div>

            <!-- Search & Filter -->
            <div class="flex gap-3 mb-6">
                <div class="relative flex-1">
                    <i class="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                    <input v-model="searchQuery" type="text" class="w-full pl-11 pr-4 py-4 rounded-2xl bg-white border border-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm font-medium" placeholder="Cari produk / SKU...">
                </div>
                <select v-model="selectedCategoryId" class="bg-white border border-slate-100 rounded-2xl px-4 py-4 text-xs font-bold outline-none focus:border-blue-500 transition max-w-[120px] appearance-none text-slate-700">
                    <option value="all">Kategori</option>
                    <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
            </div>

            <!-- Product List -->
            <div class="space-y-3">
                <div v-if="isLoading && products.length === 0" class="text-center py-10 text-slate-400 font-medium">Memuat data produk...</div>
                <div v-else-if="filteredProducts.length === 0" class="text-center py-10 text-slate-400">Produk tidak ditemukan</div>
                
                <div v-for="product in filteredProducts" :key="product.id" @click="openEditProduct(product)" class="bg-white p-3 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 active:scale-[0.98] transition animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div class="w-16 h-16 bg-slate-50 rounded-2xl overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-300 border border-slate-100">
                        <img v-if="product.image" :src="product.image" class="w-full h-full object-cover">
                        <i v-else class="ri-image-line text-2xl"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                        <h4 class="font-bold text-slate-900 text-sm truncate mb-0.5">{{ product.name }}</h4>
                        <div class="flex items-center gap-1.5 flex-wrap">
                            <span class="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">{{ product.category?.name || 'Umum' }}</span>
                            <span class="text-[11px] font-bold text-blue-700">{{ formatCurrency(product.price) }}</span>
                        </div>
                        <p class="text-[10px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">{{ product.sku }}</p>
                    </div>
                    <div class="text-right flex flex-col items-end gap-1.5 px-1">
                        <div class="flex items-center gap-2">
                            <span :class="['text-sm font-black', getStockForDisplay(product) <= 5 && product.track_stock ? 'text-orange-500' : 'text-slate-900']">
                                {{ getStockForDisplay(product) }}
                            </span>
                            <button v-if="product.track_stock" @click.stop="openStockUpdate(product)" class="bg-blue-50 text-blue-700 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition shadow-sm active:scale-90">
                                <i class="ri-add-line text-lg"></i>
                            </button>
                        </div>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">Stock</p>
                    </div>
                </div>
            </div>
        </div>
        <div v-else>
            <!-- Categories List -->
            <div class="space-y-3">
                <div v-if="isLoading && categories.length === 0" class="text-center py-10 text-slate-400 font-medium font-medium">Memuat data kategori...</div>
                <div v-for="cat in categories" :key="cat.id" class="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center group active:scale-[0.99] transition animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-700 border border-slate-100">
                            <i class="ri-bookmark-3-line text-2xl"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-slate-900 text-sm">{{ cat.name }}</h4>
                            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{{ cat.branch?.name || 'Semua Cabang (Global)' }}</p>
                        </div>
                    </div>
                    <div class="flex gap-1">
                        <button @click="openEditCategory(cat)" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-50 transition">
                            <i class="ri-edit-line text-lg"></i>
                        </button>
                        <button @click="handleDeleteCategory(cat.id)" class="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition">
                            <i class="ri-delete-bin-line text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Category Modal -->
        <Teleport to="body">
            <div v-if="isCategoryModalOpen" class="fixed inset-0 z-[70]">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isCategoryModalOpen = false"></div>
                <div class="absolute bottom-0 left-0 right-0 bg-white h-[85dvh] rounded-t-[40px] shadow-2xl animate-modal-up flex flex-col overflow-hidden">
                    <div class="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
                        <h3 class="font-bold text-xl text-slate-800 ml-1">{{ categoryForm.id ? 'Edit' : 'Tambah' }} Kategori</h3>
                        <button @click="isCategoryModalOpen = false" class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition"><i class="ri-close-line text-2xl"></i></button>
                    </div>
                    <div class="p-8 space-y-8 flex-1 overflow-y-auto">
                        <div>
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Kategori</label>
                            <input v-model="categoryForm.name" type="text" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition text-sm font-bold text-slate-700" placeholder="Contoh: Makanan Berat">
                        </div>

                        <div v-if="isOwner">
                             <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Cabang Penanggung Jawab</label>
                             <div class="relative">
                                 <select v-model="categoryForm.branch_id" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition appearance-none text-slate-700 font-bold text-sm">
                                     <option :value="null">Semua Cabang (Global)</option>
                                     <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
                                 </select>
                                 <i class="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none"></i>
                             </div>
                             <p class="text-[10px] text-slate-400 mt-2 ml-2 italic font-medium">Pilih "Semua Cabang" jika kategori ini boleh muncul di mana saja.</p>
                        </div>
                    </div>
                    <div class="p-6 border-t border-slate-50 bg-white" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);">
                        <button @click="handleSaveCategory" class="w-full bg-blue-700 text-white py-3 rounded-xl font-black text-base shadow-lg shadow-blue-500/30 active:scale-[0.98] transition">
                            {{ isLoading ? 'Memproses...' : 'Simpan Kategori' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Product Modal (Full-screen) -->
        <Teleport to="body">
            <div v-if="isProductModalOpen" class="fixed inset-0 z-[70]">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isProductModalOpen = false"></div>
                <div class="absolute bottom-0 left-0 right-0 bg-white h-[95dvh] rounded-t-[40px] shadow-2xl animate-modal-up flex flex-col overflow-hidden">
                    <div class="p-4 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-20 rounded-t-3xl" style="padding-top: calc(env(safe-area-inset-top, 0px) + 1rem);">
                        <h3 class="font-bold text-xl text-slate-800 ml-1">{{ productForm.id ? 'Edit' : 'Tambah' }} Produk</h3>
                        <div class="flex gap-2">
                             <button @click="isProductModalOpen = false" class="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 active:scale-90 transition"><i class="ri-close-line text-2xl"></i></button>
                        </div>
                    </div>
                    
                    <div class="flex-1 overflow-y-auto p-8 space-y-10 pb-32">
                        <!-- Image Upload Section -->
                        <div class="relative group">
                            <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Foto Produk</label>
                            <div v-if="!imagePreview" class="w-full h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 transition-all duration-300 overflow-hidden relative shadow-inner">
                                <div class="text-center px-6">
                                    <div class="w-16 h-16 rounded-3xl bg-white shadow-sm flex items-center justify-center mb-4 mx-auto text-slate-300">
                                        <i class="ri-image-add-line text-4xl"></i>
                                    </div>
                                    <div class="flex gap-3 justify-center">
                                        <button type="button" @click="$refs.cameraInput.click()" class="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg active:scale-95 transition">
                                            <i class="ri-camera-line text-lg"></i> Kamera
                                        </button>
                                        <button type="button" @click="$refs.galleryInput.click()" class="flex items-center gap-2 bg-white text-slate-700 px-5 py-3 rounded-2xl text-xs font-bold shadow border border-slate-200 active:scale-95 transition">
                                            <i class="ri-image-line text-lg"></i> Galeri
                                        </button>
                                    </div>
                                    <p class="text-[9px] text-slate-400 mt-3 font-medium italic">Format: JPG, PNG (Max 1MB)</p>
                                </div>
                            </div>
                            <div v-else @click="$refs.galleryInput.click()" class="w-full h-40 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden relative shadow-inner cursor-pointer">
                                <img :src="imagePreview" class="w-full h-full object-cover">
                            </div>
                            <input ref="cameraInput" type="file" @change="onFileChange" accept="image/*" capture="environment" class="hidden">
                            <input ref="galleryInput" type="file" @change="onFileChange" accept="image/*" class="hidden">
                            <button v-if="imagePreview" @click.stop="imagePreview = null; imageFile = null; productForm.image = null" class="absolute top-14 right-4 w-10 h-10 bg-red-500 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition">
                                <i class="ri-delete-bin-line text-xl"></i>
                            </button>
                        </div>

                        <div class="space-y-6">
                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Informasi Dasar</label>
                                <input v-model="productForm.name" type="text" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition text-sm font-bold text-slate-800 placeholder:text-slate-300" placeholder="Nama Menu / Produk">
                            </div>
                            
                            <div class="grid grid-cols-2 gap-4">
                                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Harga Jual</label>
                                    <div class="flex items-center gap-1">
                                        <span class="text-sm font-black text-blue-700">Rp</span>
                                        <input v-model="productForm.price" type="number" class="w-full bg-transparent border-none outline-none text-base font-bold text-slate-800 p-0" placeholder="0">
                                    </div>
                                </div>
                                <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Harga Pokok</label>
                                    <div class="flex items-center gap-1">
                                        <span class="text-sm font-black text-slate-500">Rp</span>
                                        <input v-model="productForm.cost_price" type="number" class="w-full bg-transparent border-none outline-none text-base font-bold text-slate-800 p-0" placeholder="0">
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div class="relative group">
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kategori</label>
                                    <select v-model="productForm.category_id" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition appearance-none font-bold text-sm text-slate-700">
                                        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                                    </select>
                                    <i class="ri-arrow-down-s-line absolute right-4 top-[32px] text-slate-400 text-xl pointer-events-none"></i>
                                </div>
                                <div>
                                    <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">SKU / Kode</label>
                                    <input v-model="productForm.sku" type="text" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition font-bold text-sm text-slate-700" placeholder="Otomatis">
                                </div>
                            </div>

                            <div v-if="isOwner" class="relative group">
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Assign ke Cabang</label>
                                <select v-model="productForm.branch_id" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition appearance-none font-bold text-sm text-slate-700">
                                    <option :value="null">Semua Cabang (Global)</option>
                                    <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
                                </select>
                                <i class="ri-arrow-down-s-line absolute right-4 top-[32px] text-slate-400 text-xl pointer-events-none"></i>
                                <p class="text-[10px] text-slate-400 mt-1 ml-1 italic font-medium">Jika "Global", produk muncul di semua cabang bisnis.</p>
                             </div>

                            <div>
                                <label class="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Deskripsi Produk (Opsional)</label>
                                <textarea v-model="productForm.description" rows="3" class="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition font-bold text-sm text-slate-700 leading-relaxed" placeholder="Contoh: Terbuat dari beef wagyu pilihan..."></textarea>
                            </div>

                            <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm transition active:scale-[0.99]">
                                <div class="flex items-center gap-4">
                                    <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                        <i class="ri-line-chart-line text-lg"></i>
                                    </div>
                                    <div>
                                        <p class="text-sm font-black text-slate-800">Lacak Manajemen Produk</p>
                                        <p class="text-[10px] text-slate-500 font-medium">Auto-update stok saat jualan</p>
                                    </div>
                                </div>
                                <label class="relative inline-flex items-center cursor-pointer scale-90">
                                    <input type="checkbox" v-model="productForm.track_stock" class="sr-only peer">
                                    <div class="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all duration-300 peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div class="p-4 border-t border-slate-50 bg-white sticky bottom-0 z-20" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);">
                        <button @click="handleSaveProduct" class="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-sm shadow-xl shadow-slate-900/10 active:scale-[0.98] transition hover:bg-slate-800">
                            {{ isLoading ? 'Menyimpan Produk...' : (productForm.id ? 'Perbarui Data Produk' : 'Terbitkan Produk Baru') }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>

        <!-- Stock Modal (Quick Update) -->
        <Teleport to="body">
            <div v-if="isStockModalOpen" class="fixed inset-0 z-[80]">
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="isStockModalOpen = false"></div>
                <div class="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-modal-up flex flex-col p-6 space-y-6" style="padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 1.5rem);">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
                                <i class="ri-box-3-fill text-xl"></i>
                            </div>
                            <div>
                                <h3 class="font-black text-lg text-slate-800">{{ stockForm.product_name }}</h3>
                                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Penyesuaian Stok Cepat</p>
                            </div>
                        </div>
                        <button @click="isStockModalOpen = false" class="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400"><i class="ri-close-line text-xl"></i></button>
                    </div>

                    <div class="space-y-4">
                        <div class="bg-slate-50 p-1.5 rounded-xl flex">
                            <button @click="stockForm.type = 'set'" :class="['flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all', stockForm.type === 'set' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400']">Setel</button>
                            <button @click="stockForm.type = 'add'" :class="['flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all', stockForm.type === 'add' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400']">Tambah</button>
                            <button @click="stockForm.type = 'subtract'" :class="['flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all', stockForm.type === 'subtract' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400']">Kurang</button>
                        </div>

                        <div class="relative">
                            <input v-model="stockForm.stock" type="number" class="w-full px-4 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 outline-none transition text-center text-3xl font-black text-slate-800" placeholder="0">
                            <p class="text-[10px] font-black text-slate-400 text-center mt-2 uppercase tracking-widest">Masukkan Jumlah Unit</p>
                        </div>
 
                    </div>

                    <button @click="handleUpdateStock" class="w-full bg-blue-700 text-white py-3 rounded-xl font-black text-base shadow-xl shadow-blue-500/30 active:scale-95 transition-all mt-4">
                        Update Stok Sekarang
                    </button>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<style scoped>
.max-md {
    max-width: 500px;
}

.animate-modal-up {
    animation: modal-up 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modal-up {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
}

.bg-blue-600 { background-color: #2563eb; }
.text-blue-600 { color: #2563eb; }
.text-blue-700 { color: #1d4ed8; }
.bg-blue-50 { background-color: #eff6ff; }
.bg-blue-700 { background-color: #1d4ed8; }
.border-blue-500 { border-color: #3b82f6; }
.focus\:ring-blue-500:focus { --tw-ring-color: #3b82f6; }
.shadow-blue-500\/30 { --tw-shadow-color: rgba(37, 99, 235, 0.3); }
.shadow-blue-500\/20 { --tw-shadow-color: rgba(37, 99, 235, 0.2); }
</style>
