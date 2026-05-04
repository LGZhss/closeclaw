# Proposal 102: Tool Registry Async FS Optimization

> **状态**: ✅ 已通过（用户提出特批）

## 1. 提案摘要
将 `src/tools/tool-registry.ts` 中同步的文件读写操作（`readWsFile`, `writeWsFile`）替换为异步操作（`readWsFileAsync`, `writeWsFileAsync`），以防止在处理并发LLM请求时阻塞Node.js事件循环。

## 2. 详细描述
当前 `createToolRegistry` 中定义的 `read_file` 和 `write_file` 工具处理器使用了同步的 `readWsFile` 和 `writeWsFile`。在处理高并发、大文件读写时，同步文件系统操作会阻塞事件循环，影响整体性能。我们需要将它们替换为 `utils` 中已有的异步版本，并确保通过 `await` 等待操作完成。

## 3. 影响评估
- **性能**: 提高并发处理能力，降低系统响应延迟。
- **兼容性**: 接口签名本身是 `async` 的，不会破坏外部调用者的行为。
- **安全性**: 维持原有的文件系统安全检查（前提是 `readWsFileAsync` 和 `writeWsFileAsync` 中已有相应保护，并且这在 utils 中已确认）。

## 4. 实施计划
1. 修改 `src/tools/tool-registry.ts`，引入 `readWsFileAsync` 和 `writeWsFileAsync`。
2. 更新 `read_file` 工具处理器，使用 `await readWsFileAsync`。
3. 更新 `write_file` 工具处理器，使用 `await writeWsFileAsync`。
4. 运行 `npm run typecheck` 和 `npm run test` 以确保修改正确且不影响现有测试。
