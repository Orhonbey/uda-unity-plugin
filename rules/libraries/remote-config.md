# Remote Config rules

Read this before writing code that uses `Unity.Services.RemoteConfig` (`RemoteConfigService`), and before adding, changing or removing Remote Config keys. Checked against the Remote Config 4.x manual and runtime API.

## Keys of shipped builds

- Never rename or delete a key that a shipped build reads, and never change its type or meaning. A missing key does not fail: the getter silently returns the default.
- To change behavior, add a new key, read it in the new build with its own default, and keep the old key until no supported build reads it.
- Don't edit values in the `production` environment unless the user asks.

## Code

- Initialize Unity Services and sign in before fetching: `await UnityServices.InitializeAsync()`, then `AuthenticationService.Instance.SignInAnonymouslyAsync()` if `AuthenticationService.Instance.IsSignedIn` is false. Remote Config depends on Authentication.
- Fetch with `RemoteConfigService.Instance.FetchConfigsAsync(new userAttributes(), new appAttributes())`. The attribute structs are required; they may be empty.
- Read values with `RemoteConfigService.Instance.appConfig.GetInt("key", defaultValue)` (also `GetFloat`, `GetBool`, `GetString`, `GetLong`, `GetJson`). Always pass a default that is safe for gameplay; without one you get `0`, `""` or `false`.
- The game must run without a network. On a first launch offline the config comes from defaults; on later offline launches it comes from the cache written by the last successful fetch. Never let the loading screen wait on a fetch without a timeout and a fallback.
- When behavior must differ by source, check `ConfigResponse.requestOrigin`: `ConfigOrigin.Default`, `Cached` or `Remote`.
- Read all keys in one place and pass the values on; don't scatter key strings through the code.

## Environments

- The environment is chosen in this order: `InitializationOptions`, then the Environment Selector value, then `production`. A request with no environment goes to `production`.
- Point development and test builds at a non-production environment, with `new InitializationOptions().SetEnvironmentName("name")` (namespace `Unity.Services.Core.Environments`) passed to `UnityServices.InitializeAsync`, or with `RemoteConfigService.Instance.SetEnvironmentID("id")`. Make sure release builds use `production`.

## Verify

- Log `requestOrigin` and `RemoteConfigService.Instance.appConfig.environmentId` once per fetch in development builds.
- Test three launches: first launch offline (clear the app data first; the cache file lives under `Application.persistentDataPath`), online, then offline again. Expect `Default`, `Remote`, `Cached`.
- Before adding or removing a key, search the code of every supported build for the key string.
