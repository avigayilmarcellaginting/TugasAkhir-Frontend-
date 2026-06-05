import { ref } from 'vue'
import axios from 'axios'
import { useToast } from './useToast'

export function usePromotions() {
    const promotions = ref([])
    const isLoading = ref(false)
    const { showToast } = useToast()

    // Base URL configuration (adjust if needed, usually handled in axios config)
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

    const fetchPromotions = async (activeOnly = false, branchId = null) => {
        isLoading.value = true
        try {
            const params = { active_only: activeOnly }
            if (branchId) params.branch_id = branchId

            const response = await axios.get(`${API_URL}/promotions`, { params })
            promotions.value = response.data.data
        } catch (error) {
            console.error('Error fetching promotions:', error)
            showToast('Gagal memuat promo', 'error')
        } finally {
            isLoading.value = false
        }
    }

    const createPromotion = async (promotionData) => {
        isLoading.value = true
        try {
            const response = await axios.post(`${API_URL}/promotions`, promotionData)
            showToast('Promo berhasil dibuat', 'success')
            // Refresh list
            await fetchPromotions()
            return response.data.data
        } catch (error) {
            console.error('Error creating promotion:', error)
            let msg = 'Gagal membuat promo'
            if (error.response?.data?.message) msg += ': ' + error.response.data.message
            showToast(msg, 'error')
            throw error
        } finally {
            isLoading.value = false
        }
    }

     const togglePromotionStatus = async (promotion) => {
        isLoading.value = true
        try {
            await axios.put(`${API_URL}/promotions/${promotion.id}`, {
                is_active: !promotion.is_active
            })
            showToast('Status promo berhasil diubah', 'success')
            await fetchPromotions()
        } catch (error) {
             console.error('Error updating promotion:', error)
            showToast('Gagal mengubah status promo', 'error')
        } finally {
            isLoading.value = false
        }
    }

    const updatePromotion = async (id, promotionData) => {
        isLoading.value = true
        try {
            const response = await axios.put(`${API_URL}/promotions/${id}`, promotionData)
            showToast('Promo berhasil diperbarui', 'success')
            // Refresh list
            await fetchPromotions()
            return response.data.data
        } catch (error) {
            console.error('Error updating promotion:', error)
            let msg = 'Gagal memperbarui promo'
            if (error.response?.data?.message) msg += ': ' + error.response.data.message
            showToast(msg, 'error')
            throw error
        } finally {
            isLoading.value = false
        }
    }

    return {
        promotions,
        isLoading,
        fetchPromotions,
        createPromotion,
        updatePromotion,
        togglePromotionStatus
    }
}
