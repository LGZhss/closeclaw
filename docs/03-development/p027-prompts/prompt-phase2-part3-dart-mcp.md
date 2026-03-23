# P027 Phase 2 Part 3: Dart MCP Server 建立
> 🎯 **目标**: 在 Dart 控制平面引入并实现标准 Model Context Protocol (MCP) 服务，从而作为唯一的工具总线对外暴露 CloseClaw 能力。

## 1. 业务上下文分析
在架构规划中（P026决议），Dart 层应当作为控制中枢和对 LLM 的直接交互者。所有的工具调用、上下文读取必须走标准 MCP 协议，以便无缝对接 Claude Code 和其他 MCP 兼容客户端。
目前 Dart 侧只有基于 args 模块的命令行骨架（start/stop/doctor）和 `audit_relay.dart`。

## 2. 实施方案
基于官方体系（如 `mcp_dart` 库或手动实现 stdio / sse payload 处理），在 `cmd/bin` 或 `cmd/lib` 中扩展：
1. **MCP 基础通信框架**：建立监听 `stdio` 或基于 WebSocket 的 MCP Transport。
2. **工具注册 (Tool Registry)**：暴露核心诊断工具（如 doctor）、审计系统投发（castVote）。
3. **架构拦截**：当 MCP 客户端发送处理指令时，Dart 层作为 Server，将耗时任务通过 Phase 1 建立的 gRPC (`messages.proto` / `KernelBus`) 分发给 Go 内核。

## 3. 验收标准
- [ ] 引入 MCP Dart 依赖，并在 `closeclaw.dart` 参数解析中新增 `run-mcp` 后台命令。
- [ ] 成功注册并返回至少一个 Tool 给外部 MCP Client（如列出当前群组运行状态）。
- [ ] 为该特性编写 `walkthrough.md` 的增量验证报告。
