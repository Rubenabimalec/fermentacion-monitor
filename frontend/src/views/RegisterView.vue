<template>
  <div class="register-page">
    <div class="bg-grid" aria-hidden="true"></div>
    <div class="bg-glow" aria-hidden="true"></div>

    <div class="register-card">
      <Transition name="slide" mode="out-in">
        <div v-if="!success" key="form">
          <div class="card-header">
            <span class="card-icon">🌿</span>
            <h1 class="card-title">Registro de Maestro</h1>
            <p class="card-subtitle">Configura tu acceso al sistema de monitoreo</p>
          </div>

          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <p class="progress-label">Configuración: {{ progressPercent }}%</p>
          </div>

          <Transition name="alert">
            <div v-if="errorMsg" class="alert-error" role="alert">
              <span>⚠</span> {{ errorMsg }}
            </div>
          </Transition>

          <form class="register-form" @submit.prevent="handleRegister" novalidate>
            <div class="field" :class="{ 'field--error': errors.name, 'field--ok': touched.name && !errors.name }">
              <label class="field-label">Nombre del Maestro</label>
              <div class="field-input-wrap">
                <span class="field-icon">👤</span>
                <input v-model.trim="form.name" type="text" class="field-input" placeholder="Ej. Ruben B." @blur="validateName" />
                <span v-if="touched.name && !errors.name" class="field-check">✓</span>
              </div>
              <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
            </div>

            <div class="field" :class="{ 'field--error': errors.email, 'field--ok': touched.email && !errors.email }">
              <label class="field-label">Correo electrónico</label>
              <div class="field-input-wrap">
                <span class="field-icon">✉</span>
                <input v-model.trim="form.email" type="email" class="field-input" placeholder="maestro@cerveceria.com" @blur="validateEmail" />
                <span v-if="touched.email && !errors.email" class="field-check">✓</span>
              </div>
              <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
            </div>

            <div class="field" :class="{ 'field--error': errors.password }">
              <label class="field-label">Contraseña de seguridad</label>
              <div class="field-input-wrap">
                <span class="field-icon">🔑</span>
                <input v-model="form.password" :type="showPassword ? 'text' : 'password'" class="field-input" @input="validatePassword" />
                <button type="button" class="field-toggle" @click="showPassword = !showPassword">
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
              <div v-if="form.password" class="strength-bar">
                <div v-for="n in 4" :key="n" class="strength-segment" :class="{ active: n <= passwordStrength.score }" :style="n <= passwordStrength.score ? { background: passwordStrength.color } : {}"></div>
                <span class="strength-label" :style="{ color: passwordStrength.color }">{{ passwordStrength.label }}</span>
              </div>
            </div>

            <button type="submit" class="btn-submit" :disabled="isLoading">
              <span v-if="!isLoading">Registrar Tanque →</span>
              <span v-else class="spinner"></span>
            </button>

            <p class="login-link">
              ¿Ya eres maestro? <RouterLink to="/login" class="link">Inicia sesión</RouterLink>
            </p>
          </form>
        </div>

        <div v-else key="success" class="success-state">
          <div class="success-icon">🍻</div>
          <h2 class="success-title">¡Acceso Concedido!</h2>
          <p class="success-msg">Bienvenido, maestro <strong>{{ form.name }}</strong>. El sistema está listo.</p>
          <p class="redirect-msg">Redirigiendo al panel en {{ countdown }}s...</p>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
// ... (Aquí mantén exactamente toda tu lógica de script setup que ya tenías)
// Solo asegúrate de que el script sea el mismo, funciona perfecto.
import { ref, reactive, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router  = useRouter()
const { signUp, login, emailExists } = useAuth()

const form = reactive({ name: '', email: '', password: '', confirm: '' })
const errors  = reactive({ name: '', email: '', password: '', confirm: '' })
const touched = reactive({ name: false, email: false, password: false, confirm: false })
const showPassword = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const success = ref(false)
const countdown = ref(3)

const progressPercent = computed(() => {
  let score = 0
  if (form.name.length >= 2) score += 34
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) score += 33
  if (form.password.length >= 6) score += 33
  return score
})

const passwordStrength = computed(() => {
  const p = form.password
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p) && /[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  const levels = [
    { score: 0, label: '', color: '#3a3530' },
    { score: 1, label: 'Débil', color: '#e07070' },
    { score: 2, label: 'Media', color: '#e8c46e' },
    { score: 3, label: 'Buena', color: '#b07f4e' },
    { score: 4, label: 'Excelente', color: '#6fcf97' },
  ]
  return levels[score]
})

function validateName() { touched.name = true; errors.name = form.name.length < 2 ? 'Nombre requerido' : ''; }
async function validateEmail() { 
  touched.email = true; 
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email)) { errors.email = 'Email inválido'; return; }
  errors.email = '';
}
function validatePassword() { errors.password = form.password.length < 6 ? 'Mínimo 6 caracteres' : ''; }

async function handleRegister() {
  validateName(); validateEmail(); validatePassword();
  if (errors.name || errors.email || errors.password) return;
  isLoading.value = true;
  try {
    const result = await signUp(form.email, form.password, { full_name: form.name });
    if (!result.ok) { errorMsg.value = result.error; return; }
    success.value = true;
    const timer = setInterval(() => { countdown.value--; if (countdown.value <= 0) { clearInterval(timer); router.push('/dashboard'); }}, 1000);
  } finally { isLoading.value = false; }
}
</script>

<style scoped>
.register-page {
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0b;
  position: relative;
  overflow: hidden;
  padding: 2rem;
}

.bg-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(176,127,78,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(176,127,78,0.05) 1px, transparent 1px);
  background-size: 40px 40px;
}

.bg-glow {
  position: absolute; width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(176,127,78,0.08) 0%, transparent 70%);
  top: 50%; left: 50%; transform: translate(-50%, -50%);
}

.register-card {
  position: relative; width: 100%; max-width: 420px;
  background: #0f1116;
  border: 1px solid rgba(176,127,78,0.2);
  border-radius: 20px; padding: 2.5rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
}

.card-header { text-align: center; margin-bottom: 2rem; }
.card-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
.card-title { 
  font-size: 1.75rem; font-weight: 800; color: #fff; margin: 0;
  background: linear-gradient(to right, #fff, #b07f4e);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.card-subtitle { color: #64748b; font-size: 0.9rem; margin-top: 0.5rem; }

.progress-container { margin-bottom: 2rem; }
.progress-bar { height: 4px; background: #1e293b; border-radius: 2px; overflow: hidden; }
.progress-fill { height: 100%; background: #b07f4e; transition: width 0.4s ease; }
.progress-label { font-size: 0.7rem; color: #b07f4e; text-align: right; margin-top: 0.5rem; text-transform: uppercase; font-weight: bold; }

.register-form { display: flex; flex-direction: column; gap: 1.25rem; }
.field { display: flex; flex-direction: column; gap: 0.5rem; }
.field-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
.field-input-wrap { position: relative; }
.field-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); opacity: 0.5; }
.field-input {
  width: 100%; background: #161920; border: 1px solid #2d3748; border-radius: 10px;
  padding: 0.75rem 1rem 0.75rem 2.5rem; color: #fff; outline: none; transition: all 0.2s;
}
.field-input:focus { border-color: #b07f4e; background: #1a1d25; }

.btn-submit {
  background: #b07f4e; color: #fff; border: none; padding: 1rem;
  border-radius: 10px; font-weight: 800; cursor: pointer;
  text-transform: uppercase; letter-spacing: 0.1em; transition: all 0.2s;
  margin-top: 1rem;
}
.btn-submit:hover { background: #8e653e; transform: translateY(-1px); }

.login-link { text-align: center; font-size: 0.85rem; color: #64748b; margin-top: 1rem; }
.link { color: #b07f4e; text-decoration: none; font-weight: bold; }

.strength-bar { display: flex; gap: 4px; margin-top: 8px; align-items: center; }
.strength-segment { flex: 1; height: 3px; background: #2d3748; border-radius: 2px; }
.strength-label { font-size: 0.7rem; margin-left: 8px; }

.alert-error { background: rgba(239,68,68,0.1); border: 1px solid #ef4444; color: #ef4444; padding: 0.75rem; border-radius: 8px; font-size: 0.8rem; margin-bottom: 1rem; }

/* Transiciones */
.slide-enter-active, .slide-leave-active { transition: all 0.3s ease; }
.slide-enter-from { opacity: 0; transform: translateX(20px); }
.slide-leave-to { opacity: 0; transform: translateX(-20px); }

.spinner {
  width: 20px; height: 20px; border: 3px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%; animation: spin 0.8s linear infinite;
  display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>