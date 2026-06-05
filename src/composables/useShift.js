import { ref } from 'vue'
import axios from 'axios'
import { useToast } from './useToast'

const currentShift = ref(null)
const isLoading = ref(false)

export const useShift = () => {
    const { showToast } = useToast()

    const fetchCurrentShift = async () => {
        isLoading.value = true
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/shifts/current`)
            console.log('API Shift Response:', response.data)
            if (response.data && response.data.id) {
                currentShift.value = response.data
            } else {
                currentShift.value = null
            }
        } catch (error) {
            console.error('Error fetching shift:', error)
        } finally {
            isLoading.value = false
        }
    }

    const startShift = async (startingCash) => {
        isLoading.value = true
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/shifts/start`, {
                starting_cash: startingCash
            })
            currentShift.value = response.data.shift
            showToast('Shift berhasil dimulai!', 'success')
            return true
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal memulai shift', 'error')
            return false
        } finally {
            isLoading.value = false
        }
    }

    const endShift = async (actualCash, notes = '') => {
        isLoading.value = true
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/shifts/end`, {
                actual_ending_cash: actualCash,
                notes: notes
            })
            currentShift.value = null
            showToast('Shift berhasil diakhiri!', 'success')
            return true
        } catch (error) {
            showToast(error.response?.data?.message || 'Gagal mengakhiri shift', 'error')
            return false
        } finally {
            isLoading.value = false
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount)
    }

    return {
        currentShift,
        isLoading,
        fetchCurrentShift,
        startShift,
        endShift,
        formatCurrency
    }
}
