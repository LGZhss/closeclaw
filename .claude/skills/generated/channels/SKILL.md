---
name: channels
description: "Skill for the Channels area of .closeclaw. 29 symbols across 8 files."
---

# Channels

29 symbols | 8 files | Cohesion: 75%

## When to Use

- Working with code in `src/`
- Understanding how routeOutbound, routeOutbound, routeOutbound work
- Modifying channels-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/channels/telegram.ts` | isConnected, ownsJid, disconnect, connect, sendMessage (+9) |
| `worktrees/proposal-013-vote/src/index.ts` | initializeMainGroup, main, shutdown, buildChannelOpts, connectChannels (+2) |
| `worktrees/proposal-011/src/index.ts` | shutdown, buildChannelOpts, connectChannels |
| `src/router.ts` | routeOutbound |
| `worktrees/proposal-020-phase0/src/router.ts` | routeOutbound |
| `worktrees/proposal-013-vote/src/router.ts` | routeOutbound |
| `worktrees/proposal-011/src/router.ts` | routeOutbound |
| `src/index.ts` | shutdown |

## Entry Points

Start here when exploring this area:

- **`routeOutbound`** (Function) — `src/router.ts:178`
- **`routeOutbound`** (Function) — `worktrees/proposal-020-phase0/src/router.ts:184`
- **`routeOutbound`** (Function) — `worktrees/proposal-013-vote/src/router.ts:173`
- **`routeOutbound`** (Function) — `worktrees/proposal-011/src/router.ts:168`
- **`telegramFactory`** (Function) — `src/channels/telegram.ts:263`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `TelegramChannel` | Class | `src/channels/telegram.ts` | 30 |
| `routeOutbound` | Function | `src/router.ts` | 178 |
| `routeOutbound` | Function | `worktrees/proposal-020-phase0/src/router.ts` | 184 |
| `routeOutbound` | Function | `worktrees/proposal-013-vote/src/router.ts` | 173 |
| `routeOutbound` | Function | `worktrees/proposal-011/src/router.ts` | 168 |
| `telegramFactory` | Function | `src/channels/telegram.ts` | 263 |
| `isConnected` | Method | `src/channels/telegram.ts` | 77 |
| `ownsJid` | Method | `src/channels/telegram.ts` | 81 |
| `disconnect` | Method | `src/channels/telegram.ts` | 67 |
| `connect` | Method | `src/channels/telegram.ts` | 45 |
| `sendMessage` | Method | `src/channels/telegram.ts` | 85 |
| `extractChatId` | Method | `src/channels/telegram.ts` | 198 |
| `splitMessage` | Method | `src/channels/telegram.ts` | 206 |
| `startPolling` | Method | `src/channels/telegram.ts` | 140 |
| `poll` | Method | `src/channels/telegram.ts` | 146 |
| `handleUpdate` | Method | `src/channels/telegram.ts` | 168 |
| `formatUserName` | Method | `src/channels/telegram.ts` | 191 |
| `callAPI` | Method | `src/channels/telegram.ts` | 234 |
| `shutdown` | Function | `src/index.ts` | 292 |
| `initializeMainGroup` | Function | `worktrees/proposal-013-vote/src/index.ts` | 226 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → FormatUserName` | cross_community | 7 |
| `Main → FormatUserName` | cross_community | 7 |
| `Main → FormatUserName` | cross_community | 7 |
| `Main → FormatUserName` | cross_community | 7 |
| `Main → CallAPI` | cross_community | 6 |
| `Main → CallAPI` | cross_community | 6 |
| `Main → CallAPI` | cross_community | 6 |
| `Main → CallAPI` | cross_community | 6 |
| `Main → ExtractChatId` | cross_community | 5 |
| `Main → SplitMessage` | cross_community | 5 |

## How to Explore

1. `gitnexus_context({name: "routeOutbound"})` — see callers and callees
2. `gitnexus_query({query: "channels"})` — find related execution flows
3. Read key files listed above for implementation details
