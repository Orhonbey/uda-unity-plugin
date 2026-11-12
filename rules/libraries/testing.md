# Unity Test Framework rules

Read this before writing, changing or running tests in a Unity project. Checked against the Unity Test Framework 1.4 manual (Unity 6). Check the installed version in `Packages/manifest.json`.

## Test assemblies

- Tests live in a test assembly: an assembly definition that references `nunit.framework.dll`, `UnityEngine.TestRunner` and `UnityEditor.TestRunner`. Create one with Assets > Create > Testing > Test Assembly Folder, or from the Test Runner window (Window > General > Test Runner).
- Edit Mode tests: the test assembly's only platform is Editor. Play Mode tests: the assembly references the assembly under test and may target players. `UnityEditor.TestRunner` is available in Edit Mode only.
- An assembly definition cannot reference the predefined `Assembly-CSharp`. Code under test must be in its own assembly definition that the test assembly references. If the code is still in `Assembly-CSharp`, tell the user; don't move game code into a new assembly on your own, because that changes compilation for the whole project.

## Writing tests

- Use NUnit `[Test]` by default. Use `[UnityTest]` (returns `IEnumerator`) only when the test must skip frames (`yield return null`), wait (`WaitForFixedUpdate`, `WaitForSeconds`) or, in Edit Mode, yield editor instructions such as `EnterPlayMode`.
- `async Task` tests with `[Test]` need Test Framework 1.3 or later. In them, failing log messages are reported only after the test completes.
- Use `[UnitySetUp]`/`[UnityTearDown]` (returning `IEnumerator`) when setup or cleanup must yield.
- A test fails when Unity logs an error, assert or exception that the test did not expect. Call `LogAssert.Expect(LogType.Error, "message")` before the code that logs it. Never set `LogAssert.ignoreFailingMessages = true` to make a failing test pass.
- Destroy every GameObject a test creates, in teardown, so tests don't affect each other.
- Name tests `Method_Condition_ExpectedResult`, unless the project uses another pattern.
- For input tests, follow `.claude/uda/rules/libraries/input-system.md`.

## Running tests

- Command line: `-runTests -batchmode -projectPath <project> -testPlatform EditMode|PlayMode -testResults <file.xml>`. Narrow the run with `-testFilter`, `-testCategory` or `-assemblyNames`. Without `-testPlatform`, Edit Mode tests run.
- Read the results from the NUnit XML file. The Test Framework manual says there is no common definition of exit codes for test runs, so don't judge a run by its exit code alone.
- Report what you ran and the result counts. If you could not run the tests, say "not run"; never report tests as passing that you did not run.
