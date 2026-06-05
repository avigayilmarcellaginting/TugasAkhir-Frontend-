import { ref } from 'vue'

const isVisible = ref(false)
const message = ref('')
const type = ref('info') // info, success, error
const timeout = ref(null)

export const useToast = () => {
    const showToast = (msg, toastType = 'info', duration = 3000) => {
        if (timeout.value) {
            clearTimeout(timeout.value)
            timeout.value = null
        }

        // Set state
        message.value = msg
        type.value = toastType
        isVisible.value = true

        // Start fresh timer
        timeout.value = setTimeout(() => {
            isVisible.value = false
            timeout.value = null
        }, duration)
    }

    const hideToast = () => {
        isVisible.value = false
        if (timeout.value) {
            clearTimeout(timeout.value)
            timeout.value = null
        }
    }

    return {
        isVisible,
        message,
        type,
        showToast,
        hideToast
    }
}
