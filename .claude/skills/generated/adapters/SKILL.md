---
name: adapters
description: "Skill for the Adapters area of .closeclaw. 94 symbols across 22 files."
---

# Adapters

94 symbols | 22 files | Cohesion: 100%

## When to Use

- Working with code in `worktrees/`
- Understanding how OpenAIAdapter, LocalAdapter, GeminiAdapter work
- Modifying adapters-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `worktrees/proposal-020-phase0/src/adapters/local.js` | chat, _callOllama, _callLMStudio, _callLocalAI, _buildPrompt (+4) |
| `worktrees/proposal-013-vote/src/adapters/local.js` | chat, _callOllama, _callLMStudio, _callLocalAI, _buildPrompt (+4) |
| `worktrees/proposal-011/src/adapters/local.js` | chat, _callOllama, _callLMStudio, _callLocalAI, _buildPrompt (+4) |
| `src/adapters/local.js` | chat, _callOllama, _callLMStudio, _callLocalAI, _buildPrompt (+3) |
| `worktrees/proposal-020-phase0/src/adapters/openai.js` | OpenAIAdapter, chat, _convertHistory, _extractText, _convertTools (+1) |
| `worktrees/proposal-020-phase0/src/adapters/claude.js` | ClaudeAdapter, chat, _convertHistory, _extractText, _convertTools (+1) |
| `worktrees/proposal-013-vote/src/adapters/openai.js` | OpenAIAdapter, chat, _convertHistory, _extractText, _convertTools (+1) |
| `worktrees/proposal-013-vote/src/adapters/claude.js` | ClaudeAdapter, chat, _convertHistory, _extractText, _convertTools (+1) |
| `worktrees/proposal-011/src/adapters/openai.js` | OpenAIAdapter, chat, _convertHistory, _extractText, _convertTools (+1) |
| `worktrees/proposal-011/src/adapters/claude.js` | ClaudeAdapter, chat, _convertHistory, _extractText, _convertTools (+1) |

## Entry Points

Start here when exploring this area:

- **`OpenAIAdapter`** (Class) — `worktrees/proposal-020-phase0/src/adapters/openai.js:17`
- **`LocalAdapter`** (Class) — `worktrees/proposal-020-phase0/src/adapters/local.js:17`
- **`GeminiAdapter`** (Class) — `worktrees/proposal-020-phase0/src/adapters/gemini.js:15`
- **`ClaudeAdapter`** (Class) — `worktrees/proposal-020-phase0/src/adapters/claude.js:18`
- **`LLMAdapter`** (Class) — `worktrees/proposal-020-phase0/src/adapters/base.js:0`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `OpenAIAdapter` | Class | `worktrees/proposal-020-phase0/src/adapters/openai.js` | 17 |
| `LocalAdapter` | Class | `worktrees/proposal-020-phase0/src/adapters/local.js` | 17 |
| `GeminiAdapter` | Class | `worktrees/proposal-020-phase0/src/adapters/gemini.js` | 15 |
| `ClaudeAdapter` | Class | `worktrees/proposal-020-phase0/src/adapters/claude.js` | 18 |
| `LLMAdapter` | Class | `worktrees/proposal-020-phase0/src/adapters/base.js` | 0 |
| `OpenAIAdapter` | Class | `worktrees/proposal-013-vote/src/adapters/openai.js` | 17 |
| `LocalAdapter` | Class | `worktrees/proposal-013-vote/src/adapters/local.js` | 17 |
| `GeminiAdapter` | Class | `worktrees/proposal-013-vote/src/adapters/gemini.js` | 15 |
| `ClaudeAdapter` | Class | `worktrees/proposal-013-vote/src/adapters/claude.js` | 18 |
| `LLMAdapter` | Class | `worktrees/proposal-013-vote/src/adapters/base.js` | 0 |
| `OpenAIAdapter` | Class | `worktrees/proposal-011/src/adapters/openai.js` | 17 |
| `LocalAdapter` | Class | `worktrees/proposal-011/src/adapters/local.js` | 17 |
| `GeminiAdapter` | Class | `worktrees/proposal-011/src/adapters/gemini.js` | 15 |
| `ClaudeAdapter` | Class | `worktrees/proposal-011/src/adapters/claude.js` | 18 |
| `LLMAdapter` | Class | `worktrees/proposal-011/src/adapters/base.js` | 0 |
| `chat` | Method | `src/adapters/local.js` | 39 |
| `_callOllama` | Method | `src/adapters/local.js` | 86 |
| `_callLMStudio` | Method | `src/adapters/local.js` | 108 |
| `_callLocalAI` | Method | `src/adapters/local.js` | 131 |
| `_buildPrompt` | Method | `src/adapters/local.js` | 138 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `GenerateStream → _extractText` | intra_community | 4 |
| `GenerateStream → _callLMStudio` | intra_community | 4 |
| `GenerateStream → _extractText` | intra_community | 4 |
| `GenerateStream → _callLMStudio` | intra_community | 4 |
| `GenerateStream → _extractText` | intra_community | 4 |
| `GenerateStream → _callLMStudio` | intra_community | 4 |
| `GenerateStream → _extractText` | intra_community | 4 |
| `GenerateStream → _callLMStudio` | intra_community | 4 |
| `GenerateStream → _callOllama` | intra_community | 3 |
| `GenerateStream → _extractText` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "OpenAIAdapter"})` — see callers and callees
2. `gitnexus_query({query: "adapters"})` — find related execution flows
3. Read key files listed above for implementation details
