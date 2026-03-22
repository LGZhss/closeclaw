---
name: cluster-11
description: "Skill for the Cluster_11 area of .closeclaw. 6 symbols across 1 files."
---

# Cluster_11

6 symbols | 1 files | Cohesion: 100%

## When to Use

- Working with code in `src/`
- Understanding how writeMessage, getPendingMessages, writeTaskResult work
- Modifying cluster_11-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/ipc.ts` | ensureIpcDirs, writeMessage, getPendingMessages, writeTaskResult, watchIPC (+1) |

## Entry Points

Start here when exploring this area:

- **`writeMessage`** (Function) — `src/ipc.ts:44`
- **`getPendingMessages`** (Function) — `src/ipc.ts:78`
- **`writeTaskResult`** (Function) — `src/ipc.ts:113`
- **`watchIPC`** (Function) — `src/ipc.ts:168`
- **`pollIPC`** (Function) — `src/ipc.ts:185`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `writeMessage` | Function | `src/ipc.ts` | 44 |
| `getPendingMessages` | Function | `src/ipc.ts` | 78 |
| `writeTaskResult` | Function | `src/ipc.ts` | 113 |
| `watchIPC` | Function | `src/ipc.ts` | 168 |
| `pollIPC` | Function | `src/ipc.ts` | 185 |
| `ensureIpcDirs` | Function | `src/ipc.ts` | 36 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `PollIPC → EnsureIpcDirs` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "writeMessage"})` — see callers and callees
2. `gitnexus_query({query: "cluster_11"})` — find related execution flows
3. Read key files listed above for implementation details
