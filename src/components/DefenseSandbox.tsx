'use client'

import React, { useState } from 'react'

// 定义 16 层检测系统的虚拟架构
const DEFENSE_LAYERS = [
  { id: 1, name: '标准 SU 路径校验', tier: '应用层' },
  { id: 2, name: '/system 只读分区检查', tier: '应用层' },
  { id: 3, name: '包管理器黑名单', tier: '应用层' },
  { id: 4, name: 'Test-Keys 构建标签', tier: '应用层' },
  { id: 5, name: 'Zygote 内存 Fork 异常', tier: 'Native 框架' },
  { id: 6, name: 'Env Path 环境变量劫持', tier: 'Native 框架' },
  { id: 7, name: '动态链接器 (.so) 注入检测', tier: 'Native 框架' },
  { id: 8, name: 'Inline Assembly Hook 扫描', tier: 'Native 框架' },
  { id: 9, name: '直接 SVC 系统调用完整性', tier: '内核盾' },
  { id: 10, name: 'Ptrace 反调试封锁', tier: '内核盾' },
  { id: 11, name: 'Kallsyms 驱动修改扫描', tier: '内核盾' },
  { id: 12, name: 'SELinux Enforcing 模式', tier: '内核盾' },
  { id: 13, name: 'Keystore 硬件密钥证明', tier: 'TEE 硬件' },
  { id: 14, name: 'Verified Boot (AVB 2.0) 状态', tier: 'TEE 硬件' },
  { id: 15, name: 'RPMB 分区加密握手', tier: 'TEE 硬件' },
  { id: 16, name: 'Hypervisor 直接证明检查', tier: 'TEE 硬件' },
]

const EXPLOITS = [
  { id: 'magisk', label: 'Magisk Hide (Zygisk 模式)', desc: '剥离标准 su 路径与应用层痕迹。' },
  { id: 'shamiko', label: 'Shamiko 隐藏模块', desc: '隔离并隐藏 Native Hook 调用。' },
  { id: 'ksu', label: 'KernelSU 内核引擎', desc: '通过 mount namespace 在内核态执行。' },
  { id: 'custom_kernel', label: '自定义 BPF 内核补丁', desc: '尝试伪造直接 svc 系统调用。' },
]

type LayerStatus = 'PASSED' | 'BLOCKED' | 'PENDING'

// 预设攻击组合 — 一键体验典型场景
const PRESETS = [
  { id: 'rookie', name: '新手 Root', exploits: ['magisk'], desc: '只装 Magisk，无隐藏' },
  { id: 'stealth', name: '潜伏模式', exploits: ['magisk', 'shamiko'], desc: 'Magisk + Shamiko 隐藏' },
  { id: 'kernel', name: '内核入侵', exploits: ['ksu', 'custom_kernel'], desc: 'KernelSU + 魔改内核' },
  { id: 'godmode', name: '神级突防', exploits: ['magisk', 'shamiko', 'ksu', 'custom_kernel'], desc: '全栈武器库' },
]

export default function DefenseSandbox() {
  // 用户勾选的黑客攻击组件
  const [selectedExploits, setSelectedExploits] = useState<string[]>([])
  const [scanning, setScanning] = useState(false)
  const [currentScanningIndex, setCurrentScanningIndex] = useState<number | null>(null)
  const [layerResults, setLayerResults] = useState<Record<number, LayerStatus>>({})

  const toggleExploit = (id: string) => {
    setSelectedExploits((prev) => (prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]))
  }

  const applyPreset = (exploits: string[]) => {
    if (scanning) return
    setSelectedExploits(exploits)
    setLayerResults({})
  }

  const runSimulation = async () => {
    setScanning(true)
    const results: Record<number, LayerStatus> = {}

    // 初始化全为等待状态
    DEFENSE_LAYERS.forEach((l) => {
      results[l.id] = 'PENDING'
    })
    setLayerResults({ ...results })

    // 模拟逐层攻防扫描 (修复了原代码 DEFENSE_LAYERS.forEach.length 的 bug)
    for (let i = 0; i < DEFENSE_LAYERS.length; i++) {
      const layer = DEFENSE_LAYERS[i]
      if (!layer) continue
      setCurrentScanningIndex(i)
      await new Promise<void>((resolve) => setTimeout(resolve, 150)) // 扫描动画延迟

      // 攻防逻辑判定核心
      let status: 'PASSED' | 'BLOCKED' = 'PASSED'

      // 规则 1：如果选了 MagiskHide，前 4 层应用层检测全部失效被绕过 (PASSED)
      if (selectedExploits.includes('magisk') && layer.id <= 4) {
        status = 'PASSED'
      } else if (layer.id <= 4 && selectedExploits.length > 0) {
        // 只要有 Root 但没隐藏工具，在应用层就会被拦截
        status = 'BLOCKED'
      }

      // 规则 2：选了 Shamiko 完美绕过 Native 5-8 层
      if (selectedExploits.includes('shamiko') && layer.id >= 5 && layer.id <= 8) {
        status = 'PASSED'
      } else if (
        !selectedExploits.includes('shamiko') &&
        (selectedExploits.includes('magisk') || selectedExploits.includes('ksu')) &&
        layer.id >= 5 &&
        layer.id <= 8
      ) {
        status = 'BLOCKED'
      }

      // 规则 3：KernelSU 能够绕过到 12 层，但 9-11 层如果没开魔改内核模块会被截获
      if (selectedExploits.includes('ksu') && layer.id >= 9 && layer.id <= 12) {
        status = selectedExploits.includes('custom_kernel') ? 'PASSED' : 'BLOCKED'
      }

      // 规则 4：底层的硬件级安全检测 (13-16 层)，目前没有任何软改工具能完美绕过
      if (layer.id >= 13 && selectedExploits.length > 0) {
        status = 'BLOCKED' // 终极防御：全面拦截
      }

      results[layer.id] = status
      setLayerResults({ ...results })
    }
    setScanning(false)
    setCurrentScanningIndex(null)
  }

  const resetAll = () => {
    setSelectedExploits([])
    setLayerResults({})
    setCurrentScanningIndex(null)
  }

  // 统计
  const blockedCount = Object.values(layerResults).filter((v) => v === 'BLOCKED').length
  const bypassedCount = Object.values(layerResults).filter((v) => v === 'PASSED').length

  return (
    <div className="w-full glass-card rounded-2xl p-6 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
      {/* 左操作面板：突防配置区 */}
      <div className="md:col-span-4 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/50 pb-6 md:pb-0 md:pr-6">
        <div>
          <h3 className="text-lg font-bold gradient-text mb-2 font-mono flex items-center gap-2">
            ⚔️ 攻防对抗沙盒
          </h3>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            勾选 Root 环境与隐藏模块，挑战 16 层内部检测矩阵，看哪一层最终挡住攻击。
          </p>

          <div className="space-y-3">
            <label className="text-xs text-muted-foreground font-bold tracking-wider block uppercase">
              Root 方案与隐藏套件
            </label>

            {EXPLOITS.map((exp) => (
              <div
                key={exp.id}
                onClick={() => !scanning && toggleExploit(exp.id)}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  selectedExploits.includes(exp.id)
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 bg-secondary/40 hover:border-primary/50 text-muted-foreground'
                }`}
              >
                <div className="flex justify-between items-center font-semibold text-sm font-mono">
                  {exp.label}
                  <input
                    type="checkbox"
                    checked={selectedExploits.includes(exp.id)}
                    readOnly
                    className="rounded border-border bg-black text-primary focus:ring-0 w-3.5 h-3.5"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{exp.desc}</p>
              </div>
            ))}
          </div>

          {/* 预设攻击组合 */}
          <div className="mt-5 space-y-2">
            <label className="text-xs text-muted-foreground font-bold tracking-wider block uppercase">
              快速预设
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const isActive = selectedExploits.length === preset.exploits.length &&
                  preset.exploits.every((e) => selectedExploits.includes(e))
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset.exploits)}
                    disabled={scanning}
                    className={`p-2 rounded-lg border text-left transition-all text-xs ${
                      isActive
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border/50 bg-secondary/30 hover:border-primary/40 text-muted-foreground'
                    } ${scanning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="font-bold font-mono">{preset.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{preset.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-6">
          <button
            onClick={runSimulation}
            disabled={scanning || selectedExploits.length === 0}
            className={`w-full py-3 rounded-lg font-mono font-bold transition-all text-sm ${
              scanning
                ? 'bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 animate-pulse cursor-wait'
                : selectedExploits.length === 0
                ? 'bg-secondary text-muted-foreground/50 border border-border cursor-not-allowed'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(146,111,255,0.3)]'
            }`}
          >
            {scanning ? '⚡ 引擎拦截中...' : '⚔️ 发起突防挑战'}
          </button>
          {!scanning && Object.keys(layerResults).length > 0 && (
            <button
              onClick={resetAll}
              className="w-full py-2 rounded-lg font-mono text-xs border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all"
            >
              ↻ 重置场景
            </button>
          )}
        </div>
      </div>

      {/* 右展示面板：16 层核心矩阵动态反馈 */}
      <div className="md:col-span-8">
        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
          <span className="text-xs text-muted-foreground font-mono">CORE DEFENSE LAYER MATRIX</span>
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-emerald-400 flex items-center gap-1">■ 已拦截 ({blockedCount})</span>
            <span className="text-red-400 flex items-center gap-1">■ 已绕过 ({bypassedCount})</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {DEFENSE_LAYERS.map((layer, index) => {
            const status = layerResults[layer.id]
            const isScanningNow = currentScanningIndex === index

            return (
              <div
                key={layer.id}
                className={`p-2.5 rounded-lg border font-mono transition-all duration-150 flex items-center justify-between ${
                  isScanningNow
                    ? 'border-yellow-500 bg-yellow-500/10 scale-[1.01] shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                    : status === 'BLOCKED'
                    ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-300'
                    : status === 'PASSED'
                    ? 'border-red-500/40 bg-red-500/10 text-red-400'
                    : 'border-border/50 bg-secondary/20 text-muted-foreground/50'
                }`}
              >
                <div className="truncate pr-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1 rounded border ${
                        layer.tier === 'TEE 硬件'
                          ? 'border-purple-500/50 text-purple-400 bg-purple-500/10'
                          : layer.tier === '内核盾'
                          ? 'border-blue-500/50 text-blue-400 bg-blue-500/10'
                          : layer.tier === 'Native 框架'
                          ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10'
                          : 'border-border text-muted-foreground'
                      }`}
                    >
                      L{layer.id}
                    </span>
                    <span className="text-xs font-medium truncate">{layer.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground block mt-0.5">{layer.tier}</span>
                </div>

                <div className="text-xs font-bold shrink-0 ml-2">
                  {isScanningNow ? (
                    <span className="text-yellow-400 animate-ping inline-block">●</span>
                  ) : status === 'BLOCKED' ? (
                    <span className="text-emerald-400">已拦截</span>
                  ) : status === 'PASSED' ? (
                    <span className="text-red-400">已绕过</span>
                  ) : (
                    <span className="text-muted-foreground/40">就绪</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* 战斗结果总结 */}
        {!scanning && Object.keys(layerResults).length > 0 && (
          <div className="mt-4 p-3 rounded-lg border border-border/50 bg-secondary/30 text-xs">
            {bypassedCount === 0 ? (
              <span className="text-emerald-400 font-mono">✓ 完美防御：16 层全数拦截，攻击者被彻底阻断。</span>
            ) : blockedCount === 0 ? (
              <span className="text-red-400 font-mono">✗ 防御全线崩溃：所选工具组合突破全部 16 层。建议升级至 TEE 硬件级保护。</span>
            ) : (
              <span className="text-yellow-400 font-mono">
                ⚠ 部分突破：攻击在 L
                {Math.max(
                  ...DEFENSE_LAYERS.filter((l) => layerResults[l.id] === 'PASSED').map((l) => l.id),
                )}
                被阻断，但在更高层重新生效。整体安全等级：中。
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
