<template>
  <div class="space-y-16 py-8">
    <section class="relative overflow-hidden rounded-3xl bg-[#0f1116] border border-yellow-900/20 shadow-2xl">
      <div class="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-transparent to-transparent z-10"></div>
      
      <div class="absolute right-0 top-0 w-1/2 h-full opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
        <img 
          src="https://images.unsplash.com/photo-1555658636-6e4a36218be7?auto=format&fit=crop&q=80&w=1000" 
          alt="Brewery" 
          class="object-cover h-full w-full"
        />
      </div>

      <div class="relative z-20 p-8 md:p-16 max-w-2xl">
        <div class="flex items-center gap-2 mb-4">
          <span class="h-1 w-8 bg-[#b07f4e]"></span>
          <span class="text-[#b07f4e] text-xs font-bold uppercase tracking-[0.3em]">Cervecería Digital</span>
        </div>
        <h1 class="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
          EL ARTE DE <br />
          <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#b07f4e] to-[#d4af37]">
            LA FERMENTACIÓN
          </span>
        </h1>
        <p class="text-gray-400 text-lg mb-10 leading-relaxed">
          Monitorea cada burbuja, grado y cambio químico en tiempo real. 
          Lleva tu producción artesanal al siguiente nivel con precisión industrial.
        </p>
        
        <div class="flex flex-wrap gap-4">
          <router-link 
            to="/fermentacion" 
            class="px-8 py-4 bg-[#b07f4e] hover:bg-[#8e653e] text-white font-bold rounded-xl transition-all shadow-lg shadow-yellow-900/20 uppercase text-sm tracking-widest"
          >
            Ver mis Lotes
          </router-link>
          <router-link 
            to="/dashboard" 
            class="px-8 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold rounded-xl transition-all uppercase text-sm tracking-widest"
          >
            Dashboard
          </router-link>
        </div>
      </div>
    </section>

    <section class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="stat in quickStats" :key="stat.label" 
        class="bg-[#161920] p-6 rounded-2xl border border-gray-800 hover:border-[#b07f4e]/50 transition-colors group">
        <div class="text-[#b07f4e] mb-4 group-hover:scale-110 transition-transform duration-300" v-html="stat.icon"></div>
        <h3 class="text-gray-500 text-xs uppercase tracking-widest mb-1">{{ stat.label }}</h3>
        <p class="text-2xl font-mono text-white">{{ stat.value }}<span class="text-sm text-gray-500 ml-1">{{ stat.unit }}</span></p>
      </div>
    </section>

    <section class="grid md:grid-cols-2 gap-12 items-center px-4">
      <div class="order-2 md:order-1">
        <h2 class="text-3xl font-bold text-white mb-6">Control Total sobre el Mosto</h2>
        <ul class="space-y-6">
          <li class="flex gap-4">
            <div class="flex-none h-6 w-6 rounded-full bg-[#b07f4e]/20 flex items-center justify-center text-[#b07f4e] text-xs font-bold">1</div>
            <div>
              <h4 class="text-white font-semibold">Precisión Térmica</h4>
              <p class="text-gray-400 text-sm">Alertas instantáneas si la temperatura se desvía del rango óptimo para la levadura.</p>
            </div>
          </li>
          <li class="flex gap-4">
            <div class="flex-none h-6 w-6 rounded-full bg-[#b07f4e]/20 flex items-center justify-center text-[#b07f4e] text-xs font-bold">2</div>
            <div>
              <h4 class="text-white font-semibold">Actividad de CO₂</h4>
              <p class="text-gray-400 text-sm">Visualización gráfica de la intensidad de fermentación mediante el conteo de burbujas.</p>
            </div>
          </li>
          <li class="flex gap-4">
            <div class="flex-none h-6 w-6 rounded-full bg-[#b07f4e]/20 flex items-center justify-center text-[#b07f4e] text-xs font-bold">3</div>
            <div>
              <h4 class="text-white font-semibold">Historial de Lotes</h4>
              <p class="text-gray-400 text-sm">Compara datos de fermentaciones pasadas para replicar tus mejores recetas.</p>
            </div>
          </li>
        </ul>
      </div>
      <div class="order-1 md:order-2 bg-gradient-to-br from-[#b07f4e]/10 to-transparent p-1 rounded-3xl">
        <div class="bg-[#0a0a0b] p-4 rounded-[calc(1.5rem-1px)] overflow-hidden border border-gray-800">
           <img 
            src="https://images.unsplash.com/photo-1584225064785-c72a87949f8a?auto=format&fit=crop&q=80&w=800" 
            alt="Sensors" 
            class="rounded-xl opacity-80 hover:scale-105 transition-transform duration-500"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
const quickStats = [
  { 
    label: 'Temperatura Promedio', 
    value: '19.5', 
    unit: '°C',
    icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>'
  },
  { 
    label: 'Lotes Activos', 
    value: '03', 
    unit: 'Tanques',
    icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>'
  },
  { 
    label: 'Eficiencia Global', 
    value: '94.2', 
    unit: '%',
    icon: '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>'
  }
]
</script>

<style scoped>
/* Un poco de brillo para el texto dorado */
.text-transparent {
  text-shadow: 0 0 30px rgba(176, 127, 78, 0.3);
}
</style>