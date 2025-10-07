<template>
  <div class="reporte-wrapper" ref="reporteRef">

    <!-- Header -->
    <div class="reporte-header no-print-btn">
      <div class="header-left">
        <router-link to="/fermentacion" class="btn-back">← Volver a lotes</router-link>
      </div>
      <button class="btn-pdf" @click="exportarPDF" :disabled="exportando">
        <span v-if="exportando">Generando PDF…</span>
        <span v-else>⬇ Exportar PDF</span>
      </button>
    </div>

    <!-- Portada del reporte -->
    <div class="reporte-portada">
      <div class="portada-icono"></div>
      <div class="portada-info">
        <h1 class="portada-titulo">{{ lote.nombre }}</h1>
        <p class="portada-sub">{{ lote.estilo }}</p>
        <div class="portada-badges">
          <span :class="['badge-estado', lote.activa ? 'activo' : 'finalizado']">
            {{ lote.activa ? 'En fermentación' : 'Finalizado' }}
          </span>
          <span class="badge-fecha">Inicio: {{ formatFecha(lote.created_at) }}</span>
          <span class="badge-fecha" v-if="!lote.activa && lote.updated_at">
            Fin: {{ formatFecha(lote.updated_at) }}
          </span>
        </div>
      </div>
    </div>

    <!-- KPIs resumen -->
    <section class="seccion">
      <h2 class="seccion-titulo">Resumen del lote</h2>
      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Total lecturas</span>
          <span class="kpi-valor">{{ stats.totalLecturas }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Duración</span>
          <span class="kpi-valor">{{ stats.duracion }}</span>
        </div>
        <div class="kpi-card" :class="{ alerta: stats.tempFueraRango > 0 }">
          <span class="kpi-label">Temp. promedio</span>
          <span class="kpi-valor">{{ stats.tempPromedio }}°C</span>
        </div>
        <div class="kpi-card" :class="{ alerta: stats.phFueraRango > 0 }">
          <span class="kpi-label">pH promedio</span>
          <span class="kpi-valor">{{ stats.phPromedio }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">BPM promedio</span>
          <span class="kpi-valor">{{ stats.bpmPromedio }}</span>
        </div>
      </div>
    </section>

    <!-- Gráfica promedios por hora -->
    <section class="seccion">
      <h2 class="seccion-titulo">Promedios por hora</h2>
      <p class="seccion-desc">
        Cada punto representa el promedio de todas las lecturas registradas en esa hora.
      </p>
      <div class="graficas-grid">
        <div class="grafica-wrap">
          <h3 class="grafica-titulo">Temperatura del mosto (°C)</h3>
          <canvas ref="canvasTemp" height="220"></canvas>
        </div>
        <div class="grafica-wrap">
          <h3 class="grafica-titulo">pH del mosto</h3>
          <canvas ref="canvasPh" height="220"></canvas>
        </div>
        <div class="grafica-wrap grafica-full">
          <h3 class="grafica-titulo">Actividad de fermentación (burbujas/min)</h3>
          <canvas ref="canvasBpm" height="200"></canvas>
        </div>
      </div>
    </section>

    <!-- Tabla estadísticas por hora -->
    <section class="seccion page-break">
      <h2 class="seccion-titulo">Estadísticas por hora</h2>
      <div class="tabla-wrap">
        <table class="tabla-stats">
          <thead>
            <tr>
              <th>Hora</th>
              <th>Lecturas</th>
              <th>Temp. min</th>
              <th>Temp. max</th>
              <th>Temp. prom</th>
              <th>pH min</th>
              <th>pH max</th>
              <th>BPM prom</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in statsHorarias" :key="d.hora">
              <td>{{ d.hora }}</td>
              <td>{{ d.lecturas }}</td>
              <td :class="{ 'cel-alerta': d.tempMin < config.temp_min }">{{ d.tempMin }}°C</td>
              <td :class="{ 'cel-alerta': d.tempMax > config.temp_max }">{{ d.tempMax }}°C</td>
              <td>{{ d.tempProm }}°C</td>
              <td :class="{ 'cel-alerta': d.phMin < config.ph_min }">{{ d.phMin }}</td>
              <td :class="{ 'cel-alerta': d.phMax > config.ph_max }">{{ d.phMax }}</td>
              <td>{{ d.bpmProm }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Footer del reporte -->
    <div class="reporte-footer">
      <span>Monitor de Fermentación · Reporte generado {{ formatHora(new Date()) }}</span>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'

// Chart.js desde CDN — se carga dinámicamente
let Chart = null

const route  = useRoute()
const loteId = route.params.id

const lote       = ref({})
const lecturas   = ref([])
const config     = ref({ temp_min: 16, temp_max: 24, ph_min: 3.8, ph_max: 5.5 })
const exportando = ref(false)
const reporteRef = ref(null)

const canvasTemp = ref(null)
const canvasPh   = ref(null)
const canvasBpm  = ref(null)

// ── KPIs globales ─────────────────────────────────────────────────────────────
const stats = computed(() => {
  if (!lecturas.value.length) return {
    totalLecturas: 0, duracion: '—', tempPromedio: '—',
    phPromedio: '—', bpmPromedio: '—', totalAlertas: 0,
    tempFueraRango: 0, phFueraRango: 0
  }

  const temps = lecturas.value.filter(l => l.temperatura_mosto != null).map(l => +l.temperatura_mosto)
  const phs   = lecturas.value.filter(l => l.ph != null).map(l => +l.ph)
  const bpms  = lecturas.value.filter(l => l.burbujas_por_minuto != null).map(l => +l.burbujas_por_minuto)

  const avg = arr => arr.length ? (arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : '—'

  const first = new Date(lecturas.value[0].created_at)
  const last  = new Date(lecturas.value[lecturas.value.length - 1].created_at)
  const horas = Math.round((last - first) / 3600000)
  const dias  = Math.floor(horas / 24)
  const duracion = dias > 0 ? `${dias}d ${horas % 24}h` : `${horas}h`

  return {
    totalLecturas: lecturas.value.length,
    duracion,
    tempPromedio:    avg(temps),
    phPromedio:      avg(phs),
    bpmPromedio:     avg(bpms),
    tempFueraRango:  temps.filter(t => t < config.value.temp_min || t > config.value.temp_max).length,
    phFueraRango:    phs.filter(p => p < config.value.ph_min || p > config.value.ph_max).length,
  }
})

// ── Promedios por hora para las gráficas ──────────────────────────────────────
const promediosPorHora = computed(() => {
  const mapa = {}
  lecturas.value.forEach(l => {
    const d    = new Date(l.created_at)
    const hora = `${d.toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit' })} ${String(d.getHours()).padStart(2,'0')}h`
    if (!mapa[hora]) mapa[hora] = { temps: [], phs: [], bpms: [] }
    if (l.temperatura_mosto != null) mapa[hora].temps.push(+l.temperatura_mosto)
    if (l.ph != null)                mapa[hora].phs.push(+l.ph)
    if (l.burbujas_por_minuto != null) mapa[hora].bpms.push(+l.burbujas_por_minuto)
  })
  const avg = arr => arr.length ? +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : null
  return Object.entries(mapa).map(([hora, v]) => ({
    hora,
    temp: avg(v.temps),
    ph:   avg(v.phs),
    bpm:  avg(v.bpms),
  }))
})

// ── Estadísticas por hora para la tabla ──────────────────────────────────────
const statsHorarias = computed(() => {
  const mapa = {}
  lecturas.value.forEach(l => {
    const d    = new Date(l.created_at)
    const hora = `${d.toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'2-digit' })} ${String(d.getHours()).padStart(2,'0')}:00`
    if (!mapa[hora]) mapa[hora] = { temps: [], phs: [], bpms: [], count: 0 }
    mapa[hora].count++
    if (l.temperatura_mosto    != null) mapa[hora].temps.push(+l.temperatura_mosto)
    if (l.ph                   != null) mapa[hora].phs.push(+l.ph)
    if (l.burbujas_por_minuto  != null) mapa[hora].bpms.push(+l.burbujas_por_minuto)
  })
  const avg = arr => arr.length ? (arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(1) : '—'
  const min = arr => arr.length ? Math.min(...arr).toFixed(1) : '—'
  const max = arr => arr.length ? Math.max(...arr).toFixed(1) : '—'
  return Object.entries(mapa).map(([hora, v]) => ({
    hora,
    lecturas: v.count,
    tempMin:  min(v.temps),
    tempMax:  max(v.temps),
    tempProm: avg(v.temps),
    phMin:    min(v.phs),
    phMax:    max(v.phs),
    bpmProm:  avg(v.bpms),
  }))
})

// ── Formateo ─────────────────────────────────────────────────────────────────
function formatFecha(iso) {
  return new Date(iso).toLocaleDateString('es-MX', { day:'2-digit', month:'long', year:'numeric' })
}
function formatHora(iso) {
  return new Date(iso).toLocaleString('es-MX', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
}

// ── Carga de datos ────────────────────────────────────────────────────────────
async function cargarDatos() {
  const [resLote, resLecturas, resConfig] = await Promise.all([
    fetch(`/api/fermentaciones/${loteId}`),
    fetch(`/api/lecturas/${loteId}?limite=2000`),
    fetch(`/api/alertas/config/${loteId}`),
  ])
  lote.value     = await resLote.json()
  lecturas.value = await resLecturas.json()
  if (resConfig.ok) config.value = await resConfig.json()
}

// ── Gráficas con Chart.js ─────────────────────────────────────────────────────
function crearGrafica(canvas, label, datos, color, limites) {
  if (!canvas || !datos.length) return
  const ctx = canvas.getContext('2d')

  const datasets = [{
    label,
    data: datos,
    borderColor: color,
    backgroundColor: color + '18',
    borderWidth: 2,
    pointRadius: datos.length > 60 ? 0 : 3,
    tension: 0.3,
    fill: true,
  }]

  if (limites) {
    datasets.push(
      { label: 'Mínimo', data: Array(datos.length).fill(limites.min), borderColor: '#f59e0b', borderWidth: 1, borderDash: [6,3], pointRadius: 0, fill: false },
      { label: 'Máximo', data: Array(datos.length).fill(limites.max), borderColor: '#ef4444', borderWidth: 1, borderDash: [6,3], pointRadius: 0, fill: false }
    )
  }

  new Chart(ctx, {
    type: 'line',
    data: { labels: promediosPorHora.value.map(p => p.hora), datasets },
    options: {
      responsive: true,
      plugins: { legend: { display: !!limites, labels: { font: { size: 11 }, color: '#888' } } },
      scales: {
        x: { ticks: { maxTicksLimit: 10, color: '#999', font: { size: 10 } }, grid: { color: '#f0f0f0' } },
        y: { ticks: { color: '#999', font: { size: 10 } }, grid: { color: '#f0f0f0' } }
      }
    }
  })
}

async function iniciarGraficas() {
  if (!Chart) {
    await new Promise(resolve => {
      const s = document.createElement('script')
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
      s.onload = resolve
      document.head.appendChild(s)
    })
    Chart = window.Chart
  }
  await nextTick()
  const ph = promediosPorHora.value
  crearGrafica(canvasTemp.value, 'Temp °C', ph.map(p => p.temp), '#e24b4a', { min: config.value.temp_min, max: config.value.temp_max })
  crearGrafica(canvasPh.value,   'pH',      ph.map(p => p.ph),   '#7f77dd', { min: config.value.ph_min, max: config.value.ph_max })
  crearGrafica(canvasBpm.value,  'BPM',     ph.map(p => p.bpm),  '#1d9e75', null)
}

// ── Exportar PDF con html2pdf ─────────────────────────────────────────────────
async function exportarPDF() {
  exportando.value = true
  try {
    if (!window.html2pdf) {
      await new Promise(resolve => {
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
        s.onload = resolve
        document.head.appendChild(s)
      })
    }
    const nombre = `reporte-${lote.value.nombre?.replace(/\s+/g, '-') || loteId}.pdf`
    await window.html2pdf().set({
      margin:      [10, 10, 10, 10],
      filename:    nombre,
      image:       { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF:       { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:   { mode: ['avoid-all', 'css'] }
    }).from(reporteRef.value).save()
  } finally {
    exportando.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  await cargarDatos()
  await iniciarGraficas()
})
</script>

<style scoped>
.reporte-wrapper {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: #1a1a1a;
}

/* ── Header ── */
.reporte-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.btn-back {
  font-size: .85rem;
  color: #666;
  text-decoration: none;
}
.btn-back:hover { color: #1a1a1a; }
.btn-pdf {
  background: #1a1a1a;
  color: #fff;
  border: none;
  padding: .55rem 1.25rem;
  border-radius: 8px;
  font-size: .85rem;
  cursor: pointer;
  transition: background .15s;
}
.btn-pdf:hover:not(:disabled) { background: #333; }
.btn-pdf:disabled { opacity: .5; cursor: default; }

/* ── Portada ── */
.reporte-portada {
  display: flex;
  gap: 1.25rem;
  align-items: center;
  background: #f8f7f4;
  border-radius: 14px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}
.portada-icono { font-size: 3rem; line-height: 1; }
.portada-titulo { font-size: 1.6rem; font-weight: 700; margin: 0 0 .25rem; }
.portada-sub { color: #666; margin: 0 0 .75rem; font-size: .95rem; }
.portada-badges { display: flex; flex-wrap: wrap; gap: .5rem; }
.badge-estado {
  font-size: .78rem; padding: 3px 10px; border-radius: 20px; font-weight: 600;
}
.badge-estado.activo   { background: #eafaf1; color: #22804a; }
.badge-estado.finalizado { background: #f0f0f0; color: #555; }
.badge-fecha { font-size: .78rem; padding: 3px 10px; border-radius: 20px; background: #e8e8e8; color: #555; }

/* ── Secciones ── */
.seccion { margin-bottom: 2.5rem; }
.seccion-titulo {
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: .5rem;
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: .06em;
  font-size: .8rem;
}
.seccion-desc { font-size: .85rem; color: #888; margin: -.5rem 0 1rem; }

/* ── KPIs ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: .75rem;
}
.kpi-card {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: .9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .3rem;
}
.kpi-card.alerta { border-color: #fca5a5; background: #fff5f5; }
.kpi-label { font-size: .75rem; color: #999; text-transform: uppercase; letter-spacing: .04em; }
.kpi-valor { font-size: 1.6rem; font-weight: 700; color: #1a1a1a; }
.kpi-card.alerta .kpi-valor { color: #dc2626; }

/* ── Gráficas ── */
.graficas-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.grafica-wrap {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 10px;
  padding: 1rem;
}
.grafica-full { grid-column: 1 / -1; }
.grafica-titulo { font-size: .82rem; font-weight: 600; color: #555; margin: 0 0 .75rem; }

/* ── Tabla ── */
.tabla-wrap { overflow-x: auto; }
.tabla-stats {
  width: 100%;
  border-collapse: collapse;
  font-size: .82rem;
}
.tabla-stats th {
  background: #f8f7f4;
  color: #888;
  text-transform: uppercase;
  font-size: .72rem;
  letter-spacing: .04em;
  padding: .6rem .75rem;
  text-align: left;
  border-bottom: 2px solid #ececec;
}
.tabla-stats td {
  padding: .55rem .75rem;
  border-bottom: 1px solid #f5f5f5;
  color: #333;
}
.tabla-stats tr:hover td { background: #fafafa; }
.cel-alerta { color: #dc2626; font-weight: 600; }

/* ── Footer ── */
.reporte-footer {
  text-align: center;
  color: #ccc;
  font-size: .78rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

/* ── PDF: ocultar botones y saltos de página ── */
@media print {
  .no-print-btn { display: none !important; }
  .page-break   { page-break-before: always; }
}
</style>
