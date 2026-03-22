---
name: cluster-85
description: "Skill for the Cluster_85 area of .closeclaw. 8 symbols across 1 files."
---

# Cluster_85

8 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `worktrees/`
- Understanding how writeMessage, readMessage, getPendingMessages work
- Modifying cluster_85-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `worktrees/proposal-013-vote/src/ipc.ts` | ensureIpcDirs, writeMessage, readMessage, getPendingMessages, writeTaskResult (+3) |

## Entry Points

Start here when exploring this area:

- **`writeMessage`** (Function) — `worktrees/proposal-013-vote/src/ipc.ts:45`
- **`readMessage`** (Function) — `worktrees/proposal-013-vote/src/ipc.ts:55`
- **`getPendingMessages`** (Function) — `worktrees/proposal-013-vote/src/ipc.ts:79`
- **`writeTaskResult`** (Function) — `worktrees/proposal-013-vote/src/ipc.ts:107`
- **`readTaskResult`** (Function) — `worktrees/proposal-013-vote/src/ipc.ts:129`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `writeMessage` | Function | `worktrees/proposal-013-vote/src/ipc.ts` | 45 |
| `readMessage` | Function | `worktrees/proposal-013-vote/src/ipc.ts` | 55 |
| `getPendingMessages` | Function | `worktrees/proposal-013-vote/src/ipc.ts` | 79 |
| `writeTaskResult` | Function | `worktrees/proposal-013-vote/src/ipc.ts` | 107 |
| `readTaskResult` | Function | `worktrees/proposal-013-vote/src/ipc.ts` | 129 |
| `watchIPC` | Function | `worktrees/proposal-013-vote/src/ipc.ts` | 153 |
| `pollIPC` | Function | `worktrees/proposal-013-vote/src/ipc.ts` | 196 |
| `ensureIpcDirs` | Function | `worktrees/proposal-013-vote/src/ipc.ts` | 37 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PollIPC → EnsureIpcDirs` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "writeMessage"})` — see callers and callees
2. `gitnexus_query({query: "cluster_85"})` — find related execution flows
3. Read key files listed above for implementation details
