---
title: Singleton Pattern
since: "2017.1"
stable: "2017.1"
deprecated_alternatives: ["ScriptableObject architecture", "Service Locator", "Dependency Injection"]
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Object.DontDestroyOnLoad.html
api_refs:
  - class: MonoBehaviour
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/MonoBehaviour.html
  - class: Object
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Object.DontDestroyOnLoad.html
last_verified: "2026-03-05"
---

# Singleton Pattern

## Overview

The Singleton pattern ensures a class has only one instance and provides global access to it. In Unity, this is commonly used for managers (GameManager, AudioManager, UIManager) that need to persist across scenes. A single instance is reachable from anywhere, so dependencies on it are not visible in a class's constructor or fields.

Whether this pattern is used in a project is decided by the project's architecture profile (see the selected profile in `CLAUDE.md` / `.uda/rules/unity/profiles/`), not by this file.

## Key Concepts

### Generic Singleton Base
A reusable base class that handles instance management, persistence, and duplicate prevention.

### Persistent Singleton
Survives scene loads using `DontDestroyOnLoad`. Useful for GameManager, AudioManager.

### Scene-Specific Singleton
Exists only within a scene. Destroyed on scene change. Useful for level managers.

### Lazy Initialization
Instance created on first access. Thread-safe considerations apply.

## Code Examples

### Generic Singleton Base Class

```csharp
using UnityEngine;

public abstract class Singleton<T> : MonoBehaviour where T : MonoBehaviour
{
    private static T _instance;
    private static readonly object _lock = new();
    private static bool _applicationIsQuitting = false;

    public static T Instance
    {
        get
        {
            if (_applicationIsQuitting)
            {
                Debug.LogWarning($"[Singleton] Instance '{typeof(T)}' already destroyed. Returning null.");
                return null;
            }

            lock (_lock)
            {
                if (_instance == null)
                {
                    // Try to find existing instance
                    _instance = FindFirstObjectByType<T>(); // Documented in the Script Reference for 2021.3, 2022.3 and 6000.0. Older equivalent: FindObjectOfType<T>()

                    if (_instance == null)
                    {
                        // Create new instance
                        var singletonObject = new GameObject();
                        _instance = singletonObject.AddComponent<T>();
                        singletonObject.name = $"{typeof(T)} (Singleton)";
                        
                        // Make persistent if needed
                        if (_instance is PersistentSingleton<T>)
                        {
                            DontDestroyOnLoad(singletonObject);
                        }
                        
                        Debug.Log($"[Singleton] Created instance of {typeof(T)}");
                    }
                }

                return _instance;
            }
        }
    }

    protected virtual void Awake()
    {
        if (_instance == null)
        {
            _instance = this as T;
        }
        else if (_instance != this)
        {
            Debug.LogWarning($"[Singleton] Duplicate instance of {typeof(T)} destroyed.");
            Destroy(gameObject);
        }
    }

    protected virtual void OnApplicationQuit()
    {
        _applicationIsQuitting = true;
    }

    protected virtual void OnDestroy()
    {
        if (_instance == this)
        {
            _instance = null;
        }
    }
}
```

### Persistent Singleton Variant

```csharp
using UnityEngine;

public abstract class PersistentSingleton<T> : Singleton<T> where T : MonoBehaviour
{
    protected override void Awake()
    {
        // Check if instance already exists
        if (Instance != null && Instance != this)
        {
            Debug.LogWarning($"[PersistentSingleton] Duplicate {typeof(T)} destroyed.");
            Destroy(gameObject);
            return;
        }

        base.Awake();
        DontDestroyOnLoad(gameObject);
    }
}

// Usage Example
public class GameManager : PersistentSingleton<GameManager>
{
    public int Score { get; private set; }
    public int Lives { get; private set; } = 3;

    public void AddScore(int points)
    {
        Score += points;
        Debug.Log($"Score: {Score}");
    }

    public void LoseLife()
    {
        Lives--;
        if (Lives <= 0)
        {
            GameOver();
        }
    }

    private void GameOver()
    {
        Debug.Log("Game Over!");
    }
}
```

### Scene-Specific Singleton

```csharp
using UnityEngine;

public abstract class SceneSingleton<T> : MonoBehaviour where T : MonoBehaviour
{
    public static T Instance { get; private set; }

    protected virtual void Awake()
    {
        if (Instance != null && Instance != this)
        {
            Debug.LogWarning($"[SceneSingleton] Multiple instances of {typeof(T)}. Destroying duplicate.");
            Destroy(gameObject);
            return;
        }

        Instance = this as T;
    }

    protected virtual void OnDestroy()
    {
        if (Instance == this)
        {
            Instance = null;
        }
    }
}

// Usage Example
public class LevelManager : SceneSingleton<LevelManager>
{
    [SerializeField] private Transform[] _spawnPoints;
    [SerializeField] private float _levelTime = 300f;

    private float _currentTime;

    private void Start()
    {
        _currentTime = _levelTime;
    }

    private void Update()
    {
        _currentTime -= Time.deltaTime;
        if (_currentTime <= 0)
        {
            TimeUp();
        }
    }

    private void TimeUp()
    {
        Debug.Log("Level time expired!");
    }
}
```

## Best Practices

- **Hidden dependencies**: Code that calls `Instance` has a dependency that is not visible in its constructor or fields. ScriptableObject events and dependency injection make dependencies explicit (see Alternatives below).
- **Handle application quitting**: The `_applicationIsQuitting` flag prevents accessing destroyed instances during shutdown.
- **Handle scene loading**: Use `DontDestroyOnLoad` only when persistence is truly needed.
- **Destroy duplicates**: Always handle duplicate instances created by scene loading.
- **Consider thread safety**: Use locking if accessing from multiple threads.
- **Direct access vs. events**: `GameManager.Instance.DoSomething()` is a direct call; events or injected dependencies reach the same code without naming the instance.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Multiple instances from scene loading | Duplicate managers | Check and destroy duplicates in Awake |
| Accessing during/after OnDestroy | NullReferenceException | Check `_applicationIsQuitting` flag |
| Not using DontDestroyOnLoad | Singleton destroyed on scene change | Call DontDestroyOnLoad for persistent singletons |
| Heavy logic in Instance getter | Performance issues | Keep getter lightweight |
| Singletons calling other singletons | Circular dependency risk | Use events for cross-manager communication |
| Testing difficulties | Hard to mock for unit tests | Use interfaces or dependency injection |

## Alternatives to Singleton

Other ways to reach shared state or services:
- **ScriptableObject Events**: Decoupled communication without global state
- **Service Locator**: Central registry with better testability
- **Dependency Injection**: Explicit dependencies passed to constructors
- **Zenject/Extenject**: Full DI framework for Unity
