import { ref } from 'vue'
import axios from 'axios'

const employees = ref([])
const isLoading = ref(false)

export function useEmployee() {
    const fetchEmployees = async () => {
        isLoading.value = true
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`)
            employees.value = response.data
        } catch (error) {
            console.error('Error fetching employees:', error)
        } finally {
            isLoading.value = false
        }
    }

    const createEmployee = async (employeeData) => {
        isLoading.value = true
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/users`, employeeData)
            employees.value.push(response.data.user)
            return response.data
        } catch (error) {
            console.error('Error creating employee:', error)
            throw error
        } finally {
            isLoading.value = false
        }
    }

    const updateEmployee = async (id, employeeData) => {
        isLoading.value = true
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_URL}/users/${id}`, employeeData)
            const index = employees.value.findIndex(e => e.id === id)
            if (index !== -1) {
                employees.value[index] = response.data.user
            }
            return response.data
        } catch (error) {
            console.error('Error updating employee:', error)
            throw error
        } finally {
            isLoading.value = false
        }
    }

    return {
        employees,
        isLoading,
        fetchEmployees,
        createEmployee,
        updateEmployee
    }
}
