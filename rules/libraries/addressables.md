# Addressables rules

Read this before writing code that uses `UnityEngine.AddressableAssets` (`Addressables`, `AssetReference`, labels, catalogs, remote content), and before changing Addressables groups, profiles or builds. Checked against the Addressables 2.3 manual (Unity 6). On a 2022.3 project with Addressables 1.x, confirm API details in the 1.x manual.

## Do

- Keep every `AsyncOperationHandle` for as long as you use its result, and release it exactly once with `Addressables.Release(handle)` when done, usually in the owner's `OnDestroy`. Addressables counts references: each load needs one release.
- Release the handle even when the operation failed.
- Check `handle.Status == AsyncOperationStatus.Succeeded` before reading `handle.Result`.
- Release objects made with `Addressables.InstantiateAsync` with `Addressables.ReleaseInstance(instance)`, which releases and destroys the instance.
- When you load with `LoadAssetAsync` and then call `Object.Instantiate`, the load handle owns the asset: keep it until the instances are gone.
- Use `LoadAssetsAsync` to load everything under a label. `LoadAssetAsync` with a label loads only the first match.
- Rebuild Addressables content before building the player when Addressable assets changed, unless the project builds Addressables on player build.

## Don't

- Don't expect memory back after releasing one asset: memory is freed only when every asset of its AssetBundle is released and the bundle unloads.
- Don't release the last asset of a bundle and load from the same bundle right after; that unloads and reloads the bundle (asset churn).
- Don't call `WaitForCompletion` on an operation that downloads remote content, on a scene load, or in `Awake` while a scene is still loading (use `Start`). It blocks the main thread, completes every active load, and is not supported on WebGL.
- Don't use `AsyncOperationHandle.Task` on WebGL; use a coroutine or the `Completed` event.
- Don't ship code changes in a content update. Addressables delivers content only; renaming a class, changing its namespace or moving it to another assembly definition needs a new player build and a new content build.
- Don't change groups, profiles, `Assets/AddressableAssetsData` or run content builds unless the user asks.

## Content updates for shipped builds

- Keep the `addressables_content_state.bin` from every released build, per platform. Build updates with **Update a Previous Build**, using the file from the release you are updating.
- Don't change player code or build scripts between the player build and its content updates.
- **Check for Content Update Restrictions** rearranges groups; work on a version control branch before running it.
- Remote content must be hosted at the `RemoteLoadPath` of the profile used for the build. Before a build, confirm which profile is active.

## Verify

- The **Use Asset Database** Play Mode Script loads from the AssetDatabase and does not exercise bundles. To test bundle loading, run a content build and use **Use Existing Build**.
- The Addressables Profiler module (Profiler window, **Addressable Assets** module) shows loaded bundles and assets per frame, so you can confirm that released assets unload. It needs **Debug Build Layout** enabled in the Addressables preferences and a Use Existing Build play mode.
- The Analyze tool (Window > Asset Management > Addressables > Analyze) reports duplicated dependencies between groups, Resources and scenes.
