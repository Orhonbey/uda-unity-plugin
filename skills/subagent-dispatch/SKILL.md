---
name: subagent-dispatch
description: Give each sub-agent an explicit list of the files it owns, snapshot the git state before dispatch, and after it returns verify from git what it really changed with npx uda-cli agent-check. Use when you dispatch, delegate to or run sub-agents (one or several in parallel) that may change files, and before you accept a sub-agent's work.
---

# Sub-agent dispatch

A sub-agent's reply is its own account of what it did. A file it changed and did not mention stays invisible until something breaks. Read the change from git instead, and check it against the list of files the sub-agent was allowed to change. `npx uda-cli agent-check` does the comparison.

Requirements: the project is a git repository and the tool runs as `npx uda-cli`. Run every command below from inside the repository; the tool finds the repository from the current directory.

## The procedure

### 1. Write the ownership list

Before dispatch, decide which files or folders each sub-agent owns: the only paths it may create, change or delete.

- Paths are relative to the repository root, for example `Assets/Scripts/Player` or `Assets/Scripts/Player/PlayerMover.cs`.
- A path matches by path segment: `Assets/Scripts` allows `Assets/Scripts/A.cs`, not `Assets/Scripts2/A.cs`.
- Not allowed in the list: an absolute path, a path that contains `..`, `.` or an empty string. Each makes the check fail to run.
- Sub-agents that run at the same time get lists that do not overlap.
- A sub-agent that should only read gets no list. Every change it makes is then a finding.
- **Unity:** when a sub-agent creates or moves an asset (a new script included), Unity writes a `.meta` file next to it. Give the sub-agent the folder, or list the `.meta` files too (`Assets/Scripts/Player/PlayerMover.cs.meta`), or the `.meta` shows up as a finding.

Put the list in the sub-agent's instructions, and tell it not to stage, commit, stash or reset.

### 2. Take a snapshot before dispatch

```sh
npx uda-cli agent-check snapshot <file>
```

It records HEAD, a fingerprint of the index and a content hash of every dirty path. `<file>` must be outside the work tree, for example in the system temp directory (`"${TMPDIR:-/tmp}/agent-check-<name>.json"`). A path inside the work tree is refused, because the snapshot would show up as a change.

Take a new snapshot before every dispatch. A snapshot describes the tree at one moment; an old one also reports changes you have already reviewed.

### 3. Dispatch, then check

When the sub-agent has returned:

```sh
npx uda-cli agent-check check <file> <allowed-path>...
```

Pass the same paths you gave the sub-agent. For a read-only sub-agent, pass no paths: `npx uda-cli agent-check check <file>`.

### 4. Read the change from git

Read what changed with `git status` and `git diff -- <path>...`, not from the sub-agent's reply. `git diff` does not show untracked files: `git status` lists them, and you read them directly. If HEAD moved, read the commit with `git diff <old> <new>`.

### 5. Resolve every finding before you accept the work

A finding means the work is not accepted yet. Find out what happened, then act:

- `outside-allowed <path>`: a path outside the list changed. Look at the change. It may be the sub-agent overstepping, another sub-agent or person working in the same tree, or Unity writing a file (a `.meta`). Either accept it deliberately (re-run the check with the path added, and say why), or ask the user before you undo a change you did not make.
- `head-moved`: a commit was made after the snapshot, usually by the sub-agent. Its files are listed as changes. Read the commit. Do not rewrite or drop it without asking the user.
- `index-changed`: something was staged or unstaged. Look at `git diff --cached`. Staging is the lead's job, not the sub-agent's.

## Output

`check` prints one line per result, then a last line:

```
CHANGED <path>
FINDING outside-allowed <path>
FINDING head-moved <old> -> <new>
FINDING index-changed
clean | <n> finding(s)
```

Paths are printed as JSON strings, so a path with spaces or unusual characters reads unambiguously. `CHANGED` lists every path that changed since the snapshot, allowed or not; `FINDING` lines are the problems. Example:

```
CHANGED "Assets/Scripts/Player/PlayerMover.cs"
CHANGED "Assets/Scripts/Player/PlayerMover.cs.meta"
CHANGED "ProjectSettings/TagManager.asset"
FINDING outside-allowed "ProjectSettings/TagManager.asset"
1 finding(s)
```

A file that was already dirty when you took the snapshot, and has not changed since, is not reported. If it changed again, it is reported.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Clean: nothing changed outside the list, HEAD and index unchanged |
| 2 | Findings: read the `FINDING` lines |
| 1 | The check could not run: not a git repository, a snapshot file that is missing, unreadable or corrupt, a snapshot from another repository, a snapshot file inside the work tree, an absolute or `..` allowed path, or an allowed path of `.` or an empty string. The error is on stderr |

Exit 1 is not a pass. Fix the cause and run the check again; if the snapshot is unusable, you cannot check this dispatch, so review the whole `git status` yourself.

## Parallel sub-agents

Parallel sub-agents share one work tree. Take one snapshot before you dispatch the group. When all have returned, run one check with all their lists together; it shows every change outside every list. Then match each `CHANGED` path to the sub-agent that owns it.

The check shows that a path changed, not which sub-agent changed it. A sub-agent that edited a path in another sub-agent's list is not visible as a finding. Read the diff of each owned path with that in mind.

In a Unity project only the lead compiles, once, after the last parallel writer has finished (see the Editor bridge skill, `.claude/skills/uda-unity-editor-bridge/SKILL.md`).

## Limits

- Parallel sub-agents share one work tree: the command shows that a path outside the list changed, not which agent changed it.
- Files that git ignores are invisible to it.
- An untracked nested repository or a submodule is reported by its directory path, not file by file.
