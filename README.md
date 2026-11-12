# UDA Unity

Unity rules, agents and skills for Claude Code. Plain files: no CLI, no database. Agents, skills and the setup command are linked from this repository into `~/.claude`, so there is one place to edit them. The rules are copied into each Unity project, because Claude Code loads a project's `CLAUDE.md` imports only from files inside the project.

## Setup

Once per machine:

```bash
git clone https://github.com/Orhonbey/uda-unity-plugin.git
uda-unity-plugin/scripts/bootstrap.sh
```

Once per Unity project, in Claude Code at the project root:

```
/uda-new-project
```

It asks for the architecture profile and the read-only folders, copies the rules into `.claude/uda/` in the project, writes the rules section of the project's `CLAUDE.md`, and can install the log bridge. Commit `.claude/uda/` and `CLAUDE.md` with the project: teammates then get the rules without running anything.

To update, `git pull` in the repository. Edits to agents and skills are live at once; run `scripts/bootstrap.sh` again only when one was added or removed. Rules reach a project when you run `/uda-new-project` there again: it keeps the profile and read-only folders and refreshes the copy.

To remove: `scripts/bootstrap.sh --uninstall`. It removes only the links that point into this repository.

## How it is wired

`scripts/bootstrap.sh` makes these links (in `$CLAUDE_CONFIG_DIR`, or `~/.claude`):

| Link | Points to |
|---|---|
| `~/.claude/uda` | this repository |
| `~/.claude/agents/uda-unity-*.md` | `agents/` |
| `~/.claude/skills/uda-*` | `skills/` |
| `~/.claude/commands/uda-new-project.md` | `commands/` |

It never replaces a file that is not a symlink and never touches `~/.claude/CLAUDE.md`. Agents, skills and the command are available in every project. The Unity rules load only in projects that hold a copy (`scripts/copy-rules.sh`, which `/uda-new-project` runs) and whose `CLAUDE.md` imports it:

```markdown
## Unity rules (UDA)

@.claude/uda/rules/core.md

## Architecture profile: manager-eventbus

@.claude/uda/rules/profiles/manager-eventbus.md

## Read-only paths

- Assets/SDK
```

## What's inside

| Folder | Holds |
|---|---|
| `rules/core.md` | Rules for every C# script, loaded in each session. Kept under 6144 bytes. |
| `rules/libraries/` | Addressables, SRDebugger, Remote Config, Input System, testing. `core.md` lists them; the agent reads one before writing code that uses that library. |
| `rules/profiles/` | Architecture rules, one file per profile, each under 2048 bytes. Shipped: `manager-eventbus` (a central manager, game flow as a state machine, modules talk through an event bus). |
| `agents/` | Six sub-agents, below. |
| `skills/` | `uda-subagent-dispatch` (give each sub-agent a file list and check from git what it changed) and `uda-unity-editor-bridge` (compile and run tests from the shell). |
| `commands/` | `/uda-new-project`. |
| `scripts/` | `bootstrap.sh`, `copy-rules.sh`, `agent-check.mjs`, `check.mjs`. |
| `unity-package/Editor/UdaLogBridge.cs` | Optional Editor script that writes Console errors and exceptions to `Logs/uda-console.jsonl`. |

### Agents

| Agent | Used for | Writes files |
|---|---|---|
| `uda-unity-architect` | Designs a system or feature inside the selected profile and lists the files to create or change | No |
| `uda-unity-debugger` | Finds the root cause of an error from the logs and the code and proposes a fix | No |
| `uda-unity-performance` | Finds allocations and per-frame cost in hot paths and says how to measure each | No |
| `uda-unity-reviewer` | Reviews C# against the core rules, library rules and profile, with file and line | No |
| `uda-unity-verifier` | Pre-commit gate on the staged diff: pass or fail | No (reads git) |
| `uda-unity-writer` | Changes exactly the files it is given, compiles and runs tests | Yes |

## Checking a sub-agent's work

```bash
node ~/.claude/uda/scripts/agent-check.mjs snapshot /tmp/snap.json
# ... the sub-agent works ...
node ~/.claude/uda/scripts/agent-check.mjs check /tmp/snap.json Assets/Scripts
```

Exit code 0 is clean, 2 means findings (a change outside the allowed paths, a commit, a branch switch, staging or a stash), 1 means the check could not run. The snapshot file must be outside the work tree. Needs Node 18+ and git; no packages.

## Contributing

Before sending a change, from the repository root:

```bash
node scripts/check.mjs
node --test scripts/agent-check.test.mjs
```

`check.mjs` checks rule sizes, that `core.md` references every library file, the six agents and their tools, skill and command frontmatter, executable scripts, that agents and rules point at the project copy of the rules, and that no shipped file still mentions the retired `uda` CLI.

## License

MIT - see [LICENSE](LICENSE).
