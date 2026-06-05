import { ref, computed } from 'vue'
import axios from 'axios'

const user = ref(null)
const isInitialized = ref(false)

export function useAuth() {
    const isAuthenticated = computed(() => !!user.value)
    const isOwner = computed(() => user.value?.roles?.some(r => r.slug === 'owner' || r.slug === 'admin'))
    const isCashier = computed(() => user.value?.roles?.some(r => r.slug === 'cashier' || r.slug === 'staff'))
    const permissions = computed(() => user.value?.permission_list || [])

    const can = (permissionSlug) => {
        if (!Array.isArray(permissions.value)) return false
        return permissions.value.includes(permissionSlug)
    }

    const checkAuth = async () => {

        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/auth/me`)
            console.log('Current User Permissions:', response.data.permission_list)
            user.value = response.data
        } catch (error) {
            console.warn('Auth check failed:', error.response?.status)
            user.value = null
        } finally {
            isInitialized.value = true
        }
    }

    const logout = async () => {
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/auth/logout`)
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            user.value = null
            isInitialized.value = true
            window.location.href = '/auth'
        }
    }

    return {
        user,
        isAuthenticated,
        isOwner,
        isCashier,
        permissions,
        can,
        isInitialized,
        checkAuth,
        logout
    }
}
