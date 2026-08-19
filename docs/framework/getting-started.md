# Getting started

Sleepy Hollow supports Node.js 24+ and Bun. Install the framework from npm:

```bash
npm install -g @sleepy-hollow/framework
hollow create my-api
cd my-api
npm install
npm run verify
```

Use `bun add @sleepy-hollow/framework` and `bunx hollow` for the equivalent
Bun workflow. A generated project uses Vitest and TypeScript, and begins with
an application requirement at `requirements/application.req.md`.

## Use with an agent

Install the official Sleepy Hollow skill when you want an agent to plan
requirements, write criterion-mapped tests, and collect verification evidence:

```bash
npx skills add coryfail/SleepyHollow --skill sleepy-hollow
```

The skill is optional. The framework and its verification commands work the
same way when you write the requirements and tests yourself.

## Create and verify

Add routes under `api/`, run `npm run test`, then use `hollow check` to verify
the captured evidence before deployment. Read [Verification](verification.md)
for what that evidence means.
