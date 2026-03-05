---
title: State Machine
since: "2017.1"
stable: "2017.1"
deprecated_alternatives: ["Unity Animator state machines for AI"]
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/ScriptReference/StateMachineBehaviour.html
api_refs:
  - class: StateMachineBehaviour
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/StateMachineBehaviour.html
  - class: Animator
    namespace: UnityEngine
    url: https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Animator.html
last_verified: "2026-03-05"
---

# State Machine

## Overview

Finite State Machines (FSM) manage complex behavior by breaking it into discrete states with defined transitions. Essential for AI, player controllers, UI flow, and game state management. Start with simple enum-based FSM, upgrade to class-based when complexity demands it.

## Key Concepts

### Enum-Based FSM
Simple switch statement approach. Best for 2-4 states with simple transitions.

### Class-Based FSM
Interface-driven states with Enter/Execute/Exit methods. Scalable for complex behaviors.

### State Transitions
Conditions that trigger movement from one state to another. Keep transitions explicit and predictable.

## Code Examples

### Simple Enum-Based FSM

```csharp
using UnityEngine;

public class SimpleEnemyAI : MonoBehaviour
{
    public enum EnemyState
    {
        Idle,
        Patrol,
        Chase,
        Attack
    }

    [SerializeField] private EnemyState _currentState = EnemyState.Idle;
    [SerializeField] private float _detectionRange = 10f;
    [SerializeField] private float _attackRange = 2f;
    [SerializeField] private float _patrolSpeed = 2f;
    [SerializeField] private float _chaseSpeed = 5f;

    private Transform _player;
    private Vector3 _patrolTarget;

    private void Start()
    {
        _player = GameObject.FindGameObjectWithTag("Player")?.transform;
        SetPatrolTarget();
    }

    private void Update()
    {
        // State machine logic
        switch (_currentState)
        {
            case EnemyState.Idle:
                UpdateIdle();
                break;
            case EnemyState.Patrol:
                UpdatePatrol();
                break;
            case EnemyState.Chase:
                UpdateChase();
                break;
            case EnemyState.Attack:
                UpdateAttack();
                break;
        }

        // Check transitions
        EvaluateTransitions();
    }

    private void UpdateIdle()
    {
        // Wait for player or timer
    }

    private void UpdatePatrol()
    {
        MoveTo(_patrolTarget, _patrolSpeed);
        if (Vector3.Distance(transform.position, _patrolTarget) < 0.5f)
        {
            SetPatrolTarget();
        }
    }

    private void UpdateChase()
    {
        if (_player != null)
        {
            MoveTo(_player.position, _chaseSpeed);
        }
    }

    private void UpdateAttack()
    {
        // Attack logic
        Debug.Log("Attacking player!");
    }

    private void EvaluateTransitions()
    {
        if (_player == null) return;

        float distanceToPlayer = Vector3.Distance(transform.position, _player.position);

        switch (_currentState)
        {
            case EnemyState.Idle:
            case EnemyState.Patrol:
                if (distanceToPlayer <= _detectionRange)
                {
                    ChangeState(EnemyState.Chase);
                }
                break;

            case EnemyState.Chase:
                if (distanceToPlayer <= _attackRange)
                {
                    ChangeState(EnemyState.Attack);
                }
                else if (distanceToPlayer > _detectionRange * 1.5f)
                {
                    ChangeState(EnemyState.Patrol);
                }
                break;

            case EnemyState.Attack:
                if (distanceToPlayer > _attackRange)
                {
                    ChangeState(EnemyState.Chase);
                }
                break;
        }
    }

    private void ChangeState(EnemyState newState)
    {
        // Exit current state
        switch (_currentState)
        {
            case EnemyState.Chase:
                // Cleanup chase
                break;
            case EnemyState.Attack:
                // Cleanup attack
                break;
        }

        Debug.Log($"State: {_currentState} -> {newState}");
        _currentState = newState;

        // Enter new state
        switch (_currentState)
        {
            case EnemyState.Idle:
                // Setup idle
                break;
            case EnemyState.Patrol:
                SetPatrolTarget();
                break;
        }
    }

    private void MoveTo(Vector3 target, float speed)
    {
        Vector3 direction = (target - transform.position).normalized;
        transform.position += direction * speed * Time.deltaTime;
    }

    private void SetPatrolTarget()
    {
        _patrolTarget = transform.position + Random.insideUnitSphere * 10f;
        _patrolTarget.y = transform.position.y;
    }
}
```

### Interface-Based Class FSM

```csharp
using UnityEngine;
using System;

// State Interface
public interface IState
{
    void Enter();
    void Execute();
    void Exit();
}

// State Machine Controller
public class StateMachine
{
    private IState _currentState;

    public void ChangeState(IState newState)
    {
        _currentState?.Exit();
        _currentState = newState;
        _currentState?.Enter();
    }

    public void Update()
    {
        _currentState?.Execute();
    }

    public IState GetCurrentState()
    {
        return _currentState;
    }
}

// Example States for Player
public class PlayerStateMachine : MonoBehaviour
{
    private StateMachine _stateMachine;
    
    // State instances
    private IdleState _idleState;
    private RunningState _runningState;
    private JumpingState _jumpingState;

    private void Awake()
    {
        _stateMachine = new StateMachine();
        
        // Create states with reference to this controller
        _idleState = new IdleState(this);
        _runningState = new RunningState(this);
        _jumpingState = new JumpingState(this);
    }

    private void Start()
    {
        // Set initial state
        _stateMachine.ChangeState(_idleState);
    }

    private void Update()
    {
        InputVector = new Vector2(Input.GetAxisRaw("Horizontal"), Input.GetAxisRaw("Vertical"));
        IsGrounded = Physics.Raycast(transform.position, Vector3.down, 1.1f);
        _stateMachine.Update();
    }

    // Public methods for states to call
    public void ChangeToIdle() => _stateMachine.ChangeState(_idleState);
    public void ChangeToRunning() => _stateMachine.ChangeState(_runningState);
    public void ChangeToJumping() => _stateMachine.ChangeState(_jumpingState);
    
    public bool IsGrounded { get; private set; }
    public Vector2 InputVector { get; private set; }
}

// Idle State
public class IdleState : IState
{
    private readonly PlayerStateMachine _player;

    public IdleState(PlayerStateMachine player)
    {
        _player = player;
    }

    public void Enter()
    {
        Debug.Log("Entering Idle State");
        // Play idle animation
    }

    public void Execute()
    {
        // Check for transitions
        if (_player.InputVector.magnitude > 0.1f)
        {
            _player.ChangeToRunning();
            return;
        }

        if (Input.GetButtonDown("Jump") && _player.IsGrounded) // Note: Uses legacy Input Manager
        {
            _player.ChangeToJumping();
            return;
        }
    }

    public void Exit()
    {
        Debug.Log("Exiting Idle State");
    }
}

// RunningState - Similar pattern to IdleState
public class RunningState : IState
{
    private readonly PlayerStateMachine _player;
    public RunningState(PlayerStateMachine player) => _player = player;
    public void Enter() { /* Play run animation */ }
    public void Execute()
    {
        // Move player based on input
        // Transition to Idle if no input
        // Transition to Jumping if jump pressed and grounded
    }
    public void Exit() { }
}

// JumpingState - Similar pattern to IdleState
public class JumpingState : IState
{
    private readonly PlayerStateMachine _player;
    private float _jumpTimer;
    public JumpingState(PlayerStateMachine player) => _player = player;
    public void Enter() { _jumpTimer = 0f; /* Apply jump force */ }
    public void Execute()
    {
        _jumpTimer += Time.deltaTime;
        // Check for landing, transition to Idle or Running
    }
    public void Exit() { }
}
```

## Best Practices

- **Start with enum-based**: Simple switch FSM is fine for 2-4 states. Don't over-engineer.
- **Upgrade to class-based when needed**: When states have complex logic or need inheritance.
- **Keep transitions explicit**: Avoid implicit state changes; make all transitions visible.
- **Use Enter/Exit for setup/cleanup**: Initialize state in Enter, clean up in Exit.
- **Consider hierarchical FSM**: For complex AI, states can have sub-states.

## Common Mistakes

| Mistake | Problem | Solution |
|---------|---------|----------|
| God-state with too much logic | Unmaintainable monster state | Split into smaller states or sub-state machines |
| Missing Exit cleanup | State leaking into next state | Always implement proper Exit() |
| Infinite state loops | State A -> B -> A forever | Add transition conditions and timeouts |
| Tight coupling between states | Hard to modify | Pass controller reference, use events |
| State logic in controller | Bloated controller | Move all state-specific logic to state classes |

## When to Use Each Approach

| Approach | Best For | Avoid When |
|----------|----------|------------|
| Enum + Switch | Simple AI (2-4 states), UI states | More than 5 states, complex transitions |
| Class-based FSM | Player controllers, complex AI | Very simple 2-state systems |
| Animator FSM | Animation-driven states | Logic-heavy states without animation |
| Behavior Trees | Complex AI with many conditions | Simple linear state progression |
