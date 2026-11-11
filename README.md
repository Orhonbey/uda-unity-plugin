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

## Requirements

This plugin requires `uda-cli` 0.7.0 or newer (`uda_version` in `manifest.json` is `>=0.7.0`).

## What's Included

### Knowledge Files (12)

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

### Rules (`rules/`)

- `rules/core.md` is placed in the project's `CLAUDE.md` every session, inside a block that `uda sync` manages. It is limited to 6144 bytes.
- `rules/libraries/*.md` cover Addressables, SRDebugger, Remote Config, Input System and Testing. Core rules list them by path, and the agent reads a file before writing code that uses that library.
- `rules/profiles/*.md` hold architecture rules, one file per profile. Each is limited to 2048 bytes.

### Architecture Profiles

A profile is a short set of architecture rules for a project: how modules reach each other, how game flow is changed, which folders are read-only. Knowledge files describe a pattern; whether a project uses it is decided by its selected profile.

The shipped profile is `manager-eventbus`: a central manager is the entry point, game flow is a state machine, and modules talk through an event bus instead of referencing each other.

Select it in a project, then sync:

```bash
uda config profile manager-eventbus
uda sync
```

Mark folders that come from a shared template or SDK as read-only (the profile's rules say not to edit them):

```bash
uda config readonly_paths "[Assets/SDK,Packages]"
uda sync
```

With no profile selected, only the core rules load.

### Agents (6)

Generated in a project as `uda-unity-<name>` (for example `uda-unity-architect`):

| Agent | Used for | Writes files |
|-------|----------|--------------|
| `uda-unity-architect` | Designs a new system or feature inside the selected profile and returns the design with the files to create or change | No |
| `uda-unity-debugger` | Finds the root cause of an error or wrong behavior from the console and trace logs and the code, and proposes a fix | No |
| `uda-unity-performance` | Finds managed allocations and per-frame CPU cost in hot paths and says how to measure each in the Profiler | No |
| `uda-unity-reviewer` | Reviews written C# code against the core rules, library rules and selected profile, with file and line | No |
| `uda-unity-verifier` | Pre-commit gate: reads the staged diff and returns pass or fail, without staging or committing | No (reads git through Bash) |
| `uda-unity-writer` | Implements the change in exactly the files its dispatcher lists, compiling and running tests through the Editor bridge | Yes |

### Skills (2)

Generated in a project under `.claude/skills/uda-<name>/`:

- `subagent-dispatch` — give each sub-agent an explicit list of files it owns, snapshot the git state before dispatch, and verify with `npx uda-cli agent-check` what it really changed.
- `unity-editor-bridge` — compile a Unity project and run Edit Mode or Play Mode tests from the shell, through the Unity CLI on Unity 6 or in batch mode on Unity 2022.3.

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

No CLI command runs an agent. After `uda sync`, the agents exist in the project as `.claude/agents/uda-unity-<name>.md` (for example `.claude/agents/uda-unity-architect.md`), and the AI tool dispatches them by those names.

## Checking the Plugin

Contributors run this from the repository root before sending a change:

```bash
node scripts/check.mjs
```

It needs no dependencies and exits 0 when everything is in order. It checks that `manifest.json` has the expected version and `uda_version` and lists every profile file, that `rules/core.md` and each profile stay within their size limits and core rules reference every library file, that the six agent files exist with the expected tools, that each skill folder has a `SKILL.md` with matching name and a description, and that no shipped content file (under `rules`, `agents`, `skills`, `knowledge` and `workflows`) contains the markers of the block `uda sync` manages.

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
