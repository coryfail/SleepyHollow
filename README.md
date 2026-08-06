# SleepyHollow
Agent-native headless API framework for Deno that turns application ideas into reviewed, test-driven, production-ready APIs.

## Contributing

Development follows a feature-branch workflow with `main` reserved for
production releases. See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming,
release, and hotfix procedures.

## Product requirements

SleepyHollow develops itself using the same agentic-first process it provides to
generated applications. The approved application specification lives at
[requirements/application.md](requirements/application.md), and decomposed
requirements are colocated with their future tests and implementation under the
concrete [`cli/`](cli/), [`core/`](core/), and [`skill/`](skill/) components. See
[requirements/README.md](requirements/README.md) for the lifecycle and complete
structure.
