# Contributing to Sleepy Hollow

## Branches

The repository uses the following long-lived branch:

- `main` contains the current repository state. Feature work is integrated into
  this branch through pull requests, and releases are tagged from it when the
  product reaches a releasable milestone.

Short-lived branches use these naming conventions:

- `feature/<description>` for features, fixes, and routine development work.
- `release/<version>` for optional release stabilization, such as
  `release/1.5.0`.
- `hotfix/<version>-<description>` for urgent production fixes, such as
  `hotfix/1.4.1-login`.

Use lowercase, hyphen-separated descriptions in branch names.

## One-time setup

Enable the repository's hooks:

```sh
git config core.hooksPath .githooks
```

The pre-commit hook rejects a commit whose staged `*.req.md` file no longer
matches the approval recorded inside it. An exact-content approval authorizes
exact bytes, so a change as small as a rewrapped paragraph detaches an
`approved` or `verified` requirement from the content it claims to authorize.
That has happened, caused by a formatting command run over a directory.
The project keeps requirement Markdown separate from source formatting to
prevent that specific cause; the hook is cause-independent and catches any edit.

Run the same check by hand at any time:

```sh
npm run check
```

Drafts are exempt, because a draft is expected to change before it is approved.

## Feature workflow

Create feature branches from an up-to-date `main` branch:

```sh
git switch main
git pull --ff-only origin main
git switch -c feature/short-description
```

Keep each branch focused on one change. Open a pull request into `main`
after tests and other automated checks pass. Merge approved pull requests using
a squash merge, then delete the feature branch.

## Releasing

For a small release that does not require a stabilization period, merge its
approved feature pull requests into `main`. After all release checks pass,
deploy `main` and create a semantic version tag:

```sh
git switch main
git pull --ff-only origin main
git tag -a v1.5.0 -m "Release v1.5.0"
git push origin v1.5.0
```

Use a release branch when final testing must happen while new development
continues:

```sh
git switch main
git pull --ff-only origin main
git switch -c release/1.5.0
```

Only stabilization changes belong on a release branch. When it is ready, merge
it into `main` and tag the release. Delete the release branch afterward.

Follow semantic versioning when selecting a release number:

- Increment `MAJOR` for incompatible changes.
- Increment `MINOR` for backward-compatible functionality.
- Increment `PATCH` for backward-compatible fixes.

## Hotfix workflow

Create urgent production fixes from an up-to-date `main` branch:

```sh
git switch main
git pull --ff-only origin main
git switch -c hotfix/1.5.1-short-description
```

Keep the correction as small as practical and add a regression test when
possible. Open a pull request into `main`, deploy the merged result, and tag the
patch release. Delete the hotfix branch afterward.

## Pull request policy

Configure `main` as a protected branch in the Git host:

- Disallow direct pushes and force pushes.
- Require pull requests and at least one approval.
- Require tests, linting, and build checks to pass.
- Require branches to be current before merging.
- Automatically delete merged short-lived branches.

Do not commit secrets, generated build output, or unrelated changes. Write
commit and pull request messages that explain the intent of the change.
