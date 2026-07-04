#!/usr/bin/env python3
"""Apply targeted fixes to ApexViewModel.kt"""
import sys

path = "/home/z/my-project/root-check/apex-root/app/src/main/java/com/apex/root/viewmodel/trusted/ApexViewModel.kt"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = [
    # Fix triggerReset (use tryEmit instead of emit)
    (
        '''    fun triggerReset() {
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            _snackbarChannel.emit(SnackbarEvent("所有设置已恢复至出厂默认状态", SnackbarType.WARNING))
        }
    }''',
        '''    /**
     * 使用 tryEmit 而非 emit — emit 是 suspend 函数，在没有订阅者或缓冲区满时会挂起。
     * tryEmit 立即返回（缓冲区满时丢弃），不会卡住调用方。
     */
    fun triggerReset() {
        _snackbarChannel.tryEmit(SnackbarEvent("所有设置已恢复至出厂默认状态", SnackbarType.WARNING))
    }'''
    ),
    # Fix triggerExport
    (
        '''    fun triggerExport() {
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            _snackbarChannel.emit(SnackbarEvent("诊断日志已成功导出至系统外置存储", SnackbarType.SUCCESS))
        }
    }''',
        '''    fun triggerExport() {
        _snackbarChannel.tryEmit(SnackbarEvent("诊断日志已成功导出至系统外置存储", SnackbarType.SUCCESS))
    }'''
    ),
    # Fix deepReport truncation
    (
        '''                _uiState.update {
                    it.copy(
                        scanResult = report.take(500),
                        riskScore = runCatching { NativeBridge.getRiskScore() }.getOrDefault(0),
                        isScanning = false,
                        memFingerprintMask = memMask,
                        rwxPageCount = rwxCount,
                        hasShamiko = shamiko,
                        hasZygiskNext = zygiskNext,
                        selinuxCompromised = selinuxJump || selinuxMod,
                        deepReport = report,
                        selfCheckIssues = hookIssues + injectIssues + dexIssues
                    )
                }''',
        '''                // 限制 deepReport 大小，避免在 UI state 中持有大字符串导致 OOM
                val truncatedReport = if (report.length > 64_000) report.take(64_000) + "\\n...[truncated]" else report

                _uiState.update {
                    it.copy(
                        scanResult = report.take(500),
                        riskScore = runCatching { NativeBridge.getRiskScore() }.getOrDefault(0),
                        isScanning = false,
                        memFingerprintMask = memMask,
                        rwxPageCount = rwxCount,
                        hasShamiko = shamiko,
                        hasZygiskNext = zygiskNext,
                        selinuxCompromised = selinuxJump || selinuxMod,
                        deepReport = truncatedReport,
                        selfCheckIssues = hookIssues + injectIssues + dexIssues
                    )
                }'''
    ),
    # Fix refreshState - add try-catch
    (
        '''    fun refreshState() {
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            val gameMode = repository.getGameModeState()
            _uiState.update { it.copy(gameMode = gameMode) }
        }
    }''',
        '''    fun refreshState() {
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            try {
                val gameMode = repository.getGameModeState()
                _uiState.update { it.copy(gameMode = gameMode) }
            } catch (e: Throwable) {
                Log.e("ApexViewModel", "refreshState failed", e)
            }
        }
    }'''
    ),
    # Fix exportReport - move to IO thread
    (
        '''    fun exportReport(context: Context) {
        ReportExporter.shareReport(context, _uiState.value)
    }''',
        '''    fun exportReport(context: Context) {
        // 移到 IO 线程执行文件写入，避免主线程磁盘 I/O 触发 StrictMode 崩溃
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            try {
                ReportExporter.shareReport(context, _uiState.value)
            } catch (e: Throwable) {
                Log.e("ApexViewModel", "exportReport failed", e)
                _snackbarChannel.tryEmit(SnackbarEvent("报告导出失败: ${e.message ?: "未知错误"}", SnackbarType.ERROR))
            }
        }
    }'''
    ),
]

for i, (old, new) in enumerate(replacements):
    if old not in content:
        print(f"ERROR: replacement {i+1} old_str not found", file=sys.stderr)
        # Print first divergence for debugging
        idx = content.find(old[:30])
        if idx >= 0:
            sub = content[idx:idx+len(old)]
            for j, (a, b) in enumerate(zip(old, sub)):
                if a != b:
                    print(f'  diff at {j}: old={a!r} actual={b!r}', file=sys.stderr)
                    print(f'  old context: {old[max(0,j-15):j+15]!r}', file=sys.stderr)
                    print(f'  act context: {sub[max(0,j-15):j+15]!r}', file=sys.stderr)
                    break
        sys.exit(1)
    content = content.replace(old, new)
    print(f"Replacement {i+1} applied")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("All 5 fixes applied to ApexViewModel.kt")
