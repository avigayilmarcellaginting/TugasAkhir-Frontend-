import { ref, computed } from 'vue'
import axios from 'axios'
import { useAuth } from './useAuth'

const branches = ref([])
const isLoading = ref(false)
const selectedBranchId = ref(localStorage.getItem('selectedBranchId') ? parseInt(localStorage.getItem('selectedBranchId')) : null)

export function useBranch() {
    const { user, isOwner } = useAuth()

    const fetchBranches = async () => {
        isLoading.value = true
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/branches`)
            branches.value = response.data
            
            // Auto-select user's branch if not owner, or if no selection yet
            if (!isOwner.value && user.value?.branch_id) {
                setSelectedBranch(user.value.branch_id)
            } else if (!selectedBranchId.value && branches.value.length > 0) {
                // Optional: default to first branch for owner if none selected? 
                // Or keep it null to mean "All"? Requirement says "switch branches".
                // Let's default to first branch for now to have a context.
                setSelectedBranch(branches.value[0].id)
            }
        } catch (error) {
            console.error('Error fetching branches:', error)
        } finally {
            isLoading.value = false
        }
    }

    const createBranch = async (branchData) => {
        isLoading.value = true
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/branches`, branchData)
            branches.value.push(response.data.branch)
            return response.data
        } catch (error) {
            console.error('Error creating branch:', error)
            throw error
        } finally {
            isLoading.value = false
        }
    }

    const setSelectedBranch = (id) => {
        selectedBranchId.value = id
        localStorage.setItem('selectedBranchId', id)
    }

    const selectedBranch = computed(() => {
        return branches.value.find(b => b.id === selectedBranchId.value)
    })

    return {
        branches,
        isLoading,
        selectedBranchId,
        selectedBranch,
        fetchBranches,
        createBranch,
        setSelectedBranch
    }
}
