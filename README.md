# Sleepy Hollow

Sleepy Hollow is an agentic-first headless API framework for Deno that is in
development. It is designed to turn application ideas into reviewed
requirements, test-driven implementation, independently checked code, and
deployable APIs.

## SGAD methodology

Sleepy Hollow is a reference implementation of
[Specification-Governed Agentic Development](docs/sgad/README.md): a
framework-independent methodology in which specifications authorize work,
agents implement approved behavior, and independently checkable evidence governs
completion.

Developers can apply SGAD outside the Sleepy Hollow framework with the standalone
[SGAD workflow skill](skills/sgad-workflow/SKILL.md). It is separate from the
framework-specific Sleepy Hollow application skill and contains no Sleepy Hollow
runtime or CLI workflow.

## Contributing

Development follows a feature-branch workflow with `main` reserved for
production releases. See [CONTRIBUTING.md](CONTRIBUTING.md) for branch naming,
release, and hotfix procedures.

## Product requirements

Sleepy Hollow develops itself using the same agentic-first process it provides
to generated applications. The application specification lives at
[requirements/application.md](requirements/application.md), and decomposed
requirements are colocated with their future tests and implementation under the
concrete [`cli/`](cli/), [`core/`](core/), and
[`skills/sleepy-hollow/`](skills/sleepy-hollow/) components. Durable behavior
that spans the repository is governed by the root
[requirements.md](requirements.md).
