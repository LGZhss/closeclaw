/// ClawLogger — 带时间戳和级别前缀的结构化日志器
/// 避免使用 print()，提供 INFO / WARN / ERROR 三个级别。
library;

class ClawLogger {
  final bool verbose;

  const ClawLogger({this.verbose = false});

  void info(String msg) => _log('[INFO]', msg);
  void warn(String msg) => _log('[WARN]', msg);
  void error(String msg, [Object? err]) {
    _log('[ERROR]', msg);
    if (err != null) _log('[ERROR]', '  细节: $err');
  }
  void debug(String msg) {
    if (verbose) _log('[DEBUG]', msg);
  }

  void _log(String level, String msg) {
    final ts = DateTime.now().toIso8601String().substring(11, 23); // HH:mm:ss.mmm
    // ignore: avoid_print
    print('$ts $level $msg');
  }
}
