const router = require('express').Router()
const db     = require('../db')


let io

// Estado de throttling por fermentación
// { fermentacion_id: { lastSaved: Date, lastValues: { temp, ph, burbujas } } }
const throttleState = new Map()

const THROTTLE_MS       = 3 * 60 * 1000  // 3 minutos
const CAMBIO_UMBRAL     = 2              // unidad de diferencia para guardar antes

router.setIo = (socketIo) => { io = socketIo }

// ── WebSocket: el ESP32 se conecta y emite 'lectura' ─────────────────────────
// En index.js, después de crear io, llama a: require('./routes/lecturas').initWs(io)
function initWs(socketIo) {
  io = socketIo

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id)

    // ← Este handler recibe los datos del ESP32
    socket.on('lectura', async (data) => {
      console.log('[WS] Lectura recibida del ESP32:', data)
      
      const { fermentacion_id, temperatura_mosto, burbujas_por_minuto, ph } = data

      if (!fermentacion_id) return

      // Broadcast inmediato al dashboard
      io.emit('nueva_lectura', {
        fermentacion_id,
        temperatura_mosto,
        burbujas_por_minuto,
        ph,
        ts: new Date().toISOString()
      })

      // Throttling: guardar en BD solo si corresponde
      if (debeGuardar(fermentacion_id, { temperatura_mosto, burbujas_por_minuto, ph })) {
        await guardarLectura({ fermentacion_id, temperatura_mosto, burbujas_por_minuto, ph })
      }
    })

    socket.on('disconnect', () => console.log('Cliente desconectado:', socket.id))
  })
}
 
// ── Lógica de throttling ──────────────────────────────────────────────────────
function debeGuardar(fermentacion_id, { temperatura_mosto, burbujas_por_minuto, ph }) {
  const ahora  = Date.now()
  const estado = throttleState.get(fermentacion_id)

  if (!estado) {
    // Primera lectura: guardar siempre
    throttleState.set(fermentacion_id, {
      lastSaved: ahora,
      lastValues: { temperatura_mosto, burbujas_por_minuto, ph }
    })
    return true
  }

  const { lastSaved, lastValues } = estado

  // Regla 1: han pasado ≥3 minutos
  const tiempoSuficiente = (ahora - lastSaved) >= THROTTLE_MS

  // Regla 2: algún valor cambió ≥1 unidad (antes de los 5 min)
  const cambioSignificativo =
    Math.abs((temperatura_mosto ?? lastValues.temperatura_mosto) - lastValues.temperatura_mosto) >= CAMBIO_UMBRAL ||
    Math.abs((ph             ?? lastValues.ph)             - lastValues.ph)             >= CAMBIO_UMBRAL ||
    Math.abs((burbujas_por_minuto ?? lastValues.burbujas_por_minuto) - lastValues.burbujas_por_minuto) >= CAMBIO_UMBRAL

  if (tiempoSuficiente || cambioSignificativo) {
    // Actualizar estado
    throttleState.set(fermentacion_id, {
      lastSaved: ahora,
      lastValues: { temperatura_mosto, burbujas_por_minuto, ph }
    })
    return true
  }

  return false
}

// ── Persistencia + alertas ────────────────────────────────────────────────────
async function guardarLectura({ fermentacion_id, temperatura_mosto, burbujas_por_minuto, ph }) {
  try {
    const { rows } = await db.query(
      `INSERT INTO lecturas (fermentacion_id, temperatura_mosto, burbujas_por_minuto, ph)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [fermentacion_id, temperatura_mosto, burbujas_por_minuto, ph]
    )
    await verificarAlertas(rows[0])
  } catch (err) {
    console.error('Error guardando lectura:', err.message)
  }
}

// ── REST endpoints (opcionales, para compatibilidad o backfill) ───────────────
// POST /lecturas — acepta también el flujo HTTP clásico con throttling igual
router.post('/', async (req, res) => {
  const { fermentacion_id, temperatura_mosto, burbujas_por_minuto, ph } = req.body

  if (!fermentacion_id) return res.status(400).json({ error: 'fermentacion_id es requerido' })

  if (io) io.emit('nueva_lectura', { fermentacion_id, temperatura_mosto, burbujas_por_minuto, ph, ts: new Date() })

  if (debeGuardar(fermentacion_id, { temperatura_mosto, burbujas_por_minuto, ph })) {
    await guardarLectura({ fermentacion_id, temperatura_mosto, burbujas_por_minuto, ph })
    return res.status(201).json({ guardado: true })
  }

  res.status(202).json({ guardado: false, msg: 'Throttled: no hubo cambio significativo ni pasaron 3 min' })
})

router.get('/:fermentacion_id', async (req, res) => {
  const { limite = 200, desde } = req.query
  try {
    const query = `
      SELECT * FROM lecturas
      WHERE fermentacion_id = $1
      ${desde ? 'AND created_at >= $3' : ''}
      ORDER BY created_at DESC LIMIT $2`
    const params = desde ? [req.params.fermentacion_id, limite, desde] : [req.params.fermentacion_id, limite]
   
    const { rows } = await db.query(query, params)
   
    res.json(rows.reverse())
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


router.get('/:fermentacion_id/ultima', async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM lecturas WHERE fermentacion_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [req.params.fermentacion_id]
    )
    if (!rows.length) return res.status(404).json({ error: 'Sin lecturas aún' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Alertas (sin cambios) ─────────────────────────────────────────────────────
async function verificarAlertas(lectura) {
  // ... (tu lógica actual, sin cambios)
}

module.exports = router
module.exports.initWs = initWs