---
title: Component Pattern
since: "2017.1"
stable: "2017.1"
deprecated_alternatives: []
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Component.html
api_refs:
  - class: Component
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Component.html
  - class: GameObject
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/GameObject.html
last_verified: "2026-03-05"
---

# Component Pattern

## Overview

Unity's component-based architecture is the foundation of its game object system. Unlike traditional inheritance, GameObjects are empty containers that gain functionality through attached components. This promotes composition over inheritance and enables flexible, reusable code.

## Key Concepts

### Component Access Methods
- **GetComponent<T>()**: Returns the component of type T on the same GameObject. Throws if not found (rarely happens, returns null).
- **TryGetComponent<T>(out T component)**: Null-safe alternative that returns a bool indicating success. Preferred for optional components.
- **GetComponentInChildren<T>()**: Searches the GameObject and all its children recursively.
- **GetComponentInParent<T>()**: Searches the GameObject and all its parents up the hierarchy.
- **GetComponents<T>()**: Returns all components of type T on the GameObject as an array.

### Dependency Attributes
- **[RequireComponent(typeof(T))]**: Automatically adds dependent components when this component is added. Ensures required components exist.

## Code Examples

### Cached GetComponent Pattern

```csharp
using UnityEngine;

[RequireComponent(typeof(Rigidbody))]
[RequireComponent(typeof(Animator))]
public class PlayerController : MonoBehaviour
{
    // Cached component references
    [SerializeField] private Rigidbody _rigidbody;
    [SerializeField] private Animator _animator;
    [SerializeField] private Collider _collider;
    
    // Optional components (may or may not exist)
    private AudioSource _audioSource;
    private ParticleSystem _particleSystem;

    private void Awake()
    {
        // Required components - safe to assume they exist
        _rigidbody = GetComponent<Rigidbody>();
        _animator = GetComponent<Animator>();
        
        // Optional component - use TryGetComponent
        if (!TryGetComponent<Collider>(out _collider))
        {
            Debug.LogWarning("PlayerController: No Collider found on GameObject");
        }
        
        // Check for optional components
        TryGetComponent(out _audioSource);
        TryGetComponent(out _particleSystem);
    }
    
    private void Start()
    {
        // Safe to use cached references
        _rigidbody.useGravity = true;
        _animator.SetBool("IsGrounded", true);
    }
}
```

### TryGetComponent Null-Safe Pattern

```csharp
public class InteractionDetector : MonoBehaviour
{
    [SerializeField] private float _interactionRange = 3f;

    private void Update()
    {
        // Check for interactable objects
        Collider[] hits = Physics.OverlapSphere(transform.position, _interactionRange);
        
        foreach (var hit in hits)
        {
            // TryGetComponent for optional interface/component
            if (hit.TryGetComponent<IInteractable>(out var interactable))
            {
                interactable.Highlight();
            }
            
            // Alternative: Check multiple component types safely
            if (hit.TryGetComponent<EnemyAI>(out var enemy))
            {
                enemy.DetectPlayer(transform);
            }
            else if (hit.TryGetComponent<Collectible>(out var collectible))
            {
                collectible.ShowPickupPrompt();
            }
        }
    }
}

public interface IInteractable
{
    void Highlight();
    void Interact();
}
```

### GetComponentInChildren Usage

```csharp
public class WeaponSystem : MonoBehaviour
{
    [SerializeField] private Transform _weaponHolder;
    private Weapon _currentWeapon;
    private Animator _weaponAnimator;

    private void EquipWeapon(GameObject weaponPrefab)
    {
        // Instantiate and parent to holder
        GameObject weaponInstance = Instantiate(weaponPrefab, _weaponHolder);
        
        // Find Weapon component in children (could be on root or nested)
        _currentWeapon = weaponInstance.GetComponentInChildren<Weapon>();
        
        // Find animator that might be on a child mesh
        _weaponAnimator = weaponInstance.GetComponentInChildren<Animator>();
        
        if (_currentWeapon == null)
        {
            Debug.LogError("Weapon prefab missing Weapon component!");
        }
    }
}
```

### RequireComponent Attribute

```csharp
// This ensures Rigidbody and Collider are automatically added
[RequireComponent(typeof(Rigidbody))]
[RequireComponent(typeof(Collider))]
public class PhysicsObject : MonoBehaviour
{
    private Rigidbody _rb;

    private void Awake()
    {
        // Safe to assume Rigidbody exists due to RequireComponent
        _rb = GetComponent<Rigidbody>();
        _rb.interpolation = RigidbodyInterpolation.Interpolate;
    }
}
```

## Best Practices

- **Cache in Awake**: Call GetComponent in Awake and store in a field. Never call GetComponent in Update.
- **Use TryGetComponent for optional deps**: When a component might not exist, use TryGetComponent and check the return value.
- **Prefer [RequireComponent]**: For hard dependencies, use the attribute to ensure components are present.
- **Use [SerializeField]**: Expose component references in the inspector rather than using GetComponent when possible.
- **Use generic methods**: Always prefer `GetComponent<Rigidbody>()` over `GetComponent(typeof(Rigidbody))`.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| GetComponent in Update | Performance hit every frame (16ms+ at 60fps) | Cache in Awake |
| Not null-checking | NullReferenceException at runtime | Use null-conditional or TryGetComponent |
| String-based GetComponent | Fragile, typo-prone, slow | Use generic methods |
| Assuming component exists | Crash when component is missing | Use TryGetComponent or [RequireComponent] |
| GetComponentInChildren in loop | Expensive recursive search | Cache once in Awake |
| Modifying RequireComponent at runtime | Attribute only works in Editor | Validate components in Awake |

## Performance Considerations

```csharp
// BAD: GetComponent every frame
void Update() {
    GetComponent<Rigidbody>().AddForce(Vector3.up);
}

// GOOD: Cached reference
private Rigidbody _rb;
void Awake() {
    _rb = GetComponent<Rigidbody>();
}
void Update() {
    _rb.AddForce(Vector3.up);
}

// BEST: Serialized field
[SerializeField] private Rigidbody _rb;
```
