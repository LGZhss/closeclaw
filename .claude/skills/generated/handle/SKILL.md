---
name: handle
description: "Skill for the Handle area of .closeclaw. 16 symbols across 4 files."
---

# Handle

16 symbols | 4 files | Cohesion: 100%

## When to Use

- Working with code in `worktrees/`
- Understanding how handleSpecialCase, handleUserRequest, handleVotingDeadlock work
- Modifying handle-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/core/arbitrator.js` | handleSpecialCase, handleUserRequest, handleVotingDeadlock, handleEmergency |
| `worktrees/proposal-020-phase0/src/core/arbitrator.js` | handleSpecialCase, handleUserRequest, handleVotingDeadlock, handleEmergency |
| `worktrees/proposal-013-vote/src/core/arbitrator.js` | handleSpecialCase, handleUserRequest, handleVotingDeadlock, handleEmergency |
| `worktrees/proposal-011/src/core/arbitrator.js` | handleSpecialCase, handleUserRequest, handleVotingDeadlock, handleEmergency |

## Entry Points

Start here when exploring this area:

- **`handleSpecialCase`** (Method) — `src/core/arbitrator.js:124`
- **`handleUserRequest`** (Method) — `src/core/arbitrator.js:145`
- **`handleVotingDeadlock`** (Method) — `src/core/arbitrator.js:167`
- **`handleEmergency`** (Method) — `src/core/arbitrator.js:188`
- **`handleSpecialCase`** (Method) — `worktrees/proposal-020-phase0/src/core/arbitrator.js:124`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `handleSpecialCase` | Method | `src/core/arbitrator.js` | 124 |
| `handleUserRequest` | Method | `src/core/arbitrator.js` | 145 |
| `handleVotingDeadlock` | Method | `src/core/arbitrator.js` | 167 |
| `handleEmergency` | Method | `src/core/arbitrator.js` | 188 |
| `handleSpecialCase` | Method | `worktrees/proposal-020-phase0/src/core/arbitrator.js` | 124 |
| `handleUserRequest` | Method | `worktrees/proposal-020-phase0/src/core/arbitrator.js` | 145 |
| `handleVotingDeadlock` | Method | `worktrees/proposal-020-phase0/src/core/arbitrator.js` | 167 |
| `handleEmergency` | Method | `worktrees/proposal-020-phase0/src/core/arbitrator.js` | 188 |
| `handleSpecialCase` | Method | `worktrees/proposal-013-vote/src/core/arbitrator.js` | 124 |
| `handleUserRequest` | Method | `worktrees/proposal-013-vote/src/core/arbitrator.js` | 145 |
| `handleVotingDeadlock` | Method | `worktrees/proposal-013-vote/src/core/arbitrator.js` | 167 |
| `handleEmergency` | Method | `worktrees/proposal-013-vote/src/core/arbitrator.js` | 188 |
| `handleSpecialCase` | Method | `worktrees/proposal-011/src/core/arbitrator.js` | 124 |
| `handleUserRequest` | Method | `worktrees/proposal-011/src/core/arbitrator.js` | 145 |
| `handleVotingDeadlock` | Method | `worktrees/proposal-011/src/core/arbitrator.js` | 167 |
| `handleEmergency` | Method | `worktrees/proposal-011/src/core/arbitrator.js` | 188 |

## How to Explore

1. `gitnexus_context({name: "handleSpecialCase"})` — see callers and callees
2. `gitnexus_query({query: "handle"})` — find related execution flows
3. Read key files listed above for implementation details
