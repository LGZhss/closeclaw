# P027 Phase 1 拆解任务 C: Dart 控制平面与 Daemon 骨架

## 🎯 任务背景
Dart 被选定为系统的控制层（Phase 1），主要用于处理生命周期、CLI 交互入口和充当最高级别的审计中继与 TraceID 生成。本任务需建立一个精简、强类型的入口载体。

## 📋 你的职责
你是一名资深 Dart 开发者（512K 上下文）。你只需关注项目在 Dart 侧的基础设施搭建。不需要关心 TS 沙盒。

### 具体要求：
1. 通过 `dart create -t console cmd` 初始化 Dart 项目，修改 `pubspec.yaml` 确保名称和依赖合理（如 uuid, args 等）。
2. 在 `cmd/bin/closeclaw.dart` 提供基础 CLI 入口（解析 `start`, `stop`, `doctor` 参数）。
3. 建立 `cmd/lib/core/audit_relay.dart` 的骨架类，目前只需定义出“接收请求 -> 签名 TraceID -> 中继调度”的抽象接口，暂不需要实现底层网络。
4. **最核心的验证**: 测试并提供自动化脚本（可以是简单的 `Taskfile` 或 bash/ps1 脚本），使用 `dart compile exe bin/closeclaw.dart` 成功编译为独立可执行文件。

## ⚠️ 提交交付
- 提交 PR 到 `proposal/027-phase1-part3` 分支。
- 确保没有引入无用的大型依赖，核心理念为极速轻量。
- 保证构建出 `closeclaw.exe` 并在本地测试一下 `closeclaw doctor` 命令能正常返回一些假数据或状态。
