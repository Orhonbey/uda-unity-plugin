# SRDebugger rules

Read this before writing code that references SRDebugger (`SRDebug`, `SROptions`, option containers, the bug reporter), and before any build of a project that contains it. Facts come from SRDebugger's own documentation.

## Build rule

- Test and QA builds: SRDebugger enabled, `DISABLE_SRDEBUGGER` not defined.
- Release and store builds: SRDebugger disabled.
- Check the state before every build. Never assume the previous build's state is still right.

Disabling SRDebugger (settings window, **Advanced** tab, or `SRDebugEditor.SetEnabled(false)` in editor code, SRDebugger 1.10.0 and later) adds the `DISABLE_SRDEBUGGER` define to all platforms and renames SRDebugger's Resources folders to `<Name>_DISABLED~` so Unity ignores them. Enabling reverses both. SRDebugger marks this feature experimental.

- Disable it locally right before a release build and enable it again right after. Never commit while it is disabled; the renames show up as many moves. Never update SRDebugger while it is disabled.
- In a build script, read `SRDebugEditor.IsEnabled` and fail the build when it does not match the build type.
- Toggle SRDebugger in a separate step before the build starts, then verify the define. Unity applies scripting symbols changed from code only after it recompiles scripts.

## Code

- Wrap every runtime use of SRDebugger in `#if !DISABLE_SRDEBUGGER` ... `#endif`, including `SRDebug.Init()`, `SRDebug.Instance` calls and option registration. Unwrapped code stops compiling when SRDebugger is disabled.
- Wrap whole `SROptions` partial class files the same way.
- Game flow must not depend on SRDebugger: startup, loading and menus must behave the same with `DISABLE_SRDEBUGGER` defined.
- If the **Loading** setting is **Disabled**, SRDebugger starts only when you call `SRDebug.Init()`.
- In code inside assembly definitions, don't extend `SROptions`; register your own object with `SRDebug.Instance.AddOptionContainer(obj)`, and remove it with `RemoveOptionContainer(obj)` when its owner goes away. Options added with `SRDebug.Instance.AddOption` are never removed automatically; remove them yourself.
- A custom log handler must call the original handler; otherwise the SRDebugger console receives no logs.

## Guard against mixed builds

Both mixed builds must fail to compile: a test build with SRDebugger disabled, and a release build with SRDebugger still enabled. Add both guards to a script that every build compiles (not an Editor-only folder or assembly):

```csharp
#if DISABLE_SRDEBUGGER && PROJECT_TEST_SYMBOL // use the project's real test symbol
#error "Test build with SRDebugger disabled"
#endif

#if PROJECT_RELEASE_SYMBOL && !DISABLE_SRDEBUGGER // use the project's real release symbol
#error "Release build with SRDebugger enabled"
#endif
```

Use the project's existing symbols. If the project has no symbol that marks test builds, or none that marks release builds, ask the user which symbol marks that build type before adding one. Never invent a symbol.

## Verify

- Look for `DISABLE_SRDEBUGGER` in every place a symbol can come from: Player Settings > Other Settings > Script Compilation > Scripting Define Symbols for the target platform, `Assets/csc.rsp`, and in Unity 6 the active build profile's **Scripting Defines**. Unity adds them together.
- Release build: the define is present and SRDebugger's Resources folders end in `_DISABLED~`. Test build: the define is absent and the folders have their normal names.
- On a device: in a test build the panel opens (by default the trigger is a triple-tap on the top-left corner; the project may have changed it); in a release build it does not. In both, the game must get past the loading screen to the main menu.
- After a release build, enable SRDebugger again and check that version control shows no leftover SRDebugger renames.
