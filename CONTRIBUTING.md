# Contributing to Sleepy Hollow

## Branches

The repository uses the following long-lived branches:

- `main` contains the current release-ready repository state. Releases are
  tagged from this branch when the product reaches a releasable milestone.
- `development` integrates completed work for the next release.

Short-lived branches use these naming conventions:

- `feature/<description>` for features, fixes, and routine development work.
- `release/<version>` for optional release stabilization, such as
  `release/1.5.0`.
- `hotfix/<version>-<description>` for urgent production fixes, such as
  `hotfix/1.4.1-login`.

Use lowercase, hyphen-separated descriptions in branch names.

## Feature workflow

Create feature branches from an up-to-date `development` branch:

```sh
git switch development
git pull --ff-only origin development
git switch -c feature/short-description
```

Keep each branch focused on one change. Open a pull request into `development`
after tests and other automated checks pass. Merge approved pull requests using
a squash merge, then delete the feature branch.

## Releasing

For a small release that does not require a stabilization period, open a pull
request from `development` directly into `main`. After it is approved and all
checks pass, merge it, deploy `main`, and create a semantic version tag:

```sh
git switch main
git pull --ff-only origin main
git tag -a v1.5.0 -m "Release v1.5.0"
git push origin v1.5.0
```

Use a release branch when final testing must happen while new development
continues:

```sh
git switch development
git pull --ff-only origin development
git switch -c release/1.5.0
```

Only stabilization changes belong on a release branch. When it is ready, merge
it into `main`, tag the release, and merge it back into `development` so every
release fix is retained. Delete the release branch afterward.

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
patch release. Then merge the hotfix into `development` so the correction is
included in future releases. Delete the hotfix branch afterward.

## Pull request policy

Configure `main` and `development` as protected branches in the Git host:

- Disallow direct pushes and force pushes.
- Require pull requests and at least one approval.
- Require tests, linting, and build checks to pass.
- Require branches to be current before merging.
- Automatically delete merged short-lived branches.

Do not commit secrets, generated build output, or unrelated changes. Write
commit and pull request messages that explain the intent of the change.
