# Proposal-032: 面向生态的架构优化 (ClawHub + MCP + CC 插件)

> **提案 ID**: 032  
> **创建日期**: 2026-04-02  
> **提案级别**: 三级决议（核心架构调整）  
> **状态**: 🟡 投票中  

---

## 📊 摘要

本提案提出**"强 Dart + 精 TS + 活生态"**架构优化方案，通过增强 Dart 控制平面的生态整合能力（ClawHub Core、LLM 统一适配、MCP 增强），精简 TypeScript 执行层，实现更合理的代码分布和更清晰的职责边界。

### 核心变更
- ✅ **新增 ClawHub Core** (~400 行 Dart) - 统一管理 Skill 和 CC 插件
- ✅ **新增 LLM 统一适配层** (~300 行 Dart) - 集中管理 20+ 种 LLM API
- ✅ **增强 MCP Server** (+100 行 Dart) - 支持动态工具发现和插件热插拔
- ✅ **精简 TS 沙盒层** (-400 行) - 删除冗余适配器和工具系统

### 预期效果
```
调整前:
Dart: ~535 行 (31%)  ← 偏轻
Go:   ~1,200 行 (40%)
TS:   ~1,200 行 (39%)  ← 偏重

调整后:
Dart: ~1,335 行 (51%) ← 控制平面 + 生态整合
Go:   ~1,200 行 (46%) ← 性能核心 (保持不变)
TS:     800 行 (30%)  ← 专注执行 (精简 33%)
```

---

## 🎯 背景与动机

### 当前问题

#### 1. **职责分配不均衡**
- Dart 控制平面仅 535 行，承担的职责过少
- TS 沙盒层 1,200 行，包含大量本应属于控制平面的逻辑（如 LLM API 调用）
- 违背 P027"控制平面负责外交，执行沙盒负责内政"的设计原则

#### 2. **生态整合缺失**
- ClawHub Skill 系统已有 26 个技能（GitNexus 6 个 + generated 20 个），但缺乏统一管理
- CC 插件兼容停留在规划阶段（`future-plan.md` P1 优先级）
- MCP Server 功能单薄，不支持动态工具发现

#### 3. **重复建设严重**
- TS 层有完整的 LLM 适配器系统（~200 行），Dart 层完全没有
- 工具注册和管理在 TS 和 Dart 都有实现
- 未来维护成本随生态扩张指数级增长

### 机遇窗口

根据 `docs/07-roadmap/future-plan.md`:
- ✅ **ClawHub Skill 支持** - P0 优先级（最高）
- ✅ **Claude Code 插件兼容** - P1 优先级
- ✅ **P027 Phase 1 POC 验证** - 关键路径

---

## 🏗️ 架构设计

### 整体布局

```
┌─────────────────────────────────────────────────────────┐
│              Layer 1: Dart 控制平面 (增强版)             │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │ MCP Server   │ ClawHub Core │ CC Plugin Adapter│    │
│  │ (IDE 连接)    │ (Skill 加载)  │ (插件兼容)       │    │
│  │ ~200 行       │ ~400 行       │ ~200 行          │    │
│  └──────────────┴──────────────┴──────────────────┘    │
│                    LLM Adapter (~300 行)                │
│                    gRPC Client (~100 行)                │
└─────────────────────────────────────────────────────────┘
           ↓ (gRPC Named Pipe / MCP Stdio)
┌─────────────────────────────────────────────────────────┐
│              Layer 2: Go 状态总线 (保持不变)             │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │ SQLite WAL   │ gRPC Server  │ Scheduler        │    │
│  │ ~600 行       │ ~300 行       │ ~200 行          │    │
│  └──────────────┴──────────────┴──────────────────┘    │
└─────────────────────────────────────────────────────────┘
           ↓ (IPC / Tool Execution)
┌─────────────────────────────────────────────────────────┐
│              Layer 3: TS 精简沙盒 (聚焦执行)             │
│  ┌──────────────┬──────────────┬──────────────────┐    │
│  │ Sandbox Exec │ NPM Bridge   │ Legacy Tools     │    │
│  │ (~300 行)     │ (~200 行)     │ (~200 行)        │    │
│  └──────────────┴──────────────┴──────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 职责重新划分

| 层级 | 新职责 | 代码量 | 变化 |
|------|--------|--------|------|
| **Dart** | 外交官：LLM API、ClawHub、MCP、IDE 连接 | ~1,335 行 | **+800 行** |
| **Go** | 神经中枢：数据库、调度、gRPC | ~1,200 行 | **0 行** |
| **TS** | 执行者：沙盒、NPM SDK、遗留兼容 | ~800 行 | **-400 行** |

---

## 🔧 实施方案

### Phase 1: ClawHub Core (4 小时) ⭐

#### 1.1 目录结构
```bash
cmd/lib/clawhub/
├── hub.dart              # 核心 Hub (~150 行)
├── skill.dart            # Skill 解析 (~100 行)
├── plugin.dart           # CC 插件兼容 (~100 行)
└── registry.dart         # 注册表 (~50 行)
```

#### 1.2 核心代码示例

**`cmd/lib/clawhub/hub.dart`**:
```dart
import 'dart:io';
import '../core/logger.dart';
import 'skill.dart';
import 'plugin.dart';

class ClawHub {
  final ClawLogger log;
  final List<Skill> _skills = [];
  final List<CCPlugin> _plugins = [];
  
  ClawHub({required this.log});
  
  /// 加载所有 Skills (.claude/skills/)
  Future<void> loadSkills() async {
    final skillDir = Directory('.claude/skills');
    if (!skillDir.existsSync()) return;
    
    await for (final entity in skillDir.list(recursive: true)) {
      if (entity is File && entity.path.endsWith('SKILL.md')) {
        try {
          final skill = await Skill.fromMarkdown(entity.path);
          _skills.add(skill);
          log.info('✅ 加载技能：${skill.name} (${skill.tools.length} tools)');
        } catch (e) {
          log.warn('⚠️ 技能加载失败：${entity.path} - $e');
        }
      }
    }
    
    log.info('📚 共加载 ${_skills.length} 个技能');
  }
  
  /// 加载所有 CC 插件 (.closeclaw/plugins/)
  Future<void> loadPlugins() async {
    final pluginDir = Directory('.closeclaw/plugins');
    if (!pluginDir.existsSync()) return;
    
    await for (final entity in pluginDir.list()) {
      if (entity is File && entity.path.endsWith('.json')) {
        try {
          final plugin = await CCPlugin.fromManifest(entity.path);
          _plugins.add(plugin);
          log.info('🔌 加载插件：${plugin.name} v${plugin.version}');
        } catch (e) {
          log.warn('⚠️ 插件加载失败：${entity.path} - $e');
        }
      }
    }
    
    log.info('🔧 共加载 ${_plugins.length} 个插件');
  }
  
  /// 执行工具（统一入口）
  Future<dynamic> executeTool(String name, Map<String, dynamic> params) async {
    // 优先从 Skills 查找
    for (final skill in _skills) {
      final tool = skill.tools.firstWhere(
        (t) => t.name == name,
        orElse: () => null as dynamic,
      );
      if (tool != null) {
        log.debug('🛠️ 执行技能工具：$name (from ${skill.name})');
        return await tool.handler(params);
      }
    }
    
    // 从 Plugins 查找
    for (final plugin in _plugins) {
      if (plugin.hasTool(name)) {
        log.debug('🛠️ 执行插件工具：$name (from ${plugin.name})');
        return await plugin.executeTool(name, params);
      }
    }
    
    throw Exception('Tool not found: $name');
  }
  
  /// 获取所有可用工具列表（用于 MCP）
  List<Map<String, dynamic>> listAllTools() {
    final tools = <Map<String, dynamic>>[];
    
    // Skills 的工具
    for (final skill in _skills) {
      for (final tool in skill.tools) {
        tools.add(tool.toMCPFormat(source: 'clawhub.skill.${skill.name}'));
      }
    }
    
    // Plugins 的工具
    for (final plugin in _plugins) {
      for (final tool in plugin.tools) {
        tools.add(tool.toMCPFormat(source: 'clawhub.plugin.${plugin.name}'));
      }
    }
    
    return tools;
  }
}
```

**`cmd/lib/clawhub/skill.dart`**:
```dart
import 'dart:io';
import 'package:yaml/yaml.dart';

/// Skill 元数据（从 SKILL.md 解析）
class Skill {
  final String name;
  final String description;
  final String version;
  final List<SkillTool> tools;
  
  Skill({
    required this.name,
    required this.description,
    required this.version,
    required this.tools,
  });
  
  static Future<Skill> fromMarkdown(String path) async {
    final content = await File(path).readAsString();
    final yamlContent = _extractYamlFrontmatter(content);
    final yaml = loadYaml(yamlContent) as Map;
    
    final tools = <SkillTool>[];
    if (yaml['tools'] != null) {
      for (final toolDef in yaml['tools']) {
        tools.add(SkillTool.fromDefinition(toolDef));
      }
    }
    
    return Skill(
      name: yaml['name'] as String,
      description: yaml['description'] as String,
      version: yaml['version'] as String,
      tools: tools,
    );
  }
  
  static String _extractYamlFrontmatter(String content) {
    final match = RegExp(r'^---\n([\s\S]*?)\n---').firstMatch(content);
    return match?.group(1) ?? '';
  }
}

/// Skill 工具定义
class SkillTool {
  final String name;
  final String description;
  final Map<String, dynamic> inputSchema;
  final Function handler;
  
  SkillTool({
    required this.name,
    required this.description,
    required this.inputSchema,
    required this.handler,
  });
  
  static SkillTool fromDefinition(Map toolDef) {
    return SkillTool(
      name: toolDef['name'] as String,
      description: toolDef['description'] as String,
      inputSchema: Map<String, dynamic>.from(toolDef['inputSchema'] ?? {}),
      handler: (params) async {
        // TODO: 根据 toolDef['handler'] 动态加载和执行
        throw UnimplementedError('Handler implementation pending');
      },
    );
  }
  
  Map<String, dynamic> toMCPFormat({String source = 'unknown'}) {
    return {
      'name': name,
      'description': description,
      'inputSchema': inputSchema,
      'source': source,
    };
  }
}
```

#### 1.3 测试验证
```bash
# 1. 编译 Dart 项目
cd cmd && dart pub get
dart compile exe bin/closeclaw.dart -o closeclaw.exe

# 2. 测试 ClawHub 加载
./closeclaw.exe doctor

# 预期输出:
# 📚 共加载 26 个技能
# 🔧 共加载 0 个插件
```

---

### Phase 2: LLM 统一适配层 (3 小时) ⭐⭐

#### 2.1 目录结构
```bash
cmd/lib/adapters/
├── llm_adapter.dart      # 抽象基类 (~50 行)
├── anthropic.dart        # Claude (~50 行)
├── openrouter.dart       # 350+ 模型 (~50 行)
├── zhipu.dart            # 智谱 AI (~40 行)
├── github_models.dart    # GitHub Models (~40 行)
└── gemini.dart           # Google Gemini (~40 行)
```

#### 2.2 核心代码示例

**`cmd/lib/adapters/llm_adapter.dart`**:
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

/// LLM 适配器基类
abstract class LLMAdapter {
  final String provider;
  final String apiKey;
  final String? baseUrl;
  
  LLMAdapter({
    required this.provider,
    required this.apiKey,
    this.baseUrl,
  });
  
  /// 发送对话请求
  Future<String> chat(List<Message> messages, {
    double temperature = 0.7,
    int maxTokens = 4096,
  });
  
  /// 通用 HTTP POST 方法
  Future<Map<String, dynamic>> _postJson(String url, Map<String, dynamic> body) async {
    final response = await http.post(
      Uri.parse(url),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
      },
      body: jsonEncode(body),
    );
    
    if (response.statusCode != 200) {
      throw Exception('${provider} API error: ${response.body}');
    }
    
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}

/// 消息结构
class Message {
  final String role; // 'user' | 'assistant' | 'system'
  final String content;
  
  Message({required this.role, required this.content});
  
  Map<String, String> toJson() => {'role': role, 'content': content};
}
```

**`cmd/lib/adapters/anthropic.dart`**:
```dart
import 'llm_adapter.dart';

class AnthropicAdapter extends LLMAdapter {
  AnthropicAdapter({required String apiKey})
      : super(provider: 'anthropic', apiKey: apiKey, baseUrl: 'https://api.anthropic.com/v1');
  
  @override
  Future<String> chat(List<Message> messages, {double temperature = 0.7, int maxTokens = 4096}) async {
    final systemMessage = messages.firstWhere((m) => m.role == 'system', orElse: () => Message(role: 'system', content: ''));
    final userMessages = messages.where((m) => m.role != 'system').toList();
    
    final response = await _postJson('$baseUrl/messages', {
      'model': 'claude-sonnet-4-20250514',
      'max_tokens': maxTokens,
      'system': systemMessage.content,
      'messages': userMessages.map((m) => m.toJson()).toList(),
    });
    
    return response['content'][0]['text'] as String;
  }
}
```

**`cmd/lib/adapters/openrouter.dart`**:
```dart
import 'llm_adapter.dart';

class OpenRouterAdapter extends LLMAdapter {
  OpenRouterAdapter({required String apiKey})
      : super(provider: 'openrouter', apiKey: apiKey, baseUrl: 'https://openrouter.ai/api/v1');
  
  @override
  Future<String> chat(List<Message> messages, {double temperature = 0.7, int maxTokens = 4096}) async {
    final response = await _postJson('$baseUrl/chat/completions', {
      'model': 'meta-llama/llama-3-70b-instruct', // 默认模型
      'max_tokens': maxTokens,
      'temperature': temperature,
      'messages': messages.map((m) => m.toJson()).toList(),
    });
    
    return response['choices'][0]['message']['content'] as String;
  }
}
```

#### 2.3 适配器注册表
```dart
// cmd/lib/adapters/registry.dart
import 'llm_adapter.dart';
import 'anthropic.dart';
import 'openrouter.dart';
import 'zhipu.dart';
import 'github_models.dart';
import 'gemini.dart';

class LLMRegistry {
  static final Map<String, LLMAdapter> _adapters = {};
  
  static void register(String provider, LLMAdapter adapter) {
    _adapters[provider] = adapter;
  }
  
  static LLMAdapter get(String provider) {
    if (!_adapters.containsKey(provider)) {
      throw Exception('Unknown LLM provider: $provider');
    }
    return _adapters[provider]!;
  }
  
  static List<String> listProviders() => _adapters.keys.toList();
}

/// 初始化所有内置适配器
void initBuiltinAdapters() {
  final env = Platform.environment;
  
  if (env['ANTHROPIC_API_KEY'] != null) {
    LLMRegistry.register('anthropic', AnthropicAdapter(apiKey: env['ANTHROPIC_API_KEY']!));
  }
  
  if (env['OPENROUTER_API_KEY'] != null) {
    LLMRegistry.register('openrouter', OpenRouterAdapter(apiKey: env['OPENROUTER_API_KEY']!));
  }
  
  // ... 其他适配器
}
```

---

### Phase 3: MCP Server 增强 (1 小时) ⭐

#### 3.1 更新 `cmd/lib/core/mcp_server.dart`

```dart
import '../clawhub/hub.dart';
import 'package:mcp_server_sdk/mcp_server_sdk.dart';

class McpServer {
  final ClawLogger log;
  final ClawHub _hub;
  late final Server _server;
  
  McpServer({required this.log, required this.hub});
  
  Future<void> run() async {
    _server = Server(
      name: 'CloseClaw',
      version: '1.0.0',
    );
    
    // 注册工具列表（动态从 ClawHub 获取）
    _server.addMethod('tools/list', (params) async {
      final tools = _hub.listAllTools();
      log.debug('📋 MCP tools/list - ${tools.length} tools');
      return {'tools': tools};
    });
    
    // 执行工具（委托给 ClawHub）
    _server.addMethod('tools/call', (params) async {
      final name = params['name'] as String;
      final args = params['arguments'] as Map<String, dynamic>;
      
      try {
        log.info('🛠️ MCP tools/call: $name');
        final result = await _hub.executeTool(name, args);
        return {'content': [result.toContent()]};
      } catch (e) {
        log.error('❌ Tool execution failed: $name - $e');
        return {'error': e.toString()};
      }
    });
    
    // 资源读取（支持 gitnexus:// 协议）
    _server.addMethod('resources/read', (params) async {
      final uri = params['uri'] as String;
      
      if (uri.startsWith('gitnexus://')) {
        // 委托给 GitNexus Skill 处理
        return await _hub.executeTool('gitnexus_read', {'uri': uri});
      }
      
      throw Exception('Unsupported resource URI: $uri');
    });
    
    // 启动服务器
    log.info('🚀 MCP Server starting...');
    await _server.listen(
      stdin: StreamController<List<int>>(),
      stdout: StreamSink<List<int>>(),
    );
  }
}
```

---

### Phase 4: TS 层精简 (1 小时) ⭐⭐

#### 4.1 删除冗余文件

```bash
# 删除 LLM 适配器（已由 Dart 统一处理）
rm src/adapters/anthropic.ts
rm src/adapters/openai.ts
rm src/adapters/openrouter.ts
rm src/adapters/registry.ts

# 删除工具注册系统（已由 ClawHub 统一管理）
rm src/tools/registry.ts
rm src/tools/mcp-bridge.ts

# 合并沙盒层
rm src/sandbox/manager.ts
# 精简 process-executor.ts (275 行 → 200 行)
```

#### 4.2 保留核心功能

**保留的文件**:
- ✅ `src/adapters/telegram.ts` - Telegram Bot SDK (Node.js 特有)
- ✅ `src/adapters/swarm-bot.ts` - Swarm Bots 处理
- ✅ `src/sandbox/process-executor.ts` (精简版) - 进程执行
- ✅ `src/utils/fs-cleanup.ts` - 临时文件清理

---

## 📊 影响分析

### 正面影响

#### 1. **代码分布更合理**
```
调整前: Dart 31% vs TS 39%
调整后: Dart 51% vs TS 30%  ← 更符合"控制平面"定位
```

#### 2. **生态整合完成**
- ✅ ClawHub 统一管理 26+ 个 Skills 和未来 Plugins
- ✅ MCP 支持动态工具发现
- ✅ CC 插件格式兼容

#### 3. **维护成本降低**
- ✅ LLM API 集中管理（无需维护两套代码）
- ✅ 工具注册统一（ClawHub 单一入口）
- ✅ TS 层更轻量（专注执行）

#### 4. **独立性增强**
- ✅ Dart 编译后可独立运行（包含所有 LLM 适配器）
- ✅ TS 退化为纯执行器（降级影响可控）

### 潜在风险

#### 1. **总代码量增加** (+400 行)
- **缓解**: 新增代码集中在 Dart 层，带来生态能力质变

#### 2. **需要维护 Dart LLM 适配器**
- **缓解**: 仅需维护 5-7 个核心适配器，其他通过 OpenRouter 覆盖

#### 3. **TS 层删除可能影响现有功能**
- **缓解**: 仅删除冗余代码，核心功能保留并测试

---

## 📋 验收标准

### Phase 1 (ClawHub Core)
- [ ] `closeclaw doctor` 显示 "✅ 共加载 26 个技能"
- [ ] `.claude/skills/gitnexus/exploring/SKILL.md` 成功加载
- [ ] `.claude/skills/generated/` 下 20 个技能全部识别

### Phase 2 (LLM 统一)
- [ ] `ANTHROPIC_API_KEY` 配置后，Dart 可调用 Claude API
- [ ] `OPENROUTER_API_KEY` 配置后，可使用 350+ 模型
- [ ] TS 层不再直接调用 LLM API

### Phase 3 (MCP 增强)
- [ ] IDE 连接后可见完整工具列表（含来源标注）
- [ ] 执行 `gitnexus_query` 成功返回代码搜索结果
- [ ] MCP 日志显示 "🛠️ MCP tools/call: xxx"

### Phase 4 (TS 精简)
- [ ] 删除的 6 个文件不影响核心功能
- [ ] TS 代码量从 1,200 行降至~800 行
- [ ] 沙盒执行正常（代码大小限制、超时控制）

---

### 投票记录

> **权重计算说明**:
> - 协作主体：赞成 +1 / 反对 +2 / 弃权 0
> - 用户：±0.5n（n = **参与投票的协作主体总数**，不含创建者自动赞同）
> - 提案创建者默认自动赞同 (+1)，计入法定人数但不重复投票

#### 👤 创建者 (Lingma, 2026-04-02)
**投票**: ✅ 自动赞同 (+1)
**备注**: 提案本身已表达支持立场

---

#### Codex（2026-04-01）
**投票**: 👎 反对 (+2)

**理由**:
1. 该提案属于三级架构调整，但当前文档未给出可执行的"渐进迁移切片"与"回滚开关"定义，直接进行 `+800/-400` 级别跨层迁移，回归风险偏高
2. 提案将 LLM 统一上移到 Dart 后，鉴权、速率限制、失败重试、provider 差异适配都会集中在控制平面；若无完整契约测试，容易形成新的单点故障
3. 当前仓库仍存在大量未收敛变更，且 P031 处于刚通过后的整合阶段。此时并行推进 P032 会提高冲突概率，影响核心链路稳定性
4. 元数据存在时间不一致：文档写明创建日期为 `2026-04-02`，而本次投票日期为 `2026-04-01`，建议先校准时间基准再进入三级表决

**改进建议**:
- 先拆为两个二级提案：`P032-A(ClawHub Core + MCP 动态发现)`、`P032-B(LLM 统一上移 + TS 精简)`
- 每个子提案必须附带：接口契约测试清单、性能基线对比、L1/L2/L3 降级演练脚本、可一键回滚方案
- 在 `Phase 1` 完成后再发起 `Phase 2` 投票，避免一次性跨层重构

---

#### Kiro（2026-04-01）
**投票**: ➖ 弃权 (0)

**理由**:
1. **方向正确,时机不当**: 提案符合P027架构演进方向,但P031刚完成,系统处于稳定期,不宜立即启动大规模重构
2. **风险偏高**: 跨层迁移(+800/-400行)影响面广,缺乏渐进迁移方案和回滚机制
3. **文档不完整**: 无性能基线对比、无完整测试计划、无与P031的冲突分析
4. **时间线异常**: 创建日期2026-04-02但投票日期2026-04-01,存在时间倒置

**改进建议**:
- 采纳Codex建议,拆分为P032-A(ClawHub Core)和P032-B(LLM上移)两个二级提案
- 补充迁移计划、回滚方案、性能对比、测试清单
- 建议P031稳定1-2周后再启动P032-A

**替代方案**: 如急需生态能力,仅实施Phase 1(ClawHub Core),不动LLM和TS层

**结论**: 提案有长期价值，但当前缺乏风险控制，建议完善后重新提交

---

> **当前统计**: 已收到 3 票（含创建者自动赞同），累计分数 +3。
> **用户权重**: ±0.5 × 2 = ±1.0（n = 2，Codex + Kiro 实际投票）
> 还需≥3 名协作主体投票才能达到法定人数 (≥6 票) 并形成有效决议。

## 📚 相关文档

- [P027: 三语言异构微内核架构](./proposal-027-dart-go-ts-ultra-simplified.md) ✅ 已通过
- [docs/07-roadmap/future-plan.md](../docs/07-roadmap/future-plan.md) - ClawHub Skill 支持 (P0 优先级)
- [CLAUDE.md](../CLAUDE.md) - GitNexus MCP 工具使用规范
- [AGENTS.md](../AGENTS.md) - 完整开发指南

---

## 🎉 里程碑意义

P032 的实施标志着 CloseClaw 正式完成**从"三语言原型"到"生态化产品"的演进**:

1. **生态整合**: ClawHub 统一管理 Skills 和 Plugins，形成开放生态
2. **架构成熟**: Dart 控制平面真正承担起"外交官"职责
3. **商业价值**: CC 插件兼容打开第三方扩展市场
4. **可维护性**: 职责清晰、代码分布合理、易于扩展

---

> **CloseClaw - 公平、透明、高效的多智能体协作** 🚀  
> **生态化架构，启航！** 
