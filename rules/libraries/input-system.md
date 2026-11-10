# Input System rules

Read this before writing code that reads player input: `UnityEngine.InputSystem` (`InputAction`, `PlayerInput`, devices), legacy `UnityEngine.Input`, or UI input modules. Checked against the Input System 1.11 manual.

## Which backend

- Check **Active Input Handling** in Player Settings > Other Settings: Input Manager (Old), Input System Package (New), or Both. Changing it needs an Editor restart; don't change it unless the user asks.
- The new backend defines `ENABLE_INPUT_SYSTEM`, the old one `ENABLE_LEGACY_INPUT_MANAGER`; with Both, both are defined. Guard backend-specific code with these symbols.
- In a project that uses the Input System package, don't add `UnityEngine.Input` calls. Don't mix both APIs in one feature.

## Actions

- Project-wide actions (Edit > Project Settings > Input System Package, Input System 1.8 and later) are enabled by default and reachable through `InputSystem.actions`.
- Actions from any other asset, or created in code, start disabled and ignore input until you call `Enable()` on the action or its action map. Call `Disable()` when the owner is disabled.
- Find actions once, in `Awake` or `OnEnable`, and keep them in fields: `InputSystem.actions.FindAction("Move")`. Never call `FindAction` per frame.
- For continuous input, poll in `Update` with `action.ReadValue<T>()`. For one-shot input, use `WasPressedThisFrame()`, `WasReleasedThisFrame()` or `WasPerformedThisFrame()`.
- For callbacks, subscribe to `started`, `performed` or `canceled` in `OnEnable` and unsubscribe in `OnDisable`.
- Don't rely on the order in which actions performed in the same frame are reported; it is undefined.
- Disable an action before changing its bindings; some configuration cannot change while the action is enabled.

## UI

- With the new backend, the scene's EventSystem needs `InputSystemUIInputModule`, not the legacy `StandaloneInputModule`. Replacing the component is a scene change: ask first.
- To ignore gameplay input over UI, poll in `Update` and check `EventSystem.current.IsPointerOverGameObject()`. Don't call it inside action callbacks; it logs a warning there and reflects the previous frame's UI state.

## Verify

- Window > Analysis > Input Debugger shows devices, layouts and actions, in the Editor and in connected players.
- Automated tests: list `com.unity.inputsystem` under `testables` in `Packages/manifest.json`, reference `Unity.InputSystem` and `Unity.InputSystem.TestFramework` from the test assembly, and derive the fixture from `InputTestFixture`. Feed input with `Press`, `Release`, `PressAndRelease`, `Set` and `Trigger`.
- In an `InputTestFixture` subclass, override `Setup()`/`TearDown()` and call the base methods. Don't add NUnit `[SetUp]`/`[TearDown]` methods; they stop the fixture from initializing. Layouts registered at startup (`[InitializeOnLoad]`, `[RuntimeInitializeOnLoadMethod]`) are missing inside the fixture; register them in setup.
