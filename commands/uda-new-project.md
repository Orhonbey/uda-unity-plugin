---
description: Set up or update a Unity project for the UDA rules and agents - copies the rules into .claude/uda/, writes the rules section of the project's CLAUDE.md (core rules, architecture profile, read-only folders) and can install the log bridge.
argument-hint: "[profile]"
---

Set up the current Unity project for UDA, or update its copy of the rules. Arguments: `$ARGUMENTS` (an optional profile name, or `none`).

1. **Check the prerequisites.**
   - `ProjectSettings/ProjectVersion.txt` exists in the current folder. If not, say this is not the root of a Unity project and stop.
   - `~/.claude/uda/scripts/copy-rules.sh` exists. If not, say that the UDA bootstrap has not run (`scripts/bootstrap.sh` in the uda-unity-plugin repository) and stop.

2. **Choose the architecture profile.**
   - If `$ARGUMENTS` names a profile or `none`, use it.
   - Otherwise, if `.claude/uda/rules/profiles/` already holds a profile, this is an update: keep it and do not ask.
   - Otherwise list the files in `~/.claude/uda/rules/profiles/`, read the first lines of each, and ask the user which one fits the project, with "no profile" as an option.

3. **Copy the rules.** Run `bash ~/.claude/uda/scripts/copy-rules.sh <profile>` at the project root (`none` for no profile; no argument to keep the current one). It replaces `.claude/uda/rules/` with a fresh copy. Its last line says which profile was copied. If it fails, show its error and stop.

4. **Choose the read-only folders.** These come from a shared template or SDK and the agents must never edit them. On an update, keep the list already under `## Read-only paths` in `CLAUDE.md` and do not ask. Otherwise suggest the ones that exist from this list: `Assets/SDK`, `Packages`, `Assets/Plugins`, `Assets/ThirdParty`, and ask the user to confirm or change it. An empty list is fine.

5. **Write the section** into `CLAUDE.md` at the project root. Use exactly this shape, leaving out the profile part when there is no profile and the list when it is empty:

   ```markdown
   ## Unity rules (UDA)

   @.claude/uda/rules/core.md

   ## Architecture profile: <profile>

   @.claude/uda/rules/profiles/<profile>.md

   ## Read-only paths

   - <folder>
   ```

   - No `CLAUDE.md`: create it with this section.
   - `CLAUDE.md` exists without a `## Unity rules (UDA)` heading: append the section at the end. Change nothing else in the file.
   - `CLAUDE.md` already has the section: replace only those headings and their content, nothing else.

6. **Log bridge (optional, first setup only).** If `Assets/Editor/UdaLogBridge.cs` does not exist, ask whether to install it. If yes, copy `~/.claude/uda/unity-package/Editor/UdaLogBridge.cs` to `Assets/Editor/UdaLogBridge.cs`. Once Unity compiles it, Console errors and exceptions are written to `Logs/uda-console.jsonl`, which `uda-unity-debugger` reads.

7. **Report** what changed: the profile, the read-only folders, the `CLAUDE.md` section you wrote, and whether the log bridge was installed. Tell the user to commit `.claude/uda/` and `CLAUDE.md` with the project (check that `.gitignore` does not exclude `.claude/`; if it does, say so), and that the rules load from the next session on.
