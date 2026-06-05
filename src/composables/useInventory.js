import { ref } from 'vue'
import axios from 'axios'
import { useToast } from './useToast'
import { useBranch } from './useBranch'

export function useInventory() {
    const categories = ref([])
    const products = ref([])
    const isLoading = ref(false)
    const { showToast } = useToast()
    const { selectedBranchId } = useBranch()

    const fetchCategories = async (branchId = null) => {
        isLoading.value = true
        try {
            let targetBranchId = branchId
            if (branchId === 'all') targetBranchId = null
            else if (!branchId) targetBranchId = selectedBranchId.value

            const params = targetBranchId ? { branch_id: targetBranchId } : {}
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/categories`, { params })
            categories.value = response.data
        } catch (error) {
            console.error('Error fetching categories:', error)
        } finally {
            isLoading.value = false
        }
    }

    const saveCategory = async (categoryData) => {
        isLoading.value = true
        try {
            if (categoryData.id) {
                await axios.put(`${import.meta.env.VITE_API_URL}/inventory/categories/${categoryData.id}`, categoryData)
                showToast('Kategori berhasil diperbarui', 'success')
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/inventory/categories`, categoryData)
                showToast('Kategori berhasil ditambahkan', 'success')
            }
            return true
        } catch (error) {
            console.error('Error saving category:', error)
            showToast('Gagal menyimpan kategori', 'error')
            return false
        } finally {
            isLoading.value = false
        }
    }

    const deleteCategory = async (id) => {
        if (!confirm('Hapus kategori ini? Produk di dalamnya akan kehilangan kategori.')) return false
        isLoading.value = true
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/inventory/categories/${id}`)
            showToast('Kategori berhasil dihapus', 'success')
            return true
        } catch (error) {
            showToast('Gagal menghapus kategori', 'error')
            return false
        } finally {
            isLoading.value = false
        }
    }

    const fetchProducts = async (branchId = null) => {
        isLoading.value = true
        try {
            // Use provided branchId OR selectedBranchId (global state)
            let targetBranchId = branchId
            if (branchId === 'all') targetBranchId = null
            else if (!branchId) targetBranchId = selectedBranchId.value

            const params = targetBranchId ? { branch_id: targetBranchId } : {}
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/inventory/products`, { params })
            products.value = response.data
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            isLoading.value = false
        }
    }

    const saveProduct = async (productData) => {
        isLoading.value = true
        try {
            let data = productData
            const hasFile = Object.values(productData).some(val => val instanceof File)
            
            if (hasFile) {
                data = new FormData()
                for (const key in productData) {
                    if (key === 'image' && productData[key] === null) {
                        data.append(key, '') // Send empty string to signal deletion
                    } else if (productData[key] !== null && productData[key] !== undefined) {
                        if (typeof productData[key] === 'boolean') {
                            data.append(key, productData[key] ? '1' : '0')
                        } else {
                            data.append(key, productData[key])
                        }
                    }
                }
                if (productData.id) {
                    data.append('_method', 'PUT')
                }
            }

            if (productData.id) {
                const url = `${import.meta.env.VITE_API_URL}/inventory/products/${productData.id}`
                if (hasFile) {
                    await axios.post(url, data, { headers: { 'Content-Type': 'multipart/form-data' } })
                } else {
                    await axios.put(url, data)
                }
                showToast('Produk berhasil diperbarui', 'success')
            } else {
                const url = `${import.meta.env.VITE_API_URL}/inventory/products`
                await axios.post(url, data, { 
                    headers: hasFile ? { 'Content-Type': 'multipart/form-data' } : {} 
                })
                showToast('Produk berhasil ditambahkan', 'success')
            }
            return true
        } catch (error) {
            console.error('Error saving product:', error)
            let msg = 'Gagal menyimpan produk'
            if (error.response?.data?.errors) {
                const firstField = Object.keys(error.response.data.errors)[0]
                msg = error.response.data.errors[firstField][0]
            } else if (error.response?.data?.message) {
                msg = error.response.data.message
            }
            showToast(msg, 'error')
            return false
        } finally {
            isLoading.value = false
        }
    }

    const updateStock = async (productId, stockData) => {
        isLoading.value = true
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/inventory/products/${productId}/stock`, stockData)
            showToast('Stok berhasil diperbarui')
            return response.data
        } catch (error) {
            let msg = 'Gagal memperbarui stok'
            if (error.response?.data?.message) msg = error.response.data.message
            showToast(msg, 'error')
            return null
        } finally {
            isLoading.value = false
        }
    }

    const deleteProduct = async (id) => {
        isLoading.value = true
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/inventory/products/${id}`)
            showToast('Produk berhasil dihapus', 'success')
            return true
        } catch (error) {
            console.error('Error deleting product:', error)
            showToast('Gagal menghapus produk', 'error')
            return false
        } finally {
            isLoading.value = false
        }
    }

    return {
        categories,
        products,
        isLoading,
        fetchCategories,
        saveCategory,
        deleteCategory,
        fetchProducts,
        saveProduct,
        updateStock,
        deleteProduct
    }
}
