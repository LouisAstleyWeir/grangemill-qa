'use client'

import { useEffect, useRef, useState } from 'react'

export default function LabLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible')
  const [label, setLabel] = useState('Initialising…')
  const animRef = useRef<number | null>(null)
  const tRef = useRef(0)

  useEffect(() => {
    const fade = setTimeout(() => setPhase('fading'), 4600)
    const gone = setTimeout(() => setPhase('gone'), 5200)
    return () => { clearTimeout(fade); clearTimeout(gone) }
  }, [])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const ctx = cv.getContext('2d')!
    const W = 480, H = 480, CX = W / 2, CY = H / 2
    const RED = '#E41B13', NAVY = '#1C2B4B', WHITE = '#FFFFFF'

    function easeOut(x: number) { return 1 - (1 - x) * (1 - x) }
    function easeInOut(x: number) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2 }
    function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)) }
    function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

    const PHASE_T = [0, 120, 240, 340, 420]
    function getPhase(t: number) {
      for (let i = 0; i < PHASE_T.length - 1; i++) if (t < PHASE_T[i + 1]) return i
      return PHASE_T.length - 2
    }
    function getPhaseT(t: number) {
      const p = getPhase(t)
      return clamp((t - PHASE_T[p]) / (PHASE_T[p + 1] - PHASE_T[p]), 0, 1)
    }

    function drawGrid() {
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      for (let x = 0; x <= W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
      for (let y = 0; y <= H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
      ctx.restore()
    }

    function drawDroplet(progress: number) {
      const dropY = lerp(40, CY - 50, clamp(progress * 1.5, 0, 1))
      const splat = clamp((progress - 0.5) / 0.5, 0, 1)
      const se = easeInOut(splat)
      if (progress < 0.55) {
        ctx.save()
        const sz = lerp(6, 20, clamp(progress * 2, 0, 1))
        ctx.beginPath()
        ctx.arc(CX, dropY, sz * 0.7, 0, Math.PI * 2)
        ctx.moveTo(CX, dropY - sz)
        ctx.bezierCurveTo(CX + sz * 0.4, dropY - sz * 2.2, CX + sz * 0.4, dropY - sz * 3.5, CX, dropY - sz * 3.8)
        ctx.bezierCurveTo(CX - sz * 0.4, dropY - sz * 3.5, CX - sz * 0.4, dropY - sz * 2.2, CX, dropY - sz)
        ctx.fillStyle = '#111'
        ctx.fill()
        ctx.restore()
      }
      if (splat > 0) {
        ctx.save()
        ctx.beginPath(); ctx.ellipse(CX, CY, lerp(0, 105, se), lerp(0, 18, se), 0, 0, Math.PI * 2)
        ctx.fillStyle = '#0f0f0f'; ctx.fill()
        ctx.beginPath(); ctx.ellipse(CX, CY, lerp(0, 80, se), lerp(0, 14, se), 0, 0, Math.PI * 2)
        ctx.fillStyle = '#080808'; ctx.fill()
        for (let i = 0; i < 4; i++) {
          const rp = clamp(se - i * 0.08, 0, 1); if (rp <= 0) continue
          ctx.beginPath(); ctx.ellipse(CX, CY, lerp(0, 95 - i * 14, rp), lerp(0, 16 - i * 2, rp), 0, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(25,25,25,${0.6 - i * 0.1})`; ctx.lineWidth = 2 - i * 0.3; ctx.stroke()
        }
        ctx.restore()
      }
    }

    function drawCircleSample(alpha: number) {
      ctx.save(); ctx.globalAlpha = alpha
      ctx.beginPath(); ctx.ellipse(CX, CY, 104, 18, 0, 0, Math.PI * 2); ctx.fillStyle = '#0c0c0c'; ctx.fill()
      ctx.beginPath(); ctx.ellipse(CX, CY, 80, 14, 0, 0, Math.PI * 2); ctx.fillStyle = '#080808'; ctx.fill()
      ctx.restore()
    }

    function drawScanLine(progress: number, sampleAlpha: number) {
      if (progress <= 0) return
      const p = easeInOut(clamp(progress, 0, 1))
      const scanX = lerp(CX - 112, CX + 112, p)
      ctx.save()
      ctx.strokeStyle = RED; ctx.lineWidth = 2.5
      ctx.beginPath(); ctx.moveTo(scanX, CY - 84); ctx.lineTo(scanX, CY + 84); ctx.stroke()
      ctx.strokeStyle = 'rgba(228,27,19,0.2)'; ctx.lineWidth = 14
      ctx.beginPath(); ctx.moveTo(scanX, CY - 84); ctx.lineTo(scanX, CY + 84); ctx.stroke()
      ctx.restore()
      for (let i = 0; i < 8; i++) {
        const nx = CX + Math.cos(i / 8 * Math.PI * 2) * 72
        const ny = CY + Math.sin(i / 8 * Math.PI * 2) * 13
        const dist = Math.abs(nx - scanX)
        const vis = clamp(1 - dist / 60, 0, 1) * clamp(p - i / 8 * 0.7, 0, 1)
        if (vis <= 0) continue
        ctx.save(); ctx.globalAlpha = vis * 0.7 * sampleAlpha
        ctx.strokeStyle = RED; ctx.lineWidth = 1
        ctx.beginPath(); ctx.arc(nx, ny, 4, 0, Math.PI * 2); ctx.stroke()
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.5
        ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(nx + 14, ny - 8); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(CX, CY); ctx.stroke()
        ctx.restore()
      }
      ctx.save(); ctx.globalAlpha = clamp(progress * 3, 0, 1) * sampleAlpha * 0.5
      ctx.strokeStyle = RED; ctx.lineWidth = 1; ctx.setLineDash([6, 4])
      ctx.beginPath(); ctx.moveTo(CX - 114, CY); ctx.lineTo(CX + 114, CY); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(CX, CY - 84); ctx.lineTo(CX, CY + 84); ctx.stroke()
      ctx.setLineDash([])
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5
      ctx.beginPath(); ctx.arc(CX, CY, 90, 0, Math.PI * 2); ctx.stroke()
      ctx.restore()
    }

    function drawHexagon(progress: number) {
      if (progress <= 0) return
      const p = easeOut(clamp(progress, 0, 1))
      const r = lerp(0, 112, p)
      ctx.save(); ctx.globalAlpha = p
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6
        i === 0 ? ctx.moveTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r * 0.2)
          : ctx.lineTo(CX + Math.cos(a) * r, CY + Math.sin(a) * r * 0.2)
      }
      ctx.closePath(); ctx.strokeStyle = RED; ctx.lineWidth = 2.5; ctx.stroke()
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 6; const rr = r - 8
        i === 0 ? ctx.moveTo(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr * 0.2)
          : ctx.lineTo(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr * 0.2)
      }
      ctx.closePath(); ctx.strokeStyle = 'rgba(228,27,19,0.2)'; ctx.lineWidth = 1; ctx.stroke()
      ctx.restore()
    }

    function drawCheckmark(progress: number) {
      if (progress <= 0) return
      const p = easeOut(clamp(progress, 0, 1))
      const sx = CX - 32, sy = CY + 6, mx = CX - 8, my = CY + 30, ex = CX + 40, ey = CY - 26
      const seg1 = Math.hypot(mx - sx, my - sy)
      const total = seg1 + Math.hypot(ex - mx, ey - my)
      const drawn = p * total
      ctx.save(); ctx.strokeStyle = WHITE; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.beginPath()
      if (drawn <= seg1) {
        const t2 = drawn / seg1; ctx.moveTo(sx, sy); ctx.lineTo(lerp(sx, mx, t2), lerp(sy, my, t2))
      } else {
        ctx.moveTo(sx, sy); ctx.lineTo(mx, my)
        const t2 = (drawn - seg1) / (total - seg1); ctx.lineTo(lerp(mx, ex, t2), lerp(my, ey, t2))
      }
      ctx.stroke(); ctx.restore()
    }

    function drawIKOLogo(alpha: number) {
      if (alpha <= 0) return
      ctx.save(); ctx.globalAlpha = alpha
      const s = 3.0
      const ox = CX - 159 * s / 2
      const oy = CY - 53 * s / 2 + 8
      ctx.save(); ctx.translate(ox, oy); ctx.scale(s, s)

      // Shield body — WHITE
      ctx.fillStyle = WHITE
      const shield = new Path2D()
      shield.moveTo(25.97,26.85); shield.lineTo(25.89,25.50); shield.lineTo(24.91,26.43)
      shield.bezierCurveTo(24.91,26.43,23.00,28.21,20.92,27.72)
      shield.bezierCurveTo(19.38,27.37,18.07,25.88,17.00,23.32)
      shield.bezierCurveTo(18.35,21.71,19.58,19.21,19.67,15.40)
      shield.bezierCurveTo(19.66,14.94,19.62,14.47,19.56,14.02)
      shield.bezierCurveTo(21.06,12.94,23.01,10.52,22.00,7.20)
      shield.bezierCurveTo(21.74,6.46,21.34,5.79,20.82,5.21)
      shield.bezierCurveTo(20.30,4.64,19.67,4.17,18.97,3.86)
      shield.bezierCurveTo(18.24,3.56,17.46,3.42,16.68,3.46)
      shield.bezierCurveTo(16.03,0.90,14.11,0.06,13.12,0)
      shield.lineTo(13.05,0); shield.lineTo(12.98,0)
      shield.bezierCurveTo(12.11,0.11,11.29,0.51,10.65,1.13)
      shield.bezierCurveTo(10.02,1.76,9.60,2.58,9.46,3.46)
      shield.bezierCurveTo(8.66,3.41,7.86,3.54,7.11,3.85)
      shield.bezierCurveTo(4.34,5.13,3.03,7.64,4.08,11.18)
      shield.bezierCurveTo(5.05,13.00,6.57,14.05,6.57,14.05)
      shield.bezierCurveTo(6.46,15.40,6.46,20.05,9.13,23.31)
      shield.bezierCurveTo(8.64,24.34,7.04,27.21,4.80,27.71)
      shield.bezierCurveTo(3.63,27.97,2.40,27.51,1.13,26.35)
      shield.lineTo(0.22,25.55); shield.lineTo(0.07,26.76)
      shield.bezierCurveTo(-0.15,29.75,0.15,32.75,0.97,35.62)
      shield.bezierCurveTo(2.21,40.27,5.24,47.01,12.68,52.72)
      shield.lineTo(13.04,53); shield.lineTo(13.41,52.75)
      shield.bezierCurveTo(15.95,50.87,18.20,48.61,20.07,46.05)
      shield.bezierCurveTo(24.25,40.58,26.34,33.76,25.97,26.85)
      ctx.fill(shield)

      // Red parts
      ctx.fillStyle = RED
      const tongue = new Path2D()
      tongue.moveTo(20.66,28.97)
      tongue.bezierCurveTo(21.60,29.17,22.58,29.10,23.48,28.75)
      tongue.bezierCurveTo(22.63,29.88,21.43,30.69,20.07,31.03)
      tongue.bezierCurveTo(17.28,31.66,14.52,29.93,13.73,29.36)
      tongue.lineTo(13.73,25.83)
      tongue.bezierCurveTo(14.59,25.45,15.39,24.94,16.10,24.30)
      tongue.bezierCurveTo(17.25,26.97,18.80,28.55,20.66,28.97)
      ctx.fill(tongue)

      const flame = new Path2D()
      flame.moveTo(13.07,51.40)
      flame.bezierCurveTo(2.83,43.29,1.37,33.15,1.27,28.91)
      flame.bezierCurveTo(2.47,30.45,4.12,31.56,5.99,32.08)
      flame.bezierCurveTo(8.22,32.63,10.59,32.08,13.03,30.46)
      flame.bezierCurveTo(14.06,31.18,17.08,32.99,20.30,32.28)
      flame.bezierCurveTo(22.11,31.83,23.70,30.72,24.75,29.16)
      flame.bezierCurveTo(24.46,42.02,15.07,49.87,13.07,51.40)
      ctx.fill(flame)

      const topCap = new Path2D()
      topCap.moveTo(18.45,5.01)
      topCap.bezierCurveTo(20.27,5.78,21.36,7.29,20.81,10.31)
      topCap.bezierCurveTo(20.55,11.20,20.03,11.99,19.31,12.58)
      topCap.bezierCurveTo(18.65,9.59,16.86,6.97,14.32,5.30)
      topCap.bezierCurveTo(15.93,4.63,17.31,4.53,18.45,5.01)
      ctx.fill(topCap)

      const topCentre = new Path2D()
      topCentre.moveTo(13.07,1.25)
      topCentre.bezierCurveTo(13.41,1.31,14.84,1.66,15.40,3.62)
      topCentre.bezierCurveTo(14.57,3.81,13.77,4.11,13.01,4.50)
      topCentre.bezierCurveTo(12.28,4.12,11.50,3.83,10.69,3.63)
      topCentre.bezierCurveTo(10.78,3.03,11.07,2.47,11.49,2.04)
      topCentre.bezierCurveTo(11.92,1.61,12.48,1.34,13.07,1.25)
      ctx.fill(topCentre)

      const leftArc = new Path2D()
      leftArc.moveTo(5.26,7.57)
      leftArc.bezierCurveTo(5.96,5.79,7.58,4.51,9.18,5.01)
      leftArc.bezierCurveTo(6.04,7.05,7.52,12.63,6.80,12.63)
      leftArc.bezierCurveTo(5.52,11.25,4.97,9.44,5.26,7.57)
      ctx.fill(leftArc)

      const sideFlap = new Path2D()
      sideFlap.moveTo(5.05,28.95)
      sideFlap.bezierCurveTo(7.57,28.38,9.29,25.68,10.03,24.28)
      sideFlap.bezierCurveTo(10.74,24.92,11.54,25.44,12.41,25.82)
      sideFlap.lineTo(12.41,29.35)
      sideFlap.bezierCurveTo(10.25,30.81,8.19,31.33,6.29,30.84)
      sideFlap.bezierCurveTo(5.03,30.49,3.88,29.81,2.97,28.86)
      sideFlap.bezierCurveTo(3.64,29.06,4.36,29.09,5.05,28.95)
      ctx.fill(sideFlap)

      // Arrow marks inside shield
      const arrows = [
        [13.68,14.02,17.29,15.38,13.68,16.74],
        [12.42,16.73,8.86,15.38,12.42,14.02],
        [13.68,23.31,16.11,22.45,13.68,24.43],
        [17.25,20.71,13.70,21.96,13.70,20.97,17.75,19.48],
        [18.13,17.97,13.68,19.61,13.68,18.12,18.35,16.36],
        [13.68,12.68,13.68,11.46,18.10,12.99,18.34,14.41],
        [13.68,10.11,13.68,8.95,16.94,9.94,17.64,11.48],
        [13.68,7.62,13.68,6.41,15.78,8.26],
        [12.43,7.62,10.42,8.27,12.45,6.42],
        [9.17,9.99,12.42,8.96,12.42,10.11,8.47,11.49],
        [8.01,12.99,12.40,11.45,12.40,12.68,7.74,14.46],
        [12.42,18.12,12.42,19.61,8.03,17.98,7.76,16.33],
        [12.42,20.96,12.42,21.95,9.01,20.73,8.47,19.49],
        [12.42,23.31,12.42,24.39,10.13,22.49],
      ]
      arrows.forEach(pts => {
        const ap = new Path2D()
        ap.moveTo(pts[0], pts[1])
        for (let i = 2; i < pts.length; i += 2) ap.lineTo(pts[i], pts[i + 1])
        ap.closePath(); ctx.fill(ap)
      })

      // I, K, O letterforms — all WHITE
      ctx.fillStyle = WHITE

      const letterI = new Path2D()
      letterI.moveTo(34.99,1.00); letterI.lineTo(57.78,1.00); letterI.lineTo(45.49,41.36); letterI.lineTo(22.70,41.36); letterI.closePath()
      ctx.fill(letterI)

      const letterK = new Path2D()
      letterK.moveTo(112.15,1.00); letterK.lineTo(89.61,1.00); letterK.lineTo(79.49,13.77)
      letterK.lineTo(83.39,1.00); letterK.lineTo(60.59,1.00); letterK.lineTo(48.30,41.36)
      letterK.lineTo(71.09,41.36); letterK.lineTo(75.11,28.18); letterK.lineTo(79.20,41.53)
      letterK.lineTo(102.67,41.53); letterK.lineTo(96.27,21.44); letterK.closePath()
      ctx.fill(letterK)

      const letterO = new Path2D()
      letterO.moveTo(111.04,38.24)
      letterO.bezierCurveTo(106.16,34.98,103.15,29.66,103.15,24.13)
      letterO.bezierCurveTo(103.15,18.19,105.25,12.74,109.93,8.54)
      letterO.bezierCurveTo(115.40,3.59,123.81,1.08,133.02,1.08)
      letterO.bezierCurveTo(148.86,1.08,159,7.52,159,19.64)
      letterO.bezierCurveTo(159,25.29,158.76,29.69,152.35,35.39)
      letterO.bezierCurveTo(146.73,40.42,138.41,42.69,129.06,42.69)
      letterO.bezierCurveTo(121.65,42.69,115.72,41.34,111.04,38.24)
      letterO.moveTo(126.13,21.95)
      letterO.bezierCurveTo(125.86,26.29,127.47,29.30,130.25,29.51)
      letterO.bezierCurveTo(133.37,29.71,135.98,25.81,136.29,20.90)
      letterO.bezierCurveTo(136.55,16.73,134.77,13.77,132.15,13.60)
      letterO.bezierCurveTo(129.00,13.37,126.45,17.03,126.13,21.95)
      ctx.fill(letterO)

      ctx.restore()
      ctx.restore()
    }

    function render() {
      ctx.clearRect(0, 0, W, H)
      ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W, H)
      drawGrid()
      const p = getPhase(tRef.current)
      const pt = getPhaseT(tRef.current)
      if (p === 0) {
        drawDroplet(easeInOut(pt))
        setLabel('Viscous flow…')
      } else if (p === 1) {
        drawCircleSample(1)
        drawScanLine(pt, 1)
        setLabel('Precision scan…')
      } else if (p === 2) {
        drawCircleSample(lerp(1, 0, clamp((pt - 0.5) * 4, 0, 1)))
        drawHexagon(clamp(pt * 3, 0, 1))
        drawScanLine(1, lerp(1, 0, clamp(pt * 4, 0, 1)))
        drawCheckmark(clamp((pt - 0.35) / 0.65, 0, 1))
        setLabel('QA approved')
      } else if (p === 3) {
        const fi = clamp((tRef.current - PHASE_T[3]) / 40, 0, 1)
        drawHexagon(1)
        drawCheckmark(lerp(1, 0, clamp(fi * 3, 0, 1)))
        drawIKOLogo(easeOut(fi))
        setLabel('Loading dashboard…')
      }
    }

    function loop() {
      tRef.current++
      render()
      if (tRef.current < PHASE_T[PHASE_T.length - 1] + 60) {
        animRef.current = requestAnimationFrame(loop)
      }
    }

    animRef.current = requestAnimationFrame(loop)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [])

  if (phase === 'gone') return null

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      width: '100vw', height: '100vh',
      background: '#1C2B4B',
      zIndex: 99999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1.5rem',
      opacity: phase === 'fading' ? 0 : 1,
      transition: 'opacity 0.6s ease',
    }}>
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        style={{ width: 240, height: 240 }}
      />
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '0.6875rem',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.3)',
          marginBottom: 6,
          fontFamily: 'Inter, sans-serif',
        }}>
          Grangemill · QA System
        </div>
        <div style={{
          fontSize: '0.9375rem',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.6)',
          fontFamily: 'Inter, sans-serif',
          minWidth: 180,
        }}>
          {label}
        </div>
      </div>
    </div>
  )
}
