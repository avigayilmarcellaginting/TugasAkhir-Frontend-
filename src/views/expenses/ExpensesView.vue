<script setup>
import ExpenseList from '../../components/finance/ExpenseList.vue'
</script>

<template>
  <div id="view-expenses" class="view-section pt-6 px-4 pb-24 slide-up">
      <header class="flex justify-between items-center mb-6">
           <div>
               <h2 class="text-2xl font-bold text-slate-900">Pengeluaran</h2>
               <p class="text-sm text-slate-500">Catat biaya operasional</p>
           </div>
           <div class="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center">
              <i class="ri-money-dollar-circle-line text-xl"></i>
          </div>
      </header>

      <ExpenseList />
  </div>
</template>

<style scoped>
.slide-up {
  animation: slide-up 0.4s ease-out forwards;
}

@keyframes slide-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
