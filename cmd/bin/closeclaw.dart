/// CloseClaw Ultra — 控制平面入口
/// 编译命令: dart compile exe bin/closeclaw.dart -o closeclaw.exe
/// 运行示例: closeclaw start | closeclaw doctor | closeclaw stop
library;

import 'dart:io';
import 'package:args/args.dart';
import '../lib/core/audit_relay.dart';
import '../lib/core/logger.dart';
import '../lib/core/mcp_server.dart';

void main(List<String> arguments) async {
  final parser = ArgParser()
    ..addCommand('start')
    ..addCommand('stop')
    ..addCommand('doctor')
    ..addCommand('mcp-serve')
    ..addFlag('verbose', abbr: 'v', defaultsTo: false, help: '开启详细日志');

  ArgResults results;
  try {
    results = parser.parse(arguments);
  } on FormatException catch (e) {
    stderr.writeln('参数错误: ${e.message}');
    stderr.writeln(parser.usage);
    exit(1);
  }

  final log = ClawLogger(verbose: results['verbose'] as bool);

  switch (results.command?.name) {
    case 'start':
      await _cmdStart(log);
    case 'stop':
      await _cmdStop(log);
    case 'doctor':
      await _cmdDoctor(log);
    case 'mcp-serve':
      // MCP Server 必须保持 quiet，避免普通日志污染 stdout/json
      final mcpLog = ClawLogger(verbose: results['verbose'] as bool, quiet: true);
      final server = McpServer(log: mcpLog);
      await server.run();
    default:
      stderr.writeln('请指定子命令: start | stop | doctor | mcp-serve');
      stderr.writeln(parser.usage);
      exit(1);
  }
}

/// start: 初始化守护进程并等待 Go 内核就绪
Future<void> _cmdStart(ClawLogger log) async {
  log.info('正在启动 CloseClaw Ultra 控制平面...');
  final relay = AuditRelay(log: log);
  await relay.loadSubjects();
  log.info('已加载 ${relay.subjects.length} 个协作主体');
  log.info('正在探活 Go 内核总线 (127.0.0.1:50051)...');
  // Phase1 POC：简单 TCP 连通性测试（真实 gRPC 将在 Part4 集成）
  try {
    final socket = await Socket.connect('127.0.0.1', 50051,
        timeout: const Duration(seconds: 3));
    socket.destroy();
    log.info('✅ Go 内核在线，系统进入 L1 正常态');
  } catch (_) {
    log.warn('⚠️  Go 内核不可达，退入 L2 降级模式（npm start 将自动唤起）');
    _triggerL2Fallback(log);
  }
}

/// stop: 向守护进程发送停止信号
Future<void> _cmdStop(ClawLogger log) async {
  log.info('正在停止 CloseClaw Ultra...');
  // 写入 PID 文件的停止信号（Phase2 实现完整守护进程管理）
  final pidFile = File('.closeclaw.pid');
  if (pidFile.existsSync()) {
    final pid = int.tryParse(pidFile.readAsStringSync().trim());
    if (pid != null) {
      Process.killPid(pid);
      pidFile.deleteSync();
      log.info('已向 PID $pid 发送停止信号');
    }
  } else {
    log.warn('未找到 PID 文件，进程可能未在运行');
  }
}

/// doctor: 输出系统健康状态诊断报告
Future<void> _cmdDoctor(ClawLogger log) async {
  log.info('=== CloseClaw Ultra 诊断报告 ===');
  log.info('版本:        v0.1.0-phase1');
  log.info('运行平台:    ${Platform.operatingSystem} ${Platform.operatingSystemVersion}');
  log.info('Dart 版本:   ${Platform.version}');

  // Go 内核探活
  bool kernelOnline = false;
  try {
    final s = await Socket.connect('127.0.0.1', 50051,
        timeout: const Duration(seconds: 2));
    s.destroy();
    kernelOnline = true;
  } catch (_) {}

  log.info('Go 内核总线: ${kernelOnline ? "✅ 在线 (L1)" : "❌ 离线 (L2/L3 降级)"}');

  // 读取协作主体注册
  final relay = AuditRelay(log: log, quiet: true);
  try {
    await relay.loadSubjects();
    log.info('协作主体数:  ${relay.subjects.length} 个已注册');
  } catch (e) {
    log.warn('无法加载 .subjects.json: $e');
  }

  log.info('=================================');
}

/// 触发 L2 降级：唤起 npm start 作为 P021 基线保底
void _triggerL2Fallback(ClawLogger log) {
  log.warn('正在以 L2 降级模式启动 npm start...');
  Process.start('npm', ['start'],
      workingDirectory: Directory.current.path,
      mode: ProcessStartMode.detached);
  log.warn('TS 单体已在后台启动（P021 基线保底）');
}
