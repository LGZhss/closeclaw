/// ClawLogger — 带时间戳和级别前缀的结构化日志器
/// 避免使用 print()，提供 INFO / WARN / ERROR 三个级别。
library;

import 'dart:io';

class ClawLogger {
  final bool verbose;
  final bool quiet;

  const ClawLogger({this.verbose = false, this.quiet = false});

  void info(String msg) {
    if (!quiet) _log('[INFO]', msg);
  }
  void warn(String msg) {
    if (!quiet) _log('[WARN]', msg);
  }
  void error(String msg, [Object? err]) {
    _log('[ERROR]', msg);
    if (err != null) _log('[ERROR]', '  细节: $err');
  }
  void debug(String msg) {
    if (verbose && !quiet) _log('[DEBUG]', msg);
  }

  void _log(String level, String msg) {
    final ts = DateTime.now().toIso8601String().substring(11, 23); // HH:mm:ss.mmm
    // MCP Server uses stdout for JSON-RPC, so all logs must go to stderr
    stderr.writeln('$ts $level $msg');
  }
}
