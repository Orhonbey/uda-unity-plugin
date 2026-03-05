---
title: MonoBehaviour Lifecycle
since: "2017.1"
stable: "2017.1"
deprecated_alternatives: []
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/ScriptReference/MonoBehaviour.html
api_refs:
  - class: MonoBehaviour
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/MonoBehaviour.html
  - class: Coroutine
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Coroutine.html
last_verified: "2026-03-05"
---

# MonoBehaviour Lifecycle

## Overview

MonoBehaviour lifecycle methods define the execution order of Unity scripts. Understanding this flow is essential for proper initialization, updates, and cleanup. The lifecycle follows a predictable sequence from script loading through scene changes to object destruction.

## Key Concepts

### Initialization Phase
- **Awake()**: Called when the script instance is being loaded. Use for internal initialization, caching component references. Always runs before Start.
- **OnEnable()**: Called when the object becomes enabled and active. Use for registering events, starting coroutines.
- **Start()**: Called before the first frame update. Use for cross-component initialization that requires other objects to be ready.

### Update Loop
- **FixedUpdate()**: Fixed timestep (default 0.02s). Use for physics-related code (Rigidbody manipulation).
- **Update()**: Every frame. Use for general game logic, input handling, non-physics movement.
- **LateUpdate()**: After all Update calls. Use for camera following, ensuring it runs after object movement.

### Disable/Destroy
- **OnDisable()**: When behaviour becomes disabled or inactive. Use for unregistering events, stopping coroutines.
- **OnDestroy()**: When the object is being destroyed. Use for final cleanup.

## Code Examples

### Complete Lifecycle Script

```csharp
using UnityEngine;

public class LifecycleExample : MonoBehaviour
{
    [SerializeField] private Transform targetTransform;
    [SerializeField] private Rigidbody rb;
    
    private Coroutine _updateRoutine;
    private bool _isInitialized = false;

    // 1. First - Script loaded
    private void Awake()
    {
        // Cache component references
        rb = GetComponent<Rigidbody>();
        
        // Internal initialization only
        _isInitialized = true;
        Debug.Log("Awake: Component references cached");
    }

    // 2. Second - Object enabled
    private void OnEnable()
    {
        // Register for events
        GameManager.Instance.OnGamePaused += HandlePause;
        
        // Start coroutines
        _updateRoutine = StartCoroutine(UpdateLoop());
        Debug.Log("OnEnable: Event handlers registered");
    }

    // 3. Third - Before first frame
    private void Start()
    {
        // Cross-component initialization (safe to access other objects)
        if (targetTransform != null)
        {
            transform.position = targetTransform.position;
        }
        Debug.Log("Start: Cross-component initialization complete");
    }

    // 4. Physics update (fixed timestep)
    private void FixedUpdate()
    {
        // Physics code here
        if (rb != null)
        {
            rb.AddForce(Vector3.up * 9.81f);
        }
    }

    // 5. Frame update
    private void Update()
    {
        // Game logic, input
        if (Input.GetKeyDown(KeyCode.Space))
        {
            Jump();
        }
    }

    // 6. After all Update calls
    private void LateUpdate()
    {
        // Camera follow, final adjustments
    }

    // 7. When disabled
    private void OnDisable()
    {
        // Unregister events - CRITICAL to prevent memory leaks
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnGamePaused -= HandlePause;
        }
        
        // Stop coroutines
        if (_updateRoutine != null)
        {
            StopCoroutine(_updateRoutine);
        }
        Debug.Log("OnDisable: Cleanup complete");
    }

    // 8. When destroyed
    private void OnDestroy()
    {
        // Final cleanup
        Debug.Log("OnDestroy: Object being destroyed");
    }

    private void Jump()
    {
        // Implementation
    }

    private void HandlePause(bool paused)
    {
        // Handle pause
    }

    private System.Collections.IEnumerator UpdateLoop()
    {
        while (true)
        {
            yield return new WaitForSeconds(1f);
            // Periodic update
        }
    }
}
```

### Coroutine Startup in OnEnable

```csharp
private void OnEnable()
{
    // Safe to start coroutines here
    StartCoroutine(InitializeAfterFrame());
}

private System.Collections.IEnumerator InitializeAfterFrame()
{
    // Wait one frame for all Start() methods to complete
    yield return null;
    
    // Now safe to interact with other initialized objects
    FindAndCachePlayer();
}
```

## Best Practices

- **Never use constructors** in MonoBehaviour classes. Use Awake() for initialization.
- **Cache in Awake**: GetComponent calls should happen in Awake, not Update.
- **Awake for self, Start for others**: Initialize internal state in Awake; interact with other objects in Start.
- **Always unsubscribe**: Unregister from events in OnDisable to prevent memory leaks.
- **Stop coroutines**: Stop any running coroutines in OnDisable.
- **Use FixedUpdate for physics**: Any Rigidbody manipulation belongs in FixedUpdate.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| Logic in Update that should be in FixedUpdate | Physics jitter, inconsistent behavior | Move Rigidbody code to FixedUpdate |
| Not unsubscribing in OnDisable | Memory leaks, null reference exceptions | Always unsubscribe event handlers |
| Calling methods on destroyed objects | MissingReferenceException | Check `if (obj != null)` before using |
| GetComponent in Update | Performance hit every frame | Cache in Awake |
| Cross-reference in Awake | Other object may not be initialized | Use Start() for cross-references |
| Heavy logic in LateUpdate | Frame rate drops | Keep LateUpdate lightweight |

## Execution Order Reference

```
Awake (all scripts) → OnEnable → Start → 
FixedUpdate → Update → LateUpdate → 
(repeats every frame) → 
OnDisable → OnDestroy
```

For multiple objects, Unity calls each phase on ALL objects before moving to the next phase.
