import { useEffect, useRef } from 'react'
import styles from './Background3D.module.css'

const TILT = 0.3

function rotatePoint(x, y, z, yAngle) {
  const cosY = Math.cos(yAngle), sinY = Math.sin(yAngle)
  const cosX = Math.cos(TILT),   sinX = Math.sin(TILT)
  const x1 =  x * cosY + z * sinY
  const z1 = -x * sinY + z * cosY
  const y2 =  y * cosX - z1 * sinX
  const z2 =  y * sinX + z1 * cosX
  return [x1, y2, z2]
}

function project(x, y, z, cx, cy, R) {
  const f = 3 / (3 + z / R)
  return [cx + x * f, cy + y * f]
}

const LON = 18, LAT = 9, STEPS = 80

export default function Background3D() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const onResize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    onResize()
    window.addEventListener('resize', onResize)

    function draw(yAngle) {
      const { width: W, height: H } = canvas
      ctx.clearRect(0, 0, W, H)
      const cx = W / 2
      const cy = H / 2
      const R  = Math.min(W, H) * 0.38
      const isDark  = document.documentElement.getAttribute('data-theme') !== 'light'
      const lonRGB  = isDark ? '249,115,22'  : '180,83,9'
      const latRGB  = isDark ? '14,165,233'  : '2,132,199'
      const frontLon = isDark ? 0.22 : 0.16
      const backLon  = isDark ? 0.04 : 0.03
      const frontLat = isDark ? 0.16 : 0.12
      const backLat  = isDark ? 0.03 : 0.02

      // latitude parallels
      for (let i = 1; i < LAT; i++) {
        const phi = (i / LAT) * Math.PI
        const y0  = R * Math.cos(phi)
        const r0  = R * Math.sin(phi)
        for (let j = 0; j < STEPS; j++) {
          const a0 = (j / STEPS) * Math.PI * 2
          const a1 = ((j + 1) / STEPS) * Math.PI * 2
          const [x0, yy0, z0] = rotatePoint(r0 * Math.cos(a0), y0, r0 * Math.sin(a0), yAngle)
          const [x1, yy1, z1] = rotatePoint(r0 * Math.cos(a1), y0, r0 * Math.sin(a1), yAngle)
          const alpha = (z0 + z1) / 2 >= 0 ? frontLat : backLat
          const [px0, py0] = project(x0, yy0, z0, cx, cy, R)
          const [px1, py1] = project(x1, yy1, z1, cx, cy, R)
          ctx.beginPath()
          ctx.moveTo(px0, py0)
          ctx.lineTo(px1, py1)
          ctx.strokeStyle = `rgba(${latRGB},${alpha})`
          ctx.lineWidth = 0.7
          ctx.stroke()
        }
      }

      // longitude meridians
      for (let i = 0; i < LON; i++) {
        const theta = (i / LON) * Math.PI * 2
        const cosT  = Math.cos(theta)
        const sinT  = Math.sin(theta)
        for (let j = 0; j < STEPS; j++) {
          const phi0 = (j / STEPS) * Math.PI
          const phi1 = ((j + 1) / STEPS) * Math.PI
          const [x0, yy0, z0] = rotatePoint(R * Math.sin(phi0) * cosT, R * Math.cos(phi0), R * Math.sin(phi0) * sinT, yAngle)
          const [x1, yy1, z1] = rotatePoint(R * Math.sin(phi1) * cosT, R * Math.cos(phi1), R * Math.sin(phi1) * sinT, yAngle)
          const alpha = (z0 + z1) / 2 >= 0 ? frontLon : backLon
          const [px0, py0] = project(x0, yy0, z0, cx, cy, R)
          const [px1, py1] = project(x1, yy1, z1, cx, cy, R)
          ctx.beginPath()
          ctx.moveTo(px0, py0)
          ctx.lineTo(px1, py1)
          ctx.strokeStyle = `rgba(${lonRGB},${alpha})`
          ctx.lineWidth = 0.9
          ctx.stroke()
        }
      }

      // outer glow halo
      const grd = ctx.createRadialGradient(cx, cy, R * 0.82, cx, cy, R * 1.18)
      grd.addColorStop(0, `rgba(${lonRGB},${isDark ? 0.07 : 0.05})`)
      grd.addColorStop(1, `rgba(${lonRGB},0)`)
      ctx.beginPath()
      ctx.arc(cx, cy, R * 1.15, 0, Math.PI * 2)
      ctx.fillStyle = grd
      ctx.fill()
    }

    function animate(ts) {
      draw((ts / 30000) * Math.PI * 2)
      animId = requestAnimationFrame(animate)
    }

    animId = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.canvas} />
}
