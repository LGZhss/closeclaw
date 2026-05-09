# 性能优化：工具注册表使用异步文件操作

> **状态**: ✅ 已通过（用户特批）

## 提议内容
将 `src/tools/tool-registry.ts` 中的文件操作由同步 (`readWsFile`, `writeWsFile`) 替换为异步 (`readWsFileAsync`, `writeWsFileAsync`)，以防止在高并发 LLM 请求时阻塞 Node.js 事件循环。
