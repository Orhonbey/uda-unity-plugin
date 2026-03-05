---
title: Serialization
since: "2017.1"
stable: "2017.1"
deprecated_alternatives: ["BinaryFormatter (security vulnerabilities)"]
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/ScriptReference/JsonUtility.html
api_refs:
  - class: JsonUtility
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/JsonUtility.html
  - class: PlayerPrefs
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/PlayerPrefs.html
last_verified: "2026-03-05"
---

# Serialization

## Overview

Data persistence in Unity involves saving and loading game state. Unity provides several built-in options: JsonUtility for JSON serialization, PlayerPrefs for simple key-value storage, and file I/O for custom binary formats. Choose based on complexity, security needs, and platform requirements.

## Key Concepts

### JsonUtility
Fast, simple JSON serialization. Limited to basic types but sufficient for most save data.

### PlayerPrefs
Simple key-value storage for settings and small data. Not for save games.

### persistentDataPath
Cross-platform path for save files that persists across sessions.

### Binary Serialization
Custom binary formats for performance or obfuscation. Handle with care for security.

## Code Examples

### JsonUtility Save/Load

```csharp
using UnityEngine;
using System.IO;

[System.Serializable]
public class SaveData
{
    public string playerName;
    public int level;
    public int score;
    public float playTime;
    public Vector3Serializable playerPosition;
    public InventoryItemData[] inventory;
}

[System.Serializable]
public class Vector3Serializable
{
    public float x, y, z;

    public Vector3Serializable(Vector3 vector)
    {
        x = vector.x;
        y = vector.y;
        z = vector.z;
    }

    public Vector3 ToVector3()
    {
        return new Vector3(x, y, z);
    }
}

[System.Serializable]
public class InventoryItemData
{
    public string itemId;
    public int quantity;
}

public class SaveManager : MonoBehaviour
{
    private static string SavePath => 
        Path.Combine(Application.persistentDataPath, "savegame.json");

    public static void SaveGame(SaveData data)
    {
        string json = JsonUtility.ToJson(data, true);
        File.WriteAllText(SavePath, json);
        Debug.Log($"Game saved to: {SavePath}");
    }

    public static SaveData LoadGame()
    {
        if (!File.Exists(SavePath))
        {
            Debug.Log("No save file found");
            return null;
        }

        string json = File.ReadAllText(SavePath);
        SaveData data = JsonUtility.FromJson<SaveData>(json);
        Debug.Log("Game loaded successfully");
        return data;
    }

    public static void DeleteSave()
    {
        if (File.Exists(SavePath))
        {
            File.Delete(SavePath);
            Debug.Log("Save file deleted");
        }
    }
}
```

### PlayerPrefs Wrapper

```csharp
using UnityEngine;

public static class GameSettings
{
    private const string MUSIC_VOLUME_KEY = "MusicVolume";
    private const string SFX_VOLUME_KEY = "SFXVolume";
    private const string FULLSCREEN_KEY = "Fullscreen";
    private const string RESOLUTION_KEY = "Resolution";

    public static float MusicVolume
    {
        get => PlayerPrefs.GetFloat(MUSIC_VOLUME_KEY, 0.8f);
        set
        {
            PlayerPrefs.SetFloat(MUSIC_VOLUME_KEY, value);
            PlayerPrefs.Save();
        }
    }

    public static float SFXVolume
    {
        get => PlayerPrefs.GetFloat(SFX_VOLUME_KEY, 0.9f);
        set
        {
            PlayerPrefs.SetFloat(SFX_VOLUME_KEY, value);
            PlayerPrefs.Save();
        }
    }

    public static bool Fullscreen
    {
        get => PlayerPrefs.GetInt(FULLSCREEN_KEY, 1) == 1;
        set
        {
            PlayerPrefs.SetInt(FULLSCREEN_KEY, value ? 1 : 0);
            PlayerPrefs.Save();
        }
    }

    public static void SetResolution(int width, int height)
    {
        PlayerPrefs.SetString(RESOLUTION_KEY, $"{width}x{height}");
        PlayerPrefs.Save();
    }

    public static (int width, int height) GetResolution()
    {
        string res = PlayerPrefs.GetString(RESOLUTION_KEY, "1920x1080");
        string[] parts = res.Split('x');
        return (int.Parse(parts[0]), int.Parse(parts[1]));
    }

    public static void ResetToDefaults()
    {
        PlayerPrefs.DeleteAll();
        PlayerPrefs.Save();
    }
}
```

### File-Based Save with Encryption

```csharp
using UnityEngine;
using System.IO;
using System.Security.Cryptography;
using System.Text;

public class SecureSaveManager : MonoBehaviour
{
    [SerializeField] private string encryptionKey = "YourSecretKey123";

    private static string SavePath => 
        Path.Combine(Application.persistentDataPath, "savegame.dat");

    public void SaveEncrypted(SaveData data)
    {
        string json = JsonUtility.ToJson(data);
        string encrypted = EncryptString(json, encryptionKey);
        File.WriteAllText(SavePath, encrypted);
    }

    public SaveData LoadEncrypted()
    {
        if (!File.Exists(SavePath))
            return null;

        string encrypted = File.ReadAllText(SavePath);
        string json = DecryptString(encrypted, encryptionKey);
        return JsonUtility.FromJson<SaveData>(json);
    }

    private string EncryptString(string text, string key)
    {
        byte[] keyBytes = Encoding.UTF8.GetBytes(key.PadRight(32).Substring(0, 32));
        
        using (Aes aes = Aes.Create())
        {
            aes.Key = keyBytes;
            aes.GenerateIV();

            using (MemoryStream ms = new())
            {
                ms.Write(aes.IV, 0, aes.IV.Length);

                using (CryptoStream cs = new(ms, aes.CreateEncryptor(), CryptoStreamMode.Write))
                using (StreamWriter writer = new(cs))
                {
                    writer.Write(text);
                }

                return System.Convert.ToBase64String(ms.ToArray());
            }
        }
    }

    private string DecryptString(string encryptedText, string key)
    {
        byte[] keyBytes = Encoding.UTF8.GetBytes(key.PadRight(32).Substring(0, 32));
        byte[] fullCipher = System.Convert.FromBase64String(encryptedText);

        using (Aes aes = Aes.Create())
        {
            byte[] iv = new byte[16];
            System.Array.Copy(fullCipher, iv, 16);
            aes.Key = keyBytes;
            aes.IV = iv;

            using (MemoryStream ms = new())
            using (CryptoStream cs = new(ms, aes.CreateDecryptor(), CryptoStreamMode.Write))
            {
                cs.Write(fullCipher, 16, fullCipher.Length - 16);
                cs.FlushFinalBlock();
                return Encoding.UTF8.GetString(ms.ToArray());
            }
        }
    }
}
```

### Multiple Save Slots

```csharp
using UnityEngine;
using System.IO;
using System.Linq;

public class SaveSlotManager : MonoBehaviour
{
    private const int MAX_SLOTS = 3;

    private static string GetSlotPath(int slot)
    {
        return Path.Combine(Application.persistentDataPath, $"save_{slot}.json");
    }

    public static void SaveToSlot(SaveData data, int slot)
    {
        if (slot < 0 || slot >= MAX_SLOTS)
        {
            Debug.LogError("Invalid save slot");
            return;
        }

        string path = GetSlotPath(slot);
        string json = JsonUtility.ToJson(data, true);
        File.WriteAllText(path, json);
    }

    public static SaveData LoadFromSlot(int slot)
    {
        string path = GetSlotPath(slot);
        if (!File.Exists(path))
            return null;

        string json = File.ReadAllText(path);
        return JsonUtility.FromJson<SaveData>(json);
    }

    public static bool SlotExists(int slot)
    {
        return File.Exists(GetSlotPath(slot));
    }

    public static SaveMetadata GetSlotMetadata(int slot)
    {
        SaveData data = LoadFromSlot(slot);
        if (data == null)
            return null;

        return new SaveMetadata
        {
            playerName = data.playerName,
            level = data.level,
            playTime = data.playTime,
            lastSaved = File.GetLastWriteTime(GetSlotPath(slot))
        };
    }
}

public class SaveMetadata
{
    public string playerName;
    public int level;
    public float playTime;
    public System.DateTime lastSaved;
}
```

## Best Practices

- **Use JsonUtility for simple data**: Fast, no external dependencies.
- **Use persistentDataPath for save files**: Cross-platform, survives app updates.
- **Encrypt sensitive data**: Player data, currency, progress - protect from tampering.
- **Handle missing save files**: Always check File.Exists before reading.
- **Version your save data**: Add a version field for backward compatibility.
- **Don't serialize MonoBehaviour**: Serialize data classes only.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| PlayerPrefs for large data | 1MB limit on some platforms | Use file-based serialization |
| Not handling missing files | NullReferenceException | Check File.Exists first |
| Serializing MonoBehaviour directly | Data loss, crashes | Use serializable data classes |
| Storing passwords in plain text | Security risk | Use encryption, hash passwords |
| No save versioning | Breaks on game updates | Include version field in save data |
| Saving on every change | Performance hit, file corruption risk | Debounce saves, auto-save intervals |
| Trusting client-side saves | Easy to cheat | Server validation for competitive games |

## Platform-Specific Paths

```csharp
// Windows: C:\Users\[user]\AppData\LocalLow\[company]\[product]
// macOS: ~/Library/Application Support/[company]/[product]
// Linux: ~/.config/unity3d/[company]/[product]
// Android: /storage/emulated/0/Android/data/[bundle]/files
// iOS: Application sandbox Documents folder

Debug.Log(Application.persistentDataPath);
```
