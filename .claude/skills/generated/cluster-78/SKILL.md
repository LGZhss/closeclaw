---
name: cluster-78
description: "Skill for the Cluster_78 area of .closeclaw. 7 symbols across 1 files."
---

# Cluster_78

7 symbols | 1 files | Cohesion: 80%

## When to Use

- Working with code in `worktrees/`
- Understanding how buildChannelOpts, connectChannels, processGroup work
- Modifying cluster_78-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `worktrees/proposal-020-phase0/src/index.ts` | buildChannelOpts, connectChannels, processGroup, startMessageLoop, initializeMainGroup (+2) |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `buildChannelOpts` | Function | `worktrees/proposal-020-phase0/src/index.ts` | 60 |
| `connectChannels` | Function | `worktrees/proposal-020-phase0/src/index.ts` | 75 |
| `processGroup` | Function | `worktrees/proposal-020-phase0/src/index.ts` | 113 |
| `startMessageLoop` | Function | `worktrees/proposal-020-phase0/src/index.ts` | 145 |
| `initializeMainGroup` | Function | `worktrees/proposal-020-phase0/src/index.ts` | 208 |
| `main` | Function | `worktrees/proposal-020-phase0/src/index.ts` | 234 |
| `shutdown` | Function | `worktrees/proposal-020-phase0/src/index.ts` | 258 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → FormatUserName` | cross_community | 7 |
| `Main → CallAPI` | cross_community | 6 |
| `Main → ExtractChatId` | cross_community | 5 |
| `Main → SplitMessage` | cross_community | 5 |
| `Main → BuildChannelOpts` | intra_community | 3 |
| `Main → Disconnect` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Channels | 3 calls |

## How to Explore

1. `gitnexus_context({name: "buildChannelOpts"})` — see callers and callees
2. `gitnexus_query({query: "cluster_78"})` — find related execution flows
3. Read key files listed above for implementation details
