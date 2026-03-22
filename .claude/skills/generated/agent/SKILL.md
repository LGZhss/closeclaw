---
name: agent
description: "Skill for the Agent area of .closeclaw. 5 symbols across 3 files."
---

# Agent

5 symbols | 3 files | Cohesion: 63%

## When to Use

- Working with code in `src/`
- Understanding how SandboxRunner, close, AgentRunner work
- Modifying agent-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `src/index.ts` | processGroup, executeScheduledTask |
| `src/agent/sandbox-runner.ts` | SandboxRunner, close |
| `src/agent/runner.ts` | AgentRunner |

## Entry Points

Start here when exploring this area:

- **`SandboxRunner`** (Class) — `src/agent/sandbox-runner.ts:8`
- **`close`** (Method) — `src/agent/sandbox-runner.ts:44`
- **`AgentRunner`** (Interface) — `src/agent/runner.ts:20`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `SandboxRunner` | Class | `src/agent/sandbox-runner.ts` | 8 |
| `AgentRunner` | Interface | `src/agent/runner.ts` | 20 |
| `close` | Method | `src/agent/sandbox-runner.ts` | 44 |
| `processGroup` | Function | `src/index.ts` | 119 |
| `executeScheduledTask` | Function | `src/index.ts` | 211 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → GetAdapter` | cross_community | 5 |
| `Main → ExtractChatId` | cross_community | 5 |
| `Main → SplitMessage` | cross_community | 5 |
| `Main → SandboxRunner` | cross_community | 4 |
| `Main → Close` | cross_community | 4 |
| `ExecuteScheduledTask → GetAdapter` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Tests | 2 calls |
| Channels | 1 calls |

## How to Explore

1. `gitnexus_context({name: "SandboxRunner"})` — see callers and callees
2. `gitnexus_query({query: "agent"})` — find related execution flows
3. Read key files listed above for implementation details
