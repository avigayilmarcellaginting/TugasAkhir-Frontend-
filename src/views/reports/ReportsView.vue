<script setup>

</script>

<template>
  <div id="view-reports" class="view-section pt-6 px-4 pb-24 slide-up overflow-y-auto no-scrollbar">
       <header class="flex justify-between items-center mb-6">
           <div>
               <h2 class="text-2xl font-bold text-slate-900">Laporan</h2>
               <p class="text-sm text-slate-500">Analisa performa bisnis</p>
           </div>
           <div class="flex bg-slate-100 p-1 rounded-lg">
               <button class="px-3 py-1 bg-white text-xs font-bold shadow-sm rounded-md text-slate-800">Harian</button>
               <button class="px-3 py-1 text-xs font-medium text-slate-500">Bulanan</button>
           </div>
      </header>

      <!-- Charts Placeholder -->
      <div class="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <div class="flex justify-between items-center mb-4">
              <h3 class="font-bold text-slate-900">Tren Penjualan</h3>
              <p class="text-xs text-green-500 font-bold">+12% <span class="text-slate-400 font-normal">vs kemarin</span></p>
          </div>
          <!-- Simple CSS Bar Chart -->
          <div class="flex items-end justify-between gap-2 h-32 pt-4 border-t border-slate-50">
              <div class="w-full bg-brand-100 rounded-t-lg relative group h-[40%]">
                  <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition">600k</div>
                  <p class="text-[10px] text-slate-400 text-center absolute -bottom-5 left-0 right-0">Sen</p>
              </div>
              <div class="w-full bg-brand-100 rounded-t-lg relative group h-[60%]">
                   <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition">850k</div>
                   <p class="text-[10px] text-slate-400 text-center absolute -bottom-5 left-0 right-0">Sel</p>
              </div>
              <div class="w-full bg-brand-100 rounded-t-lg relative group h-[50%]">
                   <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition">700k</div>
                   <p class="text-[10px] text-slate-400 text-center absolute -bottom-5 left-0 right-0">Rab</p>
              </div>
              <div class="w-full bg-brand-100 rounded-t-lg relative group h-[80%]">
                   <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition">1.2jt</div>
                   <p class="text-[10px] text-slate-400 text-center absolute -bottom-5 left-0 right-0">Kam</p>
              </div>
              <div class="w-full bg-brand-500 rounded-t-lg relative group h-[95%]">
                   <div class="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition">1.45jt</div>
                   <p class="text-[10px] text-slate-400 text-center absolute -bottom-5 left-0 right-0 font-bold text-brand-600">Jum</p>
              </div>
          </div>
      </div>

      <!-- Top Products -->
      <h3 class="font-bold text-slate-800 mb-3">Produk Terlaris</h3>
      <div class="space-y-3 pb-24">
          <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3 relative overflow-hidden">
              <span class="absolute left-0 top-0 bottom-0 w-1 bg-yellow-500"></span>
              <div class="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold">1</div>
              <div class="flex-1">
                  <h4 class="font-bold text-slate-900 text-sm">Classic Beef Burger</h4>
                  <p class="text-xs text-slate-500">42 Terjual</p>
              </div>
              <p class="font-bold text-brand-600 text-sm">Rp 1.890.000</p>
          </div>
           <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">2</div>
              <div class="flex-1">
                  <h4 class="font-bold text-slate-900 text-sm">Iced Lemon Tea</h4>
                  <p class="text-xs text-slate-500">38 Terjual</p>
              </div>
              <p class="font-bold text-brand-600 text-sm">Rp 684.000</p>
          </div>
           <div class="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
              <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">3</div>
              <div class="flex-1">
                  <h4 class="font-bold text-slate-900 text-sm">Healthy Green Salad</h4>
                  <p class="text-xs text-slate-500">25 Terjual</p>
              </div>
              <p class="font-bold text-brand-600 text-sm">Rp 875.000</p>
          </div>
      </div>


  </div>
</template>

<style scoped>
#view-reports {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
#view-reports::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
</style>
