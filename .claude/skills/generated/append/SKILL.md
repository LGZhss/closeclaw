---
name: append
description: "Skill for the Append area of .closeclaw. 16 symbols across 4 files."
---

# Append

16 symbols | 4 files | Cohesion: 60%

## When to Use

- Working with code in `worktrees/`
- Understanding how appendHistoryItem, appendUserMessage, appendFunctionCall work
- Modifying append-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/core/session.js` | appendHistoryItem, appendUserMessage, appendFunctionCall, appendFunctionResponse |
| `worktrees/proposal-020-phase0/src/core/session.js` | appendHistoryItem, appendUserMessage, appendFunctionCall, appendFunctionResponse |
| `worktrees/proposal-013-vote/src/core/session.js` | appendHistoryItem, appendUserMessage, appendFunctionCall, appendFunctionResponse |
| `worktrees/proposal-011/src/core/session.js` | appendHistoryItem, appendUserMessage, appendFunctionCall, appendFunctionResponse |

## Entry Points

Start here when exploring this area:

- **`appendHistoryItem`** (Method) — `src/core/session.js:62`
- **`appendUserMessage`** (Method) — `src/core/session.js:71`
- **`appendFunctionCall`** (Method) — `src/core/session.js:85`
- **`appendFunctionResponse`** (Method) — `src/core/session.js:92`
- **`appendHistoryItem`** (Method) — `worktrees/proposal-020-phase0/src/core/session.js:62`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `appendHistoryItem` | Method | `src/core/session.js` | 62 |
| `appendUserMessage` | Method | `src/core/session.js` | 71 |
| `appendFunctionCall` | Method | `src/core/session.js` | 85 |
| `appendFunctionResponse` | Method | `src/core/session.js` | 92 |
| `appendHistoryItem` | Method | `worktrees/proposal-020-phase0/src/core/session.js` | 62 |
| `appendUserMessage` | Method | `worktrees/proposal-020-phase0/src/core/session.js` | 71 |
| `appendFunctionCall` | Method | `worktrees/proposal-020-phase0/src/core/session.js` | 85 |
| `appendFunctionResponse` | Method | `worktrees/proposal-020-phase0/src/core/session.js` | 92 |
| `appendHistoryItem` | Method | `worktrees/proposal-013-vote/src/core/session.js` | 62 |
| `appendUserMessage` | Method | `worktrees/proposal-013-vote/src/core/session.js` | 71 |
| `appendFunctionCall` | Method | `worktrees/proposal-013-vote/src/core/session.js` | 85 |
| `appendFunctionResponse` | Method | `worktrees/proposal-013-vote/src/core/session.js` | 92 |
| `appendHistoryItem` | Method | `worktrees/proposal-011/src/core/session.js` | 62 |
| `appendUserMessage` | Method | `worktrees/proposal-011/src/core/session.js` | 71 |
| `appendFunctionCall` | Method | `worktrees/proposal-011/src/core/session.js` | 85 |
| `appendFunctionResponse` | Method | `worktrees/proposal-011/src/core/session.js` | 92 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Dispatch → GetHistory` | cross_community | 4 |
| `Dispatch → _saveToDb` | cross_community | 4 |
| `Dispatch → GetHistory` | cross_community | 4 |
| `Dispatch → _saveToDb` | cross_community | 4 |
| `Dispatch → GetHistory` | cross_community | 4 |
| `Dispatch → _saveToDb` | cross_community | 4 |
| `Dispatch → GetHistory` | cross_community | 4 |
| `Dispatch → _saveToDb` | cross_community | 4 |
| `AppendFunctionCall → GetHistory` | cross_community | 3 |
| `AppendFunctionCall → _saveToDb` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Cluster_50 | 2 calls |
| Cluster_128 | 2 calls |
| Cluster_155 | 2 calls |
| Cluster_193 | 2 calls |

## How to Explore

1. `gitnexus_context({name: "appendHistoryItem"})` — see callers and callees
2. `gitnexus_query({query: "append"})` — find related execution flows
3. Read key files listed above for implementation details
