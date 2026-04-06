# 运行时问题报告 (2026-04-06)

> **生成时间**: 2026-04-06 23:03  
> **检查范围**: TypeScript 编译、测试套件、代码静态分析、运行时错误模式

---

## 🚨 严重问题 (CRITICAL)

### 1. 缺失核心模块：src/channels/telegram.ts

**问题描述**:
- `src/channels/telegram.ts` 文件在 commit `7a2f029` (P027 精简 TS 层) 中被删除
- 但测试文件 `tests/telegram-receive.test.ts` 仍然引用此模块
- 编译后的文件 `dist/channels/telegram.js` 存在，但源文件不存在

**影响**:
- 测试套件无法运行：`Error: Cannot find module '../src/channels/telegram.js'`
- Telegram Channel 功能完全不可用
- 违背 P027 架构设计（Telegram 应该由 Dart 控制平面处理）

**根本原因**:
- P027 删除了 TS 层的 Telegram 实现，但：
  1. 没有删除相关测试文件
  2. 没有在 Dart 层实现替代方案
  3. 没有更新文档说明 Telegram 功能状态

**建议修复**:
1. **短期**：删除或禁用 `tests/telegram-receive.test.ts`
2. **中期**：在 Dart 控制平面实现 Telegram Channel
3. **长期**：完成 P027 架构迁移，确保所有 Channel 由 Dart 管理

---

## ⚠️ 高优先级问题 (HIGH)

### 2. 源文件编码问题：src/index.ts

**问题描述**:
- `src/index.ts` 文件中存在乱码字符
- 中文注释被错误编码为：`纭繚閫傞厤鍣ㄨ嚜鍔ㄦ敞鍐岋紙鐩墠浠呬繚鐣欏崗浣滀富浣撻€傞厤鍣紝鐢卞叾鑷韩娉ㄥ唽锛?`
- 正确应该是：`确保适配器自动注册（目前仅保留协作主体适配器，由其自身注册）`

**影响**:
- 代码可读性差
- 可能导致编辑器或工具链处理错误
- 违背代码质量标准

**根本原因**:
- 文件保存时使用了错误的编码格式（可能是 GBK 而不是 UTF-8）
- PowerShell 脚本编码问题的延续（已在 P033 中修复脚本，但源文件未修复）

**建议修复**:
1. 使用 UTF-8 编码重新保存 `src/index.ts`
2. 修正所有中文注释
3. 配置 `.editorconfig` 强制 UTF-8 编码

---

### 3. 测试失败：Bug 探索测试与实际代码不一致

**问题描述**:
- 6 个测试失败，原因是测试期望 Bug 存在，但 Bug 已被修复
- 失败的测试：
  1. `bug-b1.3-b1.4-exploration.test.ts` - busClient.onMessage 类型检查
  2. `bug-b2.2-exploration.test.ts` (3 个) - readWsFile 保护检查
  3. `bug-b3.2-exploration.test.ts` (2 个) - read_file 参数解析

**影响**:
- 测试套件无法通过（6/119 测试失败）
- CI/CD 流程可能被阻塞
- 开发者信心下降

**根本原因**:
- P031 实施过程中，Bug 已被修复，但探索测试未更新
- 探索测试的设计目标是"在未修复代码上失败"，但现在代码已修复
- 测试逻辑需要反转或删除

**建议修复**:
1. **选项 A**：删除探索测试（Bug 已修复，不再需要探索）
2. **选项 B**：将探索测试转换为回归测试（验证 Bug 不再出现）
3. **选项 C**：更新测试逻辑，反转期望结果

---

## 🟡 中优先级问题 (MEDIUM)

### 4. 空 catch 块和未处理异常

**问题描述**:
- `src/sandbox/process-executor.ts:214-215` 存在空 catch 块
```typescript
fsPromises.unlink(tempPath).catch(() => {});
} catch {}
```

**影响**:
- 错误被静默吞噬，难以调试
- 可能隐藏严重问题
- 违背错误处理最佳实践

**建议修复**:
```typescript
fsPromises.unlink(tempPath).catch((err) => {
  logger.debug(`Failed to cleanup temp file: ${tempPath}`, err);
});
} catch (err) {
  logger.debug(`Cleanup error: ${err}`);
}
```

---

### 5. 潜在的资源泄漏：setTimeout 未清理

**问题描述**:
- `src/index.ts` 中的 gRPC 重连逻辑使用 `setTimeout`，但没有保存 timer ID
```typescript
call.on("error", (err: Error) => {
  logger.error(`[TS Sandbox] gRPC Stream Error: ${err.message}`);
  setTimeout(() => this.subscribeTasks(), 5000); // 没有保存 timer ID
});
```

**影响**:
- 如果快速重连失败，可能创建多个 timer
- 无法在 shutdown 时清理 timer
- 可能导致内存泄漏

**建议修复**:
```typescript
private reconnectTimer: NodeJS.Timeout | null = null;

call.on("error", (err: Error) => {
  logger.error(`[TS Sandbox] gRPC Stream Error: ${err.message}`);
  if (this.reconnectTimer) {
    clearTimeout(this.reconnectTimer);
  }
  this.reconnectTimer = setTimeout(() => {
    this.reconnectTimer = null;
    this.subscribeTasks();
  }, 5000);
});
```

---

### 6. Go 内核数据目录回退逻辑不安全

**问题描述**:
- `kernel/main.go:67` 回退到 `./data` 可能导致数据分散
```go
if configDir, err := os.UserConfigDir(); err == nil {
    storeDir = filepath.Join(configDir, "closeclaw", "data")
} else {
    // 回退到当前目录，避免使用公共临时目录
    storeDir = "./data"
}
```

**影响**:
- 不同运行位置可能创建不同的数据目录
- 数据不一致
- 难以备份和迁移

**建议修复**:
1. 强制要求 `WORKSPACE_DIR` 环境变量
2. 如果未设置，报错退出而不是回退
3. 在启动脚本中自动设置 `WORKSPACE_DIR`

---

## 🟢 低优先级问题 (LOW)

### 7. 测试超时配置不一致

**问题描述**:
- 测试日志显示：`[2026-04-06 23:03:34.231 +0800] ERROR: [ProcessExecutor] 执行失败: 命令执行超时: 1000ms`
- 某些测试使用 1 秒超时，可能在慢速机器上失败

**建议修复**:
- 增加测试超时时间到 5 秒
- 或使用环境变量配置超时

---

### 8. 日志级别不一致

**问题描述**:
- Go 内核使用 `slog.LevelInfo`
- TS 沙盒使用自定义 logger
- 没有统一的日志级别配置

**建议修复**:
- 添加 `LOG_LEVEL` 环境变量
- 统一日志格式和级别

---

## 📊 测试结果摘要

```
Test Files  4 failed | 13 passed (17)
Tests       6 failed | 113 passed (119)
Duration    21.92s
```

**失败测试**:
1. `tests/telegram-receive.test.ts` - 模块缺失
2. `tests/governance-build-reconstruction/bug-b1.3-b1.4-exploration.test.ts` - 1 个测试
3. `tests/governance-build-reconstruction/bug-b2.2-exploration.test.ts` - 3 个测试
4. `tests/governance-build-reconstruction/bug-b3.2-exploration.test.ts` - 2 个测试

---

## 🎯 推荐修复优先级

### 立即修复 (今天)
1. ✅ 删除或禁用 `tests/telegram-receive.test.ts`
2. ✅ 修复 `src/index.ts` 编码问题
3. ✅ 更新或删除失败的 Bug 探索测试

### 本周修复
4. ⚠️ 修复空 catch 块和错误处理
5. ⚠️ 修复 setTimeout 资源泄漏
6. ⚠️ 改进 Go 内核数据目录逻辑

### 下周修复
7. 🔵 统一日志级别配置
8. 🔵 增加测试超时配置

---

## 📝 相关文档

- **P027**: 三语言微内核架构 - `docs/07-roadmap/P027-summary.md`
- **P031**: Governance Build Reconstruction - `votes/proposal-031-governance-build-reconstruction.md`
- **P033**: 会话工作总结 - `votes/proposal-033-session-work-summary-apr-06.md`
- **AGENTS.md**: 开发指南

---

> **CloseClaw - 公平、透明、高效的多智能体协作** 🚀  
> **运行时问题报告已生成，建议立即处理严重问题！**
