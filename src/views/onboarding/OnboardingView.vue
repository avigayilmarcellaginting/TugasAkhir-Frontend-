<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentSlide = ref(0) // 0 to 2

const slides = [
  {
    title: 'Pantau Transaksi Mudah',
    description: 'Kelola semua penjualan dan stok dalam satu aplikasi dengan cepat dan akurat.',
    icon: 'ri-shopping-cart-line',
    color: 'bg-brand-500',
    iconColor: 'text-brand-500'
  },
  {
    title: 'Laporan Real-Time',
    description: 'Dapatkan wawasan bisnis secara instan kapan saja dan di mana saja.',
    icon: 'ri-bar-chart-box-line',
    color: 'bg-indigo-500',
    iconColor: 'text-indigo-500'
  },
  {
    title: 'Multi Cabang',
    description: 'Pantau banyak cabang dari satu akun dengan mudah dan aman.',
    icon: 'ri-store-2-line',
    color: 'bg-emerald-500',
    iconColor: 'text-emerald-500'
  }
]

const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true')
    router.push({ name: 'auth' })
}

const handleNext = () => {
    if (currentSlide.value < slides.length - 1) {
        currentSlide.value++
    } else {
        handleSkip()
    }
}
</script>

<template>
  <div id="view-onboarding" class="view-section absolute inset-0 z-50 bg-white">
    <div class="h-full flex flex-col justify-between px-6 py-8 pb-12 sm:pb-8" style="padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px)); padding-top: calc(2rem + env(safe-area-inset-top, 0px));">
      
      <!-- Skip Button -->
      <div class="flex justify-end pt-4">
        <button v-if="currentSlide < slides.length - 1" @click="handleSkip" class="text-slate-500 font-medium text-sm hover:text-slate-700 transition px-4 py-2">
            Lewati
        </button>
        <button v-else @click="handleSkip" class="text-transparent font-medium text-sm px-4 py-2 cursor-default" disabled>
            Selesai
        </button>
      </div>

      <!-- Slide Content -->
      <div class="flex-1 flex flex-col justify-center items-center text-center mt-[-10vh]">
        <div class="relative w-72 h-72 mb-8 flex items-center justify-center">
             <!-- Decorative background blobs -->
            <div class="absolute inset-0 bg-gradient-to-tr from-brand-100 to-indigo-50 rounded-full blur-3xl opacity-60"></div>
            
            <div class="relative z-10 w-32 h-32 rounded-3xl bg-white shadow-xl flex items-center justify-center transform transition-all duration-500 ease-out" 
                 :class="[currentSlide === 0 ? 'scale-100 rotate-0' : currentSlide === 1 ? 'scale-110 -rotate-6' : 'scale-100 rotate-6']">
                <i :class="[slides[currentSlide].icon, slides[currentSlide].iconColor]" class="text-6xl drop-shadow-sm transition-colors duration-500"></i>
            </div>
        </div>

        <div class="min-h-[140px]">
            <h2 class="text-3xl font-bold tracking-tight text-slate-900 mb-4 transition-all duration-300">
                {{ slides[currentSlide].title }}
            </h2>
            <p class="text-base text-slate-500 leading-relaxed max-w-xs mx-auto transition-all duration-300">
                {{ slides[currentSlide].description }}
            </p>
        </div>
      </div>

      <!-- Controls -->
      <div class="w-full sm:mx-auto sm:max-w-md pt-8">
        <!-- Pagination Dots -->
        <div class="flex justify-center gap-2.5 mb-8">
            <button 
                v-for="(slide, index) in slides" 
                :key="index"
                @click="currentSlide = index"
                class="h-2.5 rounded-full transition-all duration-300 ease-out"
                :class="currentSlide === index ? 'w-8 bg-brand-600' : 'w-2.5 bg-slate-200 hover:bg-slate-300'"
                aria-label="Go to slide"
            ></button>
        </div>

        <button @click="handleNext" class="flex w-full justify-center items-center rounded-xl bg-brand-600 px-3 py-4 text-base font-semibold leading-6 text-white shadow-sm shadow-brand-500/30 hover:bg-brand-500 active:scale-[0.98] transition">
            {{ currentSlide === slides.length - 1 ? 'Mulai Sekarang' : 'Selanjutnya' }}
        </button>
      </div>

    </div>
  </div>
</template>
