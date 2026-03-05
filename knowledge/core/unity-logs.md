---
title: Unity Console Logs
since: "2017.1"
stable: "2017.1"
deprecated_alternatives: []
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Debug.html
api_refs:
  - class: Debug
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Debug.html
  - class: Application
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Application-logMessageReceived.html
last_verified: "2026-03-05"
---

# Unity Console Logs

## Overview

Unity provides a comprehensive logging system for debugging and monitoring application state. Logs appear in the Editor Console and can be written to files. Understanding log locations, types, and performance implications is essential for effective debugging.

## Key Concepts

### Log Types
- **Log**: Informational messages (white). Use for general flow tracking.
- **Warning**: Potential issues (yellow). Non-critical problems that should be reviewed.
- **Error**: Runtime errors (red). Code execution problems that may affect functionality.
- **Exception**: Unhandled exceptions (red). Critical errors that stop execution flow.
- **Assert**: Failed assertions (red). Development-time validation failures.

### Log File Locations

**Editor Logs:**
- **macOS**: `~/Library/Logs/Unity/Editor.log`
- **Windows**: `%LOCALAPPDATA%\Unity\Editor\Editor.log`
- **Linux**: `~/.config/unity3d/Editor.log`

**Player Logs (Builds):**
- **macOS**: `~/Library/Logs/CompanyName/ProductName/Player.log`
- **Windows**: `%USERPROFILE%\AppData\LocalLow\CompanyName\ProductName\Player.log`
- **Linux**: `~/.config/unity3d/CompanyName/ProductName/Player.log`
- **Android**: `/storage/emulated/0/Android/data/com.company.product/files/`
- **iOS**: Device console via Xcode

## Code Examples

### Basic Logging

```csharp
using UnityEngine;

public class LogExamples : MonoBehaviour
{
    private void Start()
    {
        // Informational logging
        Debug.Log("Game started successfully");
        Debug.Log($"Player level: {playerLevel}, Score: {score}");
        
        // Warning for potential issues
        Debug.LogWarning("Player health is low!");
        
        // Error for problems
        Debug.LogError("Failed to load save file!");
        
        // Exception logging
        try
        {
            RiskyOperation();
        }
        catch (System.Exception ex)
        {
            Debug.LogException(ex);
        }
        
        // Assertion (development only)
        Debug.Assert(playerConfig != null, "Player config is null!");
    }
}
```

### Conditional Compilation for Debug Logs

```csharp
using UnityEngine;

public class DebugLogger : MonoBehaviour
{
    [System.Diagnostics.Conditional("UNITY_EDITOR")]
    [System.Diagnostics.Conditional("DEVELOPMENT_BUILD")]
    public static void Log(object message)
    {
        Debug.Log(message);
    }

    [System.Diagnostics.Conditional("UNITY_EDITOR")]
    public static void LogEditorOnly(object message)
    {
        Debug.Log(message);
    }

    private void Update()
    {
        // These calls are stripped from release builds
        Log("This appears in Editor and Development builds");
        LogEditorOnly("This appears only in Editor");
        
        // Regular Debug.Log appears in all builds
        Debug.Log("This appears everywhere");
    }
}
```

### Application.logMessageReceived Hook

```csharp
using UnityEngine;
using System;

public class LogCapture : MonoBehaviour
{
    private void OnEnable()
    {
        Application.logMessageReceived += HandleLog;
    }

    private void OnDisable()
    {
        Application.logMessageReceived -= HandleLog;
    }

    private void HandleLog(string logString, string stackTrace, LogType type)
    {
        // Filter by log type
        if (type == LogType.Error || type == LogType.Exception)
        {
            // Send to analytics/crash reporting
            SendToCrashReporter(logString, stackTrace);
        }
        
        // Write to custom log file
        WriteToLogFile($"[{type}] {logString}");
    }

    private void SendToCrashReporter(string message, string stackTrace)
    {
        // Integration with crash reporting service
        Debug.Log($"Reporting error: {message}");
    }

    private void WriteToLogFile(string message)
    {
        // Custom file logging implementation
        var timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");
        // File.AppendAllText(logPath, $"{timestamp} {message}\n");
    }
}
```

### Structured Logging Pattern

```csharp
using UnityEngine;

public static class GameLogger
{
    public enum Category
    {
        Gameplay,
        UI,
        Network,
        SaveSystem
    }

    public static void Log(Category category, string message, Object context = null)
    {
        Debug.Log($"[{category}] {message}", context);
    }

    public static void LogWarning(Category category, string message, Object context = null)
    {
        Debug.LogWarning($"[{category}] {message}", context);
    }

    public static void LogError(Category category, string message, Object context = null)
    {
        Debug.LogError($"[{category}] {message}", context);
    }
}

// Usage
public class PlayerHealth : MonoBehaviour
{
    public void TakeDamage(float amount)
    {
        GameLogger.Log(GameLogger.Category.Gameplay, 
            $"Player took {amount} damage", this);
    }
}
```

## Best Practices

- **Use Debug.LogError for errors**: Reserve LogError for actual problems that need attention.
- **Strip logs in release builds**: Use conditional compilation or `Debug.unityLogger.logEnabled = false`.
- **Use structured logging**: Categorize logs for easier filtering.
- **Provide context**: Pass `this` as context parameter to click-to-select in Console.
- **Log performance data sparingly**: FPS and memory logs should not run every frame in production.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Debug.Log in Update | Severe performance impact | Use log rate limiting or conditional compilation |
| Not stripping logs in production | Performance hit, log spam | Use DEVELOPMENT_BUILD conditional |
| String concatenation in logs | GC allocations even when logs disabled | Use Debug.LogFormat or conditional methods |
| Logging in hot paths | Frame drops | Remove or conditionally compile |
| No context in logs | Hard to find source | Pass context object as parameter |

## Error Pattern Reference

### NullReferenceException
**Cause**: Accessing member on null object reference
**Fix**: Add null checks, verify inspector assignments, use TryGetComponent

### MissingReferenceException
**Cause**: Accessing destroyed GameObject or component
**Fix**: Check object lifetime, use object pooling instead of Destroy/Instantiate

### StackOverflowException
**Cause**: Infinite recursion, property self-reference
**Fix**: Check recursive method calls, verify property getters don't call themselves

### InvalidOperationException
**Cause**: Collection modified during iteration
**Fix**: Use temporary list or reverse iteration pattern

### TypeLoadException
**Cause**: Missing assembly reference, version mismatch
**Fix**: Check asmdef dependencies, verify plugin compatibility

### ArgumentException
**Cause**: Invalid argument passed to method
**Fix**: Validate inputs before passing to Unity methods

### IndexOutOfRangeException
**Cause**: Array/list index out of bounds
**Fix**: Check collection length before indexing

## Log Stripping for Production

```csharp
// In a static constructor or initialization
#if !UNITY_EDITOR && !DEVELOPMENT_BUILD
    Debug.unityLogger.logEnabled = false;
#endif
```
