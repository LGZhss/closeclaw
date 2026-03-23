# P027 Phase 1 拆解任务 A: 跨语言 Protobuf 定义

## 🎯 任务背景
在 CloseClaw Ultra 架构中，系统通过 Dart、Go、TS 进行三端协作。为了确保通信结构的强一致与版本向前兼容，我们需要建立共用的 Protocol Buffers 定义规范。

## 📋 你的职责
你是一个深谙 RPC 机制的架构师（512K 上下文）。你需要仅关注本阶段的 `messages.proto` 定义。禁止关注其他组件。

### 具体要求：
1. 在项目根目录创建 `proto/` 目录。
2. 建立 `proto/messages.proto`，包名为 `closeclaw.v1`。
3. 必须包含如下核心字段：
   - `trace_id` (string，必填，用于贯穿 Dart->Go->TS 链路)。
   - `task_id` (string)
   - `group_jid` (string)
   - `payload` (string，暂用 JSON 字串承载动态内容)
   - 状态枚举: `TaskStatus` (PENDING, RUNNING, DONE, FAILED)
4. 定义最核心的 gRPC Service 接口，例如 `TaskControl` Service，包含发信 `DispatchTask` 与状态反馈 `UpdateStatus` 等。

## ⚠️ 提交交付
- 提交 PR 到 `proposal/027-phase1-part1` 分支。
- 确保执行过 `protoc` (若有环境) 验证语法，或者至少肉眼确认语法 100% 符合 proto3 规范。
- 结束时不要做任何业务开发，你的任务仅限于定义良好的数据契约！
