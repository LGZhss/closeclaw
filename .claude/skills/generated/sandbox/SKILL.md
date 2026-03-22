---
name: sandbox
description: "Skill for the Sandbox area of .closeclaw. 38 symbols across 9 files."
---

# Sandbox

38 symbols | 9 files | Cohesion: 100%

## When to Use

- Working with code in `worktrees/`
- Understanding how cliAnything, ProcessExecutor, ProcessExecutor work
- Modifying sandbox-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/sandbox/sandboxManager.js` | execute, executeCommand, _updateExecutionStatus, constructor, stopExecution |
| `worktrees/proposal-020-phase0/src/sandbox/sandboxManager.js` | execute, executeCommand, _updateExecutionStatus, constructor, stopExecution |
| `worktrees/proposal-013-vote/src/sandbox/sandboxManager.js` | execute, executeCommand, _updateExecutionStatus, constructor, stopExecution |
| `worktrees/proposal-011/src/sandbox/sandboxManager.js` | execute, executeCommand, _updateExecutionStatus, constructor, stopExecution |
| `src/sandbox/processExecutor.js` | ProcessExecutor, stop, executeCommand, _executeProcess |
| `worktrees/proposal-020-phase0/src/sandbox/processExecutor.js` | ProcessExecutor, stop, execute, executeCommand |
| `worktrees/proposal-013-vote/src/sandbox/processExecutor.js` | ProcessExecutor, stop, execute, executeCommand |
| `worktrees/proposal-011/src/sandbox/processExecutor.js` | ProcessExecutor, stop, execute, executeCommand |
| `src/tools/cliAnything.js` | cliAnything, executeCliAnything |

## Entry Points

Start here when exploring this area:

- **`cliAnything`** (Function) — `src/tools/cliAnything.js:16`
- **`ProcessExecutor`** (Class) — `src/sandbox/processExecutor.js:11`
- **`ProcessExecutor`** (Class) — `worktrees/proposal-020-phase0/src/sandbox/processExecutor.js:11`
- **`ProcessExecutor`** (Class) — `worktrees/proposal-013-vote/src/sandbox/processExecutor.js:11`
- **`ProcessExecutor`** (Class) — `worktrees/proposal-011/src/sandbox/processExecutor.js:9`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `ProcessExecutor` | Class | `src/sandbox/processExecutor.js` | 11 |
| `ProcessExecutor` | Class | `worktrees/proposal-020-phase0/src/sandbox/processExecutor.js` | 11 |
| `ProcessExecutor` | Class | `worktrees/proposal-013-vote/src/sandbox/processExecutor.js` | 11 |
| `ProcessExecutor` | Class | `worktrees/proposal-011/src/sandbox/processExecutor.js` | 9 |
| `cliAnything` | Function | `src/tools/cliAnything.js` | 16 |
| `execute` | Method | `src/sandbox/sandboxManager.js` | 30 |
| `executeCommand` | Method | `src/sandbox/sandboxManager.js` | 74 |
| `_updateExecutionStatus` | Method | `src/sandbox/sandboxManager.js` | 171 |
| `execute` | Method | `worktrees/proposal-020-phase0/src/sandbox/sandboxManager.js` | 30 |
| `executeCommand` | Method | `worktrees/proposal-020-phase0/src/sandbox/sandboxManager.js` | 74 |
| `_updateExecutionStatus` | Method | `worktrees/proposal-020-phase0/src/sandbox/sandboxManager.js` | 171 |
| `execute` | Method | `worktrees/proposal-013-vote/src/sandbox/sandboxManager.js` | 30 |
| `executeCommand` | Method | `worktrees/proposal-013-vote/src/sandbox/sandboxManager.js` | 74 |
| `_updateExecutionStatus` | Method | `worktrees/proposal-013-vote/src/sandbox/sandboxManager.js` | 171 |
| `execute` | Method | `worktrees/proposal-011/src/sandbox/sandboxManager.js` | 30 |
| `executeCommand` | Method | `worktrees/proposal-011/src/sandbox/sandboxManager.js` | 74 |
| `_updateExecutionStatus` | Method | `worktrees/proposal-011/src/sandbox/sandboxManager.js` | 171 |
| `constructor` | Method | `src/sandbox/sandboxManager.js` | 16 |
| `stopExecution` | Method | `src/sandbox/sandboxManager.js` | 102 |
| `stop` | Method | `src/sandbox/processExecutor.js` | 176 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `CliAnything → _updateExecutionStatus` | intra_community | 4 |

## How to Explore

1. `gitnexus_context({name: "cliAnything"})` — see callers and callees
2. `gitnexus_query({query: "sandbox"})` — find related execution flows
3. Read key files listed above for implementation details
