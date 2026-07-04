# Worklog: APEX-Root Crash Fix Pass

---
Task ID: 1
Agent: main
Task: Connect to https://github.com/mengjinghao/root-check repo and comprehensively fix crash issues.

Work Log:
- Cloned repository to /home/z/my-project/root-check
- Read README.md, CODE_REVIEW.md, build.gradle.kts, AndroidManifest.xml
- Dispatched 2 parallel Explore subagents:
  - Agent 1: Audit Kotlin ViewModels + data layer for crashes — found 28 issues (C1–C28)
  - Agent 2: Audit Compose UI screens for crashes — found 17 issues (Issues 1–17)
- Applied fixes to 16 files:

  ViewModels:
  - ApexViewModel.kt: added CoroutineExceptionHandler, async SharedPreferences load, tryEmit instead of emit, try-catch in refreshState, deepReport truncation (64KB cap), moved exportReport to IO thread
  - ScanViewModel.kt: added CoroutineExceptionHandler, check send() return value, 30s scan timeout, progress coerceIn(0,1), avoid Error state clobbering
  - SettingsViewModel.kt: added CoroutineExceptionHandler, replaced 225 `_settings.value = _settings.value.copy(...)` with atomic `_settings.update { it.copy(...) }`, wrapped native call bodies (updateHideStrategy/HwidSpoof/GameMode/GameModeAggressive/PmuSpoof/TimingSpoof/MemorySpoof) in try-catch, persist() now uses IO+exceptionHandler+try-catch, resetToDefaults() now also disables native side effects

  UI screens:
  - GlassLogViewerScreen.kt: fixed LazyColumn duplicate-key crash (same-second same-message logs) — switched to itemsIndexed with index key
  - HistoryScreen.kt: fixed LazyColumn duplicate-key crash (same-ms timestamps) — switched to itemsIndexed with (index, timestamp) composite key
  - WhitelistScreen.kt: fixed LazyColumn duplicate-key crash (duplicate package names) — added distinct() + itemsIndexed
  - PermissionsScreen.kt: wrapped load() coroutine in try-catch/finally to prevent crashes from ClosedSendException/NPE during composition dispose
  - DashboardScreen.kt: changed LaunchedEffect(Unit) → LaunchedEffect(apexViewModel) so snackbar collector re-subscribes when ViewModel becomes non-null
  - SettingsScreen.kt: same LaunchedEffect fix; added scope = rememberCoroutineScope(); ModalBottomSheet now calls sheetState.hide() before removing from composition (fixes IllegalStateException on MIUI/One UI)
  - SplashScreen.kt: switched remember → rememberSaveable; LaunchedEffect(Unit) → LaunchedEffect(visible) to avoid re-delaying on rotation
  - Theme.kt: switched staticCompositionLocalOf → compositionLocalOf for LocalApexTextColors and LocalIsDarkTheme (theme toggle now properly recomposes all consumers)
  - GlassComponents.kt: fixed accent-line modifier order (padding was eating width) — now visible

  Data / Core layer:
  - SelfProtection.kt: marked context field @Volatile; init() now stores applicationContext to avoid leaking Activity
  - FingerprintDatabase.kt: marked entries/loaded @Volatile; deriveDatabaseKey() now checks hash.size >= 32 before copyInto (fixes IndexOutOfBoundsException when native fails) with SHA-256 fallback
  - RootDetectRepositoryImpl.kt: skip caching when native returns empty string (avoids 5s stale empty results)
  - PermissionManager.kt: replaced process.waitFor() with waitFor(timeout, MILLISECONDS) + destroyForcibly() in finally — no more Dispatchers.IO thread exhaustion when su dialog is dismissed slowly

Stage Summary:
- 16 files modified, ~530 insertions / ~335 deletions
- 3 LazyColumn duplicate-key crashes fixed (HIGH severity — most likely production crashes)
- All viewModelScope.launch bodies now have CoroutineExceptionHandler + try-catch
- All native side effects in SettingsViewModel now wrapped in try-catch
- Theme toggle now properly recomposes (no more stale colors)
- Splash no longer re-shows on rotation
- All state updates in SettingsViewModel are now atomic
- Native library failure no longer causes crash cascades (sha3_512,waitFor,cache all defended)
- Ready to commit and push back to GitHub
