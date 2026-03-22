---
name: cluster-77
description: "Skill for the Cluster_77 area of .closeclaw. 5 symbols across 1 files."
---

# Cluster_77

5 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `worktrees/`
- Understanding how writeMessage, getPendingMessages, writeTaskResult work
- Modifying cluster_77-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `worktrees/proposal-020-phase0/src/ipc.ts` | ensureIpcDirs, writeMessage, getPendingMessages, writeTaskResult, pollIPC |

## Entry Points

Start here when exploring this area:

- **`writeMessage`** (Function) — `worktrees/proposal-020-phase0/src/ipc.ts:45`
- **`getPendingMessages`** (Function) — `worktrees/proposal-020-phase0/src/ipc.ts:79`
- **`writeTaskResult`** (Function) — `worktrees/proposal-020-phase0/src/ipc.ts:114`
- **`pollIPC`** (Function) — `worktrees/proposal-020-phase0/src/ipc.ts:164`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `writeMessage` | Function | `worktrees/proposal-020-phase0/src/ipc.ts` | 45 |
| `getPendingMessages` | Function | `worktrees/proposal-020-phase0/src/ipc.ts` | 79 |
| `writeTaskResult` | Function | `worktrees/proposal-020-phase0/src/ipc.ts` | 114 |
| `pollIPC` | Function | `worktrees/proposal-020-phase0/src/ipc.ts` | 164 |
| `ensureIpcDirs` | Function | `worktrees/proposal-020-phase0/src/ipc.ts` | 37 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PollIPC → EnsureIpcDirs` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "writeMessage"})` — see callers and callees
2. `gitnexus_query({query: "cluster_77"})` — find related execution flows
3. Read key files listed above for implementation details
