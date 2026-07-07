'use client'

import React, { useState, useEffect, useRef } from 'react'

interface LogLine {
  text: string
  type: 'info' | 'success' | 'warn' | 'error' | 'input'
}

/**
 * 全局黑客后门终端
 *  - 按 ` 键 (Tab 上方) 切换开关
 *  - 输入 su / root 触发系统防线报警
 *  - 支持 help / status / scan --fast / clear 等指令
 */
export default function CyberTerminal() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [logs, setLogs] = useState<LogLine[]>([
    { text: 'APEX-Root Security Core v2.6.0 initialized.', type: 'success' },
    { text: 'Type "help" to see available terminal bypass testing commands.', type: 'info' },
  ])
  const terminalEndRef = useRef<HTMLDivElement>(null)

  // 监听 ` 键唤起终端
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 只在非输入框中触发 (避免影响表单输入)
      const target = e.target as HTMLElement
      const isTyping = ['INPUT', 'TEXTAREA'].includes(target?.tagName) || target?.isContentEditable

      if (e.key === '`' && !isTyping) {
        e.preventDefault()
        setIsOpen((prev) => !prev)
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const executeCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase()
    const newLogs: LogLine[] = [...logs, { text: `apex-root@user:~$ ${cmd}`, type: 'input' }]

    if (trimmed === 'clear') {
      setLogs([])
      return
    }

    switch (trimmed) {
      case 'help':
        newLogs.push(
          { text: '可用指令:', type: 'info' },
          { text: '  status       - 检查 16 层防御核心健康状态。', type: 'info' },
          { text: '  su / root    - 模拟一次恶意特权提升尝试。', type: 'info' },
          { text: '  scan --fast  - 触发高速微内核巡检。', type: 'info' },
          { text: '  layers       - 列出全部 16 层架构。', type: 'info' },
          { text: '  magisk       - 查询 Magisk 检测策略。', type: 'info' },
          { text: '  ksu          - 查询 KernelSU 检测策略。', type: 'info' },
          { text: '  frida        - 查询 Frida 动态注入检测。', type: 'info' },
          { text: '  shamiko      - 查询 Shamiko 隐藏对抗。', type: 'info' },
          { text: '  whoami       - 显示当前用户身份。', type: 'info' },
          { text: '  banner       - 打印 APEX-Root ASCII 横幅。', type: 'info' },
          { text: '  clear        - 清空战术屏幕。', type: 'info' },
        )
        break
      case 'status':
        newLogs.push(
          { text: '[L1-L4]  用户空间完整性: SECURE', type: 'success' },
          { text: '[L5-L12] 内核 syscall 盾: ACTIVE', type: 'success' },
          { text: '[L13-L16] TEE 硬件绑定: ENFORCED', type: 'success' },
        )
        break
      case 'su':
      case 'root':
        newLogs.push(
          { text: '🚨 严重警报: 检测到未授权 SU 二进制执行尝试!', type: 'error' },
          { text: '🚨 APEX-Root Layer 7 (Ptrace Anti-Hook) 已拦截载荷。', type: 'warn' },
          { text: '🔒 主机 IP 已记录，入侵反制措施已部署。', type: 'error' },
        )
        break
      case 'scan --fast':
        newLogs.push({ text: '⌛ 正在执行快速扫描...', type: 'info' })
        setTimeout(() => {
          setLogs((prev) => [
            ...prev,
            { text: '✓ 16 层已校验。未发现 Hook 向量。设备干净。', type: 'success' },
          ])
        }, 800)
        break
      case 'layers':
        newLogs.push(
          { text: 'L1-L4   应用层: SU 路径 / 只读分区 / 黑名单 / 构建标签', type: 'info' },
          { text: 'L5-L8   Native: Zygote / Env Path / .so 注入 / Inline Hook', type: 'info' },
          { text: 'L9-L12  内核: SVC syscall / Ptrace / Kallsyms / SELinux', type: 'info' },
          { text: 'L13-L16 TEE: Keystore / AVB 2.0 / RPMB / Hypervisor', type: 'info' },
        )
        break
      case 'magisk':
        newLogs.push(
          { text: '[Magisk 检测策略]', type: 'info' },
          { text: '  → L3: 内存匿名映射特征匹配 (0x7f3a2b)', type: 'info' },
          { text: '  → L6: magiskd 进程枚举 (/proc/*/cmdline)', type: 'info' },
          { text: '  → L8: /data/adb/magisk 路径存在性', type: 'info' },
          { text: '  → L16: DenyList 配置文件扫描', type: 'info' },
          { text: '绕过难度: 中 (MagiskHide + Zygisk 可过 L1-L4)', type: 'warn' },
        )
        break
      case 'ksu':
        newLogs.push(
          { text: '[KernelSU 检测策略]', type: 'info' },
          { text: '  → L9: 直接 SVC syscall 完整性监测', type: 'info' },
          { text: '  → L11: Kallsyms 驱动符号表扫描', type: 'info' },
          { text: '  → L12: SELinux Enforcing 状态强制', type: 'info' },
          { text: '绕过难度: 高 (需自定义 BPF 内核补丁才能过 L9-L12)', type: 'warn' },
        )
        break
      case 'frida':
        newLogs.push(
          { text: '[Frida 动态注入检测]', type: 'info' },
          { text: '  → L2: /proc/self/maps 中 frida-agent.so 映射', type: 'info' },
          { text: '  → L2: 端口 27042 监听检测', type: 'info' },
          { text: '  → L2: 线程名 gum-js-loop 枚举', type: 'info' },
          { text: '绕过难度: 中 (需 frida-gadget 重命名 + 端口转发)', type: 'warn' },
        )
        break
      case 'shamiko':
        newLogs.push(
          { text: '[Shamiko 隐藏对抗]', type: 'info' },
          { text: '  → L5: Zygote 内存 Fork 异常检测', type: 'info' },
          { text: '  → L7: 动态链接器 .so 注入指纹', type: 'info' },
          { text: '  → L8: Inline Assembly Hook 扫描', type: 'info' },
          { text: '绕过难度: 极高 (Shamiko 可过 L5-L8，但 L13+ 硬件层无法绕过)', type: 'error' },
        )
        break
      case 'whoami':
        newLogs.push({ text: 'guest (unprivileged) — UID 10042', type: 'success' })
        break
      case 'banner':
        newLogs.push(
          { text: '    ___   ____ _____ ____  ', type: 'success' },
          { text: '   / _ | / __// ___// __/ ', type: 'success' },
          { text: '  / __ |/ _/ / /   / _/   ', type: 'success' },
          { text: ' /_/ |_/___//_/  /___/   ', type: 'success' },
          { text: ' 16-Layer Root Detection Engine v1.0.6', type: 'info' },
        )
        break
      case '':
        // 空指令，忽略
        break
      default:
        newLogs.push({ text: `apex-bash: command not found: ${cmd}. 输入 "help" 查看可用指令`, type: 'error' })
    }
    setLogs(newLogs)
  }

  // 折叠状态：右下角悬浮按钮
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-secondary/80 border border-primary/50 text-primary px-3 py-1.5 text-xs rounded-md font-mono hover:bg-primary/10 hover:border-primary transition-all shadow-lg z-50 backdrop-blur-md"
        title="按 ` 键打开终端"
      >
        <span className="inline-block animate-pulse mr-1">▊</span>
        &gt;_ OPEN SHELL ( ` )
      </button>
    )
  }

  return (
    <div className="fixed inset-0 sm:inset-auto sm:bottom-0 sm:left-0 sm:right-0 bg-black/95 sm:bg-black/95 font-mono text-sm p-4 sm:p-6 z-50 sm:max-h-[80vh] flex flex-col border-t-2 border-primary shadow-2xl backdrop-blur-md">
      {/* Top Bar */}
      <div className="flex justify-between items-center border-b border-border pb-2 mb-4">
        <span className="text-primary font-bold flex items-center gap-2 text-xs sm:text-sm">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          APEX-ROOT INTERNAL DIAGNOSTIC CONSOLE
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-red-400 hover:text-red-500 border border-red-500/30 px-2 py-0.5 rounded text-xs bg-red-500/10 hover:bg-red-500/20 transition-colors"
        >
          [ESC / CLOSE]
        </button>
      </div>

      {/* Terminal Display */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 min-h-[40vh] sm:min-h-[300px]">
        {logs.map((log, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap break-all leading-relaxed ${
              log.type === 'success'
                ? 'text-emerald-400'
                : log.type === 'warn'
                ? 'text-yellow-400 font-semibold'
                : log.type === 'error'
                ? 'text-red-500 font-bold bg-red-950/30 px-2 py-0.5 rounded animate-shake'
                : log.type === 'input'
                ? 'text-cyan-400'
                : 'text-muted-foreground'
            }`}
          >
            {log.text}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Command Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (input) {
            executeCommand(input)
            setInput('')
          }
        }}
        className="mt-4 flex items-center gap-2 border-t border-border pt-3"
      >
        <span className="text-cyan-400 shrink-0">apex-root@user:~$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-primary caret-primary focus:ring-0 p-0 font-mono min-w-0"
          autoFocus
          placeholder='输入指令... (试试 "help")'
          autoComplete="off"
          spellCheck={false}
        />
      </form>
    </div>
  )
}
