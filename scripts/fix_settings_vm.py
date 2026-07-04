#!/usr/bin/env python3
"""Fix SettingsViewModel.kt — atomic state updates + exceptionHandler + try-catch around native calls."""
import re
import sys

path = "/home/z/my-project/root-check/apex-root/app/src/main/java/com/apex/root/viewmodel/SettingsViewModel.kt"
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add exceptionHandler to all `viewModelScope.launch(Dispatchers.IO) {`
before = content
content = content.replace(
    'viewModelScope.launch(Dispatchers.IO) {',
    'viewModelScope.launch(Dispatchers.IO + exceptionHandler) {'
)
print(f"Step 1: replaced {before.count('viewModelScope.launch(Dispatchers.IO) {')} launch scopes with exceptionHandler")

# 2. Replace `_settings.value = _settings.value.copy(` with atomic `_settings.update { it.copy(`
# Match patterns like: `_settings.value = _settings.value.copy(XXX); persist()`
# and also the multi-line `when` block pattern.
count_atomic = 0
# Simple single-line pattern: `_settings.value = _settings.value.copy(...); persist()`
# Multi-line `when` pattern: `_settings.value = when (index) { ... }; persist()`  -> skip (atomicity inside when is harder)

# We'll do a careful regex-based replacement for the simple `.copy(` case:
# Pattern: _settings.value = _settings.value.copy(ARGS); persist()
def replace_atomic(m):
    global count_atomic
    count_atomic += 1
    args = m.group(1)
    return f'_settings.update {{ it.copy({args}) }}; persist()'

content = re.sub(
    r'_settings\.value = _settings\.value\.copy\((.+?)\); persist\(\)',
    replace_atomic,
    content
)
print(f"Step 2: replaced {count_atomic} atomic-state-update sites")

# 3. Wrap native call bodies in try-catch in the `viewModelScope.launch(Dispatchers.IO + exceptionHandler) { ... }` blocks
# This is harder to do with regex — focus on the 5 specific updateXxx functions that call native methods.

# Wrap updateHideStrategy body
old_hide = '''    fun updateHideStrategy(strategy: HideStrategy) {
        _settings.update { it.copy(hideStrategy = strategy) }; persist()
        // 接线 native 层
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            val appUid = getApplication<Application>().applicationInfo.uid
            when (strategy) {
                HideStrategy.UNIDIRECTIONAL -> { NativeBridge.enableHideMode(appUid) }
                HideStrategy.FULL -> { NativeBridge.enableGameMode(appUid) }
                HideStrategy.TARGETED -> { NativeBridge.disableHideMode() }
            }
        }
    }'''
new_hide = '''    fun updateHideStrategy(strategy: HideStrategy) {
        _settings.update { it.copy(hideStrategy = strategy) }; persist()
        // 接线 native 层
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            try {
                val appUid = getApplication<Application>().applicationInfo.uid
                when (strategy) {
                    HideStrategy.UNIDIRECTIONAL -> { NativeBridge.enableHideMode(appUid) }
                    HideStrategy.FULL -> { NativeBridge.enableGameMode(appUid) }
                    HideStrategy.TARGETED -> { NativeBridge.disableHideMode() }
                }
            } catch (e: Throwable) {
                Log.e("SettingsViewModel", "updateHideStrategy native call failed", e)
            }
        }
    }'''
if old_hide in content:
    content = content.replace(old_hide, new_hide)
    print("Step 3a: wrapped updateHideStrategy body in try-catch")
else:
    print("Step 3a: WARN — updateHideStrategy pattern not found", file=sys.stderr)

# Wrap updateHwidSpoof body
old_hwid = '''    fun updateHwidSpoof(enabled: Boolean) {
        _settings.update { it.copy(hwidSpoofEnabled = enabled) }; persist()
        // 接线：HWID 伪装由 NativeHwid.spoofAll / restoreReal 控制
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            if (enabled) {
                com.apex.root.hid.NativeHwid.spoofAll()
            } else {
                com.apex.root.hid.NativeHwid.restoreReal()
            }
        }
    }'''
new_hwid = '''    fun updateHwidSpoof(enabled: Boolean) {
        _settings.update { it.copy(hwidSpoofEnabled = enabled) }; persist()
        // 接线：HWID 伪装由 NativeHwid.spoofAll / restoreReal 控制
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            try {
                if (enabled) {
                    com.apex.root.hid.NativeHwid.spoofAll()
                } else {
                    com.apex.root.hid.NativeHwid.restoreReal()
                }
            } catch (e: Throwable) {
                Log.e("SettingsViewModel", "updateHwidSpoof native call failed", e)
            }
        }
    }'''
if old_hwid in content:
    content = content.replace(old_hwid, new_hwid)
    print("Step 3b: wrapped updateHwidSpoof body in try-catch")
else:
    print("Step 3b: WARN — updateHwidSpoof pattern not found", file=sys.stderr)

# Wrap updateGameMode body
old_gm = '''    fun updateGameMode(enabled: Boolean) {
        _settings.update { it.copy(gameModeEnabled = enabled) }; persist()
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            val appUid = getApplication<Application>().applicationInfo.uid
            if (enabled) {
                NativeBridge.enableGameMode(appUid)
            } else {
                NativeBridge.disableHideMode()
            }
        }
    }'''
new_gm = '''    fun updateGameMode(enabled: Boolean) {
        _settings.update { it.copy(gameModeEnabled = enabled) }; persist()
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            try {
                val appUid = getApplication<Application>().applicationInfo.uid
                if (enabled) {
                    NativeBridge.enableGameMode(appUid)
                } else {
                    NativeBridge.disableHideMode()
                }
            } catch (e: Throwable) {
                Log.e("SettingsViewModel", "updateGameMode native call failed", e)
            }
        }
    }'''
if old_gm in content:
    content = content.replace(old_gm, new_gm)
    print("Step 3c: wrapped updateGameMode body in try-catch")
else:
    print("Step 3c: WARN — updateGameMode pattern not found", file=sys.stderr)

# Wrap updateGameModeAggressive body
old_gma = '''    fun updateGameModeAggressive(enabled: Boolean) {
        _settings.update { it.copy(gameModeAggressive = enabled) }; persist()
        // aggressive 模式：重新启用 game mode 以应用更激进的隐藏
        if (_settings.value.gameModeEnabled) {
            viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
                val appUid = getApplication<Application>().applicationInfo.uid
                NativeBridge.enableGameMode(appUid)
            }
        }
    }'''
new_gma = '''    fun updateGameModeAggressive(enabled: Boolean) {
        _settings.update { it.copy(gameModeAggressive = enabled) }; persist()
        // aggressive 模式：重新启用 game mode 以应用更激进的隐藏
        if (_settings.value.gameModeEnabled) {
            viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
                try {
                    val appUid = getApplication<Application>().applicationInfo.uid
                    NativeBridge.enableGameMode(appUid)
                } catch (e: Throwable) {
                    Log.e("SettingsViewModel", "updateGameModeAggressive native call failed", e)
                }
            }
        }
    }'''
if old_gma in content:
    content = content.replace(old_gma, new_gma)
    print("Step 3d: wrapped updateGameModeAggressive body in try-catch")
else:
    print("Step 3d: WARN — updateGameModeAggressive pattern not found", file=sys.stderr)

# Wrap updatePmuSpoof / updateTimingSpoof / updateMemorySpoof
for fn_name in ['updatePmuSpoof', 'updateTimingSpoof', 'updateMemorySpoof']:
    # find the function and wrap its body
    # Pattern looks like:
    #     fun updatePmuSpoof(enabled: Boolean) {
    #         _settings.update { it.copy(pmuSpoofEnabled = enabled) }; persist()
    #         ... comment ...
    #         if (enabled && !NativeBridge.isHideModeActive()) {
    #             viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
    #                 val appUid = getApplication<Application>().applicationInfo.uid
    #                 NativeBridge.enableHideMode(appUid)
    #             }
    #         }
    #     }
    pattern = re.compile(
        r'(    fun ' + fn_name + r'\(enabled: Boolean\) \{\n'
        r'        _settings\.update \{ it\.copy\(\w+Enabled = enabled\) \}; persist\(\)\n'
        r'        [^\n]*\n'  # comment line
        r'        if \(enabled && !NativeBridge\.isHideModeActive\(\)\) \{\n'
        r'            viewModelScope\.launch\(Dispatchers\.IO \+ exceptionHandler\) \{\n'
        r'                val appUid = getApplication<Application>\(\)\.applicationInfo\.uid\n'
        r'                NativeBridge\.enableHideMode\(appUid\)\n'
        r'            \}\n'
        r'        \}\n'
        r'    \})'
    )
    m = pattern.search(content)
    if m:
        old_block = m.group(1)
        new_block = old_block.replace(
            '                val appUid = getApplication<Application>().applicationInfo.uid\n'
            '                NativeBridge.enableHideMode(appUid)\n',
            '                try {\n'
            '                    val appUid = getApplication<Application>().applicationInfo.uid\n'
            '                    NativeBridge.enableHideMode(appUid)\n'
            '                } catch (e: Throwable) {\n'
            '                    Log.e("SettingsViewModel", "' + fn_name + ' native call failed", e)\n'
            '                }\n'
        )
        content = content.replace(old_block, new_block)
        print(f"Step 3e-{fn_name}: wrapped {fn_name} body in try-catch")
    else:
        print(f"Step 3e-{fn_name}: WARN — {fn_name} pattern not found", file=sys.stderr)

# 4. Wrap persist() body in try-catch (defensive against disk-full / XML parse errors)
old_persist = '''    private fun persist() {
        viewModelScope.launch { repository.save(_settings.value) }
    }'''
new_persist = '''    private fun persist() {
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            try {
                repository.save(_settings.value)
            } catch (e: Throwable) {
                Log.e("SettingsViewModel", "persist failed", e)
            }
        }
    }'''
if old_persist in content:
    content = content.replace(old_persist, new_persist)
    print("Step 4: wrapped persist() body in try-catch and moved to IO dispatcher")
else:
    print("Step 4: WARN — persist pattern not found", file=sys.stderr)

# 5. Fix resetToDefaults to also disable native side effects
old_reset = '''    fun resetToDefaults() {
        _settings.value = AppSettings(); persist()
    }'''
new_reset = '''    fun resetToDefaults() {
        _settings.value = AppSettings(); persist()
        // 关闭所有 native 副作用，避免设置已重置但 native 状态仍激活
        viewModelScope.launch(Dispatchers.IO + exceptionHandler) {
            try {
                NativeBridge.disableHideMode()
                com.apex.root.hid.NativeHwid.restoreReal()
            } catch (e: Throwable) {
                Log.e("SettingsViewModel", "resetToDefaults native cleanup failed", e)
            }
        }
    }'''
if old_reset in content:
    content = content.replace(old_reset, new_reset)
    print("Step 5: resetToDefaults now also disables native side effects")
else:
    print("Step 5: WARN — resetToDefaults pattern not found", file=sys.stderr)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("\nAll SettingsViewModel fixes applied.")
