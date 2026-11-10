In this architecture a central manager is the entry point, game flow is a state machine, and modules talk through an event bus. These rules take precedence over general architecture advice.

### Rules

- One central manager class is the entry point. Game-wide services are reached through it; accessing it as a single instance is intended.
- Game flow (for example loading, menu, gameplay, win, fail) is a state machine. Change flow only by requesting a transition on it.
- Modules do not hold references to each other. A module publishes an event on the event bus; modules that care subscribe. Referencing the central manager and its services is not a module-to-module reference.
- The folders under `## Read-only paths` come from a shared template or SDK. Never edit files there. Extend in the project's own folders: new classes, subclasses, event subscribers. If a change seems to need a read-only file, stop and ask.
- Before adding a service, event or state, find how existing ones are declared and follow that pattern.

### Not a finding under this profile

- Accessing the central manager as a single instance.
- Reaching services through the manager instead of injecting them.
- Communicating through the event bus where a direct call would be shorter.
- Size or style of code inside read-only folders.

### A finding under this profile

- A direct reference between modules (field, `GetComponent`, `Find*`, static access) that bypasses the event bus.
- Any edit to a file in a folder under `## Read-only paths`.
- Changing game flow outside the state machine: loading scenes, switching screens or setting flow flags directly.
- An event bus subscription without a matching unsubscription.
- A second entry point or manager that duplicates the central manager's role.
