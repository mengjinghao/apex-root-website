'use client'

import React, { useState, useEffect, useRef } from 'react'

interface TopTierIntroProps {
  isDataLoaded?: boolean // 来自父组件：Prisma 数据和主站图片是否预载完成
  onUnlock: () => void // 解锁成功回调
}

/**
 * 顶级开场组件 — 液压舱门分裂 + 黑洞粒子引力场 + 黄金特权彩蛋
 *
 * 特性:
 *  - Canvas 黑洞粒子引力场 (鼠标靠近核心时粒子被吸入)
 *  - 上下液压舱门机械分裂解锁
 *  - Konami Code / 输入 "apex" 触发黄金特权彩蛋
 *  - 99% 数据卡点 — 等待父组件 isDataLoaded 信号
 */
export default function TopTierIntro({ isDataLoaded = true, onUnlock }: TopTierIntroProps) {
  const [stage, setStage] = useState<'locked' | 'scanning' | 'stabilizing' | 'unlocking'>('locked')
  const [progress, setProgress] = useState(0)
  const [currentLayerLog, setCurrentLayerLog] = useState('STANDBY: AWAITING CORE INITIATION')
  const [isGoldenEgg, setIsGoldenEgg] = useState(false) // 是否触发黄金彩蛋

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -1000, y: -1000, isNearCenter: false })
  const keyboardBuffer = useRef<string[]>([])
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // 16 层攻防检测硬核日志
  const scanLogs = [
    'STAGE 01: Intercepting Bootloader Verification Vectors...',
    'STAGE 03: Mapping VbMeta Partition Cryptographic Salt...',
    'STAGE 05: Analyzing Zygote Memory Space Allocations...',
    'STAGE 08: Executing Direct SVC Inline Syscall Auditing...',
    'STAGE 11: Ptrace Anti-Debug Hook Traps Deployed...',
    'STAGE 13: Querying TEE Hardware KeyAttestation Blocks...',
    'STAGE 15: RPMB Cryptographic Handshake Validated...',
    'STAGE 16: Hypervisor Enforced Integrity Check: COMPLETE.',
  ]

  // 彩蛋监听：Konami Code & "apex"
  useEffect(() => {
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']
    const cheatWord = ['a', 'p', 'e', 'x']

    const handleKeyDown = (e: KeyboardEvent) => {
      if (stage === 'unlocking') return

      keyboardBuffer.current.push(e.key)
      if (keyboardBuffer.current.length > 20) keyboardBuffer.current.shift()

      const lastKeys = keyboardBuffer.current.join(',')
      const isKonamiMatch = lastKeys.includes(konami.join(','))
      const isApexMatch = lastKeys.includes(cheatWord.join(','))

      if (isKonamiMatch || isApexMatch) {
        setIsGoldenEgg(true)
        setStage('unlocking')
        setCurrentLayerLog('🚨 OVERRIDE: ELITE BYPASS GRANTED. WELCOME PRO-USER.')
        setTimeout(() => onUnlock(), 1200) // 黄金舱门炸开延迟
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stage, onUnlock])

  // Canvas 黑洞粒子引力场模拟
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
    }
    window.addEventListener('resize', handleResize)

    // 初始化 0xEF 进制碎片粒子
    const particles: { x: number; y: number; ox: number; oy: number; speed: number; size: number; text: string }[] = []
    for (let i = 0; i < 80; i++) {
      const rx = Math.random() * width
      const ry = Math.random() * height
      particles.push({
        x: rx, y: ry, ox: rx, oy: ry, // 记录原始坐标用于复原
        speed: Math.random() * 1 + 0.5,
        size: Math.random() * 2 + 1,
        text: Math.random() > 0.5 ? '0xEF' : '0x7F',
      })
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(10, 8, 16, 0.25)' // 优雅的拖影效果 — 与站点背景 #0a0810 对齐
      ctx.fillRect(0, 0, width, height)

      const centerX = width / 2
      const centerY = height / 2

      // 实时计算鼠标和中心按钮的关系
      const mdx = mouseRef.current.x - centerX
      const mdy = mouseRef.current.y - centerY
      const mDist = Math.sqrt(mdx * mdx + mdy * mdy)
      // 鼠标距离中心按钮 120px 内激活动态引力
      mouseRef.current.isNearCenter = mDist < 120

      particles.forEach((p) => {
        // 计算粒子到核心的距离
        const pdx = centerX - p.x
        const pdy = centerY - p.y
        const pDist = Math.sqrt(pdx * pdx + pdy * pdy) || 0.001

        if ((mouseRef.current.isNearCenter && pDist < 350) || stage === 'scanning') {
          // 【引力场逻辑】距离越近，吸入速度越快
          const force = (350 - pDist) / 350
          p.x += (pdx / pDist) * force * 6
          p.y += (pdy / pDist) * force * 6

          // 如果离核心太近（被黑洞吞噬），从外围重新随机刷新
          if (pDist < 20) {
            p.x = Math.random() * width
            p.y = Math.random() * height
          }
          ctx.fillStyle = isGoldenEgg ? 'rgba(234, 179, 8, 0.7)' : 'rgba(146, 111, 255, 0.7)'
        } else {
          // 【复原平衡逻辑】鼠标离开，粒子平滑回到原本的自上而下漂浮轨迹
          p.y -= p.speed
          if (p.y < 0) p.y = height
          // 慢慢向原始 X 靠拢归位
          p.x += (p.ox - p.x) * 0.02
          ctx.fillStyle = 'rgba(0, 183, 192, 0.3)'
        }

        ctx.font = '9px monospace'
        ctx.fillText(p.text, p.x, p.y)
      })

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
    }
  }, [stage, isGoldenEgg])

  // 核心突防扫描读条与预载卡点状态机
  const executeUnlock = () => {
    setProgress(100)
    setStage('unlocking')
    setCurrentLayerLog('✓ LINK ENFORCED. INJECTING OVERLAY WEB-FRAME...')
    setTimeout(() => onUnlock(), 1200) // 预留 1.2 秒给液压舱门完全划出屏幕
  }

  const startCoreScan = () => {
    setStage('scanning')
    let currentProgress = 0

    const interval = setInterval(() => {
      // 模拟突防进度
      currentProgress += Math.floor(Math.random() * 3) + 1

      if (currentProgress >= 99) {
        // 【核心视觉欺骗】到达 99% 时，如果数据没就绪，强制锁死在 99 休眠状态
        if (!isDataLoaded) {
          setProgress(99)
          setStage('stabilizing')
          setCurrentLayerLog('⌛ STABILIZING DATASTREAM... AWAITING PRISMA HANDSHAKE')
          clearInterval(interval)

          // 轮询检查父组件数据就绪状态
          pollingRef.current = setInterval(() => {
            if (isDataLoaded) {
              if (pollingRef.current) clearInterval(pollingRef.current)
              executeUnlock()
            }
          }, 100)
          return
        }

        // 如果数据早已就绪，直接放行突破 100%
        currentProgress = 100
        setProgress(100)
        clearInterval(interval)
        executeUnlock()
      } else {
        setProgress(currentProgress)
        const logIndex = Math.floor((currentProgress / 100) * scanLogs.length)
        setCurrentLayerLog(scanLogs[logIndex] || scanLogs[scanLogs.length - 1])
      }
    }, 30)
  }

  // 组件卸载时清理 polling
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0a0810] overflow-hidden font-mono select-none"
      onMouseMove={(e) => { mouseRef.current.x = e.clientX; mouseRef.current.y = e.clientY }}
    >
      {/* 物理割裂的双层液压机械舱门结构 */}
      {/* 上半壁舱门 */}
      <div
        className={`absolute top-0 left-0 w-full h-1/2 bg-[#0a0810]/95 border-b border-border/60 transition-transform duration-[1200ms] z-10 flex flex-col justify-end pb-12 ${
          stage === 'unlocking' ? '-translate-y-full' : ''
        } ${isGoldenEgg ? 'border-yellow-500/40' : ''}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)' }}
      >
        {stage === 'locked' && (
          <div className="text-center px-4">
            <h1 className={`text-2xl sm:text-3xl font-black tracking-[0.3em] uppercase mb-2 ${isGoldenEgg ? 'text-yellow-400' : 'gradient-text'}`}>
              {isGoldenEgg ? 'GOLDEN PRIVILEGE BYPASS' : 'APEX-ROOT CORE ATTESTATION'}
            </h1>
            <p className="text-[11px] text-muted-foreground tracking-wider">
              HARDWARE ATTENUATION SHIELD // LEVEL 16 ACTIVE
            </p>
          </div>
        )}
      </div>

      {/* 下半壁舱门 */}
      <div
        className={`absolute bottom-0 left-0 w-full h-1/2 bg-[#0a0810]/95 border-t border-border/60 transition-transform duration-[1200ms] z-10 pt-12 ${
          stage === 'unlocking' ? 'translate-y-full' : ''
        } ${isGoldenEgg ? 'border-yellow-500/40' : ''}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.85, 0, 0.15, 1)' }}
      >
        {(stage === 'scanning' || stage === 'stabilizing') && (
          <div className="max-w-xl mx-auto px-6 space-y-4 text-center">
            <div className={`text-5xl sm:text-6xl font-black font-mono tracking-tighter ${stage === 'stabilizing' ? 'text-yellow-400 animate-pulse' : 'text-primary'}`}>
              {progress}
              <span className="text-sm font-normal text-muted-foreground">%</span>
            </div>
            <div className="w-full h-[2px] bg-border rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  stage === 'stabilizing' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.6)]' : 'bg-primary shadow-[0_0_15px_rgba(146,111,255,0.8)]'
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
              {currentLayerLog}
            </div>
          </div>
        )}
      </div>

      {/* 独立背景层：Canvas 粒子系统与核心引力按钮（不受舱门分裂影响，增强空间错落感） */}
      <div className="absolute inset-0 z-0 flex flex-col items-center justify-center">
        <canvas ref={canvasRef} className="absolute inset-0 block pointer-events-none" />

        {stage === 'locked' && (
          <button
            onClick={startCoreScan}
            className={`relative w-28 h-28 rounded-full border bg-black/60 flex flex-col items-center justify-center font-bold tracking-widest text-xs transition-all duration-300 z-20 group ${
              isGoldenEgg
                ? 'border-yellow-500 text-yellow-400 shadow-[0_0_40px_rgba(234,179,8,0.3)]'
                : 'border-primary/40 text-primary hover:border-primary hover:shadow-[0_0_35px_rgba(146,111,255,0.4)]'
            }`}
          >
            {/* 旋转流光齿轮 */}
            <div className="absolute inset-0 rounded-full border-t border-b border-transparent border-l-primary border-r-primary animate-spin group-hover:scale-110 transition-transform" />
            <span className="text-[10px] text-muted-foreground font-medium scale-90 mb-0.5">INITIATE</span>
            <span className="tracking-widest">BREACH</span>
          </button>
        )}
      </div>

      {/* 四角战术边框 UI */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-border/70 z-30" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-border/70 z-30" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-border/70 z-30" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-border/70 z-30" />

      {/* 顶部核心状态栏 */}
      <div className="absolute top-8 left-12 right-12 flex justify-between text-[11px] text-muted-foreground tracking-widest z-30">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${stage === 'scanning' ? 'bg-red-500 animate-ping' : 'bg-primary'}`} />
          SYSTEM_INTEGRITY: {stage === 'locked' ? 'ENFORCED (SECURE)' : stage === 'scanning' ? 'UNDER_ANALYSIS' : stage === 'stabilizing' ? 'STABILIZING' : 'DECRYPTED'}
        </div>
        <div className="hidden sm:block">HOST: APEX_GUARD_PROTOTYPE_V2</div>
      </div>

      {/* 底部安全警告免责水印 */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-[10px] text-muted-foreground/40 tracking-widest font-mono z-30">
        SECURE HARDWARE ENCLAVE BOUND // ANTI-HOOK TRACER ACTIVE
      </div>
    </div>
  )
}
