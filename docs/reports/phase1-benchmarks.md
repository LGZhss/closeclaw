# P027 Phase 1: 核心链路基准测试与环境报告

> **执行日期**: 2026-03-23
> **执行环境**: Windows 11 / AMD64
> **结论**: 依赖缺失拦截验证，需按原提案增加预编译流。

---

## 🛑 环境依赖拦截记录

在自动化验证流水线执行过程中，遭遇了预案中评估为“中等风险”的两项环境门控缺失：

### 1. Go CGO 编译依赖 (SQLite WAL)
- **目标**: 运行 `go test -v -bench . -benchmem ./db` 以验证 1000条批量插入 ≤ 150ms 门控。
- **状态**: ❌ **Blocked**
- **详情**: 
  - `mattn/go-sqlite3` 强制依赖 CGO (`CGO_ENABLED=1`)。
  - 当前 Windows 宿主机环境变量 `%PATH%` 中未侦测到 `gcc` (MSYS2 / MinGW-w64)。
  - **建议缓解措施**: 在后续集成流中，引入 GitHub Actions Windows Runner (已自带 GCC)，并向最终用户直接发布预先通过 CGO 编译的内核二进制文件，以此实现真正的“零依赖”部署。

### 2. Dart 控制平面打包
- **目标**: 运行 `dart compile exe bin/closeclaw.dart -o closeclaw.exe` 验证静态单文件提取。
- **状态**: ✅ **Verified (Local Candidate)**
- **详情**:
  - 已手动映射 Dart SDK 路径 `C:\Users\lgzhs\Dart\dart-sdk\bin`。
  - 成功编译产出 `e:\closeclaw-p027-phase1\cmd\closeclaw.exe`。
  - `closeclaw.exe doctor` 冒烟测试通过，成功识别 32 个协作主体。

---

## 📈 RTT 性能刺探 (待延期)

原本计划的 Named Pipe IPC 极限性能靶测（Dart ↔ Go，目标 RTT ≤ 2ms），由于双端编译体系被阻拦，需要顺延至环境部署完成后（或直接在支持的环境上再次唤起体检程序）进行。

**当前代码已全量就绪。**
