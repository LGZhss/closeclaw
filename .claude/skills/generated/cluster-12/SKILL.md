---
name: cluster-12
description: "Skill for the Cluster_12 area of .closeclaw. 5 symbols across 1 files."
---

# Cluster_12

5 symbols | 1 files | Cohesion: 73%

## When to Use

- Working with code in `src/`
- Understanding how buildChannelOpts, connectChannels, startMessageLoop work
- Modifying cluster_12-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/index.ts` | buildChannelOpts, connectChannels, startMessageLoop, initializeMainGroup, main |

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `buildChannelOpts` | Function | `src/index.ts` | 66 |
| `connectChannels` | Function | `src/index.ts` | 81 |
| `startMessageLoop` | Function | `src/index.ts` | 165 |
| `initializeMainGroup` | Function | `src/index.ts` | 242 |
| `main` | Function | `src/index.ts` | 268 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → FormatUserName` | cross_community | 7 |
| `Main → CallAPI` | cross_community | 6 |
| `Main → GetAdapter` | cross_community | 5 |
| `Main → ExtractChatId` | cross_community | 5 |
| `Main → SplitMessage` | cross_community | 5 |
| `Main → SandboxRunner` | cross_community | 4 |
| `Main → Close` | cross_community | 4 |
| `Main → BuildChannelOpts` | intra_community | 3 |
| `Main → Disconnect` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Channels | 2 calls |
| Agent | 1 calls |

## How to Explore

1. `gitnexus_context({name: "buildChannelOpts"})` — see callers and callees
2. `gitnexus_query({query: "cluster_12"})` — find related execution flows
3. Read key files listed above for implementation details
