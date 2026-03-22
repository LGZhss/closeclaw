---
name: cluster-76
description: "Skill for the Cluster_76 area of .closeclaw. 5 symbols across 1 files."
---

# Cluster_76

5 symbols | 1 files | Cohesion: 89%

## When to Use

- Working with code in `worktrees/`
- Understanding how formatMessages, findChannelForJid, buildAgentPrompt work
- Modifying cluster_76-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `worktrees/proposal-020-phase0/src/router.ts` | formatMessages, findChannelForJid, buildAgentPrompt, processGroupMessages, sendMessage |

## Entry Points

Start here when exploring this area:

- **`formatMessages`** (Function) — `worktrees/proposal-020-phase0/src/router.ts:35`
- **`findChannelForJid`** (Function) — `worktrees/proposal-020-phase0/src/router.ts:56`
- **`buildAgentPrompt`** (Function) — `worktrees/proposal-020-phase0/src/router.ts:79`
- **`processGroupMessages`** (Function) — `worktrees/proposal-020-phase0/src/router.ts:96`
- **`sendMessage`** (Function) — `worktrees/proposal-020-phase0/src/router.ts:158`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `formatMessages` | Function | `worktrees/proposal-020-phase0/src/router.ts` | 35 |
| `findChannelForJid` | Function | `worktrees/proposal-020-phase0/src/router.ts` | 56 |
| `buildAgentPrompt` | Function | `worktrees/proposal-020-phase0/src/router.ts` | 79 |
| `processGroupMessages` | Function | `worktrees/proposal-020-phase0/src/router.ts` | 96 |
| `sendMessage` | Function | `worktrees/proposal-020-phase0/src/router.ts` | 158 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `ProcessGroupMessages → OwnsJid` | cross_community | 3 |
| `ProcessGroupMessages → FormatMessages` | intra_community | 3 |
| `SendMessage → OwnsJid` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Channels | 1 calls |

## How to Explore

1. `gitnexus_context({name: "formatMessages"})` — see callers and callees
2. `gitnexus_query({query: "cluster_76"})` — find related execution flows
3. Read key files listed above for implementation details
