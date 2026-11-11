---
title: ScriptableObjects
since: "2017.1"
stable: "2017.1"
deprecated_alternatives: []
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/ScriptReference/ScriptableObject.html
api_refs:
  - class: ScriptableObject
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/ScriptableObject.html
  - class: CreateAssetMenu
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/CreateAssetMenuAttribute.html
last_verified: "2026-03-05"
---

# ScriptableObjects

## Overview

ScriptableObjects are data containers that live in the Assets folder rather than in scenes. They provide a clean way to store shared data, game configuration, and runtime data sets without the overhead of MonoBehaviours. SOs are assets, not scene objects, making them ideal for data-driven design.

## Key Concepts

### Data Containers
Store game data like weapon stats, enemy configurations, level settings as editable assets.

### Runtime Sets
Collections that can be modified at runtime and shared across scenes.

### Enum Replacement
Replace fragile enums with SO references for type-safe, expandable systems.

### Event Channels
SO-based events for decoupled cross-scene communication.

### Asset References
Reference data assets from prefabs without scene dependencies.

## Code Examples

### Basic ScriptableObject with CreateAssetMenu

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "WeaponData", menuName = "Game/Weapon Data", order = 1)]
public class WeaponData : ScriptableObject
{
    [Header("Basic Info")]
    public string weaponName = "New Weapon";
    public string description;
    public Sprite icon;

    [Header("Stats")]
    public int damage = 10;
    public float fireRate = 1f;
    public int magazineSize = 30;
    public float reloadTime = 2f;
    public float range = 100f;

    [Header("Audio")]
    public AudioClip fireSound;
    public AudioClip reloadSound;

    [Header("VFX")]
    public GameObject muzzleFlashPrefab;
    public GameObject impactEffectPrefab;

    private void OnValidate()
    {
        // Validate values in editor
        damage = Mathf.Max(0, damage);
        fireRate = Mathf.Max(0.01f, fireRate);
        magazineSize = Mathf.Max(1, magazineSize);
    }
}
```

### ScriptableObject Variable Pattern

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "FloatVariable", menuName = "Variables/Float")]
public class FloatVariable : ScriptableObject
{
    public float value;

    // Runtime-only value that doesn't persist
    [System.NonSerialized]
    public float runtimeValue;

    private void OnEnable()
    {
        // Reset runtime value when entering play mode
        runtimeValue = value;
    }

    public void SetValue(float newValue)
    {
        runtimeValue = newValue;
    }

    public void ApplyChange(float amount)
    {
        runtimeValue += amount;
    }
}

// Reference wrapper for inspector
[System.Serializable]
public class FloatReference
{
    public bool useConstant = true;
    public float constantValue;
    public FloatVariable variable;

    public float Value
    {
        get { return useConstant ? constantValue : variable.runtimeValue; }
    }
}

// Usage in MonoBehaviour
public class PlayerHealth : MonoBehaviour
{
    [SerializeField] private FloatReference _maxHealth;
    [SerializeField] private FloatVariable _currentHealth;

    private void Start()
    {
        _currentHealth.runtimeValue = _maxHealth.Value;
    }
}
```

### Runtime Set Pattern

```csharp
using UnityEngine;
using System.Collections.Generic;

[CreateAssetMenu(fileName = "EnemyRuntimeSet", menuName = "Sets/Enemy Runtime Set")]
public class EnemyRuntimeSet : ScriptableObject
{
    private List<Enemy> _items = new();

    public int Count => _items.Count;

    public void Add(Enemy enemy)
    {
        if (!_items.Contains(enemy))
        {
            _items.Add(enemy);
        }
    }

    public void Remove(Enemy enemy)
    {
        if (_items.Contains(enemy))
        {
            _items.Remove(enemy);
        }
    }

    public Enemy GetClosest(Vector3 position)
    {
        Enemy closest = null;
        float closestDistance = float.MaxValue;

        foreach (var enemy in _items)
        {
            if (enemy == null) continue;
            
            float distance = Vector3.Distance(position, enemy.transform.position);
            if (distance < closestDistance)
            {
                closestDistance = distance;
                closest = enemy;
            }
        }

        return closest;
    }

    public void Clear()
    {
        _items.Clear();
    }

    private void OnEnable()
    {
        // Clear on play mode enter
        _items.Clear();
    }
}

// Enemy auto-registration
public class Enemy : MonoBehaviour
{
    [SerializeField] private EnemyRuntimeSet _enemySet;

    private void OnEnable()
    {
        _enemySet?.Add(this);
    }

    private void OnDisable()
    {
        _enemySet?.Remove(this);
    }
}
```

### SO as Configuration

```csharp
using UnityEngine;

[CreateAssetMenu(fileName = "GameConfig", menuName = "Game/Game Config")]
public class GameConfig : ScriptableObject
{
    [Header("Player")]
    public float playerMoveSpeed = 5f;
    public float playerJumpForce = 10f;
    public int playerMaxHealth = 100;

    [Header("Combat")]
    public float invulnerabilityTime = 1f;
    public float knockbackForce = 5f;

    [Header("Economy")]
    public int startingCurrency = 0;
    public float sellMultiplier = 0.5f;

    [Header("Difficulty Scaling")]
    public AnimationCurve enemyHealthCurve;
    public AnimationCurve enemyDamageCurve;

    [Header("Audio")]
    [Range(0f, 1f)]
    public float masterVolume = 1f;
    [Range(0f, 1f)]
    public float musicVolume = 0.8f;
    [Range(0f, 1f)]
    public float sfxVolume = 0.9f;
}

// Global access pattern (use sparingly)
public class GameManager : MonoBehaviour
{
    [SerializeField] private GameConfig _config;
    public static GameConfig Config { get; private set; }

    private void Awake()
    {
        Config = _config;
    }
}

// Usage
public class PlayerMovement : MonoBehaviour
{
    private float _moveSpeed;

    private void Start()
    {
        _moveSpeed = GameManager.Config.playerMoveSpeed;
    }
}
```

### SO Type Replacement (instead of enums)

```csharp
using UnityEngine;

// Instead of: public enum Rarity { Common, Rare, Epic, Legendary }
[CreateAssetMenu(fileName = "Rarity", menuName = "Game/Rarity")]
public class Rarity : ScriptableObject
{
    public string displayName;
    public Color color;
    public Sprite icon;
    public float dropChance;
    public int minStats;
    public int maxStats;
}

// Create assets: Common.asset, Rare.asset, Epic.asset, Legendary.asset
// Then reference directly:
public class Item : MonoBehaviour
{
    [SerializeField] private Rarity _rarity; // Drag Rarity asset here
    
    public string RarityDisplay => _rarity.displayName;
    public Color RarityColor => _rarity.color;
}
```

## Best Practices

- **Use for shared data**: Game config, level data, weapon stats - anything used by multiple objects.
- **Data lives in an asset**: SO values are edited in the Inspector and saved with the asset, so no code has to fill them in at runtime; data in static fields or a singleton is set up by code.
- **Use [System.NonSerialized] for runtime state**: Prevent editor changes from persisting at runtime.
- **Reset runtime state in OnEnable**: Clear runtime data when entering play mode.
- **Validate in OnValidate**: Catch configuration errors in the editor.
- **Organize with folders**: Keep SOs organized by type in the project.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Modifying SO at runtime in editor | Changes persist after play mode | Use [System.NonSerialized] for runtime fields |
| Not resetting runtime state | State leaks between play sessions | Clear/reset in OnEnable |
| Large SO files | Performance issues, merge conflicts | Split large configs into smaller SOs |
| Referencing scene objects | Broken references | Only reference other assets, not scene objects |
| No null checking | MissingReferenceException | Always validate SO references |
| Too many SO references | Memory overhead | Use lazy loading where appropriate |

## ScriptableObject vs MonoBehaviour for Data

| Use Case | ScriptableObject | MonoBehaviour |
|----------|-----------------|---------------|
| Weapon stats | ✅ Perfect fit | ❌ Scene overhead |
| Player health (instance) | ❌ Needs instance | ✅ Each player has own |
| Game configuration | ✅ Shared asset | ❌ One per scene |
| Runtime data sets | ✅ With NonSerialized | ✅ Direct approach |
| Level layout data | ✅ Asset reference | ✅ In-scene editing |
