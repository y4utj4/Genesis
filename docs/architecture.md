# Architecture

SideStage uses a pnpm monorepo with a device-plugin architecture.

- core: device-agnostic domain types and rules
- ms3: Boss MS-3 parsing, serialization, and device behavior
- midi: MIDI domain and protocol utilities
- project: SideStage project and show data
- ui: reusable presentation components
- desktop: application shell and orchestration

Core must not depend on a specific hardware device. Unknown device data must survive import/save cycles.
