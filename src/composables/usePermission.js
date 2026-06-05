import { ref } from 'vue'
import axios from 'axios'

const allPermissions = ref([])
const isLoading = ref(false)

export function usePermission() {
    const fetchAllPermissions = async () => {
        isLoading.value = true
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/permissions`)
            allPermissions.value = response.data
        } catch (error) {
            console.error('Failed to fetch permissions:', error)
        } finally {
            isLoading.value = false
        }
    }

    return {
        allPermissions,
        isLoading,
        fetchAllPermissions
    }
}
