import { ref } from 'vue'

const isVisible = ref(false)
const message = ref('')
const onConfirm = ref(null)
const onCancel = ref(null)

export const useConfirm = () => {
    const ask = (msg) => {
        return new Promise((resolve) => {
            message.value = msg
            isVisible.value = true
            
            onConfirm.value = () => {
                isVisible.value = false
                resolve(true)
            }
            
            onCancel.value = () => {
                isVisible.value = false
                resolve(false)
            }
        })
    }

    return {
        isVisible,
        message,
        ask,
        onConfirm,
        onCancel
    }
}
