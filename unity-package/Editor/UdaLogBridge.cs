using UnityEngine;
using UnityEditor;
using System;
using System.IO;

[InitializeOnLoad]
public static class UdaLogBridge
{
    private static readonly string UdaLogsDir;
    private static readonly string LogFilePath;
    private static readonly object WriteLock = new();
    private const long MaxLogFileSize = 5 * 1024 * 1024; // 5MB

    static UdaLogBridge()
    {
        var projectRoot = Directory.GetParent(Application.dataPath)?.FullName;
        if (projectRoot == null) return;

        UdaLogsDir = Path.Combine(projectRoot, ".uda", "logs");
        LogFilePath = Path.Combine(UdaLogsDir, "console.jsonl");

        Application.logMessageReceived += OnLogMessageReceived;
        EditorApplication.quitting += OnQuitting;
    }

    private static void OnLogMessageReceived(string message, string stackTrace, LogType type)
    {
        if (type != LogType.Error && type != LogType.Exception && type != LogType.Warning)
            return;

        try
        {
            // Check file size and rotate if needed
            if (File.Exists(LogFilePath) && new FileInfo(LogFilePath).Length > MaxLogFileSize)
            {
                File.Delete(LogFilePath);
            }

            if (!Directory.Exists(UdaLogsDir))
                Directory.CreateDirectory(UdaLogsDir);

            var entry = new LogEntry
            {
                time = DateTime.UtcNow.ToString("o"),
                type = type.ToString(),
                message = message,
                stack = string.IsNullOrEmpty(stackTrace) ? "" : stackTrace.Trim()
            };

            var json = JsonUtility.ToJson(entry);

            lock (WriteLock)
            {
                File.AppendAllText(LogFilePath, json + "\n");
            }
        }
        catch
        {
            // Silently fail — we must never cause errors in the logging system itself
        }
    }

    private static void OnQuitting()
    {
        Application.logMessageReceived -= OnLogMessageReceived;
    }

    [Serializable]
    private class LogEntry
    {
        public string time;
        public string type;
        public string message;
        public string stack;
    }
}
