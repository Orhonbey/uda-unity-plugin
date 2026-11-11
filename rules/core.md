### Scope

These rules apply to every C# script you write or change in this Unity project. They target Unity 6 (6000.0 LTS) and also hold for 2022.3 LTS unless a line says otherwise.

### Architecture

Architecture rules (managers, singletons, events, dependency injection, folder ownership) come from the selected profile under `## Architecture Profile` in this file. If no profile is selected, follow the patterns the project already uses and do not introduce a new one.

### Naming and files

- PascalCase for types, methods, properties, events and constants; `_camelCase` for private fields; `I` prefix for interfaces. If the project consistently uses another convention, follow the project.
- One MonoBehaviour or ScriptableObject class per file, file name equal to class name: Unity resolves the class by file name. Use one namespace in such a file, or Unity cannot use the class.
- Expose Inspector fields as `[SerializeField] private`, not `public`.

### Per-frame code (`Update`, `FixedUpdate`, `LateUpdate`, per-frame callbacks)

- Allocate nothing: no `new` of classes or arrays, no string concatenation or interpolation, no LINQ, no lambdas or method groups passed as arguments, no boxing, no `params` calls.
- Unity APIs that return arrays allocate a new copy on every access. Use the non-allocating form with a reused buffer: `mesh.GetVertices(list)`, `Physics.RaycastNonAlloc`, `renderer.GetSharedMaterials(list)`.
- Update UI text only when the value changes.
- No logging.

### Caching

- Get components once in `Awake` (or assign them in the Inspector) and keep them in fields. Never call `GetComponent`, `GameObject.Find` or `Object.Find*` in per-frame code. Use generic `GetComponent<T>()`; the `Type` and `string` overloads are slower.
- Use `FindFirstObjectByType` or `FindAnyObjectByType`; `FindObjectOfType` is deprecated in Unity 6.
- Cache ids in `static readonly int` fields: `Animator.StringToHash` for animator parameters, `Shader.PropertyToID` for material properties. Never save or send shader property ids; they change between runs.

### Pooling

- Pool objects that are created and destroyed repeatedly (projectiles, effects, list items) with `UnityEngine.Pool.ObjectPool<T>`; pool temporary collections with the collection pools in `UnityEngine.Pool`.
- Reset state on get or release: stop coroutines, unsubscribe events, reset physics, deactivate the GameObject on release.
- Release each object exactly once and drop your reference to it. Never `Destroy` a pooled object yourself. Do not set `collectionCheck` to false: with it on (the default), the pool throws on a double release in the Editor.
- Call pools from the main thread only. A pool dies with its scene: release active instances in `OnDisable`/`OnDestroy`, and `Clear()` the pool between levels.

### Unity objects and events

- Test Unity objects with `== null` or `if (obj)`. Never use `?.` or `??` on them: those skip Unity's check and treat destroyed objects as alive.
- Unsubscribe every handler you subscribe; pair `OnEnable` subscribe with `OnDisable` unsubscribe.

### Logging

- `Debug.Log*` calls are not stripped from release builds. Send verbose logs through the project's logger, or a method marked `[System.Diagnostics.Conditional("SYMBOL")]` whose symbol is defined only in development builds.
- Pass the object as context: `Debug.Log(message, this)`.
- Log caught exceptions with `Debug.LogException(e, this)`. Never catch and ignore.
- Use `LogWarning`/`LogError` only for real problems; an unexpected error log fails Unity Test Framework tests.

### Editor and assets

- Change scenes, prefabs, ScriptableObject assets, materials, `ProjectSettings/` or `Packages/manifest.json` only when the user explicitly asks for that change. A code task does not authorize asset changes: describe the needed asset change instead.
- Never hand-edit or delete `.meta` files. When you move or rename an asset outside Unity, move or rename its `.meta` with it; a lost `.meta` breaks every reference to the asset.

### Libraries

Before writing code that uses one of these libraries, read its file:

- `.uda/rules/unity/libraries/addressables.md`: every load and instantiate must be released, or the asset stays in memory.
- `.uda/rules/unity/libraries/srdebugger.md`: on in test builds, off in release builds; every call to it must compile with `DISABLE_SRDEBUGGER` defined.
- `.uda/rules/unity/libraries/remote-config.md`: a missing key silently returns the default, so never rename or delete a key a shipped build reads.
- `.uda/rules/unity/libraries/input-system.md`: actions outside the project-wide asset start disabled and do nothing until `Enable()`.
- `.uda/rules/unity/libraries/testing.md`: test assemblies cannot reference `Assembly-CSharp`; code under test needs its own assembly definition.
