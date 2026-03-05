# UDA Unity Plugin Implementation Plan

**Goal:** Build `uda-unity-plugin` — a git-based Unity knowledge plugin for UDA with 11 knowledge files, 6 workflows, 3 agents, reference system, and Unity log bridge.

**Architecture:** Standalone git repo with `manifest.json`, categorized `knowledge/` markdown with versioned frontmatter, YAML `workflows/`, markdown `agents/`, `references/` JSON indexes, and a C# Editor script for log bridging. Installed via `uda plugin add <repo>`.

**Tech Stack:** Markdown (knowledge), YAML (workflows), JSON (manifest + references), C# (Unity Editor script)

**Working Directory:** `/Users/sunalorhon/Desktop/SunalSpaciel/uda-unity-plugin` (repo and folders already created)

## Important Rules

- All files must be created inside `/Users/sunalorhon/Desktop/SunalSpaciel/uda-unity-plugin/`
- Follow the exact file paths specified in each task
- Knowledge markdown files MUST include the frontmatter format shown in the design doc
- Unity API references must link to official Unity 6000.0 docs
- All content in English
- Commit after each task with the specified commit message
- Do NOT modify any files outside the plugin repo
- Use Unity's official documentation as the source of truth for all technical content

## Knowledge File Format

Every knowledge markdown file MUST follow this structure:

```markdown
---
title: Topic Title
since: "2021.1"
stable: "2022.2"
deprecated_alternatives: []
unity_docs:
  - https://docs.unity3d.com/6000.0/Documentation/...
api_refs:
  - class: ClassName
    namespace: UnityEngine.Something
    url: https://docs.unity3d.com/...
last_verified: "2026-03-05"
---

# Topic Title

## Overview
Brief description (2-3 sentences)

## Key Concepts
- Bullet point explanations

## Code Examples
```csharp
// Real, working Unity C# code
```

## Best Practices
- Do's and don'ts

## Common Mistakes
- Frequent errors and their solutions
```

Use version-specific code blocks where needed:
```markdown
<!-- unity:6000.0+ -->
(code for Unity 6+)
<!-- /unity -->

<!-- unity:2021.3-2022.3 -->
(code for older versions)
<!-- /unity -->
```

---

## Phase 1: Repo Scaffold

### Task 1: Create manifest, LICENSE, and directory structure

The repo is already initialized at `/Users/sunalorhon/Desktop/SunalSpaciel/uda-unity-plugin` with these empty directories:
- `knowledge/core/`, `knowledge/patterns/`, `knowledge/ui/`, `knowledge/data/`
- `workflows/`, `agents/`, `references/`, `unity-package/Editor/`

**Files:**
- Create: `manifest.json`
- Create: `LICENSE`

**Step 1: Create manifest.json**

```json
{
  "name": "uda-unity",
  "version": "0.1.0",
  "engine": "unity",
  "description": "Unity game development knowledge, workflows, and agents for UDA",
  "author": "UDA Contributors",
  "license": "MIT",
  "minUdaVersion": "0.1.0",
  "engineVersions": {
    "min": "2021.3",
    "max": "6000.1",
    "tested": ["2022.3 LTS", "6000.0 LTS"]
  },
  "i18n": ["en"],
  "tags": ["unity", "game-dev", "c-sharp"]
}
```

**Step 2: Create LICENSE**

MIT license, year 2026, "UDA Contributors".

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: initialize uda-unity-plugin repo with manifest and structure"
```

---

### Task 2: Create reference files

**Files:**
- Create: `references/version-matrix.json`
- Create: `references/api-index.json`

**Step 1: Create version-matrix.json**

```json
{
  "features": {
    "monobehaviour-lifecycle": {
      "since": "2017.1",
      "stable": "2017.1",
      "notes": "Core lifecycle unchanged since early Unity"
    },
    "ui-toolkit-runtime": {
      "since": "2021.1",
      "stable": "2022.2",
      "notes": "Runtime UI support added in 2021.1, stable from 2022.2"
    },
    "object-pool-api": {
      "since": "2021.1",
      "stable": "2021.1",
      "class": "UnityEngine.Pool.ObjectPool<T>"
    },
    "awaitable": {
      "since": "6000.0",
      "stable": "6000.0",
      "class": "UnityEngine.Awaitable"
    },
    "scriptable-objects": {
      "since": "2017.1",
      "stable": "2017.1",
      "notes": "Core feature, stable since early Unity"
    },
    "assembly-definitions": {
      "since": "2017.3",
      "stable": "2018.1",
      "notes": "asmdef files for compilation isolation"
    },
    "serialization-api": {
      "since": "2022.1",
      "stable": "2022.3",
      "class": "Unity.Serialization"
    },
    "ugui": {
      "since": "2017.1",
      "stable": "2017.1",
      "deprecated_by": "ui-toolkit-runtime",
      "notes": "Legacy runtime UI, still widely used"
    }
  }
}
```

**Step 2: Create api-index.json**

```json
{
  "MonoBehaviour": {
    "namespace": "UnityEngine",
    "url": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/MonoBehaviour.html",
    "versions": ["2021.3+"]
  },
  "Component": {
    "namespace": "UnityEngine",
    "url": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Component.html",
    "versions": ["2021.3+"]
  },
  "GameObject": {
    "namespace": "UnityEngine",
    "url": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/GameObject.html",
    "versions": ["2021.3+"]
  },
  "ObjectPool<T>": {
    "namespace": "UnityEngine.Pool",
    "url": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Pool.ObjectPool_1.html",
    "versions": ["2021.1+"]
  },
  "VisualElement": {
    "namespace": "UnityEngine.UIElements",
    "url": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/UIElements.VisualElement.html",
    "versions": ["2021.1+"]
  },
  "ScriptableObject": {
    "namespace": "UnityEngine",
    "url": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/ScriptableObject.html",
    "versions": ["2021.3+"]
  },
  "JsonUtility": {
    "namespace": "UnityEngine",
    "url": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/JsonUtility.html",
    "versions": ["2021.3+"]
  },
  "UnityEvent": {
    "namespace": "UnityEngine.Events",
    "url": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Events.UnityEvent.html",
    "versions": ["2021.3+"]
  },
  "Application.logMessageReceived": {
    "namespace": "UnityEngine",
    "url": "https://docs.unity3d.com/6000.0/Documentation/ScriptReference/Application-logMessageReceived.html",
    "versions": ["2021.3+"]
  }
}
```

**Step 3: Commit**

```bash
git add references/
git commit -m "feat: add version-matrix and api-index references"
```

---

## Phase 2: Knowledge Files (Core)

### Task 3: Create knowledge/core/lifecycle.md

**Files:**
- Create: `knowledge/core/lifecycle.md`

**Step 1: Write lifecycle.md**

Content covers:
- Frontmatter: `title: MonoBehaviour Lifecycle`, `since: 2017.1`, Unity docs refs for MonoBehaviour
- Overview: MonoBehaviour execution order
- Key Concepts: Awake vs Start, Update vs FixedUpdate vs LateUpdate, OnEnable/OnDisable, OnDestroy
- Code Examples: Complete lifecycle script showing proper order, coroutine startup in OnEnable
- Best Practices: Don't use constructor, use Awake for self-init / Start for cross-references, cache in Awake
- Common Mistakes: Logic in Update that should be in FixedUpdate, not unsubscribing in OnDisable, calling methods on destroyed objects

Target: ~150 lines. Include `last_verified: "2026-03-05"`.

**Step 2: Commit**

```bash
git add knowledge/core/lifecycle.md
git commit -m "feat: add MonoBehaviour lifecycle knowledge"
```

### Task 4: Create knowledge/core/component-pattern.md

**Files:**
- Create: `knowledge/core/component-pattern.md`

**Step 1: Write component-pattern.md**

Content covers:
- Frontmatter: `title: Component Pattern`, `since: 2017.1`, refs for Component, GetComponent
- Overview: Unity's component-based architecture
- Key Concepts: GetComponent<T>(), TryGetComponent, GetComponentInChildren, RequireComponent attribute
- Code Examples: Cached GetComponent pattern, TryGetComponent null-safe, RequireComponent usage
- Best Practices: Cache GetComponent results in Awake, use TryGetComponent for optional deps, prefer [RequireComponent]
- Common Mistakes: GetComponent in Update loop, not null-checking, string-based GetComponent

Target: ~120 lines.

**Step 2: Commit**

```bash
git add knowledge/core/component-pattern.md
git commit -m "feat: add component pattern knowledge"
```

### Task 5: Create knowledge/core/project-structure.md

**Files:**
- Create: `knowledge/core/project-structure.md`

**Step 1: Write project-structure.md**

Content covers:
- Frontmatter: `title: Project Structure`, `since: 2017.1`, ref for assembly definitions
- Overview: Unity project folder conventions
- Key Concepts: Standard folder layout (Scripts/, Prefabs/, Scenes/, Art/, Audio/), .meta files, assembly definitions
- Code Examples: Sample asmdef JSON, .gitignore for Unity
- Best Practices: Feature-based organization, asmdef per module, never delete .meta files manually
- Common Mistakes: Flat Scripts/ folder, ignoring .meta in git, circular asmdef references

Target: ~100 lines.

**Step 2: Commit**

```bash
git add knowledge/core/project-structure.md
git commit -m "feat: add project structure knowledge"
```

### Task 6: Create knowledge/core/unity-logs.md

**Files:**
- Create: `knowledge/core/unity-logs.md`

**Step 1: Write unity-logs.md**

Content covers:
- Frontmatter: `title: Unity Console Logs`, `since: 2017.1`, ref for Debug, Application.logMessageReceived
- Overview: Unity logging system and file locations
- Key Concepts: Editor.log paths per OS (macOS/Windows/Linux), Player.log paths, log types (Log/Warning/Error/Exception/Assert)
- Code Examples: Debug.Log, Debug.LogError, conditional compilation #if UNITY_EDITOR, Application.logMessageReceived hook
- Best Practices: Use Debug.LogError for errors, strip logs in release builds, structured logging patterns
- Common Mistakes: Debug.Log in Update (performance), not stripping in production, logging in hot paths
- Error Pattern Reference: NullReferenceException, MissingReferenceException, StackOverflowException, TypeLoadException with causes and fixes

Target: ~120 lines.

**Step 2: Commit**

```bash
git add knowledge/core/unity-logs.md
git commit -m "feat: add Unity console logs knowledge"
```

---

## Phase 3: Knowledge Files (Patterns)

### Task 7: Create knowledge/patterns/singleton.md

**Files:**
- Create: `knowledge/patterns/singleton.md`

**Step 1: Write singleton.md**

Content covers:
- Frontmatter: title, since, refs
- Overview: Singleton pattern in Unity
- Key Concepts: Generic Singleton<T>, DontDestroyOnLoad, lazy initialization, thread safety
- Code Examples: Full generic `Singleton<T> : MonoBehaviour` base class, persistent singleton variant
- Best Practices: Use sparingly, consider ScriptableObject alternatives, always handle OnDestroy
- Common Mistakes: Multiple instances from scene loading, not checking applicationIsQuitting

Target: ~100 lines.

**Step 2: Commit**

```bash
git add knowledge/patterns/singleton.md
git commit -m "feat: add singleton pattern knowledge"
```

### Task 8: Create knowledge/patterns/object-pooling.md

**Files:**
- Create: `knowledge/patterns/object-pooling.md`

**Step 1: Write object-pooling.md**

Content covers:
- Frontmatter: `since: 2021.1` (Unity's built-in ObjectPool), refs for ObjectPool<T>
- Overview: Object pooling to avoid GC pressure
- Key Concepts: Unity's ObjectPool<T>, IObjectPool interface, create/get/release/destroy callbacks, warm-up
- Code Examples: Using UnityEngine.Pool.ObjectPool<T>, custom pool wrapper, projectile pool example
- Best Practices: Pre-warm pools, set max size, release back to pool in OnDisable, use for bullets/VFX/UI elements
- Common Mistakes: Forgetting to release, double release, accessing pooled (inactive) objects

Target: ~130 lines. Version-tagged: `<!-- unity:2021.1+ -->` for built-in API.

**Step 2: Commit**

```bash
git add knowledge/patterns/object-pooling.md
git commit -m "feat: add object pooling pattern knowledge"
```

### Task 9: Create knowledge/patterns/state-machine.md

**Files:**
- Create: `knowledge/patterns/state-machine.md`

**Step 1: Write state-machine.md**

Content covers:
- Frontmatter: title, refs
- Overview: FSM patterns for game logic
- Key Concepts: Enum-based FSM (simple), interface-based FSM (scalable), state transitions
- Code Examples: Simple enum+switch FSM, IState interface + StateMachine controller, state with Enter/Execute/Exit
- Best Practices: Start with enum-based, upgrade to interface when states have complex logic, keep transitions explicit
- Common Mistakes: God-state with too much logic, missing Exit cleanup, infinite state loops

Target: ~140 lines.

**Step 2: Commit**

```bash
git add knowledge/patterns/state-machine.md
git commit -m "feat: add state machine pattern knowledge"
```

### Task 10: Create knowledge/patterns/event-system.md

**Files:**
- Create: `knowledge/patterns/event-system.md`

**Step 1: Write event-system.md**

Content covers:
- Frontmatter: title, refs for UnityEvent, ScriptableObject
- Overview: Event-driven architecture in Unity
- Key Concepts: C# events/Action, UnityEvent (inspector-friendly), ScriptableObject event channels
- Code Examples: C# Action event pattern, UnityEvent usage, SO event channel (GameEvent + GameEventListener)
- Best Practices: SO events for cross-scene communication, C# events for internal logic, always unsubscribe
- Common Mistakes: Memory leaks from not unsubscribing, UnityEvent performance in hot paths

Target: ~120 lines.

**Step 2: Commit**

```bash
git add knowledge/patterns/event-system.md
git commit -m "feat: add event system pattern knowledge"
```

---

## Phase 4: Knowledge Files (UI + Data)

### Task 11: Create knowledge/ui/ui-toolkit.md

**Files:**
- Create: `knowledge/ui/ui-toolkit.md`

**Step 1: Write ui-toolkit.md**

Content covers:
- Frontmatter: `since: 2021.1`, `stable: 2022.2`, refs for VisualElement, UXML, USS
- Overview: Unity's modern UI system
- Key Concepts: UXML (layout), USS (styling), C# controller, UQueryBuilder, data binding
- Code Examples: Basic UXML document, USS stylesheet, C# controller that queries elements, button click handler
- Version-specific: `<!-- unity:6000.0+ -->` for latest API patterns
- Best Practices: Separate UXML/USS/C#, use BEM naming in USS, Q<T>() for element queries
- Common Mistakes: Querying before element is attached, USS specificity issues, not using classes for styling

Target: ~150 lines.

**Step 2: Commit**

```bash
git add knowledge/ui/ui-toolkit.md
git commit -m "feat: add UI Toolkit knowledge"
```

### Task 12: Create knowledge/ui/canvas-comparison.md

**Files:**
- Create: `knowledge/ui/canvas-comparison.md`

**Step 1: Write canvas-comparison.md**

Content covers:
- Frontmatter: title, refs for both systems
- Overview: When to use UI Toolkit vs uGUI (Canvas)
- Decision Matrix: Feature comparison table (runtime support, editor tools, performance, learning curve, asset store support)
- Recommendations: UI Toolkit for new projects (2022.2+), uGUI for existing projects or world-space UI
- Migration Notes: No automatic migration path, plan for gradual transition

Target: ~80 lines.

**Step 2: Commit**

```bash
git add knowledge/ui/canvas-comparison.md
git commit -m "feat: add UI system comparison knowledge"
```

### Task 13: Create knowledge/data/scriptable-objects.md

**Files:**
- Create: `knowledge/data/scriptable-objects.md`

**Step 1: Write scriptable-objects.md**

Content covers:
- Frontmatter: title, refs for ScriptableObject, CreateAssetMenu
- Overview: ScriptableObject as data containers and architecture tool
- Key Concepts: Data containers, runtime sets, enum replacement, event channels, asset references
- Code Examples: Basic SO with CreateAssetMenu, runtime set pattern, SO-based variable (FloatVariable), SO as config
- Best Practices: Use for shared data, game config, level design, prefer over static/singleton for data
- Common Mistakes: Modifying SO at runtime (persists in editor), not resetting runtime state, large SO files

Target: ~130 lines.

**Step 2: Commit**

```bash
git add knowledge/data/scriptable-objects.md
git commit -m "feat: add ScriptableObject knowledge"
```

### Task 14: Create knowledge/data/serialization.md

**Files:**
- Create: `knowledge/data/serialization.md`

**Step 1: Write serialization.md**

Content covers:
- Frontmatter: title, refs for JsonUtility, PlayerPrefs
- Overview: Data persistence in Unity
- Key Concepts: JsonUtility (fast, limited), PlayerPrefs (key-value), binary serialization, Application.persistentDataPath
- Code Examples: JsonUtility save/load, PlayerPrefs wrapper, file-based save with path
- Best Practices: Use JsonUtility for simple data, persistentDataPath for save files, encrypt sensitive data
- Common Mistakes: PlayerPrefs for large data, not handling missing save files, serializing MonoBehaviour directly

Target: ~100 lines.

**Step 2: Commit**

```bash
git add knowledge/data/serialization.md
git commit -m "feat: add serialization knowledge"
```

---

## Phase 5: Workflows

### Task 15: Create all 6 workflow YAML files

**Files:**
- Create: `workflows/create-monobehaviour.yaml`
- Create: `workflows/create-ui-panel.yaml`
- Create: `workflows/setup-object-pool.yaml`
- Create: `workflows/create-state-machine.yaml`
- Create: `workflows/create-so-data.yaml`
- Create: `workflows/setup-event-system.yaml`

**Step 1: Create create-monobehaviour.yaml**

```yaml
name: create-monobehaviour
description: Create a new MonoBehaviour script with proper lifecycle methods and namespace
steps:
  - id: gather-requirements
    type: ask
    name: Gather Requirements
    questions:
      - "What should the script be called? (PascalCase, e.g. PlayerController)"
      - "Which lifecycle methods do you need? (Awake, Start, Update, FixedUpdate, LateUpdate, OnEnable, OnDisable, OnDestroy)"
      - "What namespace should it be in? (e.g. Game.Player, or none)"
      - "Which folder should it be created in? (e.g. Assets/Scripts/Player)"
  - id: generate-script
    type: auto
    name: Generate Script
    actions:
      - "Create C# file at specified path"
      - "Add namespace wrapper if specified"
      - "Add selected lifecycle methods with summary comments"
      - "Add [RequireComponent] if dependencies are mentioned"
      - "Follow project naming conventions from knowledge base"
  - id: verify
    type: auto
    name: Verify
    actions:
      - "Ensure file is in correct folder"
      - "Ensure .meta file will be generated by Unity"
      - "Check naming follows PascalCase convention"
```

**Step 2: Create create-ui-panel.yaml**

```yaml
name: create-ui-panel
description: Scaffold a UI Toolkit panel with UXML layout, USS stylesheet, and C# controller
steps:
  - id: gather-requirements
    type: ask
    name: Gather Requirements
    questions:
      - "What is the panel name? (e.g. SettingsPanel, InventoryPanel)"
      - "What UI elements does it need? (buttons, labels, scrollview, listview, etc.)"
      - "Should it be a full-screen panel or overlay?"
      - "What namespace for the C# controller?"
  - id: generate-uxml
    type: auto
    name: Generate UXML Layout
    actions:
      - "Create .uxml file with requested elements"
      - "Use BEM naming convention for classes"
      - "Add proper VisualElement hierarchy"
  - id: generate-uss
    type: auto
    name: Generate USS Stylesheet
    actions:
      - "Create .uss file with base styles"
      - "Style all elements from UXML"
      - "Use USS variables for theme colors"
  - id: generate-controller
    type: auto
    name: Generate C# Controller
    actions:
      - "Create MonoBehaviour controller"
      - "Query all interactive elements in OnEnable"
      - "Register event callbacks"
      - "Unregister in OnDisable"
  - id: verify
    type: auto
    name: Verify
    actions:
      - "Ensure UXML references USS correctly"
      - "Ensure controller queries match UXML element names"
```

**Step 3: Create setup-object-pool.yaml**

```yaml
name: setup-object-pool
description: Set up an object pooling system using Unity's built-in ObjectPool<T>
steps:
  - id: gather-requirements
    type: ask
    name: Gather Requirements
    questions:
      - "What type of object will be pooled? (e.g. Bullet, VFX, Enemy)"
      - "What is the initial pool size? (default: 10)"
      - "What is the maximum pool size? (default: 100)"
      - "Does the pooled object need a prefab reference?"
  - id: generate-pool
    type: auto
    name: Generate Pool Manager
    actions:
      - "Create pool manager using UnityEngine.Pool.ObjectPool<T>"
      - "Implement createFunc, actionOnGet, actionOnRelease, actionOnDestroy"
      - "Add warm-up method for pre-instantiation"
      - "Add Get() and Release() public methods"
  - id: generate-poolable
    type: auto
    name: Generate Poolable Component
    actions:
      - "Create IPoolable interface with OnGetFromPool() and OnReturnToPool()"
      - "Add component to pooled prefab that auto-releases after lifetime"
  - id: verify
    type: auto
    name: Verify
    actions:
      - "Ensure pool manager is singleton or scene-scoped"
      - "Ensure release is called in all code paths"
```

**Step 4: Create create-state-machine.yaml**

```yaml
name: create-state-machine
description: Create a finite state machine with IState interface and state controller
steps:
  - id: gather-requirements
    type: ask
    name: Gather Requirements
    questions:
      - "What is the state machine for? (e.g. PlayerState, EnemyAI, GameFlow)"
      - "What states does it need? (e.g. Idle, Walking, Running, Jumping)"
      - "What triggers transitions between states?"
      - "Do you want enum-based (simple) or class-based (scalable) FSM?"
  - id: generate-interface
    type: auto
    name: Generate State Interface
    actions:
      - "Create IState interface with Enter(), Execute(), Exit() methods"
      - "Create base state class if class-based FSM chosen"
  - id: generate-states
    type: auto
    name: Generate State Classes
    actions:
      - "Create a class for each state"
      - "Implement Enter/Execute/Exit for each"
      - "Define transition conditions"
  - id: generate-controller
    type: auto
    name: Generate State Machine Controller
    actions:
      - "Create StateMachine MonoBehaviour"
      - "Add ChangeState method with Exit/Enter flow"
      - "Set initial state in Start()"
      - "Call currentState.Execute() in Update()"
  - id: verify
    type: auto
    name: Verify
    actions:
      - "Ensure all states handle transitions cleanly"
      - "Ensure Exit is always called before Enter"
```

**Step 5: Create create-so-data.yaml**

```yaml
name: create-so-data
description: Create a ScriptableObject data container with CreateAssetMenu
steps:
  - id: gather-requirements
    type: ask
    name: Gather Requirements
    questions:
      - "What data does this SO hold? (e.g. weapon stats, level config, character data)"
      - "What fields does it need? (name:type pairs, e.g. damage:float, range:float)"
      - "What CreateAssetMenu path? (e.g. Game/Weapons/WeaponData)"
      - "Should it be read-only at runtime or mutable?"
  - id: generate-so
    type: auto
    name: Generate ScriptableObject
    actions:
      - "Create SO class with [CreateAssetMenu] attribute"
      - "Add serialized fields for all requested data"
      - "Add read-only properties if immutable requested"
      - "Add OnValidate() for editor-time validation"
  - id: verify
    type: auto
    name: Verify
    actions:
      - "Ensure proper serialization attributes"
      - "Ensure CreateAssetMenu path is valid"
```

**Step 6: Create setup-event-system.yaml**

```yaml
name: setup-event-system
description: Set up a ScriptableObject-based event system for decoupled communication
steps:
  - id: gather-requirements
    type: ask
    name: Gather Requirements
    questions:
      - "What events do you need? (e.g. OnPlayerDied, OnScoreChanged, OnLevelComplete)"
      - "Do any events carry data? (e.g. OnDamage carries float amount)"
      - "Do you need a generic typed event channel?"
  - id: generate-channel
    type: auto
    name: Generate Event Channel
    actions:
      - "Create GameEvent ScriptableObject (void event)"
      - "Create GameEvent<T> ScriptableObject for typed events if needed"
      - "Add Raise() method and listener list"
      - "Add [CreateAssetMenu] for easy creation"
  - id: generate-listener
    type: auto
    name: Generate Event Listener
    actions:
      - "Create GameEventListener MonoBehaviour"
      - "Add SO event reference field"
      - "Add UnityEvent response field (inspector-configurable)"
      - "Register/unregister in OnEnable/OnDisable"
  - id: verify
    type: auto
    name: Verify
    actions:
      - "Ensure listeners unregister on disable"
      - "Ensure events can be raised from code and inspector"
```

**Step 7: Commit**

```bash
git add workflows/
git commit -m "feat: add 6 Unity workflow definitions"
```

---

## Phase 6: Agents

### Task 16: Create all 3 agent definitions

**Files:**
- Create: `agents/unity-architect.md`
- Create: `agents/unity-debugger.md`
- Create: `agents/unity-reviewer.md`

**Step 1: Create unity-architect.md**

```markdown
---
name: unity-architect
description: Unity system architect for design decisions and architecture planning
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a Unity system architect. Your role is to help design game systems with clean, maintainable architecture.

## Principles

- **Composition over inheritance** — use components and ScriptableObjects, not deep class hierarchies
- **Decoupled systems** — use events and SO channels for cross-system communication
- **Performance awareness** — consider GC allocation, draw calls, physics costs in every design
- **Testability** — design systems that can be tested in isolation

## Process

1. **Analyze current project structure** — read the project folder layout and existing scripts
2. **Identify dependencies** — map which systems interact and how
3. **Propose architecture** — suggest patterns from the knowledge base (singleton, FSM, event system, object pool)
4. **Consider scaling** — will this work with 10x content? 100 players? Mobile performance?

## Knowledge References

- Singleton pattern: use sparingly, prefer SO-based alternatives
- State machines: start with enum-based, upgrade to class-based when complexity demands it
- Event system: prefer SO event channels for anything cross-scene
- Object pooling: required for any frequently instantiated/destroyed objects

## Anti-Patterns to Flag

- God classes (MonoBehaviours with 500+ lines)
- Manager-of-managers patterns
- Tight coupling between unrelated systems
- String-based references (Find, SendMessage, tags)
```

**Step 2: Create unity-debugger.md**

```markdown
---
name: unity-debugger
description: Unity debugging specialist for console errors and performance issues
tools: Read, Grep, Glob, Bash
model: sonnet
---

You are a Unity debugging specialist. Your role is to diagnose and fix errors, warnings, and performance issues.

## First Actions

1. **Read Unity logs** — check for errors:
   - Primary: `.uda/logs/console.jsonl` (if UDA log bridge is active)
   - Fallback macOS: `~/Library/Logs/Unity/Editor.log` (last 100 lines)
   - Fallback Windows: `%LOCALAPPDATA%\Unity\Editor\Editor.log`
   - Fallback Linux: `~/.config/unity3d/Editor.log`
2. **Parse error type** — identify the exception or warning category
3. **Locate source** — find the file and line referenced in the stack trace
4. **Diagnose root cause** — trace the code path that leads to the error

## Common Error Patterns

| Error | Usual Cause | Fix |
|-------|-------------|-----|
| NullReferenceException | Missing component ref, destroyed object | Add null check, verify inspector assignment, use TryGetComponent |
| MissingReferenceException | Accessing destroyed GameObject | Check lifecycle, use object pooling instead of Destroy |
| StackOverflowException | Infinite recursion, property self-reference | Check recursive calls, property getters |
| InvalidOperationException | Collection modified during iteration | Use temporary list or reverse iteration |
| TypeLoadException | Missing assembly reference | Check asmdef dependencies |

## Performance Debugging

- Check for GC allocations in Update loops (string concat, LINQ, boxing)
- Look for GetComponent calls not cached in Awake
- Identify excessive Instantiate/Destroy (suggest pooling)
- Flag physics queries every frame without caching
```

**Step 3: Create unity-reviewer.md**

```markdown
---
name: unity-reviewer
description: Unity code reviewer checking for best practices and anti-patterns
tools: Read, Grep, Glob
model: sonnet
---

You are a Unity code reviewer. Your role is to review C# scripts for Unity best practices, performance issues, and common anti-patterns.

## Review Checklist

### Performance
- [ ] No GetComponent/Find/FindObjectOfType in Update/FixedUpdate
- [ ] Component references cached in Awake or assigned in Inspector
- [ ] No string allocations in hot paths (Update, FixedUpdate)
- [ ] No LINQ in performance-critical code
- [ ] Object pooling used for frequently spawned objects

### Architecture
- [ ] MonoBehaviours focused (single responsibility)
- [ ] No god classes (>300 lines is a warning, >500 is critical)
- [ ] Events used for decoupling, not direct references between unrelated systems
- [ ] ScriptableObjects used for shared data/config
- [ ] Proper namespace usage

### Unity-Specific
- [ ] [SerializeField] private fields instead of public fields
- [ ] [RequireComponent] for hard dependencies
- [ ] Coroutines properly stopped in OnDisable
- [ ] Event unsubscription in OnDisable/OnDestroy
- [ ] No Camera.main in loops (cache it)

### Code Quality
- [ ] PascalCase for public members, _camelCase for private fields
- [ ] Summary comments on public API
- [ ] No magic numbers (use const or SerializeField)
- [ ] Proper null handling (TryGetComponent, null-conditional)

## Severity Levels

- **Critical**: Will cause bugs or crashes (null refs, memory leaks, race conditions)
- **Warning**: Performance issues or maintainability concerns
- **Info**: Style suggestions and minor improvements
```

**Step 4: Commit**

```bash
git add agents/
git commit -m "feat: add unity-architect, unity-debugger, and unity-reviewer agents"
```

---

## Phase 7: Unity Log Bridge

### Task 17: Create UdaLogBridge.cs

**Files:**
- Create: `unity-package/Editor/UdaLogBridge.cs`

**Step 1: Create UdaLogBridge.cs**

```csharp
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
            if (!Directory.Exists(UdaLogsDir))
                Directory.CreateDirectory(UdaLogsDir);

            var entry = new LogEntry
            {
                time = DateTime.UtcNow.ToString("o"),
                type = type.ToString(),
                message = message,
                stack = string.IsNullOrEmpty(stackTrace) ? null : stackTrace.Trim()
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
```

**Step 2: Commit**

```bash
git add unity-package/
git commit -m "feat: add UdaLogBridge Unity Editor script for console log capture"
```

---

## Phase 8: Final Polish

### Task 18: Write README.md

**Files:**
- Create: `README.md`

**Step 1: Write README.md**

Content:
- Project title and description
- Installation: `uda plugin add https://github.com/<user>/uda-unity-plugin`
- What's included (knowledge categories, workflow list, agent list)
- Unity version support (2021.3 — 6000.1)
- Log bridge setup instructions (copy `unity-package/Editor/UdaLogBridge.cs` to Unity project)
- Usage examples (`uda search "object pooling"`, `uda sync`, workflow usage)
- Contributing guidelines
- License

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add comprehensive README"
```

### Task 19: Integration test with UDA

> **NOTE:** This task is done OUTSIDE the plugin repo. It tests the full flow. Skip this task if you don't have access to the UDA CLI. The project owner will run this manually.

Test commands (for reference):
```bash
# Create fake Unity project
mkdir -p /tmp/uda-test-project/ProjectSettings
echo "m_EditorVersion: 2022.3.0f1" > /tmp/uda-test-project/ProjectSettings/ProjectVersion.txt

# Init UDA
cd /tmp/uda-test-project
node /Users/sunalorhon/Desktop/SunalSpaciel/Uda/bin/uda.js init

# Install plugin from local path
node /Users/sunalorhon/Desktop/SunalSpaciel/Uda/bin/uda.js plugin add /Users/sunalorhon/Desktop/SunalSpaciel/uda-unity-plugin

# Verify files were copied
ls -R .uda/knowledge/engine/unity/
ls .uda/workflows/
ls .uda/agents/

# Test search
node /Users/sunalorhon/Desktop/SunalSpaciel/Uda/bin/uda.js search "how to cache GetComponent"

# Clean up
rm -rf /tmp/uda-test-project
```

### Task 20: Final commit and tag

**Step 1: Commit any remaining files**

```bash
cd /Users/sunalorhon/Desktop/SunalSpaciel/uda-unity-plugin
git add -A
git status
```

If clean, skip. If files remain, commit them.

**Step 2: Tag v0.1.0**

```bash
git tag -a v0.1.0 -m "v0.1.0: Initial release — 11 knowledge files, 6 workflows, 3 agents, log bridge"
```
