---
name: scripts
description: "Skill for the Scripts area of .closeclaw. 55 symbols across 13 files."
---

# Scripts

55 symbols | 13 files | Cohesion: 100%

## When to Use

- Working with code in `worktrees/`
- Understanding how print_header, fetch_openrouter_models, fetch_github_models work
- Modifying scripts-related functionality

## Key Files

| File | Symbols |
|------|---------|
| `scripts/prepare-pr.js` | parseProposal, extractChangedFiles, generateBranchName, createPRDraft, main |
| `scripts/scan_free_models.py` | print_header, fetch_openrouter_models, fetch_github_models, check_configured_providers, main |
| `worktrees/proposal-020-phase0/scripts/prepare-pr.js` | parseProposal, extractChangedFiles, generateBranchName, createPRDraft, main |
| `worktrees/proposal-020-phase0/scripts/scan_free_models.py` | print_header, fetch_openrouter_models, fetch_github_models, check_configured_providers, main |
| `worktrees/proposal-013-vote/scripts/scan_free_models.py` | print_header, fetch_openrouter_models, fetch_github_models, check_configured_providers, main |
| `worktrees/proposal-011/scripts/scan_free_models.py` | print_header, fetch_openrouter_models, fetch_github_models, check_configured_providers, main |
| `worktrees/proposal-011/scripts/prepare-pr.js` | parseProposal, extractChangedFiles, generateBranchName, createPRDraft, main |
| `scripts/auto-vote-stats.js` | scanProposals, printReport, main, parseTableRow, parseProposal |
| `worktrees/proposal-020-phase0/scripts/auto-vote-stats.js` | scanProposals, printReport, main, parseTableRow, parseProposal |
| `worktrees/proposal-011/scripts/vote-tally.js` | listProposals, parseProposal, main |

## Entry Points

Start here when exploring this area:

- **`print_header`** (Function) — `scripts/scan_free_models.py:21`
- **`fetch_openrouter_models`** (Function) — `scripts/scan_free_models.py:27`
- **`fetch_github_models`** (Function) — `scripts/scan_free_models.py:42`
- **`check_configured_providers`** (Function) — `scripts/scan_free_models.py:69`
- **`main`** (Function) — `scripts/scan_free_models.py:91`

## Key Symbols

| Symbol | Type | File | Line |
|--------|------|------|------|
| `print_header` | Function | `scripts/scan_free_models.py` | 21 |
| `fetch_openrouter_models` | Function | `scripts/scan_free_models.py` | 27 |
| `fetch_github_models` | Function | `scripts/scan_free_models.py` | 42 |
| `check_configured_providers` | Function | `scripts/scan_free_models.py` | 69 |
| `main` | Function | `scripts/scan_free_models.py` | 91 |
| `print_header` | Function | `worktrees/proposal-020-phase0/scripts/scan_free_models.py` | 21 |
| `fetch_openrouter_models` | Function | `worktrees/proposal-020-phase0/scripts/scan_free_models.py` | 27 |
| `fetch_github_models` | Function | `worktrees/proposal-020-phase0/scripts/scan_free_models.py` | 42 |
| `check_configured_providers` | Function | `worktrees/proposal-020-phase0/scripts/scan_free_models.py` | 69 |
| `main` | Function | `worktrees/proposal-020-phase0/scripts/scan_free_models.py` | 91 |
| `print_header` | Function | `worktrees/proposal-013-vote/scripts/scan_free_models.py` | 9 |
| `fetch_openrouter_models` | Function | `worktrees/proposal-013-vote/scripts/scan_free_models.py` | 14 |
| `fetch_github_models` | Function | `worktrees/proposal-013-vote/scripts/scan_free_models.py` | 29 |
| `check_configured_providers` | Function | `worktrees/proposal-013-vote/scripts/scan_free_models.py` | 56 |
| `main` | Function | `worktrees/proposal-013-vote/scripts/scan_free_models.py` | 78 |
| `print_header` | Function | `worktrees/proposal-011/scripts/scan_free_models.py` | 21 |
| `fetch_openrouter_models` | Function | `worktrees/proposal-011/scripts/scan_free_models.py` | 27 |
| `fetch_github_models` | Function | `worktrees/proposal-011/scripts/scan_free_models.py` | 42 |
| `check_configured_providers` | Function | `worktrees/proposal-011/scripts/scan_free_models.py` | 69 |
| `main` | Function | `worktrees/proposal-011/scripts/scan_free_models.py` | 91 |

## Execution Flows

| Flow | Type | Steps |
|------|------|-------|
| `Main → Print_header` | intra_community | 3 |
| `Main → Print_header` | intra_community | 3 |
| `Main → Print_header` | intra_community | 3 |
| `Main → Print_header` | intra_community | 3 |
| `Main → ExtractChangedFiles` | intra_community | 3 |
| `Main → GenerateBranchName` | intra_community | 3 |
| `Main → ExtractChangedFiles` | intra_community | 3 |
| `Main → GenerateBranchName` | intra_community | 3 |
| `Main → ExtractChangedFiles` | intra_community | 3 |
| `Main → GenerateBranchName` | intra_community | 3 |

## How to Explore

1. `gitnexus_context({name: "print_header"})` — see callers and callees
2. `gitnexus_query({query: "scripts"})` — find related execution flows
3. Read key files listed above for implementation details
