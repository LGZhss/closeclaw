---
name: tests
description: "Skill for the Tests area of .closeclaw. 5 symbols across 3 files."
---

# Tests

5 symbols | 3 files | Cohesion: 71%

## When to Use

- Working with code in `src/`
- Understanding how registerAdapter, getAdapter, execute work
- Modifying tests-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `tests/phase-1-demo.ts` | DemoLLMAdapter, demo |
| `src/adapters/registry.ts` | registerAdapter, getAdapter |
| `src/agent/sandbox-runner.ts` | execute |

## Entry Points

Start here when exploring this area:

- **`registerAdapter`** (Function) — `src/adapters/registry.ts:17`
- **`getAdapter`** (Function) — `src/adapters/registry.ts:26`
- **`execute`** (Method) — `src/agent/sandbox-runner.ts:15`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `registerAdapter` | Function | `src/adapters/registry.ts` | 17 |
| `getAdapter` | Function | `src/adapters/registry.ts` | 26 |
| `execute` | Method | `src/agent/sandbox-runner.ts` | 15 |
| `DemoLLMAdapter` | Class | `tests/phase-1-demo.ts` | 11 |
| `demo` | Function | `tests/phase-1-demo.ts` | 27 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → GetAdapter` | cross_community | 5 |
| `ExecuteScheduledTask → GetAdapter` | cross_community | 3 |

## Connected Areas

| Area | Connections |
|------|-------------|
| Agent | 2 calls |

## How to Explore

1. `gitnexus_context({name: "registerAdapter"})` — see callers and callees
2. `gitnexus_query({query: "tests"})` — find related execution flows
3. Read key files listed above for implementation details
