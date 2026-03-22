---
name: setup
description: "Skill for the Setup area of .closeclaw. 36 symbols across 4 files."
---

# Setup

36 symbols | 4 files | Cohesion: 100%

## When to Use

- Working with code in `worktrees/`
- Understanding how checkCommand, checkEnvironment, setupEnvFile work
- Modifying setup-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `setup/index.ts` | checkCommand, checkEnvironment, setupEnvFile, installDependencies, buildContainer (+4) |
| `worktrees/proposal-020-phase0/setup/index.ts` | checkCommand, checkEnvironment, setupEnvFile, installDependencies, buildContainer (+4) |
| `worktrees/proposal-013-vote/setup/index.ts` | checkCommand, checkEnvironment, setupEnvFile, installDependencies, buildContainer (+4) |
| `worktrees/proposal-011/setup/index.ts` | checkCommand, checkEnvironment, setupEnvFile, installDependencies, buildContainer (+4) |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `checkCommand` | Function | `setup/index.ts` | 32 |
| `checkEnvironment` | Function | `setup/index.ts` | 44 |
| `setupEnvFile` | Function | `setup/index.ts` | 76 |
| `installDependencies` | Function | `setup/index.ts` | 100 |
| `buildContainer` | Function | `setup/index.ts` | 119 |
| `createDirectories` | Function | `setup/index.ts` | 147 |
| `createContextMdFiles` | Function | `setup/index.ts` | 176 |
| `displayNextSteps` | Function | `setup/index.ts` | 214 |
| `main` | Function | `setup/index.ts` | 239 |
| `checkCommand` | Function | `worktrees/proposal-020-phase0/setup/index.ts` | 32 |
| `checkEnvironment` | Function | `worktrees/proposal-020-phase0/setup/index.ts` | 44 |
| `setupEnvFile` | Function | `worktrees/proposal-020-phase0/setup/index.ts` | 76 |
| `installDependencies` | Function | `worktrees/proposal-020-phase0/setup/index.ts` | 100 |
| `buildContainer` | Function | `worktrees/proposal-020-phase0/setup/index.ts` | 119 |
| `createDirectories` | Function | `worktrees/proposal-020-phase0/setup/index.ts` | 147 |
| `createContextMdFiles` | Function | `worktrees/proposal-020-phase0/setup/index.ts` | 176 |
| `displayNextSteps` | Function | `worktrees/proposal-020-phase0/setup/index.ts` | 214 |
| `main` | Function | `worktrees/proposal-020-phase0/setup/index.ts` | 239 |
| `checkCommand` | Function | `worktrees/proposal-013-vote/setup/index.ts` | 32 |
| `checkEnvironment` | Function | `worktrees/proposal-013-vote/setup/index.ts` | 44 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → CheckCommand` | intra_community | 3 |
| `Main → CheckCommand` | intra_community | 3 |
| `Main → CheckCommand` | intra_community | 3 |
| `Main → CheckCommand` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "checkCommand"})` — see callers and callees
2. `gitnexus_query({query: "setup"})` — find related execution flows
3. Read key files listed above for implementation details
