# Proposal: Add Tests for cleanupTmpFiles

> **状态**: ✅ 已通过（用户提出特批）
> **Proposal-By**: [Author name/ID]
> **Implemented-By**: [Implementer name/ID or task reference]
## 1. 提案背景 / Background

The `cleanupTmpFiles()` function in `src/utils/fs-cleanup.ts` currently lacks test coverage. It's crucial to test its behavior (filtering based on prefix, suffix, and modification time) to ensure it correctly deletes old temporary files without removing unrelated ones.

## 2. 改造范围 / Scope

- 增加 `tests/utils/fs-cleanup.test.ts` 文件以测试 `src/utils/fs-cleanup.ts`。

## 3. 具体修改 / Specific Changes

- Create a test file `tests/utils/fs-cleanup.test.ts`.
- Use `vi.mock` for `fs/promises`, `os`, and `logger`.
- Test cases: successful deletion of old temp files, retention of new temp files, retention of non-temp files, and error handling for `readdir`, `stat`, and `unlink`.

## 4. 影响评估 / Impact Assessment

Improves test coverage and reliability of temporary file cleanup functionality without altering production code.
