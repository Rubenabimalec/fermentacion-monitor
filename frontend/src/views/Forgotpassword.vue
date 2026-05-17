<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0a0a0b] px-4">
    <div class="w-full max-w-md p-8 rounded-2xl bg-[#0f1116] border border-blue-900/30 shadow-2xl shadow-blue-900/10">
      
      <div class="flex justify-center mb-6">
        <div class="p-3 rounded-full border border-yellow-600/30 bg-yellow-600/5">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-[#b07f4e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
      </div>

      <h1 class="text-2xl font-bold text-white text-center tracking-tight uppercase mb-2">
        Restablecer contraseña
      </h1>
      <p class="text-gray-400 text-center text-sm mb-8">
        Introduce tu email para recibir un enlace de restablecimiento.
      </p>
      
      <form @submit.prevent="handleReset" class="space-y-6">
        <div class="relative">
          <label class="text-xs uppercase tracking-widest text-gray-500 ml-1 mb-2 block">Correo electrónico</label>
          <input 
            type="email" 
            v-model="email" 
            placeholder="ejemplo@correo.com" 
            required 
            class="w-full bg-[#161920] border border-gray-800 text-gray-200 px-4 py-3 rounded-lg focus:outline-none focus:border-[#b07f4e] focus:ring-1 focus:ring-[#b07f4e] transition-all duration-300 placeholder:text-gray-600"
          />
        </div>

        <button 
          type="submit" 
          class="w-full py-3 px-4 bg-[#b07f4e] hover:bg-[#8e653e] text-white font-bold rounded-lg uppercase tracking-widest text-sm shadow-lg shadow-yellow-900/20 transition-all active:scale-[0.98]"
        >
          Enviar enlace
        </button>
      </form>

      <Transition name="fade">
        <div v-if="message" 
          :class="[
            'mt-6 p-3 rounded-lg text-sm text-center border',
            success ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
          ]"
        >
          {{ message }}
        </div>
      </Transition>

      <div class="mt-8 text-center">
        <router-link to="/login" class="text-xs text-[#b07f4e] hover:text-yellow-500 uppercase tracking-tighter transition-colors">
          &larr; Volver al inicio de sesión
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animación para el mensaje de éxito/error */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Efecto sutil de resplandor en el contenedor (opcional) */
.shadow-2xl {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 15px rgba(59, 130, 246, 0.05);
}
</style>