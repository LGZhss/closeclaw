---
name: tools
description: "Skill for the Tools area of .closeclaw. 66 symbols across 19 files."
---

# Tools

66 symbols | 19 files | Cohesion: 93%

## When to Use

- Working with code in `worktrees/`
- Understanding how findToolByAlias, findToolByName, findToolByAlias work
- Modifying tools-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/tools/toolRegistry.js` | executeByCommand, executeByName, getToolsForLLM, isNoContextCommand, _parseArgsToObject (+4) |
| `worktrees/proposal-020-phase0/src/tools/toolRegistry.js` | executeByCommand, executeByName, getToolsForLLM, isNoContextCommand, _parseArgsToObject (+4) |
| `worktrees/proposal-013-vote/src/tools/toolRegistry.js` | executeByCommand, executeByName, getToolsForLLM, isNoContextCommand, _parseArgsToObject (+4) |
| `worktrees/proposal-011/src/tools/toolRegistry.js` | executeByCommand, executeByName, getToolsForLLM, isNoContextCommand, _parseArgsToObject (+4) |
| `src/tools/toolDefinitions.js` | findToolByAlias, findToolByName |
| `src/core/session.js` | init, appendModelMessage |
| `src/core/dispatcher.js` | ensureInitialized, dispatch |
| `worktrees/proposal-020-phase0/src/tools/toolDefinitions.js` | findToolByAlias, findToolByName |
| `worktrees/proposal-020-phase0/src/core/session.js` | init, appendModelMessage |
| `worktrees/proposal-020-phase0/src/core/dispatcher.js` | ensureInitialized, dispatch |

## Entry Points

Start here when exploring this area:

- **`findToolByAlias`** (Function) — `src/tools/toolDefinitions.js:301`
- **`findToolByName`** (Function) — `src/tools/toolDefinitions.js:313`
- **`findToolByAlias`** (Function) — `worktrees/proposal-020-phase0/src/tools/toolDefinitions.js:301`
- **`findToolByName`** (Function) — `worktrees/proposal-020-phase0/src/tools/toolDefinitions.js:313`
- **`findToolByAlias`** (Function) — `worktrees/proposal-013-vote/src/tools/toolDefinitions.js:301`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `findToolByAlias` | Function | `src/tools/toolDefinitions.js` | 301 |
| `findToolByName` | Function | `src/tools/toolDefinitions.js` | 313 |
| `findToolByAlias` | Function | `worktrees/proposal-020-phase0/src/tools/toolDefinitions.js` | 301 |
| `findToolByName` | Function | `worktrees/proposal-020-phase0/src/tools/toolDefinitions.js` | 313 |
| `findToolByAlias` | Function | `worktrees/proposal-013-vote/src/tools/toolDefinitions.js` | 301 |
| `findToolByName` | Function | `worktrees/proposal-013-vote/src/tools/toolDefinitions.js` | 313 |
| `findToolByAlias` | Function | `worktrees/proposal-011/src/tools/toolDefinitions.js` | 301 |
| `findToolByName` | Function | `worktrees/proposal-011/src/tools/toolDefinitions.js` | 313 |
| `cliAnything` | Function | `worktrees/proposal-020-phase0/src/tools/cliAnything.js` | 19 |
| `cliAnything` | Function | `worktrees/proposal-013-vote/src/tools/cliAnything.js` | 19 |
| `cliAnything` | Function | `worktrees/proposal-011/src/tools/cliAnything.js` | 19 |
| `executeByCommand` | Method | `src/tools/toolRegistry.js` | 74 |
| `executeByName` | Method | `src/tools/toolRegistry.js` | 101 |
| `getToolsForLLM` | Method | `src/tools/toolRegistry.js` | 126 |
| `isNoContextCommand` | Method | `src/tools/toolRegistry.js` | 133 |
| `_parseArgsToObject` | Method | `src/tools/toolRegistry.js` | 139 |
| `init` | Method | `src/core/session.js` | 9 |
| `appendModelMessage` | Method | `src/core/session.js` | 78 |
| `ensureInitialized` | Method | `src/core/dispatcher.js` | 14 |
| `dispatch` | Method | `src/core/dispatcher.js` | 27 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Dispatch → FindToolByName` | intra_community | 4 |
| `Dispatch → GetHistory` | cross_community | 4 |
| `Dispatch → _saveToDb` | cross_community | 4 |
| `Dispatch → FindToolByName` | intra_community | 4 |
| `Dispatch → GetHistory` | cross_community | 4 |
| `Dispatch → _saveToDb` | cross_community | 4 |
| `Dispatch → FindToolByName` | intra_community | 4 |
| `Dispatch → GetHistory` | cross_community | 4 |
| `Dispatch → _saveToDb` | cross_community | 4 |
| `Dispatch → FindToolByName` | intra_community | 4 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Append | 8 calls |
| Cluster_50 | 1 calls |
| Cluster_128 | 1 calls |
| Cluster_155 | 1 calls |
| Cluster_193 | 1 calls |

## How to Explore

1. `gitnexus_context({name: "findToolByAlias"})` — see callers and callees
2. `gitnexus_query({query: "tools"})` — find related execution flows
3. Read key files listed above for implementation details
