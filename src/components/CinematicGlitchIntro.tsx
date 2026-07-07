'use client'

import React, { useState, useEffect, useRef } from 'react'

interface CinematicGlitchIntroProps {
  /** 主站数据是否就绪 — 若 false, 故障阶段会在 99% 卡点等待 */
  isDataLoaded?: boolean
  /** 闸门裂开后的回调, 用于卸载本组件并显示主站 */
  onUnlock: () => void
}

/**
 * 电影级·科幻系统深层引导开场
 *
 * 四阶段叙事 (~4.5 秒):
 *  Stage 1 (0.0 - 1.5s)  终端系统初始化微文本 — 黑客绿字 CORE_INIT 闪烁输入
 *  Stage 2 (1.5 - 1.6s)  量子故障爆发 — APEX ROOT 文字伴随 cubic-bezier 弹出
 *  Stage 3 (1.6 - 4.2s)  赛博故障持续 — RGB 红青三层色差抖动 + 扫描线
 *  Stage 4 (4.2 - 5.0s)  电子闸门破裂 — 上下两扇闸门向相反方向裂开, 主内容放大虚化
 *
 * 设计要点:
 *  - 无任何彩蛋 (按用户明确要求)
 *  - 纯 CSS keyframes 驱动, 无 Canvas, 无外部库
 *  - 自适应: 移动端字号缩小, 横屏竖屏均可用
 *  - 支持键盘 ESC 跳过 (无障碍)
 *  - 99% 数据卡点 — 若 isDataLoaded=false, 故障阶段会停在 99% 等待数据就绪
 */

// 终端启动阶段会逐行闪现的硬核日志
const BOOT_LOGS = [
  'CORE_INIT::LOADING_ROOT_PROTOCOL...',
  '[BOOT] Mounting /dev/__properties__ ...',
  '[L01] Verifying bootloader signature ...',
  '[L05] Zygote memory fork handshake ...',
  '[L09] Direct SVC syscall integrity ...',
  '[L13] TEE KeyAttestation challenge ...',
  '[L16] Hypervisor envelope check ...',
  'ROOT_PROTOCOL::ARMED.',
]

export default function CinematicGlitchIntro({ isDataLoaded = true, onUnlock }: CinematicGlitchIntroProps) {
  // gateOpen: 是否已触发闸门裂开
  const [gateOpen, setGateOpen] = useState(false)
  // currentBootLog: 终端启动阶段当前显示的日志行
  const [currentBootLog, setCurrentBootLog] = useState(BOOT_LOGS[0] || '')
  // progress: 故障阶段的百分比读数 (装饰性, 但 isDataLoaded=false 时会卡在 99)
  const [progress, setProgress] = useState(0)
  // phase: 当前所处的叙事阶段
  const [phase, setPhase] = useState<'boot' | 'glitch' | 'gate'>('boot')

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const bootIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // 保存最新的 onUnlock 回调, 避免 triggerGateOpen 依赖它而导致 effect 重跑
  const onUnlockRef = useRef(onUnlock)
  useEffect(() => {
    onUnlockRef.current = onUnlock
  }, [onUnlock])

  // 添加 timer 到 ref 数组, 便于卸载时统一清理
  const addTimer = (fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }

  // === 阶段 4: 触发闸门裂开 ===
  // 必须在引用它的 effect 之前声明
  const triggerGateOpen = () => {
    setPhase('gate')
    setGateOpen(true)
    // 800ms 后闸门完全移出视口, 通知父组件卸载本组件
    addTimer(() => {
      onUnlockRef.current()
    }, 800)
  }

  // === 阶段 1: 终端启动日志逐行闪现 (0 - 1.5s) ===
  useEffect(() => {
    let idx = 0
    bootIntervalRef.current = setInterval(() => {
      idx += 1
      if (idx >= BOOT_LOGS.length) {
        if (bootIntervalRef.current) clearInterval(bootIntervalRef.current)
        return
      }
      setCurrentBootLog(BOOT_LOGS[idx] || '')
    }, 180) // 每 180ms 切换一行, 8 行约 1.44s

    return () => {
      if (bootIntervalRef.current) clearInterval(bootIntervalRef.current)
    }
  }, [])

  // === 阶段 2/3: 1.5s 后切换到故障爆发阶段 ===
  useEffect(() => {
    addTimer(() => {
      setPhase('glitch')
    }, 1500)
  }, [])

  // === 阶段 3: 故障百分比读数推进 (1.5s - 4.2s) ===
  useEffect(() => {
    // 延迟到故障阶段才开始读条
    const startDelay = addTimer(() => {
      let p = 0
      progressIntervalRef.current = setInterval(() => {
        p += Math.floor(Math.random() * 4) + 2
        if (p >= 99) {
          p = 99
          setProgress(99)

          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)

          if (!isDataLoaded) {
            // 数据未就绪 — 卡在 99% 轮询等待
            pollingRef.current = setInterval(() => {
              if (isDataLoaded) {
                if (pollingRef.current) clearInterval(pollingRef.current)
                triggerGateOpen()
              }
            }, 100)
          } else {
            // 数据已就绪 — 短暂延迟后触发闸门裂开
            addTimer(() => triggerGateOpen(), 600)
          }
        } else {
          setProgress(p)
        }
      }, 60)
    }, 1600)

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (pollingRef.current) clearInterval(pollingRef.current)
      void startDelay
    }
  }, [isDataLoaded])

  // === 兜底: 4.2s 后强制触发闸门 (即使进度未跑完) ===
  useEffect(() => {
    addTimer(() => {
      setPhase((prev) => {
        // 只有还在故障阶段才强制跳过, 已进入 gate 阶段则不再触发
        if (prev === 'glitch') {
          triggerGateOpen()
        }
        return prev
      })
    }, 4200)
  }, [])

  // === 无障碍: ESC 键跳过开场 ===
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase !== 'gate') {
        triggerGateOpen()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [phase])

  // === 卸载时清理所有 timer ===
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
      if (bootIntervalRef.current) clearInterval(bootIntervalRef.current)
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  return (
    <div
      id="apex-cinematic-container"
      className={`fixed inset-0 z-[9999] bg-[#050508] flex items-center justify-center overflow-hidden font-mono select-none ${gateOpen ? 'gate-open' : ''}`}
      role="dialog"
      aria-label="系统初始化中"
      aria-busy="true"
    >
      {/* 背景科技网格线条 */}
      <div className="absolute inset-0 cinematic-grid-overlay" aria-hidden="true" />

      {/* 四角战术边框 UI — 强化电影感 */}
      <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-[#1a1a24] z-30" aria-hidden="true" />
      <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-[#1a1a24] z-30" aria-hidden="true" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-[#1a1a24] z-30" aria-hidden="true" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-[#1a1a24] z-30" aria-hidden="true" />

      {/* 顶部状态栏 */}
      <div className="absolute top-8 left-12 right-12 flex justify-between text-[10px] text-[#3a3a44] tracking-[0.3em] uppercase z-30" aria-hidden="true">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full ${phase === 'gate' ? 'bg-[#00ff66]' : 'bg-[#ff0055] animate-pulse'}`} />
          {phase === 'boot' ? 'SYS_BOOT' : phase === 'glitch' ? 'QUANTUM_GLITCH' : 'GATE_BREACH'}
        </div>
        <div className="hidden sm:block">APEX_GUARD_V2.6.0</div>
      </div>

      {/* 主内容区 */}
      <div className="relative text-center z-20 cinematic-content">
        {/* 阶段一: 终端系统初始化微文本 */}
        <div className="terminal-boot mb-5 sm:mb-8">
          <span className="pulse-dot" aria-hidden="true" />
          <span className="boot-string text-[10px] sm:text-xs text-[#00ff66] tracking-[0.2em] uppercase">
            {currentBootLog}
          </span>
        </div>

        {/* 阶段二 & 三: 三层量子故障文本 */}
        <div className="glitch-box">
          <h1
            className="glitch-title text-4xl sm:text-6xl md:text-7xl font-black text-white uppercase"
            data-text="APEX ROOT"
            style={{ letterSpacing: '0.3em', paddingLeft: '0.3em' }}
          >
            APEX ROOT
          </h1>
        </div>

        {/* 故障阶段才显示的百分比读数 */}
        {phase === 'glitch' && (
          <div className="mt-6 sm:mt-8 flex items-center justify-center gap-3 cinematic-progress">
            <div className="text-[#00ff66] text-xs sm:text-sm font-bold tabular-nums tracking-wider">
              {progress.toString().padStart(2, '0')}%
            </div>
            <div className="w-32 sm:w-48 h-[2px] bg-[#1a1a24] overflow-hidden">
              <div
                className="h-full bg-[#00ff66] transition-all duration-75 shadow-[0_0_8px_#00ff66]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-[#3a3a44] text-[10px] tracking-widest uppercase hidden sm:block">
              {progress >= 99 ? 'ARMED' : 'BREACHING'}
            </div>
          </div>
        )}

        {/* 阶段四: 闸门裂开时显示的破甲提示 */}
        {phase === 'gate' && (
          <div className="mt-6 sm:mt-8 text-[#ff0055] text-xs sm:text-sm font-bold tracking-[0.4em] uppercase cinematic-gate-text">
            ▼ GATE BREACH ▼
          </div>
        )}
      </div>

      {/* 动态扫描线 */}
      <div className="scanline" aria-hidden="true" />

      {/* 阶段四: 电子闸门式离场遮罩 — 上下两扇 */}
      <div className="gate gate-top" aria-hidden="true" />
      <div className="gate gate-bottom" aria-hidden="true" />

      {/* 底部水印 */}
      <div className="absolute bottom-8 left-0 right-0 text-center text-[9px] text-[#2a2a34] tracking-[0.3em] uppercase z-30" aria-hidden="true">
        SECURE HARDWARE ENCLAVE BOUND // ANTI-HOOK TRACER ACTIVE
      </div>
    </div>
  )
}
