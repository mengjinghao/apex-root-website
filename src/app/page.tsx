'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Shield, ShieldCheck, ShieldAlert, Zap, Radar, Terminal, Cpu, Lock,
  Bug, Eye, EyeOff, Gamepad2, Download, Github, AlertTriangle,
  CheckCircle2, XCircle, Loader2, Activity, Fingerprint,
  Skull, Sparkles, Flame, ChevronRight, Play, RotateCcw,
  Trophy, Target, Gauge, Layers as LayersIcon, Power
} from 'lucide-react'

// ═══════════════════════════════════════════════════
// 数据
// ═══════════════════════════════════════════════════

const LAYERS = [
  { id: 1, name: '系统属性', icon: Shield, color: '#a855f7', desc: 'ro.debuggable / ro.secure', threat: '低' },
  { id: 2, name: 'ART 注入', icon: Bug, color: '#06b6d4', desc: 'Frida / Xposed / LSPosed', threat: '高' },
  { id: 3, name: '内存特征', icon: Cpu, color: '#22c55e', desc: 'Magisk / Zygisk / Shamiko', threat: '高' },
  { id: 4, name: '挂载检查', icon: LayersIcon, color: '#06b6d4', desc: 'overlayfs / bind-mount', threat: '中' },
  { id: 5, name: '侧信道', icon: Activity, color: '#eab308', desc: 'syscall 时延分析', threat: '中' },
  { id: 6, name: 'Root 守护', icon: Skull, color: '#ef4444', desc: 'magiskd / ksud / apd', threat: '高' },
  { id: 7, name: '启动链', icon: Lock, color: '#06b6d4', desc: 'Bootloader / AVB / dm-verity', threat: '低' },
  { id: 8, name: 'Magisk', icon: Flame, color: '#ef4444', desc: 'Delta/Kitsune/Kitana fork', threat: '高' },
  { id: 9, name: 'KernelSU', icon: Cpu, color: '#22c55e', desc: 'KSU / SukiSU / NEXT', threat: '高' },
  { id: 10, name: 'APatch', icon: Cpu, color: '#a855f7', desc: 'APD / KPM 模块', threat: '中' },
  { id: 11, name: 'Hook 框架', icon: Bug, color: '#06b6d4', desc: 'Xposed / Frida / Substrate', threat: '高' },
  { id: 12, name: '自定义 ROM', icon: Sparkles, color: '#eab308', desc: '50+ ROM 标识', threat: '低' },
  { id: 13, name: '固件完整性', icon: Fingerprint, color: '#06b6d4', desc: 'TEE / Modem / Recovery', threat: '中' },
  { id: 14, name: '虚拟框架', icon: Eye, color: '#22c55e', desc: 'VirtualXposed / 太极', threat: '中' },
  { id: 15, name: '危险应用', icon: AlertTriangle, color: '#ef4444', desc: 'GameGuardian / CE', threat: '中' },
  { id: 16, name: 'Magisk 扩展', icon: Shield, color: '#a855f7', desc: 'DenyList / ZygiskNext', threat: '中' },
]

const SCAN_LOGS = [
  { t: '[INIT]', m: '加载原生检测引擎 libapex_root.so...', type: 'info' },
  { t: '[INIT]', m: 'eBPF 防火墙就绪 (kernel 5.15+)', type: 'info' },
  { t: '[L1]', m: '读取 /dev/__properties__', type: 'info' },
  { t: '[L1]', m: 'ro.debuggable=0 ✓  ro.secure=1 ✓', type: 'ok' },
  { t: '[L2]', m: '扫描 /proc/self/maps', type: 'info' },
  { t: '[L2]', m: 'Frida gadget 未发现 ✓', type: 'ok' },
  { t: '[L3]', m: 'RWX 页面检测... 发现 2 个可疑映射', type: 'warn' },
  { t: '[L3]', m: '⚠ Magisk 匿名映射特征匹配!', type: 'danger' },
  { t: '[L4]', m: '解析 /proc/self/mountinfo', type: 'info' },
  { t: '[L4]', m: 'overlayfs 挂载异常 ⚠', type: 'warn' },
  { t: '[L5]', m: 'ARM64 裸 svc 指令计时...', type: 'info' },
  { t: '[L5]', m: 'syscall 时延正常 ✓', type: 'ok' },
  { t: '[L6]', m: '枚举 /proc/*/cmdline', type: 'info' },
  { t: '[L6]', m: '⚠ 发现 magiskd (PID 4231)', type: 'danger' },
  { t: '[L7]', m: '读取 /proc/cmdline', type: 'info' },
  { t: '[L7]', m: 'Bootloader: unlocked ⚠', type: 'warn' },
  { t: '[L8]', m: '扫描 Magisk 守护进程', type: 'info' },
  { t: '[L8]', m: '⚠ /data/adb/magisk 存在!', type: 'danger' },
  { t: '[L9]', m: '检测 KernelSU', type: 'info' },
  { t: '[L9]', m: '/data/adb/ksu 不存在 ✓', type: 'ok' },
  { t: '[L10]', m: '检测 APatch', type: 'info' },
  { t: '[L10]', m: '/data/adb/ap 不存在 ✓', type: 'ok' },
  { t: '[L11]', m: 'Hook 框架扫描', type: 'info' },
  { t: '[L11]', m: 'LSPosed 未检测到 ✓', type: 'ok' },
  { t: '[L12]', m: 'build.prop 多分区扫描', type: 'info' },
  { t: '[L12]', m: '官方 ROM ✓', type: 'ok' },
  { t: '[L13]', m: 'TEE / Modem 分区检查', type: 'info' },
  { t: '[L13]', m: 'dm-verity 启用 ✓', type: 'ok' },
  { t: '[L14]', m: '虚拟框架检测', type: 'info' },
  { t: '[L14]', m: 'VirtualXposed 未检测到 ✓', type: 'ok' },
  { t: '[L15]', m: '危险应用扫描', type: 'info' },
  { t: '[L15]', m: 'GameGuardian 未安装 ✓', type: 'ok' },
  { t: '[L16]', m: 'Magisk 扩展检测', type: 'info' },
  { t: '[L16]', m: '⚠ DenyList 配置发现!', type: 'danger' },
  { t: '[DONE]', m: '16 层检测完成', type: 'done' },
  { t: '[RESULT]', m: '风险评分: 62/100  高风险', type: 'result' },
]

const FEATURES = [
  { icon: Radar, title: '16 层深度检测', desc: '从系统属性到固件完整性，全维度安全审计', color: '#a855f7' },
  { icon: EyeOff, title: '3 模式隐藏', desc: 'Detection / Hide / Game 三种隐藏策略', color: '#06b6d4' },
  { icon: Lock, title: '后量子签名', desc: 'ML-DSA-65 (CRYSTALS-Dilithium-3)', color: '#22c55e' },
  { icon: Zap, title: 'eBPF 防火墙', desc: 'Android 12+ 内核级 syscall 拦截', color: '#eab308' },
  { icon: Cpu, title: '微服务架构', desc: '20 个独立 .so 插件，热加载', color: '#a855f7' },
  { icon: Terminal, title: '原生引擎', desc: 'C++20 + NDK 28，ARM64 裸 syscall', color: '#ef4444' },
]

const DETECTED_LAYERS = [3, 4, 6, 8, 16] // 模拟检测到异常的层

// ═══════════════════════════════════════════════════
// 开场动画组件
// ═══════════════════════════════════════════════════

function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),   // logo 出现
      setTimeout(() => setPhase(2), 800),   // 文字出现
      setTimeout(() => setPhase(3), 2000),  // 开始淡出
      setTimeout(() => onComplete(), 2700), // 完成
    ]
    return () => timers.forEach(clearTimeout)
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background"
      style={{
        opacity: phase >= 3 ? 0 : 1,
        transition: 'opacity 0.7s ease-out',
        pointerEvents: phase >= 3 ? 'none' : 'auto',
      }}
    >
      {/* 扩散光环 */}
      {phase >= 1 && (
        <>
          <div className="absolute w-32 h-32 rounded-full border-2 border-primary animate-intro-ring" />
          <div className="absolute w-32 h-32 rounded-full border-2 border-primary animate-intro-ring" style={{ animationDelay: '0.3s' }} />
        </>
      )}

      {/* Logo */}
      <div className="relative flex flex-col items-center">
        {phase >= 1 && (
          <div className="relative w-24 h-24 mb-8 animate-intro-zoom">
            <div className="absolute inset-0 rounded-3xl bg-primary/20 animate-pulse-glow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-12 h-12 text-primary" />
            </div>
          </div>
        )}

        {phase >= 2 && (
          <div className="text-center animate-intro-text">
            <h1 className="text-5xl font-black gradient-text mb-2">APEX-Root</h1>
            <p className="text-sm text-muted-foreground font-mono tracking-widest">
              16-LAYER DETECTION ENGINE
            </p>
          </div>
        )}
      </div>

      {/* 底部加载条 */}
      {phase >= 2 && (
        <div className="absolute bottom-20 w-64">
          <div className="h-0.5 bg-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground mt-3 font-mono">
            INITIALIZING...
          </p>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 雷达组件
// ═══════════════════════════════════════════════════

function RadarDisplay({
  scanning,
  layerResults,
}: {
  scanning: boolean
  layerResults: Record<number, 'clean' | 'detected' | 'pending'>
}) {
  return (
    <div className="relative aspect-square max-w-[280px] mx-auto">
      {/* 同心圆 */}
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-[12%] rounded-full border border-primary/15" />
      <div className="absolute inset-[25%] rounded-full border border-primary/10" />
      <div className="absolute inset-[37%] rounded-full border border-primary/5" />

      {/* 十字线 */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/20" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20" />

      {/* 扫描线 */}
      {scanning && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(168, 85, 247, 0.35) 50deg, transparent 90deg)',
            animation: 'radar-sweep 2.5s linear infinite',
          }}
        />
      )}

      {/* 中心点 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className={`w-3 h-3 rounded-full ${scanning ? 'bg-primary animate-ping' : 'bg-primary/40'}`} />
      </div>

      {/* 检测到的威胁点 */}
      {LAYERS.map(layer => {
        if (layerResults[layer.id] !== 'detected') return null
        const angle = (layer.id / 16) * 360 - 90
        const radius = 25 + (layer.id % 4) * 8
        const x = 50 + Math.cos((angle * Math.PI) / 180) * radius
        const y = 50 + Math.sin((angle * Math.PI) / 180) * radius
        return (
          <motion.div
            key={layer.id}
            className="absolute w-2.5 h-2.5 rounded-full bg-red-500"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.4, 1] }}
            transition={{ duration: 0.4 }}
          >
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
          </motion.div>
        )
      })}

      {/* 安全点 */}
      {LAYERS.map(layer => {
        if (layerResults[layer.id] !== 'clean') return null
        const angle = (layer.id / 16) * 360 - 90
        const radius = 20 + (layer.id % 4) * 8
        const x = 50 + Math.cos((angle * Math.PI) / 180) * radius
        const y = 50 + Math.sin((angle * Math.PI) / 180) * radius
        return (
          <motion.div
            key={layer.id}
            className="absolute w-1.5 h-1.5 rounded-full bg-green-400"
            style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
        )
      })}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 终端日志组件
// ═══════════════════════════════════════════════════

function TerminalLog({ logs }: { logs: typeof SCAN_LOGS }) {
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const colorMap: Record<string, string> = {
    info: 'text-cyan-400',
    ok: 'text-green-400',
    warn: 'text-yellow-400',
    danger: 'text-red-400',
    done: 'text-purple-400 font-bold',
    result: 'text-red-500 font-bold',
  }

  return (
    <div className="bg-black/50 rounded-xl p-4 font-mono text-xs h-72 overflow-y-auto border border-border/30">
      {logs.length === 0 ? (
        <div className="text-muted-foreground/40 flex items-center h-full justify-center">
          <span className="animate-blink">▊</span>
          <span className="ml-1">等待初始化...</span>
        </div>
      ) : (
        <>
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              className={`whitespace-pre-wrap break-all ${colorMap[log.type] || 'text-muted-foreground'} terminal-text`}
            >
              <span className="text-muted-foreground/60">{log.t}</span> {log.m}
            </motion.div>
          ))}
          <div ref={logEndRef} />
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 风险仪表盘
// ═══════════════════════════════════════════════════

function RiskGauge({ score }: { score: number }) {
  const angle = (score / 100) * 180 - 90
  const color = score > 60 ? '#ef4444' : score > 30 ? '#eab308' : '#22c55e'

  return (
    <div className="relative w-40 h-20 mx-auto">
      <svg viewBox="0 0 100 50" className="w-full h-full">
        {/* 背景弧 */}
        <path d="M 10 45 A 40 40 0 0 1 90 45" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" strokeLinecap="round" />
        {/* 进度弧 */}
        <motion.path
          d="M 10 45 A 40 40 0 0 1 90 45"
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray="125.6"
          initial={{ strokeDashoffset: 125.6 }}
          animate={{ strokeDashoffset: 125.6 - (125.6 * score) / 100 }}
          transition={{ duration: 0.5 }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
        <motion.div
          key={score}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="text-3xl font-black"
          style={{ color }}
        >
          {score}
        </motion.div>
        <div className="text-xs text-muted-foreground">/ 100</div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 粒子背景
// ═══════════════════════════════════════════════════

function ParticleBackground() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: 10 + Math.random() * 15,
    size: 1 + Math.random() * 3,
  }))

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-primary/30"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            animation: `particle-float ${p.duration}s linear infinite`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════

export default function Home() {
  const [showIntro, setShowIntro] = useState(true)
  const [section, setSection] = useState<'hero' | 'scanner' | 'layers' | 'features' | 'download'>('hero')
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [scanProgress, setScanProgress] = useState(0)
  const [currentLayer, setCurrentLayer] = useState(0)
  const [logs, setLogs] = useState<typeof SCAN_LOGS>([])
  const [layerResults, setLayerResults] = useState<Record<number, 'clean' | 'detected' | 'pending'>>({})
  const [riskScore, setRiskScore] = useState(0)
  const [scanCount, setScanCount] = useState(0)
  const [achievements, setAchievements] = useState<string[]>([])
  const intervalsRef = useRef<{ log?: ReturnType<typeof setInterval>; progress?: ReturnType<typeof setInterval> }>({})

  // 清理 intervals
  useEffect(() => {
    return () => {
      if (intervalsRef.current.log) clearInterval(intervalsRef.current.log)
      if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress)
    }
  }, [])

  // 扫描逻辑
  const startScan = useCallback(() => {
    if (scanState === 'scanning') return

    // 清理旧 intervals
    if (intervalsRef.current.log) clearInterval(intervalsRef.current.log)
    if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress)

    setScanState('scanning')
    setScanProgress(0)
    setCurrentLayer(0)
    setLogs([])
    setRiskScore(0)
    setLayerResults({})

    let logIdx = 0
    let layerIdx = 0
    let progress = 0
    let done = false

    intervalsRef.current.log = setInterval(() => {
      if (logIdx < SCAN_LOGS.length) {
        const logEntry = SCAN_LOGS[logIdx]
        if (logEntry) {
          setLogs(prev => [...prev, logEntry])
        }
        logIdx++
      } else if (intervalsRef.current.log) {
        clearInterval(intervalsRef.current.log)
      }
    }, 150)

    intervalsRef.current.progress = setInterval(() => {
      if (done) return
      progress += 1.5
      setScanProgress(Math.min(progress, 100))

      const newLayerIdx = Math.floor((progress / 100) * 16)
      if (newLayerIdx > layerIdx) {
        layerIdx = newLayerIdx
        setCurrentLayer(layerIdx)
        setLayerResults(prev => ({
          ...prev,
          [layerIdx]: DETECTED_LAYERS.includes(layerIdx) ? 'detected' : 'clean'
        }))
      }

      if (progress > 15) {
        setRiskScore(Math.min(Math.floor((progress - 15) * 0.73), 62))
      }

      if (progress >= 100) {
        done = true
        if (intervalsRef.current.log) clearInterval(intervalsRef.current.log)
        if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress)
        setTimeout(() => {
          setScanState('done')
          setScanCount(prev => prev + 1)
          // 成就系统
          if (scanCount === 0) {
            setAchievements(prev => [...prev, '首次扫描'])
          }
          if (scanCount === 4) {
            setAchievements(prev => [...prev, '扫描达人'])
          }
        }, 600)
      }
    }, 70)
  }, [scanState, scanCount])

  const detectedCount = Object.values(layerResults).filter(v => v === 'detected').length
  const cleanCount = Object.values(layerResults).filter(v => v === 'clean').length

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      {/* 开场动画 */}
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      {/* 粒子背景 */}
      <ParticleBackground />

      {/* 网格背景 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* 扫描线覆盖（扫描中显示） */}
      {scanState === 'scanning' && <div className="scan-overlay" />}

      {/* 导航 */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSection('hero')} className="flex items-center gap-3 group">
            <div className={`relative w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center ${scanState === 'scanning' ? 'animate-pulse-glow' : ''}`}>
              <Shield className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="font-bold text-lg leading-tight">APEX-Root</div>
              <div className="text-[10px] text-muted-foreground font-mono">v1.0.6 · 16-LAYER ENGINE</div>
            </div>
          </button>
          <div className="hidden md:flex items-center gap-1">
            {[
              { id: 'hero', label: '首页', icon: Play },
              { id: 'scanner', label: '检测台', icon: Radar },
              { id: 'layers', label: '检测层', icon: LayersIcon },
              { id: 'features', label: '功能', icon: Sparkles },
              { id: 'download', label: '下载', icon: Download },
            ].map(item => (
              <Button
                key={item.id}
                variant={section === item.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSection(item.id as typeof section)}
                className="text-xs"
              >
                <item.icon className="w-4 h-4 mr-1" />
                {item.label}
              </Button>
            ))}
            <Button size="sm" variant="outline" asChild>
              <a href="https://github.com/mengjinghao/root-check" target="_blank" rel="noopener">
                <Github className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* 主体 */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* ═══ Hero ═══ */}
          {section === 'hero' && (
            <motion.div
              key="hero"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center py-8 sm:py-16"
            >
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-8"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-muted-foreground font-mono">ENGINE READY · libapex_root.so</span>
              </motion.div>

              <motion.h1
                className="text-6xl sm:text-8xl font-black mb-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
              >
                <span className="gradient-text">APEX-Root</span>
              </motion.h1>

              <motion.p
                className="text-xl sm:text-2xl text-muted-foreground mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                16 层深度 Root 检测 · 3 模式隐藏 · 后量子签名
              </motion.p>

              <motion.p
                className="text-xs text-muted-foreground/60 mb-10 max-w-xl font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                在感知安全与地面实况之间架起桥梁
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center justify-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Button
                  size="lg"
                  className="text-base h-14 px-10 animate-pulse-glow"
                  onClick={() => {
                    setSection('scanner')
                    setTimeout(startScan, 400)
                  }}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  启动检测
                </Button>
                <Button size="lg" variant="outline" className="text-base h-14 px-8" asChild>
                  <a href="https://github.com/mengjinghao/root-check/releases" target="_blank" rel="noopener">
                    <Download className="w-5 h-5 mr-2" />
                    下载 APK
                  </a>
                </Button>
              </motion.div>

              {/* 统计 */}
              <motion.div
                className="grid grid-cols-3 gap-6 max-w-2xl w-full mt-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {[
                  { label: '检测层', value: 16, icon: LayersIcon, color: '#a855f7' },
                  { label: '微服务插件', value: 20, icon: Cpu, color: '#06b6d4' },
                  { label: '隐藏模式', value: 3, icon: EyeOff, color: '#22c55e' },
                ].map((stat, i) => (
                  <div key={stat.label} className="glass-card rounded-2xl p-5 hover:scale-105 transition-transform">
                    <stat.icon className="w-6 h-6 mx-auto mb-2" style={{ color: stat.color }} />
                    <div className="text-4xl font-black gradient-text">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>

              {/* 成就展示 */}
              {achievements.length > 0 && (
                <motion.div
                  className="mt-8 flex flex-wrap justify-center gap-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {achievements.map(a => (
                    <Badge key={a} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      <Trophy className="w-3 h-3 mr-1" /> {a}
                    </Badge>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══ Scanner ═══ */}
          {section === 'scanner' && (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="grid lg:grid-cols-3 gap-6">
                {/* 左侧：雷达 + 仪表盘 */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                      <Radar className="w-5 h-5 text-primary" />
                      检测雷达
                    </h3>
                    <RadarDisplay scanning={scanState === 'scanning'} layerResults={layerResults} />

                    {scanState === 'scanning' && currentLayer > 0 && (
                      <div className="text-center mt-4">
                        <div className="text-xs text-muted-foreground mb-1">当前检测</div>
                        <div className="text-sm font-bold text-primary">
                          L{currentLayer} · {LAYERS[currentLayer - 1]?.name}
                        </div>
                      </div>
                    )}
                  </Card>

                  {scanState === 'done' && (
                    <Card className="glass-card-red p-6 animate-pulse-glow-red">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-red-400">
                        <Gauge className="w-5 h-5" />
                        风险评估
                      </h3>
                      <RiskGauge score={riskScore} />
                      <div className="text-center mt-2">
                        <Badge variant="destructive" className="text-sm">
                          <ShieldAlert className="w-3 h-3 mr-1" />
                          {riskScore > 60 ? '高风险' : riskScore > 30 ? '中等风险' : '低风险'}
                        </Badge>
                      </div>
                    </Card>
                  )}
                </div>

                {/* 右侧：日志 + 结果 */}
                <div className="lg:col-span-2 space-y-4">
                  <Card className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Terminal className="w-5 h-5 text-primary" />
                        检测日志
                      </h3>
                      <div className="flex items-center gap-2">
                        {scanState === 'scanning' && (
                          <Badge className="bg-primary/20 text-primary border-primary/30">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            {scanProgress.toFixed(0)}%
                          </Badge>
                        )}
                        {scanState === 'done' && (
                          <Badge variant="destructive">
                            {riskScore}/100
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* 进度条 */}
                    {(scanState === 'scanning' || scanState === 'done') && (
                      <div className="mb-3">
                        <Progress value={scanProgress} className="h-1.5" />
                      </div>
                    )}

                    <TerminalLog logs={logs} />

                    {/* 控制按钮 */}
                    <div className="flex gap-3 mt-4">
                      {scanState !== 'scanning' && (
                        <Button onClick={startScan} className="flex-1">
                          {scanState === 'done' ? (
                            <><RotateCcw className="w-4 h-4 mr-2" /> 重新扫描</>
                          ) : (
                            <><Zap className="w-4 h-4 mr-2" /> 开始检测</>
                          )}
                        </Button>
                      )}
                      {scanState === 'scanning' && (
                        <Button disabled className="flex-1">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          扫描中... {scanProgress.toFixed(0)}%
                        </Button>
                      )}
                    </div>
                  </Card>

                  {/* 结果统计 */}
                  {scanState === 'done' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="grid grid-cols-3 gap-3"
                    >
                      <Card className="glass-card-green p-4 text-center">
                        <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        <div className="text-3xl font-black text-green-400">{cleanCount}</div>
                        <div className="text-xs text-muted-foreground">通过</div>
                      </Card>
                      <Card className="glass-card-red p-4 text-center animate-pulse-glow-red">
                        <XCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
                        <div className="text-3xl font-black text-red-400">{detectedCount}</div>
                        <div className="text-xs text-muted-foreground">异常</div>
                      </Card>
                      <Card className="glass-card p-4 text-center">
                        <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="text-3xl font-black gradient-text">16</div>
                        <div className="text-xs text-muted-foreground">总层数</div>
                      </Card>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Layers ═══ */}
          {section === 'layers' && (
            <motion.div
              key="layers"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black mb-3 gradient-text">16 层检测架构</h2>
                <p className="text-muted-foreground text-sm">点击层卡片查看详情 · 点击下方按钮运行完整检测</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
                {LAYERS.map((layer, i) => {
                  const status = layerResults[layer.id]
                  return (
                    <motion.div
                      key={layer.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.04 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                    >
                      <Card
                        className={`p-4 h-full cursor-pointer transition-all ${
                          status === 'detected' ? 'glass-card-red' :
                          status === 'clean' ? 'glass-card-green' : 'glass-card'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center"
                            style={{ background: `${layer.color}20` }}
                          >
                            <layer.icon className="w-5 h-5" style={{ color: layer.color }} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-muted-foreground">L{layer.id}</span>
                            {status === 'detected' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                            {status === 'clean' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                          </div>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{layer.name}</h4>
                        <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">{layer.desc}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] py-0">威胁: {layer.threat}</Badge>
                          {status === 'detected' && <Badge variant="destructive" className="text-[10px] py-0">已检测</Badge>}
                          {status === 'clean' && <Badge className="text-[10px] py-0 bg-green-500/20 text-green-400">通过</Badge>}
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              <div className="text-center">
                <Button
                  size="lg"
                  onClick={() => {
                    setSection('scanner')
                    setTimeout(startScan, 400)
                  }}
                  className="animate-pulse-glow"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  运行完整检测
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ Features ═══ */}
          {section === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black mb-3 gradient-text">核心功能</h2>
                <p className="text-muted-foreground text-sm">专业级安全分析工具的全维度能力</p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {FEATURES.map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.03 }}
                  >
                    <Card className="glass-card p-6 h-full">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                        style={{ background: `${feat.color}20` }}
                      >
                        <feat.icon className="w-6 h-6" style={{ color: feat.color }} />
                      </div>
                      <h4 className="font-bold text-lg mb-2">{feat.title}</h4>
                      <p className="text-sm text-muted-foreground">{feat.desc}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* 3 模式隐藏 */}
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-center mb-6 flex items-center justify-center gap-2">
                  <EyeOff className="w-6 h-6 text-primary" />
                  3 模式隐藏系统
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: Eye, name: 'Detection', desc: '仅检测不隐藏', detail: '默认模式，零副作用', color: '#22c55e' },
                    { icon: ShieldCheck, name: 'Hide', desc: '对其他应用隐藏 Root', detail: 'eBPF 防火墙 + mount namespace', color: '#a855f7' },
                    { icon: Gamepad2, name: 'Game', desc: '激进隐藏 + 性能', detail: '进程伪装 + HWID 伪装', color: '#eab308' },
                  ].map((mode, i) => (
                    <motion.div
                      key={mode.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.05, y: -4 }}
                    >
                      <Card className="glass-card p-6 text-center">
                        <div
                          className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                          style={{ background: `${mode.color}20` }}
                        >
                          <mode.icon className="w-8 h-8" style={{ color: mode.color }} />
                        </div>
                        <h4 className="font-bold text-lg" style={{ color: mode.color }}>{mode.name}</h4>
                        <p className="text-sm font-medium mt-1">{mode.desc}</p>
                        <p className="text-xs text-muted-foreground mt-2">{mode.detail}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* 技术栈 */}
              <div>
                <h3 className="text-xl font-bold text-center mb-4">技术栈</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Kotlin 1.9', 'C++20', 'NDK 28.2', 'Jetpack Compose', 'Material3', 'eBPF CO-RE', 'Protobuf', 'liboqs', 'ML-DSA-65', 'CMake 3.22', 'Gradle 8.2'].map(tech => (
                    <Badge key={tech} variant="outline" className="text-xs">{tech}</Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Download ═══ */}
          {section === 'download' && (
            <motion.div
              key="download"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black mb-3 gradient-text">下载 APEX-Root</h2>
                <p className="text-muted-foreground text-sm">v1.0.6 · 无混淆版本 · 完整调试信息</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-3">
                {[
                  { name: 'arm64-v8a', size: '40 MB', desc: 'ARM 64 位 — 现代手机推荐', url: 'https://github.com/mengjinghao/root-check/releases/download/v1.0.6/APEX-Root-v1.0.6-arm64-v8a.apk', recommended: true },
                  { name: 'armeabi-v7a', size: '39 MB', desc: 'ARM 32 位 — 旧款手机', url: 'https://github.com/mengjinghao/root-check/releases/download/v1.0.6/APEX-Root-v1.0.6-armeabi-v7a.apk', recommended: false },
                  { name: 'x86_64', size: '40 MB', desc: 'x86 64 位 — 模拟器', url: 'https://github.com/mengjinghao/root-check/releases/download/v1.0.6/APEX-Root-v1.0.6-x86_64.apk', recommended: false },
                ].map(apk => (
                  <Card key={apk.name} className="glass-card p-5 flex items-center justify-between hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Download className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-sm">APEX-Root-v1.0.6-{apk.name}.apk</span>
                          {apk.recommended && <Badge className="text-xs">推荐</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{apk.desc} · {apk.size}</div>
                      </div>
                    </div>
                    <Button asChild size="sm">
                      <a href={apk.url} target="_blank" rel="noopener">
                        <Download className="w-4 h-4 mr-1" /> 下载
                      </a>
                    </Button>
                  </Card>
                ))}

                <div className="mt-6 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <h4 className="font-bold mb-2 flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" /> 使用要求
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Android 10+ (API 29+)</li>
                    <li>Root 权限（Magisk / KernelSU / APatch）用于隐藏功能</li>
                    <li>首次启动需授予通知权限</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold">APEX-Root</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">专业级 Android 设备完整性评估系统</p>
          <div className="flex justify-center gap-4 text-xs">
            <a href="https://github.com/mengjinghao/root-check" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">GitHub</a>
            <a href="https://github.com/mengjinghao/root-check/releases" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">Releases</a>
            <a href="https://github.com/mengjinghao/root-check/blob/main/docs/ARCHITECTURE.md" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">文档</a>
          </div>
          <p className="text-[10px] text-muted-foreground/40 mt-3 font-mono">v1.0.6 · Made by MJH · 仅供安全研究使用</p>
        </div>
      </footer>
    </div>
  )
}
