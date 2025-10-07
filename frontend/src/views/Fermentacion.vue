<template>
  <div class="contenedor">
    <div class="encabezado">
      <h1>Lotes de fermentación</h1>
      <button class="btn-primary" @click="mostrarFormulario = true">+ Nuevo lote</button>
    </div>

    <!-- Formulario -->
    <div v-if="mostrarFormulario" class="card form-card">
      <h2>Nuevo lote</h2>

      <p class="seccion-label">Información general</p>
      <input v-model="form.nombre"      placeholder="Nombre del lote *" />
      <input v-model="form.estilo"      placeholder="Estilo (ej. Ale, Lager, IPA)" />
      <textarea v-model="form.descripcion" placeholder="Descripción (opcional)" rows="2" />

      <p class="seccion-label">Rango de temperatura (°C)</p>
      <div class="fila-inputs">
        <div class="input-grupo">
          <label>Mínima</label>
          <input v-model.number="form.temp_min" type="number" step="0.5" placeholder="ej. 16" />
        </div>
        <div class="input-grupo">
          <label>Máxima</label>
          <input v-model.number="form.temp_max" type="number" step="0.5" placeholder="ej. 24" />
        </div>
      </div>

      <p class="seccion-label">Rango de pH</p>
      <div class="fila-inputs">
        <div class="input-grupo">
          <label>Mínimo</label>
          <input v-model.number="form.ph_min" type="number" step="0.1" placeholder="ej. 3.8" />
        </div>
        <div class="input-grupo">
          <label>Máximo</label>
          <input v-model.number="form.ph_max" type="number" step="0.1" placeholder="ej. 5.5" />
        </div>
      </div>

      <div class="form-acciones">
        <button class="btn-primary" @click="crearLote">Crear lote</button>
        <button class="btn-secondary" @click="cancelar">Cancelar</button>
      </div>
    </div>

    <!-- Estados -->
    <div v-if="cargando" class="mensaje-centro">Cargando lotes...</div>
    <div v-else-if="!lotes.length" class="mensaje-centro">No hay lotes registrados aún.</div>

    <!-- Lista -->
    <div v-else class="grilla-lotes">
      <div
        v-for="lote in lotes"
        :key="lote.id"
        class="card lote-card"
        @click="irDetalle(lote.id)"
      >
        <div class="lote-header">
          <span class="lote-nombre">{{ lote.nombre }}</span>
          <span :class="['badge', lote.activa ? 'badge-activo' : 'badge-inactivo']">
            {{ lote.activa ? 'Activo' : 'Finalizado' }}
          </span>
        </div>

        <p class="lote-estilo">{{ lote.estilo || 'Sin estilo definido' }}</p>

        <div class="lote-rangos" v-if="lote.config">
          <span class="rango">🌡 {{ lote.config.temp_min }}–{{ lote.config.temp_max }}°C</span>
          <span class="rango">🧪 pH {{ lote.config.ph_min }}–{{ lote.config.ph_max }}</span>
        </div>

        <p class="lote-fecha">Iniciado: {{ formatearFecha(lote.created_at) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const lotes           = ref([])
const cargando        = ref(true)
const mostrarFormulario = ref(false)

const formVacio = () => ({
  nombre: '', estilo: '', descripcion: '',
  temp_min: null, temp_max: null,
  ph_min: null,   ph_max: null
})

const form = ref(formVacio())

async function cargarLotes() {
  cargando.value = true
  try {
    const res   = await fetch('/api/fermentaciones')
    const lista = await res.json()
    // Cargar config de alertas para mostrar rangos en las tarjetas
    const lotesConConfig = await Promise.all(
      lista.map(async (lote) => {
        const r = await fetch(`/api/alertas/config/${lote.id}`)
        lote.config = r.ok ? await r.json() : null
        return lote
      })
    )
    lotes.value = lotesConConfig
  } catch (error) {
    console.error('Error cargando lotes:', error)
  } finally {
    cargando.value = false
  }
}

async function crearLote() {
  if (!form.value.nombre) return alert('El nombre es requerido')
  if (form.value.temp_min !== null && form.value.temp_max !== null &&
      form.value.temp_min >= form.value.temp_max)
    return alert('La temperatura mínima debe ser menor a la máxima')
  if (form.value.ph_min !== null && form.value.ph_max !== null &&
      form.value.ph_min >= form.value.ph_max)
    return alert('El pH mínimo debe ser menor al máximo')
  try {
    await fetch('/api/fermentaciones', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(form.value)
    })
    cancelar()
    await cargarLotes()
  } catch (error) {
    console.error('Error creando lote:', error)
  }
}

function cancelar() {
  form.value = formVacio()
  mostrarFormulario.value = false
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

function irDetalle(id) {
  router.push(`/lote/${id}`)
}

onMounted(cargarLotes)
</script>

<style scoped>
.contenedor {
  max-width: 1100px;
  margin: auto;
  padding: 1.5rem 1rem;
}

h1 {
  font-size: 1.4rem;
  font-weight: 600;
  color: #e2e8f0;  /* ← texto claro para fondo oscuro */
}
.encabezado {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

h1 { font-size: 1.4rem; font-weight: 600; color: #1a1a1a; }
h2 { font-size: 1.1rem; font-weight: 600; color: #1a1a1a; margin-bottom: .75rem; }

.card {
  background: #1e2130;       /* ← oscuro pero visible */
  border: 1px solid rgba(176, 127, 78, 0.2);
  border-radius: 10px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0,0,0,.3);
}

/* ── Formulario ── */
.form-card {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: .6rem;
  max-width: 480px;
}

.seccion-label {
  font-size: .78rem;
  font-weight: 600;
  color: #d4870a;
  text-transform: uppercase;
  letter-spacing: .05em;
  margin: .3rem 0 .1rem;
}

.form-card input,
.form-card textarea {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: .55rem .75rem;
  font-size: .95rem;
  font-family: inherit;
  color: #1a1a1a;
  background: #fff;
  width: 100%;
}

.form-card input:focus,
.form-card textarea:focus {
  outline: none;
  border-color: #d4870a;
}

.fila-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .75rem;
}

.input-grupo {
  display: flex;
  flex-direction: column;
  gap: .3rem;
}

.input-grupo label {
  font-size: .82rem;
  color: #666;
}

.form-acciones {
  display: flex;
  gap: .75rem;
  margin-top: .25rem;
}

/* ── Tarjetas de lotes ── */
.grilla-lotes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.lote-card {
  cursor: pointer;
  transition: box-shadow .15s;
}

.lote-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,.12);
}

.lote-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: .4rem;
}

.lote-nombre { font-weight: 600; font-size: 1.05rem; color: #e2e8f0; }
.lote-estilo { color: #94a3b8; font-size: .9rem; margin-bottom: .5rem; }

.lote-rangos {
  display: flex;
  gap: .75rem;
  margin-bottom: .4rem;
}

.lote-fecha  { color: #64748b; font-size: .82rem; }
.rango       { font-size: .82rem; color: #94a3b8; }

/* ── Badges ── */
.badge {
  font-size: .75rem;
  padding: 2px 8px;
  border-radius: 20px;
  font-weight: 500;
}

.badge-activo   { background: #eafaf1; color: #22804a; }
.badge-inactivo { background: #f0f0f0; color: #888; }

/* ── Botones ── */
.btn-primary {
  background: #d4870a;
  color: #fff;
  border: none;
  padding: .5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: .9rem;
}

.btn-primary:hover { background: #b87209; }

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  border: none;
  padding: .5rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: .9rem;
}

.mensaje-centro {
  text-align: center;
  padding: 2rem;
  color: #888;
}
</style>
