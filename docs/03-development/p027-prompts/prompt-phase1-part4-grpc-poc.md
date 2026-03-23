# P027 Phase 1: gRPC Named Pipe IPC 极限性能靶测

## 📌 核心目标
在 `proto/messages.proto` 的指导下，建立 Go gRPC Server 与 Dart gRPC Client，利用基于 Windows 平台的 Named Pipe 建立通信连接，测试 10,000 条 Task 的 RTT (往返延迟) 必须控制在 ≤ 2ms。

## ⚠️ 强制性纪律 (ANTI-LAZINESS)
你作为该环节性能的终极把关者，有全权决定 IPC 通道（如 gopkg.in/natefinch/npipe.v2 或标准库）与收发逻辑，但**绝对禁止**以下懒惰行为：
1. **[纸上谈兵]**：禁止仅编写抽象接口代码而在关键测试环节抛出 `throw UnimplementedError('等待后续压测接入')`。你必须提交完整的靶测 Client 和模拟回复 Server 代码，并执行出结果。
2. **[欺瞒日志]**：你必须真实跑满万级请求并提供 `docs/reports/phase1-benchmarks.md`。如果是系统权限拒绝，请解决并文档化；如果被杀软拦截导致超限 2ms，写下来证明。
3. **[敷衍协议]**：必须真实加载生成的 protobuf 桩，携带 `trace_id` 来回交互，不允许降级使用普通 socket 字串冒充。

完成开发后，提交至 `proposal/027-phase1-part4` 分支。
