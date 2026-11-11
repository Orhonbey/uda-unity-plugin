---
title: Object Pooling
since: "2021.1"
stable: "2021.1"
deprecated_alternatives: []
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Pool.ObjectPool_1.html
api_refs:
  - class: ObjectPool<T>
    namespace: UnityEngine.Pool
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Pool.ObjectPool_1.html
  - class: IObjectPool<T>
    namespace: UnityEngine.Pool
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Pool.IObjectPool_1.html
last_verified: "2026-03-05"
---

# Object Pooling

## Overview

Object pooling reduces garbage collection (GC) pressure by reusing objects instead of repeatedly instantiating and destroying them. Used in performance-critical scenarios like bullet hells, particle effects, and frequently spawned enemies. Unity provides a built-in `ObjectPool<T>` class since version 2021.1.

Whether this pattern is used in a project is decided by the project's architecture profile (see the selected profile in `CLAUDE.md` / `.uda/rules/unity/profiles/`), not by this file.

## Key Concepts

### Unity's ObjectPool<T>
Generic pool implementation with callbacks for create, get, release, and destroy actions.

### Pool Lifecycle
1. **Create**: New object instantiated when pool is empty
2. **Get**: Object retrieved from pool and activated
3. **Release**: Object returned to pool and deactivated
4. **Destroy**: Object destroyed when pool exceeds max size

### Warm-up
Pre-instantiating objects to avoid runtime hiccups.

## Code Examples

<!-- unity:2021.1+ -->

### Basic Object Pool Usage

```csharp
using UnityEngine;
using UnityEngine.Pool;

public class ProjectilePool : MonoBehaviour
{
    [SerializeField] private Projectile _projectilePrefab;
    [SerializeField] private int _defaultCapacity = 10;
    [SerializeField] private int _maxCapacity = 100;

    private ObjectPool<Projectile> _pool;

    private void Awake()
    {
        _pool = new ObjectPool<Projectile>(
            createFunc: CreateProjectile,
            actionOnGet: OnGetFromPool,
            actionOnRelease: OnReturnToPool,
            actionOnDestroy: OnDestroyPoolObject,
            collectionCheck: Application.isEditor, // Detect double-release in editor
            defaultCapacity: _defaultCapacity,
            maxSize: _maxCapacity
        );
    }

    private Projectile CreateProjectile()
    {
        Projectile projectile = Instantiate(_projectilePrefab);
        projectile.SetPool(_pool);
        return projectile;
    }

    private void OnGetFromPool(Projectile projectile)
    {
        projectile.gameObject.SetActive(true);
        projectile.ResetState();
    }

    private void OnReturnToPool(Projectile projectile)
    {
        projectile.gameObject.SetActive(false);
    }

    private void OnDestroyPoolObject(Projectile projectile)
    {
        Destroy(projectile.gameObject);
    }

    public Projectile Get()
    {
        return _pool.Get();
    }

    public void Release(Projectile projectile)
    {
        _pool.Release(projectile);
    }

    public void WarmUp(int count)
    {
        var temp = new Projectile[count];
        
        // Get objects from pool (forces creation)
        for (int i = 0; i < count; i++)
        {
            temp[i] = _pool.Get();
        }
        
        // Return them to pool
        for (int i = 0; i < count; i++)
        {
            _pool.Release(temp[i]);
        }
        
        Debug.Log($"Pool warmed up with {count} objects");
    }

    private void OnDestroy()
    {
        _pool?.Clear();
        _pool?.Dispose();
    }
}
```

### Pool-Aware Projectile Component

```csharp
using UnityEngine;
using UnityEngine.Pool;

public class Projectile : MonoBehaviour
{
    [SerializeField] private float _speed = 20f;
    [SerializeField] private float _lifetime = 5f;

    private IObjectPool<Projectile> _pool;
    private float _timeAlive;
    private Vector3 _direction;
    private bool _isReleased = false;

    public void SetPool(IObjectPool<Projectile> pool)
    {
        _pool = pool;
    }

    public void ResetState()
    {
        _timeAlive = 0f;
        _isReleased = false;
    }

    public void Initialize(Vector3 direction)
    {
        _direction = direction.normalized;
        transform.forward = _direction;
    }

    private void Update()
    {
        if (_isReleased) return;

        // Move projectile
        transform.position += _direction * _speed * Time.deltaTime;

        // Check lifetime
        _timeAlive += Time.deltaTime;
        if (_timeAlive >= _lifetime)
        {
            ReturnToPool();
        }
    }

    private void OnTriggerEnter(Collider other)
    {
        if (_isReleased) return;

        // Handle hit logic
        var damageable = other.GetComponent<IDamageable>(); // IDamageable is your custom interface
        damageable?.TakeDamage(10);

        ReturnToPool();
    }

    private void ReturnToPool()
    {
        if (_isReleased) return;
        _isReleased = true;
        _pool?.Release(this);
    }

    private void OnDisable()
    {
        // Ensure cleanup when returned to pool
        _isReleased = false;
    }
}
```

### Pool Warm-up

Call `WarmUp()` during initialization to pre-instantiate objects and avoid runtime stutter:

```csharp
private void Start()
{
    // Pre-warm pool with 20 objects
    WarmUp(20);
}
```

### Generic Pool Wrapper for GameObjects

```csharp
using UnityEngine;
using UnityEngine.Pool;

public class GameObjectPool<T> where T : Component
{
    private readonly ObjectPool<T> _pool;
    private readonly T _prefab;

    public GameObjectPool(T prefab, int defaultCapacity = 10, int maxSize = 100)
    {
        _prefab = prefab;
        _pool = new ObjectPool<T>(
            CreateFunc,
            ActionOnGet,
            ActionOnRelease,
            ActionOnDestroy,
            collectionCheck: Application.isEditor,
            defaultCapacity: defaultCapacity,
            maxSize: maxSize
        );
    }

    private T CreateFunc()
    {
        return Object.Instantiate(_prefab);
    }

    private void ActionOnGet(T obj)
    {
        obj.gameObject.SetActive(true);
    }

    private void ActionOnRelease(T obj)
    {
        obj.gameObject.SetActive(false);
    }

    private void ActionOnDestroy(T obj)
    {
        Object.Destroy(obj.gameObject);
    }

    public T Get()
    {
        return _pool.Get();
    }

    public void Release(T obj)
    {
        _pool.Release(obj);
    }

    public void Clear()
    {
        _pool.Clear();
    }
}

// Usage
public class EnemySpawner : MonoBehaviour
{
    [SerializeField] private Enemy _enemyPrefab;
    private GameObjectPool<Enemy> _enemyPool;

    private void Awake()
    {
        _enemyPool = new GameObjectPool<Enemy>(_enemyPrefab, 10, 50);
    }

    private void SpawnEnemy()
    {
        Enemy enemy = _enemyPool.Get();
        enemy.transform.position = GetSpawnPosition();
    }
}
```

<!-- /unity -->

## Best Practices

- **Pre-warm pools**: Instantiate objects during loading to avoid runtime hiccups.
- **Set max size**: Prevents memory bloat from unbounded growth.
- **Release in OnDisable**: Always return objects to pool when disabled.
- **Use for bullets/VFX/UI**: Any frequently spawned/destroyed objects benefit from pooling.
- **Enable collectionCheck in editor**: Detects double-release bugs during development.
- **Clear pools on scene change**: Prevent memory leaks when using persistent pools.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Forgetting to release | Pool exhaustion, fallback to Instantiate | Always release, use OnDisable |
| Double release | Exceptions (in editor), undefined behavior | Track released state, use collectionCheck |
| Accessing pooled objects | Working with inactive objects | Check active state before access |
| No max size | Unbounded memory growth | Always set reasonable maxSize |
| Modifying released objects | State corruption | Reset state in actionOnGet |
| Not clearing on destroy | Memory leaks | Call pool.Clear() in OnDestroy |

## Performance Comparison

```
Instantiate/Destroy (1000 bullets):
- GC Allocations: ~50KB per wave
- Frame time spikes: 5-15ms during instantiation

Object Pool (1000 bullets):
- GC Allocations: ~0KB after warm-up
- Frame time: Consistent 0.1-0.2ms
```

Use pooling when:
- Spawning more than 10 objects per second
- Objects have short lifetimes (< 5 seconds)
- Targeting mobile or low-end hardware
- GC spikes cause noticeable stutter
