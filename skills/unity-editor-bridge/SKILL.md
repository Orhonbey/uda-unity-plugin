---
name: unity-editor-bridge
description: Compile a Unity project and run its Edit Mode or Play Mode tests from the shell, through the Unity CLI and the Pipeline package on Unity 6, or in batch mode when no Editor has the project open (the route for Unity 2022.3). Use when you must check that C# changes compile, run Unity tests, read a compile or test result, or the Editor cannot be reached or is in Safe Mode.
---

# Unity Editor bridge

How to compile a Unity project and run its tests from a shell, and how to report what Unity said. Read this whole file before your first Unity command. Use only the commands written here. If your installed CLI rejects one of them, read `unity <subcommand> --help` for your version (for example `unity recompile --help`) instead of guessing.

In the commands below, `<project>` is the absolute path of the Unity project root (the folder that holds `Assets/`, `Packages/` and `ProjectSettings/`). Quote it if it contains spaces.

## Requirements

- **Editor route (primary):** Unity 6.0 or newer, the Unity CLI (`unity` on `PATH`), and the Pipeline package `com.unity.pipeline` in the project. The Pipeline package runs inside the open Editor and lets the CLI drive it.
- **Batchmode route (fallback):** any Unity version, Unity 2022.3 included, but only while no Editor has the project open.

## What you report

```
Compile: passed | failed | not compiled (parallel) | not verified (<reason>)
Tests: passed | failed | not run (<reason>)
```

- `passed` only when you saw Unity's result say so. Quote the line (or lines) Unity printed, and the exit code.
- `failed`: quote the errors or the failing tests exactly as Unity printed them.
- `not compiled (parallel)`: you are one of several writers working at the same time. You do not compile; the lead does (see "One Editor").
- `not verified (<reason>)`: you could not get a compile result. Say why: Unity CLI not installed, Editor not reachable, Editor in Safe Mode, Editor busy, an Editor has the project open and the batchmode route needs it closed, the command failed before compiling.
- `not run (<reason>)` for tests you did not run or that did not run.
- Never report `passed` for a compile or a test run you did not see succeed.

## Pick the route

1. Read the Editor version in `ProjectSettings/ProjectVersion.txt`. Unity 6 versions start with `6000.`; Unity 2022.3 versions start with `2022.3.`.
2. Check `Packages/manifest.json` for `com.unity.pipeline`.
3. If `unity` is on `PATH`, see which Editors are running and which project each has open:

   ```sh
   unity editors running
   ```

| Situation | Route |
|---|---|
| Unity 6.0+, Pipeline package present, an Editor has the project open | Editor route |
| No Editor has the project open (any version) | Batchmode route |
| An Editor has the project open, but the project is on 2022.3 or has no Pipeline package | Neither. Report `not verified (Editor open, no Pipeline connection)` |
| `unity` is not installed and you cannot confirm that no Editor has the project open | Neither. Report `not verified (cannot tell whether an Editor has the project open)` |

Do not install or upgrade the Pipeline package, and do not open, close or quit an Editor, unless the user explicitly asked for it. `unity pipeline install` changes `Packages/manifest.json`, and `unity close` exits the Editor without saving.

## One Editor

- A project is open in at most one Editor. Unity cannot open a project in batch mode while an Editor has the same project open.
- One agent drives Unity at a time. Do not start a compile or a test run while another one is running on the same project.
- **Working alone:** you compile and run the tests that cover your change yourself.
- **Working in parallel with other writers:** do not compile and do not run tests. The other writers are still editing, and a half-written file fails the compile for the wrong reason. Report `not compiled (parallel)`.
- **The lead session** compiles once, after the last parallel writer has finished, then runs the tests once for the whole set of changes. It matches each compile error to a writer by the file path in the error.

## Editor route (Unity 6.0+, Pipeline package)

Pass `--project-path <project>` to every `unity status`, `unity recompile`, `unity command` and `unity list` call. Without it the CLI picks the Editor from the current directory, which is the wrong one when several Editors are open.

Output that goes to a pipe or a file defaults to tab-separated text. Add `--json` to any command for a structured result with `success` and `errors` fields.

### 1. Connect

```sh
unity status --project-path <project>
```

Look for the project with state `ready`.

- `settling`: the Editor is still starting (importing, compiling). Wait for it:

  ```sh
  unity status --project-path <project> --until-ready --timeout 300
  ```

- `blocked_by_dialog`: a dialog is open in the Editor and needs a person. Report `not verified (Editor shows a dialog)`.
- The project is not listed: run `unity pipeline list`. It lists every running Editor and its Pipeline package status; a working project shows `Pipeline: Installed`. If `unity editors running` shows the Editor but the CLI cannot reach it, the Editor may be in Safe Mode (below), or its Pipeline server may be stopped (Project Settings > Pipeline > Editor > Auto Start, or Window > Pipeline > Start Server; ask the user). Report `not verified` with what you saw.

### 2. Compile

Save your files, then:

```sh
unity recompile --project-path <project>
```

It recompiles the open Editor's scripts, waits for the compile to finish (`--timeout <seconds>`, default 120) and reports compile errors.

| Exit code | Meaning | What you do |
|---|---|---|
| 0 | Compiled without errors | Report `passed` and quote the line it printed |
| 7 | Could not reach a running Editor | Safe to retry once `unity status ... --until-ready` shows `ready`. If it stays unreachable, check Safe Mode, then report `not verified` |
| 2 | The command line is wrong | Fix the command. Do not retry it unchanged |
| any other non-zero code | The compile failed or the command could not run | Read the errors it printed |

If the errors are in your files, fix them and run `unity recompile` again. If errors remain in files you do not own, stop and report them, quoted.

### 3. Test (Edit Mode)

```sh
unity command --project-path <project> --timeout 600 test run --mode editor --filter <TestName>
```

- `--filter` is a case-insensitive partial match. `--filter-type` says what it matches: `TestName` (the default), `Assembly` or `Category`. For example, to run the `Smoke` category: `unity command --project-path <project> --timeout 600 test run --mode editor --filter-type category --filter Smoke`.
- `--timeout 600` before `test` is the CLI's wait in seconds; its default is 30, shorter than many test runs. The run itself times out after 600 seconds by default.
- The run is synchronous: it returns when the run ends, with one record per test (`fullName`, `status`, `message`, `stackTrace`).

| Exit code | Meaning |
|---|---|
| 0 | At least one test ran and none failed |
| 2 | Invalid arguments, or no test matched the filter. This is not a pass: fix the filter |
| 6 | Tests failed or the run errored |
| 14 | The run timed out |

Report the filter you used, the counts, and for each failing test its name and message as Unity printed them.

### 4. Test (Play Mode)

Entering Play Mode reloads the script domain, which drops a synchronous request. A Play Mode run (`--mode playmode` or `--mode all`) must be started with the `async-tests` parameter, then polled:

```sh
unity command --project-path <project> test status
```

Repeat `test status` until it shows a finished run; for a finished run it uses the exit codes of `test run`. The same applies to any test that recompiles scripts or reloads the domain. Before your first asynchronous run, check how your Pipeline version takes the `async-tests` value: `unity list --project-path <project>` lists every command the Editor registers, with its parameters.

If `test run` is not a known command, your Pipeline package is older. `unity command --project-path <project>` lists the command groups the Editor offers; use the names it shows. Do not upgrade the package unless the user asks.

### Safe Mode

When an Editor opens a project that has compile errors, it can enter Safe Mode. In Safe Mode Unity imports only script-related assets and runs no managed code from the project or its packages. The Pipeline package does not run either, so the CLI cannot reach that Editor: `unity editors running` lists it, but `unity status` does not show it ready, and `unity recompile` typically exits 7 (could not reach a running Editor).

What you do:

1. Do not switch to the batchmode route: the Editor still has the project open. Do not close the Editor and do not ask anyone to leave Safe Mode with errors remaining.
2. Read the compile errors from the Editor log. They are the lines that contain `error CS`.
   - macOS: `~/Library/Logs/Unity/Editor.log`
   - Windows: `%LOCALAPPDATA%\Unity\Editor\Editor.log`
   - Linux: `~/.config/unity3d/Editor.log`
3. If the errors are in your files, fix them. Unity leaves Safe Mode by itself once every compile error is resolved. Then wait with `unity status --project-path <project> --until-ready --timeout 300` and confirm with `unity recompile --project-path <project>`.
4. If errors remain in files you do not own, or the Editor does not come back, stop. Report `failed` with the quoted error lines if your files had errors, otherwise `not verified (Editor in Safe Mode)` with the quoted error lines.

## Batchmode route (Unity 2022.3, or no Editor open)

Run this only while no Editor has the project open. Check with `unity editors running` right before you start. If an Editor has the project open, do not run it, do not compile another way, and report `not verified (an Editor has the project open)`, never `passed`. If you cannot check, ask the lead or the user instead of guessing.

### Find the Editor

Take the version from `ProjectSettings/ProjectVersion.txt`. With the Unity CLI installed, `unity editors path <version>` prints that Editor's install directory. The Editor executable inside it:

- macOS: `<install dir>/Unity.app/Contents/MacOS/Unity` (the Hub's default install dir is `/Applications/Unity/Hub/Editor/<version>`)
- Windows: `<install dir>\Editor\Unity.exe` (the Hub's default install dir is `C:\Program Files\Unity\Hub\Editor\<version>`)

Below, `<unity>` is that executable. Write the log and results files outside the project (for example in the system temp directory), so they do not show up as project changes.

### Compile

```sh
<unity> -batchmode -quit -projectPath <project> -logFile <log>
```

Opening the project compiles its scripts. In batch mode Unity quits when the project has compile errors, and a failure exits with a non-zero code (the Manual names 1 for failed operations).

- Exit 0 and no line containing `error CS` in the log: report `passed`. Quote the exit code and the last lines of the log.
- Non-zero exit: read the log. Compile errors are the lines that contain `error CS`; quote them and report `failed`. If there are none, report `not verified` with the error the log shows.
- Never add `-ignorecompilererrors`; it lets Unity start despite compile errors.

### Test

```sh
<unity> -runTests -batchmode -projectPath <project> -testPlatform EditMode -testResults <results.xml> -logFile <log>
```

- `-testPlatform PlayMode` runs Play Mode tests in the Editor. Without `-testPlatform`, Edit Mode tests run.
- Narrow the run with `-testFilter` (semicolon-separated test names, or a regular expression on the full name), `-testCategory` or `-assemblyNames` (semicolon-separated lists).
- Read the result from the NUnit XML file, not from the exit code: the Test Framework says there is no common definition of exit codes for test runs. The `<test-run>` element carries `result` (`Passed`, `Failed`, `Inconclusive` or `Skipped`) and the counts `total`, `passed`, `failed`. Quote that element's result and counts. Failing tests are the `<test-case>` elements with `result="Failed"`; quote their `fullname` and the `<failure><message>` text.
- No results file means the tests did not run: report `not run` with the reason from the log.

### After a batchmode run

Opening the project imports assets and can write files in it. Run `git status` and report every change outside your file list. Do not revert or commit it.

## Editor assets

Compiling and running tests are always allowed on these routes. Changing the project through the Editor is not: commands that create or change scenes, prefabs, GameObjects, components, assets, materials, project settings or packages (for example the `unity command` groups `asset`, `scene`, `gameobject`, `component`, `prefab`, `material`, `settings.*` and `package`, or `unity pipeline install` and `unity pipeline upgrade`) run only when the user explicitly asked for that change. Otherwise describe the needed change in your reply. Never hand-edit a `.meta` file.

## Exit codes at a glance

Unity CLI (all commands):

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | General error; details on stderr |
| 2 | Usage error: invalid flags, invalid option values, missing arguments. Fix the command line |
| 3 | Authentication or authorization failure |
| 4 | Configuration required: a needed preference or context is not set |
| 6 | The command's main operation failed |
| 7 | A Unity service could not be reached, or `unity recompile` could not reach a running Editor. Safe to retry |
| 130 / 143 | Interrupted (Ctrl+C) / terminated (SIGTERM) |

`unity command ... test run` and `test status`: 0 passed, 2 invalid arguments or no matching tests, 6 failed or errored, 14 timed out.

Batch mode: 0 success; a failure exits non-zero (1 for failed operations). For test runs, judge by the results file, not the exit code.
