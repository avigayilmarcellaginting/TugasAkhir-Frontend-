import { ref, computed } from 'vue'
import axios from 'axios'

const cart = ref({})

export function useCart() {
  
  const addToCart = (product) => {
    if (cart.value[product.id]) {
        cart.value[product.id].quantity++
    } else {
        cart.value[product.id] = {
            ...product,
            quantity: 1
        }
    }
  }

  const removeFromCart = (productId) => {
    if (cart.value[productId]) {
        cart.value[productId].quantity--
        if (cart.value[productId].quantity === 0) {
            delete cart.value[productId]
        }
    }
  }

  const clearCart = () => {
    cart.value = {}
  }

  const checkout = async (payload) => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/transactions`, payload)
        clearCart()
        return response.data
    } catch (error) {
        throw error
    }
  }

  const cartTotal = computed(() => {
    return Object.values(cart.value).reduce((total, item) => total + (item.price * item.quantity), 0)
  })

  const cartCount = computed(() => {
    return Object.values(cart.value).reduce((count, item) => count + item.quantity, 0)
  })

  const cartItems = computed(() => {
    return Object.values(cart.value)
  })

  const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number)
  }

  return {
    cart,
    addToCart,
    removeFromCart,
    clearCart,
    checkout,
    cartTotal,
    cartCount,
    cartItems,
    formatRupiah
  }
}
