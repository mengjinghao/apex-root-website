'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

interface GravityWellIntroProps {
  /** 主站数据是否就绪 */
  isDataLoaded?: boolean
  /** 舱门裂开后的回调 */
  onUnlock: () => void
}

/**
 * 鼠标重力黑洞粒子 + 液压机械舱门 + Breach 按钮 + 极客彩蛋
 *
 * 特性:
 *  - Canvas 鼠标重力引力黑洞粒子 (鼠标半径 170px 内粒子被吸附)
 *  - 粒子阻尼归位 (鼠标移开后平滑回到原生坐标)
 *  - 上下液压机械舱门垂直分拆转场
 *  - Breach 按钮触发解锁
 *  - Konami Code (↑↑↓↓←→←→BA) 触发黄金彩蛋
 *  - 盲打 "apex" 触发黄金彩蛋
 *  - ESC 键跳过 (无障碍)
 */

// 粒子文字池 — root-check 主题相关关键词
const PARTICLE_POOL = ['0xEF', '0x00', 'ROOT', 'BYPASS', 'SU', 'ZYGISK', 'APEX', 'INTEGRITY', 'FAIL', 'HOOK']

// 极客彩蛋监听序列
const KONAMI_CODE = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
const CHEAT_WORD = ['a', 'p', 'e', 'x']

export default function GravityWellIntro({ isDataLoaded = true, onUnlock }: GravityWellIntroProps) {
  const [unlocked, setUnlocked] = useState(false)
  const [isGolden, setIsGolden] = useState(false)
  const [hidden, setHidden] = useState(false) // 完全隐藏 (display:none)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -9999, y: -9999, radius: 170 })
  const onUnlockRef = useRef(onUnlock)
  const unlockedRef = useRef(false) // 防止重复触发

  useEffect(() => {
    onUnlockRef.current = onUnlock
  }, [onUnlock])

  // === 解锁系统: 触发液压舱门裂开 ===
  const unlockSystem = useCallback(() => {
    if (unlockedRef.current) return
    unlockedRef.current = true
    setUnlocked(true)
    // 1.2s 后舱门完全移出视口, 通知父组件卸载
    setTimeout(() => {
      setHidden(true)
      onUnlockRef.current()
    }, 1200)
  }, [])

  // === 极客彩蛋: Konami Code + "apex" 盲打 ===
  useEffect(() => {
    let konamiIndex = 0
    let typedString = ''

    const handleKeyDown = (e: KeyboardEvent) => {
      if (unlockedRef.current) return

      // Konami Code 序列匹配
      if (e.key === KONAMI_CODE[konamiIndex]) {
        konamiIndex++
        if (konamiIndex === KONAMI_CODE.length) {
          setIsGolden(true)
          unlockSystem()
          konamiIndex = 0
          return
        }
      } else {
        konamiIndex = 0
      }

      // "apex" 关键字盲打匹配
      typedString += e.key.toLowerCase()
      if (typedString.includes(CHEAT_WORD.join(''))) {
        setIsGolden(true)
        unlockSystem()
        typedString = ''
        return
      }
      if (typedString.length > 20) typedString = typedString.slice(-10)

      // ESC 跳过 (无障碍)
      if (e.key === 'Escape') {
        unlockSystem()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [unlockSystem])

  // === Canvas 鼠标重力黑洞粒子引擎 ===
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId = 0
    let width = (canvas.width = window.innerWidth)
    let height = (canvas.height = window.innerHeight)

    const handleResize = () => {
      width = canvas.width = window.innerWidth
      height = canvas.height = window.innerHeight
      initParticles()
    }
    window.addEventListener('resize', handleResize)

    // 粒子类 — 鼠标重力场 + 阻尼归位
    interface CyberParticle {
      x: number; y: number; baseX: number; baseY: number;
      text: string; density: number; size: number; color: string; alpha: number;
    }
    let particles: CyberParticle[] = []

    function initParticles() {
      particles = []
      const count = Math.min(Math.floor((width * height) / 12000), 130)
      for (let i = 0; i < count; i++) {
        const x = Math.random() * width
        const y = Math.random() * height
        particles.push({
          x, y, baseX: x, baseY: y,
          text: PARTICLE_POOL[Math.floor(Math.random() * PARTICLE_POOL.length)] || '0xEF',
          density: Math.random() * 30 + 15,
          size: Math.random() * 3 + 1,
          color: Math.random() > 0.4 ? '#00ff66' : '#00bfff',
          alpha: Math.random() * 0.4 + 0.2,
        })
      }
    }
    initParticles()

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2
      // 判断鼠标是否靠近中央 Breach 按钮 (半径 280px, 较大范围便于触发)
      const distMouseToCenter = Math.hypot(mouseRef.current.x - centerX, mouseRef.current.y - centerY)
      const isHoveringCenter = distMouseToCenter < 280

      particles.forEach((p) => {
        if (isHoveringCenter) {
          // 鼠标靠近中心时, 粒子吸向中心 Breach 按钮 (黑洞引力)
          const dx = centerX - p.x
          const dy = centerY - p.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.001
          // 越靠近中心, 引力越强
          const force = Math.min(0.15, 12 / dist)
          p.x += (dx / dist) * force * 8
          p.y += (dy / dist) * force * 8
          // 被中心吞噬后从外围重生
          if (dist < 20) {
            const angle = Math.random() * Math.PI * 2
            const radius = Math.max(width, height) * 0.5
            p.x = centerX + Math.cos(angle) * radius
            p.y = centerY + Math.sin(angle) * radius
          }
          p.alpha = 0.95 // 激活高亮
        } else {
          // 鼠标不在中心区域, 粒子利用阻尼运动平滑归位
          if (p.x !== p.baseX) {
            p.x -= (p.x - p.baseX) / 20
          }
          if (p.y !== p.baseY) {
            p.y -= (p.y - p.baseY) / 20
          }
          p.alpha = Math.max(p.alpha - 0.01, 0.3)
        }

        // 渲染: 黄金彩蛋时变金色, 否则保持原色
        ctx.fillStyle = isGolden ? '#eab308' : p.color
        ctx.globalAlpha = p.alpha
        ctx.font = `${Math.floor(p.size * 3) + 8}px 'Share Tech Mono', monospace`
        ctx.fillText(p.text, p.x, p.y)
      })

      // 绘制中心黑洞光晕 (鼠标靠近时显现)
      if (isHoveringCenter) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 120)
        gradient.addColorStop(0, isGolden ? 'rgba(234, 179, 8, 0.5)' : 'rgba(0, 255, 102, 0.5)')
        gradient.addColorStop(0.5, isGolden ? 'rgba(234, 179, 8, 0.15)' : 'rgba(0, 255, 102, 0.15)')
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.globalAlpha = 1
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(centerX, centerY, 120, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameId = requestAnimationFrame(draw)
    }
    draw()

    // 鼠标移动监听
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX
      mouseRef.current.y = e.clientY
    }
    const handleMouseLeave = () => {
      mouseRef.current.x = -9999
      mouseRef.current.y = -9999
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isGolden])

  if (hidden) return null

  return (
    <div
      id="gravity-intro-container"
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden ${unlocked ? 'system-unlocked' : ''}`}
      onMouseMove={(e) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY }}
    >
      {/* 液压机械舱门 — 上半 */}
      <div className="shutter shutter-top flex items-end justify-center pb-4">
        <div className="h-1 w-32 bg-cyan-500/50 rounded-full mb-[-2px] animate-pulse" />
      </div>
      {/* 液压机械舱门 — 下半 */}
      <div className="shutter shutter-bottom flex items-start justify-center pt-4">
        <div className="h-1 w-32 bg-cyan-500/50 rounded-full mt-[-2px] animate-pulse" />
      </div>

      {/* Canvas 粒子层 — z-60 高于舱门 z-50, 粒子在舱门之上可见 */}
      <canvas ref={canvasRef} className="absolute inset-0 z-[60] opacity-80 pointer-events-none" />

      {/* 主内容区 */}
      <div className="z-20 text-center flex flex-col items-center px-4">
        <div
          className={`mb-6 p-6 rounded-xl border backdrop-blur-md max-w-lg ${
            isGolden
              ? 'border-yellow-500/40 bg-black/60 shadow-[0_0_50px_rgba(234,179,8,0.2)]'
              : 'border-emerald-500/20 bg-black/60 shadow-[0_0_50px_rgba(0,255,102,0.1)]'
          }`}
        >
          <h1
            className={`text-3xl md:text-5xl font-extrabold tracking-widest font-mono mb-2 glitch-text select-none ${
              isGolden ? 'text-yellow-400' : 'text-emerald-400'
            }`}
          >
            {isGolden ? 'GOLDEN BYPASS' : 'APEX NEURAL CORE'}
          </h1>
          <p className={`text-xs tracking-widest uppercase font-mono ${isGolden ? 'text-yellow-600/80' : 'text-emerald-600/80'}`}>
            {isGolden ? 'OVERLORD ACCESS GRANTED' : 'ENVIRONMENT AUDIT & SECURITY CONTROL TERMINAL'}
          </p>
        </div>

        <button
          onClick={unlockSystem}
          className={`group relative px-8 py-4 bg-transparent border-2 font-bold uppercase tracking-widest font-mono rounded-lg overflow-hidden transition-all duration-300 cursor-pointer ${
            isGolden
              ? 'border-yellow-500 text-yellow-400 hover:bg-yellow-500/10 hover:shadow-[0_0_35px_rgba(234,179,8,0.4)]'
              : 'border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:shadow-[0_0_35px_rgba(0,255,102,0.4)]'
          }`}
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
          <span className="relative z-10 flex items-center gap-3">
            <span className={`inline-block w-2 h-2 rounded-full animate-ping ${isGolden ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
            {isGolden ? 'GOLDEN BREACH' : 'INITIALIZE BYPASS SCANNER'}
          </span>
        </button>

        <p className="text-[10px] text-gray-600 mt-6 font-mono select-none">
          PRO TIP: TRY ENTERING THE REBEL CODE (KONAMI) OR &quot;apex&quot; ANYWHERE
        </p>
      </div>

      {/* 黄金彩蛋: ACCESS GRANTED 全屏覆盖文字 */}
      {isGolden && !unlocked && (
        <div className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none mix-blend-screen animate-pulse">
          <h1 className="text-6xl md:text-8xl font-black text-yellow-500 tracking-tighter opacity-50 select-none">
            ACCESS GRANTED
          </h1>
        </div>
      )}
    </div>
  )
}
