'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Shield, Zap, Radar, Terminal, Cpu, Lock, Bug, Eye, EyeOff,
  Gamepad2, Download, Github, AlertTriangle, CheckCircle2, XCircle,
  Loader2, Activity, Fingerprint, Skull, Sparkles, Flame,
  Play, RotateCcw, Trophy, Layers as LayersIcon, Power, Wifi,
  HardDrive, MemoryStick, Network, Crosshair
} from 'lucide-react'

// ═══ 数据 ═══

const LAYERS = [
  { id: 1, name: '系统属性', icon: Shield, color: '#a855f7', desc: 'ro.debuggable / ro.secure', threat: '低' },
  { id: 2, name: 'ART 注入', icon: Bug, color: '#06b6d4', desc: 'Frida / Xposed / LSPosed', threat: '高' },
  { id: 3, name: '内存特征', icon: Cpu, color: '#22c55e', desc: 'Magisk / Zygisk / Shamiko', threat: '高' },
  { id: 4, name: '挂载检查', icon: HardDrive, color: '#06b6d4', desc: 'overlayfs / bind-mount', threat: '中' },
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
  { id: 16, name: 'Magisk 扩展', icon: Network, color: '#a855f7', desc: 'DenyList / ZygiskNext', threat: '中' },
]

const SCAN_SCRIPTS: Record<string, { logs: { t: string; m: string; type: string }[]; detected: number[] }> = {
  quick: {
    logs: [
      { t: '[BOOT]', m: '加载 libapex_root.so', type: 'info' },
      { t: '[L1]', m: '读取系统属性...', type: 'info' },
      { t: '[L1]', m: 'ro.debuggable=0  ro.secure=1', type: 'ok' },
      { t: '[L3]', m: '扫描内存映射...', type: 'info' },
      { t: '[L3]', m: '发现 Magisk 匿名映射', type: 'danger' },
      { t: '[L8]', m: '检测 Magisk 守护进程...', type: 'info' },
      { t: '[L8]', m: '/data/adb/magisk 存在', type: 'danger' },
      { t: '[L9]', m: '检测 KernelSU', type: 'info' },
      { t: '[L9]', m: '未检测到', type: 'ok' },
      { t: '[L10]', m: '检测 APatch', type: 'info' },
      { t: '[L10]', m: '未检测到', type: 'ok' },
      { t: '[DONE]', m: '快速扫描完成 (5 层)', type: 'done' },
    ],
    detected: [3, 8],
  },
  deep: {
    logs: [
      { t: '[BOOT]', m: '加载 libapex_root.so + eBPF 引擎', type: 'info' },
      { t: '[L1]', m: '读取 /dev/__properties__', type: 'info' },
      { t: '[L1]', m: 'ro.debuggable=0  ro.secure=1', type: 'ok' },
      { t: '[L2]', m: '扫描 /proc/self/maps', type: 'info' },
      { t: '[L2]', m: 'Frida gadget 未发现', type: 'ok' },
      { t: '[L3]', m: 'RWX 页面检测... 2 个可疑', type: 'warn' },
      { t: '[L3]', m: 'Magisk 匿名映射特征匹配', type: 'danger' },
      { t: '[L4]', m: '解析 mountinfo', type: 'info' },
      { t: '[L4]', m: 'overlayfs 挂载异常', type: 'warn' },
      { t: '[L5]', m: 'ARM64 svc 指令计时', type: 'info' },
      { t: '[L5]', m: 'syscall 时延正常', type: 'ok' },
      { t: '[L6]', m: '枚举 /proc/*/cmdline', type: 'info' },
      { t: '[L6]', m: '发现 magiskd (PID 4231)', type: 'danger' },
      { t: '[L7]', m: 'Bootloader: unlocked', type: 'warn' },
      { t: '[L8]', m: '/data/adb/magisk 存在', type: 'danger' },
      { t: '[L9]', m: 'KSU 未检测到', type: 'ok' },
      { t: '[L10]', m: 'APatch 未检测到', type: 'ok' },
      { t: '[L11]', m: 'LSPosed 未检测到', type: 'ok' },
      { t: '[L12]', m: '官方 ROM', type: 'ok' },
      { t: '[L13]', m: 'dm-verity 启用', type: 'ok' },
      { t: '[L14]', m: 'VirtualXposed 未检测到', type: 'ok' },
      { t: '[L15]', m: 'GameGuardian 未安装', type: 'ok' },
      { t: '[L16]', m: 'DenyList 配置发现', type: 'danger' },
      { t: '[DONE]', m: '深度扫描完成 (16 层)', type: 'done' },
    ],
    detected: [3, 4, 6, 8, 16],
  },
  frida: {
    logs: [
      { t: '[FRIDA]', m: '扫描 Frida 痕迹...', type: 'info' },
      { t: '[FRIDA]', m: '检测端口 27042...', type: 'info' },
      { t: '[FRIDA]', m: '端口开放!', type: 'danger' },
      { t: '[FRIDA]', m: '扫描 /proc/self/maps 中的 frida-agent', type: 'info' },
      { t: '[FRIDA]', m: '发现 frida-agent.so 映射', type: 'danger' },
      { t: '[FRIDA]', m: '检测线程名 gum-js-loop', type: 'info' },
      { t: '[FRIDA]', m: '发现 2 个 Frida 线程', type: 'danger' },
      { t: '[FRIDA]', m: 'Frida 检测完成', type: 'done' },
    ],
    detected: [],
  },
  memory: {
    logs: [
      { t: '[MEM]', m: '深度内存指纹扫描...', type: 'info' },
      { t: '[MEM]', m: '扫描 RWX 页面...', type: 'info' },
      { t: '[MEM]', m: '发现 3 个 RWX 页面', type: 'warn' },
      { t: '[MEM]', m: '匹配 Magisk 签名...', type: 'info' },
      { t: '[MEM]', m: 'Magisk 特征匹配 (0x7f3a2b)', type: 'danger' },
      { t: '[MEM]', m: '匹配 Zygisk 签名...', type: 'info' },
      { t: '[MEM]', m: 'Zygisk 特征匹配', type: 'danger' },
      { t: '[MEM]', m: '匹配 Shamiko 签名...', type: 'info' },
      { t: '[MEM]', m: 'Shamiko 未发现', type: 'ok' },
      { t: '[MEM]', m: '内存扫描完成', type: 'done' },
    ],
    detected: [],
  },
  hide: {
    logs: [
      { t: '[HIDE]', m: '检测隐藏模块...', type: 'info' },
      { t: '[HIDE]', m: '扫描 Shamiko...', type: 'info' },
      { t: '[HIDE]', m: 'Shamiko 未检测到', type: 'ok' },
      { t: '[HIDE]', m: '扫描 ZygiskNext...', type: 'info' },
      { t: '[HIDE]', m: 'ZygiskNext 未检测到', type: 'ok' },
      { t: '[HIDE]', m: '检测进程隐藏...', type: 'info' },
      { t: '[HIDE]', m: '发现隐藏的 magiskd 进程', type: 'danger' },
      { t: '[HIDE]', m: '检测 mount namespace 隐藏', type: 'info' },
      { t: '[HIDE]', m: '发现 namespace 隔离痕迹', type: 'warn' },
      { t: '[HIDE]', m: '隐藏检测完成', type: 'done' },
    ],
    detected: [],
  },
}

const SCAN_MODES = [
  { id: 'quick', name: '快速扫描', icon: Zap, desc: '5 层核心检测 · <500ms', color: '#a855f7' },
  { id: 'deep', name: '深度扫描', icon: Radar, desc: '全 16 层 · 10-30s', color: '#06b6d4' },
  { id: 'frida', name: 'Frida 检测', icon: Bug, desc: '专项 Frida 痕迹扫描', color: '#ef4444' },
  { id: 'memory', name: '内存指纹', icon: MemoryStick, desc: 'RWX + 签名匹配', color: '#22c55e' },
  { id: 'hide', name: '隐藏检测', icon: EyeOff, desc: 'Shamiko/ZygiskNext/进程', color: '#eab308' },
]

const FEATURES = [
  { icon: Radar, title: '16 层深度检测', desc: '从系统属性到固件完整性', color: '#a855f7' },
  { icon: EyeOff, title: '3 模式隐藏', desc: 'Detection / Hide / Game', color: '#06b6d4' },
  { icon: Lock, title: '后量子签名', desc: 'ML-DSA-65 防篡改', color: '#22c55e' },
  { icon: Zap, title: 'eBPF 防火墙', desc: '内核级 syscall 拦截', color: '#eab308' },
  { icon: Cpu, title: '微服务架构', desc: '20 个独立插件', color: '#a855f7' },
  { icon: Terminal, title: '原生引擎', desc: 'C++20 + ARM64 裸 syscall', color: '#ef4444' },
]

// ═══ 开场动画 ═══

function IntroAnimation({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 50),
      setTimeout(() => setPhase(2), 700),
      setTimeout(() => setPhase(3), 2200),
      setTimeout(() => onComplete(), 2900),
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
      {phase >= 1 && (
        <>
          <div className="absolute w-28 h-28 rounded-full border-2 border-primary" style={{ animation: 'intro-ring-expand 1.5s ease-out forwards' }} />
          <div className="absolute w-28 h-28 rounded-full border-2 border-primary" style={{ animation: 'intro-ring-expand 1.5s ease-out 0.3s forwards' }} />
        </>
      )}
      <div className="relative flex flex-col items-center">
        {phase >= 1 && (
          <div className="relative w-20 h-20 mb-6" style={{ animation: 'intro-zoom 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
            <div className="absolute inset-0 rounded-3xl bg-primary/20" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-10 h-10 text-primary" />
            </div>
          </div>
        )}
        {phase >= 2 && (
          <div className="text-center" style={{ animation: 'intro-text-reveal 0.8s ease-out forwards' }}>
            <h1 className="text-4xl font-black gradient-text mb-1">APEX-Root</h1>
            <p className="text-xs text-muted-foreground font-mono tracking-[0.3em]">16-LAYER DETECTION</p>
          </div>
        )}
      </div>
      {phase >= 2 && (
        <div className="absolute bottom-16 w-56">
          <div className="h-0.5 bg-border rounded-full overflow-hidden">
            <motion.div className="h-full bg-primary" initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'easeInOut' }} />
          </div>
        </div>
      )}
    </div>
  )
}

// ═══ 雷达 ═══

function RadarDisplay({ scanning, layerResults }: { scanning: boolean; layerResults: Record<number, string> }) {
  return (
    <div className="relative aspect-square max-w-[240px] mx-auto">
      <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
      <div className="absolute inset-[12%] rounded-full border border-primary/15" />
      <div className="absolute inset-[25%] rounded-full border border-primary/10" />
      <div className="absolute inset-[37%] rounded-full border border-primary/5" />
      <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/20" />
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20" />
      {scanning && (
        <div className="absolute inset-0 rounded-full" style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, rgba(168, 85, 247, 0.35) 50deg, transparent 90deg)',
          animation: 'radar-sweep 2.5s linear infinite',
        }} />
      )}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className={`w-3 h-3 rounded-full ${scanning ? 'bg-primary' : 'bg-primary/40'}`} style={scanning ? { animation: 'radar-pulse 1.5s ease-in-out infinite' } : {}} />
      </div>
      {LAYERS.map(layer => {
        if (layerResults[layer.id] !== 'detected') return null
        const angle = (layer.id / 16) * 360 - 90
        const radius = 25 + (layer.id % 4) * 8
        const x = 50 + Math.cos((angle * Math.PI) / 180) * radius
        const y = 50 + Math.sin((angle * Math.PI) / 180) * radius
        return (
          <div key={layer.id} className="absolute w-2.5 h-2.5 rounded-full bg-red-500" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', animation: 'blip-appear 0.4s ease-out' }}>
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
          </div>
        )
      })}
      {LAYERS.map(layer => {
        if (layerResults[layer.id] !== 'clean') return null
        const angle = (layer.id / 16) * 360 - 90
        const radius = 20 + (layer.id % 4) * 8
        const x = 50 + Math.cos((angle * Math.PI) / 180) * radius
        const y = 50 + Math.sin((angle * Math.PI) / 180) * radius
        return <div key={layer.id} className="absolute w-1.5 h-1.5 rounded-full bg-green-400" style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)', animation: 'blip-appear 0.3s ease-out' }} />
      })}
    </div>
  )
}

// ═══ 终端 ═══

function TerminalLog({ logs }: { logs: { t: string; m: string; type: string }[] }) {
  const logEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])
  const colors: Record<string, string> = {
    info: 'text-cyan-400', ok: 'text-green-400', warn: 'text-yellow-400',
    danger: 'text-red-400', done: 'text-purple-400 font-bold',
  }
  return (
    <div className="bg-black/50 rounded-xl p-4 font-mono text-xs h-64 overflow-y-auto border border-border/30">
      {logs.length === 0 ? (
        <div className="text-muted-foreground/40 flex items-center h-full justify-center">
          <span className="animate-blink">▊</span><span className="ml-1">选择扫描模式开始...</span>
        </div>
      ) : (
        <>
          {logs.map((log, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={`whitespace-pre-wrap break-all ${colors[log.type] || 'text-muted-foreground'}`} style={{ textShadow: '0 0 8px currentColor' }}>
              <span className="text-muted-foreground/60">{log.t}</span> {log.m}
            </motion.div>
          ))}
          <div ref={logEndRef} />
        </>
      )}
    </div>
  )
}

// ═══ 粒子背景 ═══

function ParticleBackground() {
  const particles = Array.from({ length: 15 }, (_, i) => ({ id: i, left: Math.random() * 100, delay: Math.random() * 10, duration: 12 + Math.random() * 15, size: 1 + Math.random() * 2 }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="absolute rounded-full bg-primary/30" style={{ left: `${p.left}%`, bottom: '-10px', width: `${p.size}px`, height: `${p.size}px`, animation: `particle-float ${p.duration}s linear infinite`, animationDelay: `${p.delay}s` }} />
      ))}
    </div>
  )
}

// ═══ 主页面 ═══

export default function Home() {
  const [showIntro, setShowIntro] = useState(true)
  const [section, setSection] = useState<'hero' | 'scanner' | 'layers' | 'features' | 'download'>('hero')
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [scanMode, setScanMode] = useState<string>('quick')
  const [scanProgress, setScanProgress] = useState(0)
  const [currentLayerName, setCurrentLayerName] = useState('')
  const [logs, setLogs] = useState<{ t: string; m: string; type: string }[]>([])
  const [layerResults, setLayerResults] = useState<Record<number, 'clean' | 'detected' | 'pending'>>({})
  const [scanCount, setScanCount] = useState(0)
  const [achievements, setAchievements] = useState<string[]>([])
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null)
  const intervalsRef = useRef<{ log?: ReturnType<typeof setInterval>; progress?: ReturnType<typeof setInterval> }>({})

  useEffect(() => {
    return () => {
      if (intervalsRef.current.log) clearInterval(intervalsRef.current.log)
      if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress)
    }
  }, [])

  const startScan = useCallback((mode: string) => {
    if (scanState === 'scanning') return
    const script = SCAN_SCRIPTS[mode]
    if (!script) return

    if (intervalsRef.current.log) clearInterval(intervalsRef.current.log)
    if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress)

    setScanState('scanning')
    setScanProgress(0)
    setLogs([])
    setLayerResults({})
    setScanMode(mode)
    setSelectedLayer(null)

    let logIdx = 0
    let progress = 0
    let done = false

    intervalsRef.current.log = setInterval(() => {
      if (logIdx < script.logs.length) {
        const entry = script.logs[logIdx]
        if (entry) {
          setLogs(prev => [...prev, entry])
          // 从日志中提取层号
          const match = entry.t.match(/L(\d+)/)
          if (match) {
            const layerId = parseInt(match[1])
            if (entry.type === 'danger' || entry.type === 'warn') {
              setLayerResults(prev => ({ ...prev, [layerId]: 'detected' }))
            } else if (entry.type === 'ok') {
              setLayerResults(prev => ({ ...prev, [layerId]: 'clean' }))
            }
            setCurrentLayerName(LAYERS[layerId - 1]?.name || '')
          }
        }
        logIdx++
      } else if (intervalsRef.current.log) {
        clearInterval(intervalsRef.current.log)
      }
    }, 200)

    intervalsRef.current.progress = setInterval(() => {
      if (done) return
      progress += 100 / (script.logs.length * 2)
      setScanProgress(Math.min(progress, 100))
      if (progress >= 100) {
        done = true
        if (intervalsRef.current.log) clearInterval(intervalsRef.current.log)
        if (intervalsRef.current.progress) clearInterval(intervalsRef.current.progress)
        setTimeout(() => {
          setScanState('done')
          setScanCount(prev => {
            const newCount = prev + 1
            setAchievements(a => {
              const newA = [...a]
              const add = (name: string) => { if (!newA.includes(name)) newA.push(name) }
              if (newCount === 1) add('初次检测')
              if (newCount === 3) add('检测爱好者')
              if (newCount === 5) add('安全专家')
              if (mode === 'deep') add('深度分析师')
              if (mode === 'frida') add('Frida 猎人')
              if (mode === 'memory') add('内存侦探')
              if (mode === 'hide') add('隐藏克星')
              return newA
            })
            return newCount
          })
        }, 500)
      }
    }, 100)
  }, [scanState])



  const detectedCount = Object.values(layerResults).filter(v => v === 'detected').length
  const cleanCount = Object.values(layerResults).filter(v => v === 'clean').length

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden flex flex-col">
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}
      <ParticleBackground />
      <div className="fixed inset-0 grid-bg pointer-events-none" />
      {scanState === 'scanning' && <div className="scan-overlay" />}

      {/* 导航 */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSection('hero')} className="flex items-center gap-2 group">
            <div className={`relative w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center ${scanState === 'scanning' ? '' : ''}`} style={scanState === 'scanning' ? { animation: 'pulse-glow 2s ease-in-out infinite' } : {}}>
              <Shield className="w-5 h-5 text-primary group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="font-bold text-base leading-tight">APEX-Root</div>
              <div className="text-[10px] text-muted-foreground font-mono">16-LAYER ENGINE</div>
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
              <Button key={item.id} variant={section === item.id ? 'default' : 'ghost'} size="sm" onClick={() => setSection(item.id as typeof section)} className="text-xs">
                <item.icon className="w-4 h-4 mr-1" />{item.label}
              </Button>
            ))}
            <Button size="sm" variant="outline" asChild>
              <a href="https://github.com/mengjinghao/root-check" target="_blank" rel="noopener"><Github className="w-4 h-4" /></a>
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {/* ═══ Hero ═══ */}
          {section === 'hero' && (
            <motion.div key="hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="flex flex-col items-center text-center py-8 sm:py-12">
              <motion.div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-8" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}>
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-muted-foreground font-mono">ENGINE READY</span>
              </motion.div>
              <motion.h1 className="text-5xl sm:text-7xl font-black mb-4" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}>
                <span className="gradient-text">APEX-Root</span>
              </motion.h1>
              <motion.p className="text-lg sm:text-xl text-muted-foreground mb-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>16 层深度 Root 检测 · 3 模式隐藏 · 后量子签名</motion.p>
              <motion.p className="text-xs text-muted-foreground/50 mb-8 font-mono" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>在感知安全与地面实况之间架起桥梁</motion.p>
              <motion.div className="flex flex-wrap items-center justify-center gap-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <Button size="lg" className="text-base h-12 px-8" style={{ animation: 'pulse-glow 2s ease-in-out infinite' }} onClick={() => { setSection('scanner'); setTimeout(() => startScan('quick'), 400) }}>
                  <Zap className="w-5 h-5 mr-2" />启动检测
                </Button>
                <Button size="lg" variant="outline" className="text-base h-12 px-8" asChild>
                  <a href="https://github.com/mengjinghao/root-check/releases" target="_blank" rel="noopener"><Download className="w-5 h-5 mr-2" />下载 APK</a>
                </Button>
              </motion.div>
              <motion.div className="grid grid-cols-3 gap-4 max-w-xl w-full mt-12" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
                {[
                  { label: '检测层', value: 16, icon: LayersIcon, color: '#a855f7' },
                  { label: '微服务', value: 20, icon: Cpu, color: '#06b6d4' },
                  { label: '隐藏模式', value: 3, icon: EyeOff, color: '#22c55e' },
                ].map(stat => (
                  <div key={stat.label} className="glass-card rounded-2xl p-4 hover:scale-105 transition-transform">
                    <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
                    <div className="text-3xl font-black gradient-text">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
              {achievements.length > 0 && (
                <motion.div className="mt-6 flex flex-wrap justify-center gap-2" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  {achievements.map(a => (
                    <Badge key={a} className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Trophy className="w-3 h-3 mr-1" />{a}</Badge>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ═══ Scanner ═══ */}
          {section === 'scanner' && (
            <motion.div key="scanner" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              {/* 扫描模式选择 */}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2"><Crosshair className="w-4 h-4" />选择扫描模式</h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {SCAN_MODES.map(mode => (
                    <button key={mode.id} onClick={() => scanState !== 'scanning' && startScan(mode.id)} disabled={scanState === 'scanning'} className={`p-3 rounded-xl border transition-all text-left ${scanMode === mode.id && scanState !== 'idle' ? 'border-primary bg-primary/10' : 'border-border/50 glass-card hover:border-primary/50'} ${scanState === 'scanning' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}>
                      <mode.icon className="w-5 h-5 mb-2" style={{ color: mode.color }} />
                      <div className="font-bold text-xs">{mode.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* 雷达 */}
                <div className="lg:col-span-1">
                  <Card className="glass-card p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Radar className="w-5 h-5 text-primary" />检测雷达</h3>
                    <RadarDisplay scanning={scanState === 'scanning'} layerResults={layerResults} />
                    {scanState === 'scanning' && currentLayerName && (
                      <div className="text-center mt-4">
                        <div className="text-xs text-muted-foreground mb-1">正在检测</div>
                        <div className="text-sm font-bold text-primary">{currentLayerName}</div>
                      </div>
                    )}
                    {scanState === 'done' && (
                      <div className="text-center mt-4 space-y-1">
                        <div className="text-xs text-muted-foreground">扫描完成</div>
                        <div className="flex justify-center gap-4 text-sm">
                          <span className="text-green-400 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" />{cleanCount}</span>
                          <span className="text-red-400 flex items-center gap-1"><XCircle className="w-4 h-4" />{detectedCount}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>

                {/* 终端 */}
                <div className="lg:col-span-2">
                  <Card className="glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2"><Terminal className="w-5 h-5 text-primary" />检测日志</h3>
                      {scanState === 'scanning' && (
                        <Badge className="bg-primary/20 text-primary border-primary/30"><Loader2 className="w-3 h-3 mr-1 animate-spin" />{scanProgress.toFixed(0)}%</Badge>
                      )}
                    </div>
                    {(scanState === 'scanning' || scanState === 'done') && <div className="mb-3"><Progress value={scanProgress} className="h-1.5" /></div>}
                    <TerminalLog logs={logs} />
                    {scanState !== 'scanning' && (
                      <Button onClick={() => startScan(scanMode)} className="w-full mt-4">
                        {scanState === 'done' ? <><RotateCcw className="w-4 h-4 mr-2" />重新扫描</> : <><Zap className="w-4 h-4 mr-2" />开始扫描</>}
                      </Button>
                    )}
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Layers ═══ */}
          {section === 'layers' && (
            <motion.div key="layers" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black mb-2 gradient-text">16 层检测架构</h2>
                <p className="text-muted-foreground text-sm">点击层卡片查看详情</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {LAYERS.map((layer, i) => {
                  const status = layerResults[layer.id]
                  return (
                    <motion.div key={layer.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} whileHover={{ scale: 1.05, y: -4 }} onClick={() => setSelectedLayer(selectedLayer === layer.id ? null : layer.id)}>
                      <Card className={`p-4 h-full cursor-pointer transition-all ${selectedLayer === layer.id ? 'border-primary' : ''} ${status === 'detected' ? 'glass-card-red' : status === 'clean' ? 'glass-card-green' : 'glass-card'}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${layer.color}20` }}>
                            <layer.icon className="w-5 h-5" style={{ color: layer.color }} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono text-muted-foreground">L{layer.id}</span>
                            {status === 'detected' && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                            {status === 'clean' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />}
                          </div>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{layer.name}</h4>
                        <p className="text-[10px] text-muted-foreground mb-2">{layer.desc}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] py-0">威胁: {layer.threat}</Badge>
                          {status === 'detected' && <Badge variant="destructive" className="text-[10px] py-0">已检测</Badge>}
                          {status === 'clean' && <Badge className="text-[10px] py-0 bg-green-500/20 text-green-400">通过</Badge>}
                        </div>
                        <AnimatePresence>
                          {selectedLayer === layer.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                              <p className="text-[10px] text-muted-foreground/70">检测目标：{layer.desc}</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">威胁等级：{layer.threat}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
              <div className="text-center">
                <Button size="lg" onClick={() => { setSection('scanner'); setTimeout(() => startScan('deep'), 400) }} style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}>
                  <Radar className="w-5 h-5 mr-2" />运行深度扫描
                </Button>
              </div>
            </motion.div>
          )}

          {/* ═══ Features ═══ */}
          {section === 'features' && (
            <motion.div key="features" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black mb-2 gradient-text">核心功能</h2>
                <p className="text-muted-foreground text-sm">专业级安全分析工具的全维度能力</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {FEATURES.map((feat, i) => (
                  <motion.div key={feat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.03 }}>
                    <Card className="glass-card p-6 h-full">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${feat.color}20` }}>
                        <feat.icon className="w-6 h-6" style={{ color: feat.color }} />
                      </div>
                      <h4 className="font-bold text-lg mb-2">{feat.title}</h4>
                      <p className="text-sm text-muted-foreground">{feat.desc}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2"><EyeOff className="w-5 h-5 text-primary" />3 模式隐藏系统</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: Eye, name: 'Detection', desc: '仅检测不隐藏', detail: '默认模式，零副作用', color: '#22c55e' },
                    { icon: Shield, name: 'Hide', desc: '对其他应用隐藏 Root', detail: 'eBPF + mount namespace', color: '#a855f7' },
                    { icon: Gamepad2, name: 'Game', desc: '激进隐藏 + 性能', detail: '进程伪装 + HWID 伪装', color: '#eab308' },
                  ].map((mode, i) => (
                    <motion.div key={mode.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} whileHover={{ scale: 1.05, y: -4 }}>
                      <Card className="glass-card p-6 text-center">
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: `${mode.color}20` }}>
                          <mode.icon className="w-7 h-7" style={{ color: mode.color }} />
                        </div>
                        <h4 className="font-bold" style={{ color: mode.color }}>{mode.name}</h4>
                        <p className="text-sm font-medium mt-1">{mode.desc}</p>
                        <p className="text-xs text-muted-foreground mt-1">{mode.detail}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-center mb-3">技术栈</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {['Kotlin 1.9', 'C++20', 'NDK 28.2', 'Compose', 'Material3', 'eBPF', 'Protobuf', 'liboqs', 'ML-DSA-65', 'CMake 3.22', 'Gradle 8.2'].map(t => (
                    <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══ Download ═══ */}
          {section === 'download' && (
            <motion.div key="download" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-black mb-2 gradient-text">下载 APEX-Root</h2>
                <p className="text-muted-foreground text-sm">v1.0.6 · 无混淆版本</p>
              </div>
              <div className="max-w-xl mx-auto space-y-3">
                {[
                  { name: 'arm64-v8a', size: '40 MB', desc: 'ARM 64 位 — 现代手机推荐', url: 'https://github.com/mengjinghao/root-check/releases/download/v1.0.6/APEX-Root-v1.0.6-arm64-v8a.apk', rec: true },
                  { name: 'armeabi-v7a', size: '39 MB', desc: 'ARM 32 位 — 旧款手机', url: 'https://github.com/mengjinghao/root-check/releases/download/v1.0.6/APEX-Root-v1.0.6-armeabi-v7a.apk', rec: false },
                  { name: 'x86_64', size: '40 MB', desc: 'x86 64 位 — 模拟器', url: 'https://github.com/mengjinghao/root-check/releases/download/v1.0.6/APEX-Root-v1.0.6-x86_64.apk', rec: false },
                ].map(apk => (
                  <Card key={apk.name} className="glass-card p-4 flex items-center justify-between hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Download className="w-5 h-5 text-primary" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-xs">APEX-Root-v1.0.6-{apk.name}.apk</span>
                          {apk.rec && <Badge className="text-xs">推荐</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">{apk.desc} · {apk.size}</div>
                      </div>
                    </div>
                    <Button asChild size="sm"><a href={apk.url} target="_blank" rel="noopener"><Download className="w-4 h-4 mr-1" />下载</a></Button>
                  </Card>
                ))}
                <div className="mt-4 p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                  <h4 className="font-bold mb-2 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4 text-yellow-400" />使用要求</h4>
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

      <footer className="relative z-10 border-t border-border/50 mt-auto">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-1"><Shield className="w-4 h-4 text-primary" /><span className="font-bold text-sm">APEX-Root</span></div>
          <div className="flex justify-center gap-4 text-xs mb-2">
            <a href="https://github.com/mengjinghao/root-check" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">GitHub</a>
            <a href="https://github.com/mengjinghao/root-check/releases" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">Releases</a>
            <a href="https://github.com/mengjinghao/root-check/blob/main/docs/ARCHITECTURE.md" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">文档</a>
          </div>
          <p className="text-[10px] text-muted-foreground/40 font-mono">v1.0.6 · Made by MJH · 仅供安全研究使用</p>
        </div>
      </footer>
    </div>
  )
}
