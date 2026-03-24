---
name: cluster-9
description: "Skill for the Cluster_9 area of .closeclaw. 5 symbols across 1 files."
---

# Cluster_9

5 symbols | 1 files | Cohesion: 89%

## When to Use

- Working with code in `src/`
- Understanding how formatMessages, findChannelForJid, buildAgentPrompt work
- Modifying cluster_9-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/router.ts` | formatMessages, findChannelForJid, buildAgentPrompt, processGroupMessages, sendMessage |

## Entry Points

Start here when exploring this area:

- **`formatMessages`** (Function) — `src/router.ts:29`
- **`findChannelForJid`** (Function) — `src/router.ts:50`
- **`buildAgentPrompt`** (Function) — `src/router.ts:73`
- **`processGroupMessages`** (Function) — `src/router.ts:90`
- **`sendMessage`** (Function) — `src/router.ts:152`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `formatMessages` | Function | `src/router.ts` | 29 |
| `findChannelForJid` | Function | `src/router.ts` | 50 |
| `buildAgentPrompt` | Function | `src/router.ts` | 73 |
| `processGroupMessages` | Function | `src/router.ts` | 90 |
| `sendMessage` | Function | `src/router.ts` | 152 |

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
2. `gitnexus_query({query: "cluster_9"})` — find related execution flows
3. Read key files listed above for implementation details
