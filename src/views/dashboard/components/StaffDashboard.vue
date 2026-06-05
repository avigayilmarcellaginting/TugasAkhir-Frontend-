<script setup>
const props = defineProps({
    userName: String
})
</script>

<template>
    <div class="space-y-6">
        <!-- Greetings -->
        <div class="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[32px] text-white shadow-lg shadow-indigo-500/20">
            <h3 class="text-xl font-bold mb-1">Halo, {{ userName }}</h3>
            <p class="text-white/80 text-sm">Selamat bekerja! Jangan lupa cek tugas hari ini.</p>
        </div>

        <!-- Schedule / Tasks -->
        <div>
            <h4 class="font-bold text-slate-800 mb-3 px-1">Tugas Hari Ini</h4>
            <div class="space-y-3">
                <div class="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm">
                    <div class="w-10 h-10 bg-green-50 text-green-500 rounded-full flex items-center justify-center">
                        <i class="ri-check-line font-bold"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-slate-900 text-sm">Cek Stok Bahan Baku</p>
                        <p class="text-[10px] text-slate-400">Pukul 09:00 WIB</p>
                    </div>
                </div>
                <div class="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-4 shadow-sm opacity-60">
                    <div class="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center">
                        <i class="ri-time-line"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-bold text-slate-900 text-sm">Kebersihan Area Depan</p>
                        <p class="text-[10px] text-slate-400">Pukul 11:30 WIB</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Announcements -->
        <div class="bg-amber-50 border border-amber-100 p-5 rounded-[24px]">
            <div class="flex items-center gap-2 mb-2 text-amber-700">
                <i class="ri-notification-3-line font-bold"></i>
                <h4 class="font-bold text-sm tracking-tight">Pengumuman Penting</h4>
            </div>
            <p class="text-xs text-amber-600 leading-relaxed">
                Rapat bulanan staff akan diadakan hari Jumat jam 16:00. Mohon kehadiran tepat waktu semua tim.
            </p>
        </div>
    </div>
</template>
