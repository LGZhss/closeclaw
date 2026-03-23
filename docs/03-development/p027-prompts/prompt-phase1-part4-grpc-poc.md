# P027 Phase 1 拆解任务 D: gRPC Named Pipe POC 验证 (Dart ↔ Go)

## 🎯 任务背景
在 CloseClaw 三语言架构中，Dart 作为控制层，将与 Go 作为状态神经中枢通过 gRPC (因平台主要为 Windows，故采用 Named Pipe) 进行底层二进制通信，以此取代过往 JSON API 轮询带来的损耗。此性能对整个系统命脉至关重要。

## 📋 你的职责
你熟悉 Dart 和 Go 网络编程底层（512K 上下文）。你需要验证跨界 IPC 的效率。

### 具体要求：
1. 先查阅根目录刚刚生成的 `proto/messages.proto` (不要修改它，仅依赖以编译桩代码)。
2. 在 `kernel/` 下补充 gRPC Server 处理骨架，实现极简的回显（Echo）或模拟状态写入。
3. 在 `cmd/` 下补充 gRPC Client 连接端代码，通过指定的 Named Pipe (例如 `\\.\pipe\closeclaw_ipc`) 向 Go 狂发请求。
4. **验证门槛**: 在 Windows 下实测 Named Pipe RTT，必须包含明确的 Bench 追踪日志：确认 P50/P95 RTT 参数均 `≤ 2ms` 才能通过验收线。

## ⚠️ 提交交付
- 提交 PR 到 `proposal/027-phase1-part4` 分支。
- 你必须同时提供测试脚本和相应的性能报告文档记录（建议为 `docs/reports/phase1-benchmarks.md`），明确写出测试环境与得到的 RTT 值。
- 如果发现在部分杀毒软件拦截或 Windows Defender 开启状态下 RTT 飙升，需要在这份报告中给出环境配置避坑指南。
