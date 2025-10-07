<template>
  <div id="app" class="app-container">
    <nav class="navbar">
      <RouterLink to="/" class="brand-link">
        <div class="logo-container">
          <span class="beer-icon"></span>
          <span class="brand-text">Monitor de Fermentación</span>
        </div>
      </RouterLink>

      <div class="nav-links">
        <button v-if="isAuthenticated" @click="Lotes" class="nav-btn">Lotes</button>

        <template v-if="!isAuthenticated">
          <RouterLink to="/login" class="nav-link nav-link--cta">
            Iniciar sesión
          </RouterLink>
        </template>

        <template v-else>
          
          <div class="user-badge">
            <span class="nav-user">{{ user?.name || 'Usuario' }}</span>
          </div>
          <button class="logout-btn" @click="handleLogout" title="Cerrar sesión">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </template>
      </div>
    </nav>

    <main class="main-content">
      <RouterView v-slot="{ Component }">
        <Transition name="page-fade" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>
  </div>
</template>

<script setup>
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { isAuthenticated, user, logout } = useAuth()

async function handleLogout() {
  await logout()
  router.push('/login')
}

const Lotes = () => router.push('/fermentacion')
</script>

<style>
/* Estilos Globales para mantener la coherencia con el login */
:root {
  --bg-dark: #0a0a0b;
  --bg-card: #161920;
  --accent-gold: #b07f4e;
  --accent-gold-hover: #8e653e;
  --text-primary: #e2e8f0;
  --text-muted: #94a3b8;
  --border-color: rgba(176, 127, 78, 0.2);
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background-color: #111318;  /* ← antes era #0a0a0b, un poco más claro */
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

/* Scrollbar personalizada */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--bg-dark); }
::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent-gold); }
</style>

<style scoped>
.app-container {
  min-h-screen: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 2rem;
  background: #0f1116;
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 50;
}

.brand-link {
  text-decoration: none;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.beer-icon { font-size: 1.5rem; }

.brand-text {
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent-gold);
  font-size: 1.1rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  align-items: center;
}

.nav-link, .nav-btn {
  text-decoration: none;
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: all 0.2s ease;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-link:hover, .nav-btn:hover {
  color: var(--accent-gold);
}

.nav-link--cta {
  background: var(--accent-gold);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 6px;
  box-shadow: 0 4px 15px rgba(176, 127, 78, 0.2);
}

.nav-link--cta:hover {
  background: var(--accent-gold-hover);
  color: white;
  transform: translateY(-1px);
}

.user-badge {
  background: rgba(176, 127, 78, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  border: 1px solid var(--border-color);
}

.nav-user {
  color: var(--accent-gold);
  font-size: 0.85rem;
  font-weight: 600;
}

.logout-btn {
  background: none;
  border: none;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background 0.2s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1300px;
  width: 100%;
  margin: 0 auto;
}

/* Transición de página */
.page-fade-enter-active,
.page-fade-leave-active {
  transition: all 0.3s ease;
}

.page-fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Ajuste para iconos SVG */
.h-5 { height: 1.25rem; }
.w-5 { width: 1.25rem; }
</style>
