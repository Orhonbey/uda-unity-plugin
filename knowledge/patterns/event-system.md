---
title: Event System
since: "2017.1"
stable: "2017.1"
deprecated_alternatives: []
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Events.UnityEvent.html
api_refs:
  - class: UnityEvent
    namespace: UnityEngine.Events
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Events.UnityEvent.html
  - class: ScriptableObject
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/ScriptableObject.html
last_verified: "2026-03-05"
---

# Event System

## Overview

Event-driven architecture decouples systems by allowing objects to communicate without direct references. Events enable cross-scene communication, UI updates, and reactive game systems. Choose between C# events (fast, code-only), UnityEvent (inspector-friendly), or ScriptableObject channels (cross-scene, modular).

Whether this pattern is used in a project is decided by the project's architecture profile (see the selected profile in `CLAUDE.md` / `.uda/rules/unity/profiles/`), not by this file.

## Key Concepts

### C# Events/Action
Standard .NET events using `event` keyword or `System.Action`. Fastest performance, code-only.

### UnityEvent
Serializable events that can be wired in the Inspector. Slightly slower but designer-friendly.

### ScriptableObject Event Channels
SO-based event system enabling communication between prefabs, scenes, and systems without direct references.

## Code Examples

### C# Action Event Pattern

```csharp
using UnityEngine;
using System;

public class PlayerHealth : MonoBehaviour
{
    // Event that other classes can subscribe to
    public event Action<float> OnHealthChanged;
    public event Action OnPlayerDied;

    [SerializeField] private float _maxHealth = 100f;
    private float _currentHealth;

    private void Start()
    {
        _currentHealth = _maxHealth;
    }

    public void TakeDamage(float damage)
    {
        _currentHealth -= damage;
        _currentHealth = Mathf.Max(0, _currentHealth);
        
        // Notify subscribers
        OnHealthChanged?.Invoke(_currentHealth);

        if (_currentHealth <= 0)
        {
            OnPlayerDied?.Invoke();
        }
    }

    public void Heal(float amount)
    {
        _currentHealth += amount;
        _currentHealth = Mathf.Min(_maxHealth, _currentHealth);
        OnHealthChanged?.Invoke(_currentHealth);
    }
}

// Subscriber
public class HealthBarUI : MonoBehaviour
{
    [SerializeField] private PlayerHealth _playerHealth;
    [SerializeField] private UnityEngine.UI.Slider _healthSlider;

    private void OnEnable()
    {
        // Subscribe to events
        _playerHealth.OnHealthChanged += UpdateHealthBar;
        _playerHealth.OnPlayerDied += OnPlayerDeath;
    }

    private void OnDisable()
    {
        // ALWAYS unsubscribe to prevent memory leaks
        _playerHealth.OnHealthChanged -= UpdateHealthBar;
        _playerHealth.OnPlayerDied -= OnPlayerDeath;
    }

    private void UpdateHealthBar(float health)
    {
        _healthSlider.value = health / 100f;
    }

    private void OnPlayerDeath()
    {
        Debug.Log("Player died!");
        // Show death screen
    }
}
```

### UnityEvent Usage

```csharp
using UnityEngine;
using UnityEngine.Events;

public class Damageable : MonoBehaviour
{
    [SerializeField] private float _health = 100f;
    
    // Inspector-configurable events
    [Space]
    public UnityEvent OnDamaged;
    public UnityEvent OnDestroyed;
    
    [Space]
    public UnityEvent<float> OnHealthChanged;

    public void TakeDamage(float damage)
    {
        _health -= damage;
        
        // Invoke events
        OnDamaged?.Invoke();
        OnHealthChanged?.Invoke(_health);

        if (_health <= 0)
        {
            OnDestroyed?.Invoke();
            Destroy(gameObject);
        }
    }
}

// Usage: Wire up in Inspector
// - OnDamaged -> ParticleSystem.Play()
// - OnDestroyed -> SpawnExplosion()
// - OnHealthChanged -> UpdateHealthBar.UpdateValue(float)
```

### ScriptableObject Event Channel

```csharp
using UnityEngine;
using System;

[CreateAssetMenu(fileName = "GameEvent", menuName = "Events/Game Event")]
public class GameEvent : ScriptableObject
{
    private event Action _listeners;

    public void Raise()
    {
        _listeners?.Invoke();
    }

    public void RegisterListener(Action listener)
    {
        _listeners += listener;
    }

    public void UnregisterListener(Action listener)
    {
        _listeners -= listener;
    }
}

// Typed event channel for data
[CreateAssetMenu(fileName = "GameEvent_Float", menuName = "Events/Game Event Float")]
public class GameEventFloat : ScriptableObject
{
    private event Action<float> _listeners;

    public void Raise(float value)
    {
        _listeners?.Invoke(value);
    }

    public void RegisterListener(Action<float> listener)
    {
        _listeners += listener;
    }

    public void UnregisterListener(Action<float> listener)
    {
        _listeners -= listener;
    }
}
```

### GameEventListener Component

```csharp
using UnityEngine;
using UnityEngine.Events;

public class GameEventListener : MonoBehaviour
{
    [SerializeField] private GameEvent _event;
    [SerializeField] private UnityEvent _response;

    private void OnEnable()
    {
        _event?.RegisterListener(OnEventRaised);
    }

    private void OnDisable()
    {
        _event?.UnregisterListener(OnEventRaised);
    }

    private void OnEventRaised()
    {
        _response?.Invoke();
    }
}

// Typed listener
public class GameEventFloatListener : MonoBehaviour
{
    [SerializeField] private GameEventFloat _event;
    [SerializeField] private UnityEvent<float> _response;

    private void OnEnable()
    {
        _event?.RegisterListener(OnEventRaised);
    }

    private void OnDisable()
    {
        _event?.UnregisterListener(OnEventRaised);
    }

    private void OnEventRaised(float value)
    {
        _response?.Invoke(value);
    }
}
```

### Using SO Event Channels

```csharp
// Publisher - can be in any scene
public class LevelManager : MonoBehaviour
{
    [SerializeField] private GameEvent _onLevelComplete;
    [SerializeField] private GameEventFloat _onScoreChanged;

    private int _score;

    public void AddScore(int points)
    {
        _score += points;
        _onScoreChanged?.Raise(_score);
    }

    public void CompleteLevel()
    {
        _onLevelComplete?.Raise();
    }
}

// Subscriber - can be in any scene
public class UIManager : MonoBehaviour
{
    [SerializeField] private GameEventFloat _onScoreChanged;
    [SerializeField] private GameEvent _onLevelComplete;
    [SerializeField] private TMPro.TextMeshProUGUI _scoreText;
    [SerializeField] private GameObject _victoryPanel;

    private void OnEnable()
    {
        _onScoreChanged?.RegisterListener(UpdateScore);
        _onLevelComplete?.RegisterListener(ShowVictory);
    }

    private void OnDisable()
    {
        _onScoreChanged?.UnregisterListener(UpdateScore);
        _onLevelComplete?.UnregisterListener(ShowVictory);
    }

    private void UpdateScore(float score)
    {
        _scoreText.text = $"Score: {score:F0}";
    }

    private void ShowVictory()
    {
        _victoryPanel.SetActive(true);
    }
}
```

## Best Practices

- **SO events across scenes**: ScriptableObject channels can connect objects that live in different scenes.
- **C# events within a system**: Action/event is the fastest option for communication inside one system.
- **Always unsubscribe**: Unregister in OnDisable/OnDestroy to prevent memory leaks.
- **Null-conditional invoke**: Use `?.Invoke()` pattern to avoid null checks.
- **UnityEvent for designer wiring**: Expose UnityEvents for things designers need to hook up.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Not unsubscribing | Memory leaks, exceptions after destruction | Always unregister in OnDisable |
| UnityEvent in hot paths | Performance overhead | Use C# events for frequent calls |
| Anonymous lambda subscription | Can't unsubscribe later | Use named methods or keep delegate reference |
| Chaining too many listeners | Hard to debug | Keep event chains short and clear |
| Event explosion | Too many event types | Group related events, use typed payloads |

## Performance Comparison

| Event Type | Performance | Use Case |
|------------|-------------|----------|
| C# event/Action | Fastest | Internal systems, frequent updates |
| UnityEvent | ~10x slower | Inspector wiring, occasional events |
| SO Event Channel | Fast + flexible | Cross-scene, modular architecture |

## When to Use What

- **C# Events**: Player input handling, health changes, internal system communication
- **UnityEvents**: Animation events, button clicks, designer-configurable responses
- **SO Channels**: Cross-scene communication, achievement system, game-wide events
