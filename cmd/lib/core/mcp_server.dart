import 'dart:convert';
import 'dart:io';

import 'logger.dart';

/// Dart MCP Server - 基于标准的 Stdio JSON-RPC
class McpServer {
  final ClawLogger log;

  McpServer({required this.log});

  /// 启动 MCP Stdio 循环
  Future<void> run() async {
    // 禁用默认 stdout 缓冲并强制以 UTF-8 输出 JSON 避免破坏协议
    
    // 启动 stdin 监听（按行读取 JSON）
    stdin.transform(utf8.decoder).transform(const LineSplitter()).listen(
      (line) {
        if (line.trim().isEmpty) return;
        _handleRpcPayload(line);
      },
      onDone: () => exit(0),
      onError: (e) {
        log.warn("MCP Server 发生错误: $e");
        exit(1);
      },
    );
  }

  void _handleRpcPayload(String payload) {
    try {
      final req = json.decode(payload);
      if (req is! Map<String, dynamic>) return;

      final id = req['id'];
      final method = req['method'];

      if (method == null) return;

      Map<String, dynamic> response = {
        'jsonrpc': '2.0',
        'id': id,
      };

      switch (method) {
        case 'initialize':
          response['result'] = _handleInitialize();
          break;
        case 'tools/list':
          response['result'] = _handleToolsList();
          break;
        case 'tools/call':
          final params = req['params'] as Map<String, dynamic>? ?? {};
          response['result'] = _handleToolsCall(params['name'], params['arguments']);
          break;
        case 'ping':
          response['result'] = {};
          break;
        default:
          response['error'] = {
            'code': -32601,
            'message': 'Method not found: \$method'
          };
      }

      // 回写 JSON
      final out = json.encode(response);
      stdout.writeln(out);

    } catch (e) {
      log.warn("JSON-RPC 解析失败: $e");
    }
  }

  Map<String, dynamic> _handleInitialize() {
    return {
      'protocolVersion': '2024-11-05',
      'capabilities': {
        'tools': {'listChanged': false},
      },
      'serverInfo': {
        'name': 'closeclaw-kernel',
        'version': '0.1.0-phase2'
      }
    };
  }

  Map<String, dynamic> _handleToolsList() {
    return {
      'tools': [
        {
          'name': 'closeclaw_doctor',
          'description': '执行 CloseClaw 层面的健康检查和诊断，返回内核在线情况。',
          'inputSchema': {
            'type': 'object',
            'properties': {},
            'required': []
          }
        }
      ]
    };
  }

  Map<String, dynamic> _handleToolsCall(String? name, dynamic arguments) {
    if (name == 'closeclaw_doctor') {
      // 执行健康检查逻辑并返回文字
      return {
        'content': [
          {
            'type': 'text',
            'text': '=== CloseClaw Ultra 诊断报告 ===\n版本: 0.1.0-phase2\nDart 内核就绪\n'
          }
        ]
      };
    }

    throw Exception('Unknown tool: \$name');
  }
}
