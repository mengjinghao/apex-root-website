'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Shield, ShieldCheck, ShieldAlert, Zap, Radar, Terminal, Cpu, Lock,
  Bug, Eye, EyeOff, Gamepad2, Download, Github, AlertTriangle,
  CheckCircle2, XCircle, Loader2, ChevronRight, Activity, Fingerprint,
  Skull, Sparkles, Wifi, HardDrive, MemoryStick, Network, Flame
} from 'lucide-react'

// ═══════════════════════════════════════════════════
// 数据定义
// ═══════════════════════════════════════════════════

const LAYERS = [
  { id: 1, name: '系统属性', icon: Shield, color: 'oklch(0.65 0.25 290)', desc: 'ro.debuggable / ro.secure / ro.build.tags', threat: '低' },
  { id: 2, name: 'ART 注入', icon: Bug, color: 'oklch(0.7 0.2 200)', desc: 'Frida / Xposed / LSPosed / SandHook', threat: '高' },
  { id: 3, name: '内存特征', icon: MemoryStick, color: 'oklch(0.75 0.2 150)', desc: 'Magisk / Zygisk / Shamiko / Riru', threat: '高' },
  { id: 4, name: '挂载检查', icon: HardDrive, color: 'oklch(0.7 0.2 200)', desc: 'overlayfs / bind-mount / 命名空间', threat: '中' },
  { id: 5, name: '侧信道', icon: Activity, color: 'oklch(0.8 0.2 80)', desc: 'syscall 时延 + 结果一致性', threat: '中' },
  { id: 6, name: 'Root 守护', icon: Skull, color: 'oklch(0.65 0.25 20)', desc: 'magiskd / ksud / apd / sukid', threat: '高' },
  { id: 7, name: '启动链', icon: Lock, color: 'oklch(0.7 0.2 200)', desc: 'Bootloader / AVB / dm-verity', threat: '低' },
  { id: 8, name: 'Magisk', icon: Flame, color: 'oklch(0.65 0.25 20)', desc: '主流 + Delta/Kitsune/Kitana fork', threat: '高' },
  { id: 9, name: 'KernelSU', icon: Cpu, color: 'oklch(0.75 0.2 150)', desc: 'KSU / SukiSU / KSU-NEXT', threat: '高' },
  { id: 10, name: 'APatch', icon: Cpu, color: 'oklch(0.65 0.25 290)', desc: 'APD / KPM 用户态模块', threat: '中' },
  { id: 11, name: 'Hook 框架', icon: Bug, color: 'oklch(0.7 0.2 200)', desc: 'Xposed / LSPosed / Frida / Substrate', threat: '高' },
  { id: 12, name: '自定义 ROM', icon: Sparkles, color: 'oklch(0.8 0.2 80)', desc: '50+ ROM 标识 (LineageOS 等)', threat: '低' },
  { id: 13, name: '固件完整性', icon: Fingerprint, color: 'oklch(0.7 0.2 200)', desc: 'TEE / Modem / Recovery / Vendor', threat: '中' },
  { id: 14, name: '虚拟框架', icon: Eye, color: 'oklch(0.75 0.2 150)', desc: 'VirtualXposed / 太极 / 双开分身', threat: '中' },
  { id: 15, name: '危险应用', icon: AlertTriangle, color: 'oklch(0.65 0.25 20)', desc: 'GameGuardian / CheatEngine', threat: '中' },
  { id: 16, name: 'Magisk 扩展', icon: Network, color: 'oklch(0.65 0.25 290)', desc: 'DenyList / ZygiskNext / ReZygisk', threat: '中' },
]

const SCAN_LOGS = [
  '[INIT] 加载原生检测引擎 libapex_root.so...',
  '[INIT] eBPF 防火墙就绪 (kernel 5.15+)',
  '[L1] 读取 /dev/__properties__ ...',
  '[L1] ro.debuggable=0 ✅ ro.secure=1 ✅',
  '[L2] 扫描 /proc/self/maps ...',
  '[L2] 检测 Frida gadget ... 未发现 ✅',
  '[L3] RWX 页面检测 ... 发现 2 个可疑映射',
  '[L3] ⚠️ Magisk 匿名映射特征匹配!',
  '[L4] 解析 /proc/self/mountinfo ...',
  '[L4] overlayfs 检测 ... 发现挂载异常',
  '[L5] ARM64 裸 svc 指令计时 ...',
  '[L5] syscall 时延分析 ... 正常范围',
  '[L6] 枚举 /proc/*/cmdline ...',
  '[L6] ⚠️ 发现 magiskd 进程 (PID 4231)',
  '[L7] 读取 /proc/cmdline ...',
  '[L7] Bootloader: unlocked ⚠️',
  '[L8] 扫描 Magisk 守护进程 ...',
  '[L8] ⚠️ /data/adb/magisk 存在!',
  '[L9] 检测 KernelSU ...',
  '[L9] /data/adb/ksu 不存在 ✅',
  '[L10] 检测 APatch ...',
  '[L10] /data/adb/ap 不存在 ✅',
  '[L11] Hook 框架扫描 ...',
  '[L11] LSPosed 未检测到 ✅',
  '[L12] build.prop 多分区扫描 ...',
  '[L12] 官方 ROM ✅',
  '[L13] TEE / Modem 分区检查 ...',
  '[L13] dm-verity 启用 ✅',
  '[L14] 虚拟框架检测 ...',
  '[L14] VirtualXposed 未检测到 ✅',
  '[L15] 危险应用扫描 ...',
  '[L15] GameGuardian 未安装 ✅',
  '[L16] Magisk 扩展检测 ...',
  '[L16] ⚠️ DenyList 配置发现!',
  '[DONE] 16 层检测完成',
  '[RESULT] 风险评分: 62/100 ❌ 高风险',
]

const FEATURES = [
  { icon: Radar, title: '16 层深度检测', desc: '从系统属性到固件完整性，全维度安全审计' },
  { icon: EyeOff, title: '3 模式隐藏', desc: 'Detection / Hide / Game 三种隐藏策略' },
  { icon: Lock, title: '后量子签名', desc: 'ML-DSA-65 (CRYSTALS-Dilithium-3) 防篡改' },
  { icon: Zap, title: 'eBPF 防火墙', desc: 'Android 12+ 内核级 syscall 拦截' },
  { icon: Cpu, title: '微服务架构', desc: '20 个独立 .so 插件，热加载' },
  { icon: Terminal, title: '原生引擎', desc: 'C++20 + NDK 28，ARM64 裸 syscall' },
]

// ═══════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════

export default function Home() {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [scanProgress, setScanProgress] = useState(0)
  const [currentLayer, setCurrentLayer] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [layerResults, setLayerResults] = useState<Record<number, 'clean' | 'detected' | 'pending'>>({})
  const [activeTab, setActiveTab] = useState('scanner')
  const [riskScore, setRiskScore] = useState(0)
  const logEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动日志
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  // 扫描模拟
  const startScan = useCallback(() => {
    if (scanState === 'scanning') return
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

    const logInterval = setInterval(() => {
      if (logIdx < SCAN_LOGS.length) {
        const logLine = SCAN_LOGS[logIdx]
        if (logLine) {
          setLogs(prev => [...prev, logLine])
        }
        logIdx++
      } else {
        clearInterval(logInterval)
      }
    }, 180)

    const progressInterval = setInterval(() => {
      if (done) {
        clearInterval(progressInterval)
        return
      }
      progress += 1.2
      setScanProgress(Math.min(progress, 100))

      // 层进度
      const newLayerIdx = Math.floor((progress / 100) * 16)
      if (newLayerIdx > layerIdx) {
        layerIdx = newLayerIdx
        setCurrentLayer(layerIdx)
        // 模拟检测结果
        const detectedLayers = [3, 4, 6, 8, 16] // 这些层会检测到异常
        setLayerResults(prev => ({
          ...prev,
          [layerIdx]: detectedLayers.includes(layerIdx) ? 'detected' : 'clean'
        }))
      }

      // 风险分动态增长
      if (progress > 20) setRiskScore(Math.min(Math.floor((progress - 20) * 0.78), 62))

      if (progress >= 100) {
        done = true
        clearInterval(logInterval)
        clearInterval(progressInterval)
        // 等待日志输出完成
        setTimeout(() => {
          setScanState('done')
        }, 800)
      }
    }, 80)
  }, [scanState])

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* 网格背景 */}
      <div className="fixed inset-0 grid-bg pointer-events-none" />

      {/* 顶部导航 */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/60 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center animate-pulse-glow">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <div className="font-bold text-lg leading-tight">APEX-Root</div>
              <div className="text-xs text-muted-foreground">v1.0.6 · 16 层检测引擎</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('scanner')}>
              <Radar className="w-4 h-4 mr-1" /> 检测台
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('layers')}>
              <Layers className="w-4 h-4 mr-1" /> 检测层
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('features')}>
              <Sparkles className="w-4 h-4 mr-1" /> 功能
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setActiveTab('download')}>
              <Download className="w-4 h-4 mr-1" /> 下载
            </Button>
            <Button size="sm" asChild>
              <a href="https://github.com/mengjinghao/root-check" target="_blank" rel="noopener">
                <Github className="w-4 h-4 mr-1" /> GitHub
              </a>
            </Button>
          </div>
        </div>
      </nav>

      {/* 主体内容 */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-20">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Hero 区 */}
          {activeTab === 'scanner' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              {/* Hero */}
              <section className="text-center py-12 sm:py-20 relative">
                <motion.div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 mb-6"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm text-muted-foreground">原生引擎已就绪 · libapex_root.so</span>
                </motion.div>

                <h1 className="text-5xl sm:text-7xl font-black mb-6 leading-tight">
                  <span className="gradient-text">APEX-Root</span>
                </h1>
                <p className="text-xl sm:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto">
                  16 层深度 Root 检测 · 3 模式隐藏 · 后量子签名
                </p>
                <p className="text-sm text-muted-foreground/70 mb-10 max-w-2xl mx-auto font-mono">
                  在感知安全与地面实况之间架起桥梁 —— 为安全研究者、开发者与企业 IT 管理员提供一把分毫不差的诊断仪器
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button size="lg" onClick={startScan} disabled={scanState === 'scanning'} className="text-base h-12 px-8">
                    {scanState === 'scanning' ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> 扫描中...</>
                    ) : scanState === 'done' ? (
                      <><Radar className="w-5 h-5 mr-2" /> 重新扫描</>
                    ) : (
                      <><Zap className="w-5 h-5 mr-2" /> 开始检测</>
                    )}
                  </Button>
                  <Button size="lg" variant="outline" className="text-base h-12 px-8" asChild>
                    <a href="https://github.com/mengjinghao/root-check/releases" target="_blank" rel="noopener">
                      <Download className="w-5 h-5 mr-2" /> 下载 APK
                    </a>
                  </Button>
                </div>

                {/* 统计数据 */}
                <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mt-12">
                  {[
                    { label: '检测层', value: '16', icon: Layers },
                    { label: '微服务插件', value: '20', icon: Cpu },
                    { label: '隐藏模式', value: '3', icon: EyeOff },
                  ].map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="glass-card rounded-2xl p-4"
                    >
                      <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
                      <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* 扫描台 */}
              <section className="grid lg:grid-cols-3 gap-6 mt-8">
                {/* 左侧：雷达 + 进度 */}
                <Card className="glass-card p-6 lg:col-span-1">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Radar className="w-5 h-5 text-primary" /> 检测雷达
                  </h3>

                  {/* 雷达动画 */}
                  <div className="relative aspect-square max-w-xs mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                    <div className="absolute inset-4 rounded-full border border-primary/15" />
                    <div className="absolute inset-8 rounded-full border border-primary/10" />
                    <div className="absolute inset-12 rounded-full border border-primary/5" />
                    {/* 十字线 */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/20" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/20" />
                    {/* 扫描线 */}
                    {scanState === 'scanning' && (
                      <div
                        className="absolute inset-0 rounded-full overflow-hidden"
                        style={{
                          background: 'conic-gradient(from 0deg, transparent 0deg, oklch(0.65 0.25 290 / 0.4) 60deg, transparent 90deg)',
                          animation: 'radar-sweep 3s linear infinite',
                        }}
                      />
                    )}
                    {/* 中心点 */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className={`w-4 h-4 rounded-full ${scanState === 'scanning' ? 'bg-primary animate-ping' : 'bg-primary/50'}`} />
                    </div>
                    {/* 检测到的点 */}
                    {[3, 6, 8, 16].map(layerId => {
                      const layer = LAYERS[layerId - 1]
                      if (layerResults[layerId] !== 'detected') return null
                      const angle = (layerId / 16) * 360
                      const radius = 30 + (layerId % 3) * 10
                      const x = 50 + Math.cos((angle * Math.PI) / 180) * radius
                      const y = 50 + Math.sin((angle * Math.PI) / 180) * radius
                      return (
                        <motion.div
                          key={layerId}
                          className="absolute w-3 h-3 rounded-full bg-red-500"
                          style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                          initial={{ scale: 0 }}
                          animate={{ scale: [0, 1.3, 1] }}
                          transition={{ duration: 0.5 }}
                        >
                          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* 进度 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">扫描进度</span>
                      <span className="font-mono font-bold">{scanProgress.toFixed(0)}%</span>
                    </div>
                    <Progress value={scanProgress} className="h-2" />
                    {scanState === 'scanning' && currentLayer > 0 && (
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        正在检测: <span className="text-primary font-semibold">L{currentLayer} {LAYERS[currentLayer - 1]?.name}</span>
                      </div>
                    )}
                  </div>
                </Card>

                {/* 中间：日志终端 */}
                <Card className="glass-card p-6 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Terminal className="w-5 h-5 text-primary" /> 检测日志
                    </h3>
                    {scanState === 'done' && (
                      <Badge variant={riskScore > 60 ? 'destructive' : 'secondary'} className="font-mono">
                        风险分: {riskScore}/100
                      </Badge>
                    )}
                  </div>

                  <div className="bg-black/40 rounded-lg p-4 font-mono text-xs h-80 overflow-y-auto border border-border/30">
                    {logs.length === 0 ? (
                      <div className="text-muted-foreground/50 flex items-center h-full justify-center">
                        <span>等待开始检测...</span>
                      </div>
                    ) : (
                      <>
                        {logs.filter(Boolean).map((log, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`whitespace-pre-wrap break-all ${
                              log.includes('⚠️') ? 'text-yellow-400' :
                              log.includes('✅') ? 'text-green-400' :
                              log.includes('❌') || log.includes('高风险') ? 'text-red-400' :
                              log.includes('[DONE]') || log.includes('[RESULT]') ? 'text-primary font-bold' :
                              'text-muted-foreground'
                            }`}
                          >
                            {log}
                          </motion.div>
                        ))}
                        <div ref={logEndRef} />
                      </>
                    )}
                  </div>

                  {/* 扫描结果摘要 */}
                  <AnimatePresence>
                    {scanState === 'done' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4"
                      >
                        <div className="grid grid-cols-3 gap-3">
                          <div className="glass-card rounded-xl p-3 text-center">
                            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-400" />
                            <div className="text-2xl font-bold text-green-400">
                              {Object.values(layerResults).filter(v => v === 'clean').length}
                            </div>
                            <div className="text-xs text-muted-foreground">通过</div>
                          </div>
                          <div className="glass-card rounded-xl p-3 text-center">
                            <XCircle className="w-5 h-5 mx-auto mb-1 text-red-400" />
                            <div className="text-2xl font-bold text-red-400">
                              {Object.values(layerResults).filter(v => v === 'detected').length}
                            </div>
                            <div className="text-xs text-muted-foreground">异常</div>
                          </div>
                          <div className="glass-card rounded-xl p-3 text-center">
                            <Shield className="w-5 h-5 mx-auto mb-1 text-primary" />
                            <div className="text-2xl font-bold gradient-text">16</div>
                            <div className="text-xs text-muted-foreground">总层数</div>
                          </div>
                        </div>
                        {riskScore > 60 && (
                          <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2"
                          >
                            <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div className="text-sm">
                              <span className="font-bold text-red-400">高风险设备</span>
                              <span className="text-muted-foreground ml-2">检测到 Root 框架痕迹，建议查看详细报告</span>
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </section>
            </motion.div>
          )}

          {/* 16 层检测可视化 */}
          {activeTab === 'layers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <section className="text-center mb-10">
                <h2 className="text-4xl font-black mb-3">
                  <span className="gradient-text">16 层检测架构</span>
                </h2>
                <p className="text-muted-foreground">每一层独立检测，覆盖从系统属性到固件完整性的全维度安全审计</p>
              </section>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {LAYERS.map((layer, i) => {
                  const status = layerResults[layer.id]
                  return (
                    <motion.div
                      key={layer.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className={`glass-card p-5 h-full transition-all hover:scale-105 cursor-pointer ${
                        status === 'detected' ? 'border-red-500/50' :
                        status === 'clean' ? 'border-green-500/30' : ''
                      }`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${layer.color}20` }}>
                            <layer.icon className="w-5 h-5" style={{ color: layer.color }} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono text-muted-foreground">L{layer.id}</span>
                            {status === 'detected' && <XCircle className="w-4 h-4 text-red-400" />}
                            {status === 'clean' && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                            {status === 'pending' && <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />}
                          </div>
                        </div>
                        <h4 className="font-bold text-sm mb-1">{layer.name}</h4>
                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{layer.desc}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            威胁: {layer.threat}
                          </Badge>
                          {status === 'detected' && (
                            <Badge variant="destructive" className="text-xs">已检测</Badge>
                          )}
                          {status === 'clean' && (
                            <Badge className="text-xs bg-green-500/20 text-green-400 border-green-500/30">通过</Badge>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>

              <div className="text-center mt-8">
                <Button onClick={() => { setActiveTab('scanner'); setTimeout(startScan, 300) }} size="lg">
                  <Zap className="w-5 h-5 mr-2" /> 运行完整检测
                </Button>
              </div>
            </motion.div>
          )}

          {/* 功能特性 */}
          {activeTab === 'features' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <section className="text-center mb-10">
                <h2 className="text-4xl font-black mb-3">
                  <span className="gradient-text">核心功能</span>
                </h2>
                <p className="text-muted-foreground">专业级安全分析工具的全维度能力</p>
              </section>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {FEATURES.map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="glass-card p-6 h-full hover:border-primary/50 transition-colors">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <feat.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h4 className="font-bold text-lg mb-2">{feat.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* 隐藏模式展示 */}
              <section className="mt-12">
                <h3 className="text-2xl font-bold text-center mb-6">
                  <EyeOff className="inline w-6 h-6 mr-2 text-primary" />
                  3 模式隐藏系统
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { icon: Eye, name: 'Detection', desc: '仅检测不隐藏', detail: '默认模式，零副作用', color: 'oklch(0.75 0.2 150)' },
                    { icon: ShieldCheck, name: 'Hide', desc: '对其他应用隐藏 Root', detail: 'eBPF 防火墙 (Android 12+) 或 mount namespace 隔离', color: 'oklch(0.65 0.25 290)' },
                    { icon: Gamepad2, name: 'Game', desc: '激进隐藏 + 性能优化', detail: '进程伪装 + 敏感路径屏蔽 + HWID 伪装', color: 'oklch(0.8 0.2 80)' },
                  ].map((mode, i) => (
                    <motion.div
                      key={mode.name}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="glass-card p-6 text-center hover:scale-105 transition-transform">
                        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${mode.color}20` }}>
                          <mode.icon className="w-8 h-8" style={{ color: mode.color }} />
                        </div>
                        <h4 className="font-bold text-lg" style={{ color: mode.color }}>{mode.name}</h4>
                        <p className="text-sm font-medium mt-1">{mode.desc}</p>
                        <p className="text-xs text-muted-foreground mt-2">{mode.detail}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* 技术栈 */}
              <section className="mt-12">
                <h3 className="text-2xl font-bold text-center mb-6">
                  <Cpu className="inline w-6 h-6 mr-2 text-primary" />
                  技术栈
                </h3>
                <div className="flex flex-wrap justify-center gap-3">
                  {['Kotlin 1.9', 'C++20', 'NDK 28.2', 'Jetpack Compose', 'Material3', 'eBPF CO-RE', 'Protobuf Lite', 'liboqs', 'ML-DSA-65', 'CMake 3.22.1', 'Gradle 8.2', 'Unix Socket'].map(tech => (
                    <Badge key={tech} variant="outline" className="text-sm py-1.5 px-3">
                      {tech}
                    </Badge>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {/* 下载页 */}
          {activeTab === 'download' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <section className="text-center mb-10">
                <h2 className="text-4xl font-black mb-3">
                  <span className="gradient-text">下载 APEX-Root</span>
                </h2>
                <p className="text-muted-foreground">v1.0.6 · 无混淆版本 · 完整调试信息</p>
              </section>

              <div className="max-w-3xl mx-auto space-y-4">
                {[
                  { name: 'APEX-Root-v1.0.6-arm64-v8a.apk', size: '40 MB', desc: 'ARM 64 位 — 现代手机推荐', url: 'https://github.com/mengjinghao/root-check/releases/download/v1.0.6/APEX-Root-v1.0.6-arm64-v8a.apk', recommended: true },
                  { name: 'APEX-Root-v1.0.6-armeabi-v7a.apk', size: '39 MB', desc: 'ARM 32 位 — 旧款手机', url: 'https://github.com/mengjinghao/root-check/releases/download/v1.0.6/APEX-Root-v1.0.6-armeabi-v7a.apk', recommended: false },
                  { name: 'APEX-Root-v1.0.6-x86_64.apk', size: '40 MB', desc: 'x86 64 位 — 模拟器', url: 'https://github.com/mengjinghao/root-check/releases/download/v1.0.6/APEX-Root-v1.0.6-x86_64.apk', recommended: false },
                ].map(apk => (
                  <Card key={apk.name} className="glass-card p-5 flex items-center justify-between hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Download className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-sm">{apk.name}</span>
                          {apk.recommended && <Badge className="text-xs">推荐</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{apk.desc} · {apk.size}</div>
                      </div>
                    </div>
                    <Button asChild>
                      <a href={apk.url} target="_blank" rel="noopener">
                        <Download className="w-4 h-4 mr-1" /> 下载
                      </a>
                    </Button>
                  </Card>
                ))}

                <div className="mt-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <h4 className="font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" /> 使用要求
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Android 10+ (API 29+)</li>
                    <li>Root 权限（Magisk / KernelSU / APatch）用于隐藏功能</li>
                    <li>首次启动需授予通知权限</li>
                    <li>仅检测功能无需 Root</li>
                  </ul>
                </div>

                <div className="text-center mt-6">
                  <Button variant="outline" asChild>
                    <a href="https://github.com/mengjinghao/root-check" target="_blank" rel="noopener">
                      <Github className="w-4 h-4 mr-2" /> 查看源码
                    </a>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-bold">APEX-Root</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            专业级 Android 设备完整性评估系统
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <a href="https://github.com/mengjinghao/root-check" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">
              GitHub
            </a>
            <a href="https://github.com/mengjinghao/root-check/releases" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">
              Releases
            </a>
            <a href="https://github.com/mengjinghao/root-check/blob/main/docs/ARCHITECTURE.md" target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">
              文档
            </a>
          </div>
          <p className="text-xs text-muted-foreground/50 mt-4">
            v1.0.6 · Made by MJH · 本应用仅供安全研究使用
          </p>
        </div>
      </footer>
    </div>
  )
}

// 缺失的 Layers 图标导入
function Layers({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>
      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>
      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>
    </svg>
  )
}
