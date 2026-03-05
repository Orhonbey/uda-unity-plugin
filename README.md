# UDA Unity Plugin

A comprehensive Unity knowledge plugin for [UDA](https://github.com/uda/uda) — featuring best practices, design patterns, workflows, and debugging tools for Unity game development.

## Installation

Install via UDA CLI:

```bash
uda plugin add https://github.com/<user>/uda-unity-plugin
```

Or install from local path:

```bash
uda plugin add /path/to/uda-unity-plugin
```

## What's Included

### Knowledge Files (11)

Organized into categories for easy discovery:

**Core (`knowledge/core/`)**
- `lifecycle.md` — MonoBehaviour lifecycle methods and best practices
- `component-pattern.md` — GetComponent patterns and caching
- `project-structure.md` — Folder organization and assembly definitions
- `unity-logs.md` — Logging, debugging, and error patterns

**Patterns (`knowledge/patterns/`)**
- `singleton.md` — Singleton pattern implementations
- `object-pooling.md` — Object pooling with Unity's ObjectPool<T>
- `state-machine.md` — FSM patterns (enum and class-based)
- `event-system.md` — C# events, UnityEvents, and SO channels

**UI (`knowledge/ui/`)**
- `ui-toolkit.md` — UI Toolkit (UXML/USS) guide
- `canvas-comparison.md` — UI Toolkit vs uGUI comparison

**Data (`knowledge/data/`)**
- `scriptable-objects.md` — ScriptableObject patterns
- `serialization.md` — Save/load and data persistence

### Workflows (6)

YAML workflow definitions for common tasks:

- `create-monobehaviour.yaml` — Scaffold new MonoBehaviour scripts
- `create-ui-panel.yaml` — Create UI Toolkit panels (UXML+USS+C#)
- `setup-object-pool.yaml` — Set up object pooling systems
- `create-state-machine.yaml` — Generate FSM architecture
- `create-so-data.yaml` — Create ScriptableObject data containers
- `setup-event-system.yaml` — Set up SO-based event channels

### Agents (3)

Specialized agents for different tasks:

- `unity-architect` — System design and architecture decisions
- `unity-debugger` — Error diagnosis and debugging
- `unity-reviewer` — Code review and best practice checks

### Unity Log Bridge

`unity-package/Editor/UdaLogBridge.cs` — An Editor script that captures Unity console logs and writes them to `.uda/logs/console.jsonl` for UDA to read.

## Unity Version Support

- **Minimum**: Unity 2021.3 LTS
- **Maximum**: Unity 6000.1
- **Tested On**: Unity 2022.3 LTS, Unity 6000.0 LTS

## Log Bridge Setup

To enable automatic console log capture in Unity:

1. Copy `unity-package/Editor/UdaLogBridge.cs` to your Unity project:
   ```
   Assets/Editor/UdaLogBridge.cs
   ```

2. The script will automatically:
   - Create `.uda/logs/` directory in your project root
   - Capture errors, warnings, and exceptions
   - Write to `console.jsonl` in JSON Lines format

3. UDA will read logs from `.uda/logs/console.jsonl` when debugging.

## Usage Examples

### Search Knowledge

```bash
uda search "object pooling"
uda search "how to cache GetComponent"
uda search "singleton pattern"
```

### Sync Plugin

```bash
uda sync  # Pull latest knowledge updates
```

### Run Workflows

```bash
uda workflow run create-monobehaviour
uda workflow run setup-object-pool
uda workflow run create-ui-panel
```

### Use Agents

```bash
uda agent unity-architect  # Ask architecture questions
uda agent unity-debugger   # Debug errors
uda agent unity-reviewer   # Review code
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Follow the existing file structure and formatting
4. Update relevant knowledge files with version info
5. Submit a pull request

### Knowledge File Format

All knowledge files use frontmatter for metadata:

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
```

## License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2026 UDA Contributors
