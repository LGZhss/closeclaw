/// AuditRelay — voter.js + arbitrator.js 的强类型精简替代
/// 实现与旧版 VotingEngine 完全相同的得分算法：
///   - ideScore = Σ ideVotes
///   - userScore = ideVotes.length * 0.5 * userVote  （与 voter.js L107 一致）
///   - totalScore = ideScore + userScore
///   - passed = totalScore > opposedCount && quorumMet
/// 去除：内存 Map 状态存储（状态交由 Go SQLite 管理）
///       复杂的 arbitrator 争议逻辑（在本架构中无必要）
library;

import 'dart:convert';
import 'dart:io';
import 'package:uuid/uuid.dart';
import 'logger.dart';

/// 法定人数门控（对应 RULES.md）
const Map<int, int> _quorum = {1: 2, 2: 5, 3: 8};

/// 协作主体权重（赞同/反对）
const double _ideWeight = 1.0;

/// 协作主体信息（从 .subjects.json 解析）
class Subject {
  final String name;
  final String role; // "collaborator" | "cloud"
  const Subject({required this.name, required this.role});
}

/// 单次投票记录
class VoteRecord {
  final String subjectName;
  final int vote; // +1 赞同 / 0 弃权 / -1 反对
  final String reason;
  final DateTime castAt;

  VoteRecord({
    required this.subjectName,
    required this.vote,
    required this.reason,
    DateTime? castAt,
  }) : castAt = castAt ?? DateTime.now();
}

/// 投票计算结果（完整语义与 voter.js calculateResult 对齐）
class VoteResult {
  final String proposalId;
  final int level;
  final double ideScore;
  final double userScore;
  final double totalScore;
  final int opposedCount;
  final int actualParticipants;
  final int requiredQuorum;
  final bool quorumMet;
  final bool passed;
  final DateTime completedAt;

  const VoteResult({
    required this.proposalId,
    required this.level,
    required this.ideScore,
    required this.userScore,
    required this.totalScore,
    required this.opposedCount,
    required this.actualParticipants,
    required this.requiredQuorum,
    required this.quorumMet,
    required this.passed,
    required this.completedAt,
  });

  @override
  String toString() {
    final status = passed ? '✅ 已通过' : '❌ 未通过';
    return '$status | ideScore=$ideScore userScore=$userScore total=$totalScore '
        '反对=$opposedCount 参与=$actualParticipants 法定=$requiredQuorum';
  }
}

/// AuditRelay 是 Dart 控制平面中唯一负责投票审计的组件。
/// Phase1 阶段维持纯内存计算（状态持久化由 Phase2 的 Go SQLite 接管）。
class AuditRelay {
  final ClawLogger log;
  final bool quiet;
  final _uuid = const Uuid();

  List<Subject> subjects = [];

  AuditRelay({required this.log, this.quiet = false});

  // ─────────────────────────────────────────
  // 初始化：读取 .subjects.json
  // ─────────────────────────────────────────

  /// 从项目根目录的 .subjects.json 加载协作主体注册表。
  /// 支持向上查找（从 cmd/ 目录执行时也能定位到根目录）。
  Future<void> loadSubjects() async {
    final rootFile = _locateSubjectsFile();
    if (rootFile == null) {
      throw FileSystemException('.subjects.json 未找到，请确认在 CloseClaw 根目录运行');
    }

    final raw = json.decode(await rootFile.readAsString()) as Map<String, dynamic>;
    final data = raw['subjects'] as Map<String, dynamic>;

    subjects = [
      ...(data['collaborators'] as List).map(
        (n) => Subject(name: n as String, role: 'collaborator'),
      ),
      ...(data['cloud'] as List? ?? []).map(
        (n) => Subject(name: n as String, role: 'cloud'),
      ),
    ];

    if (!quiet) log.info('已加载协作主体: ${subjects.length} 个（${data['collaborators']}长度 协作者 + ${(data['cloud'] as List?)?.length ?? 0} 云端）');
  }

  // ─────────────────────────────────────────
  // 核心算法（精确对齐 voter.js L94-L147）
  // ─────────────────────────────────────────

  /// calculateResult 等价于 voter.js VotingEngine.calculateResult()。
  /// [proposalId] 提案 ID，[level] 决议级别（1-3），[ideVotes] 协作主体票，[userVote] 用户票（null = 未投）。
  VoteResult calculateResult({
    required String proposalId,
    required int level,
    required List<VoteRecord> ideVotes,
    int? userVote, // +1 / 0 / -1
  }) {
    if (level < 1 || level > 3) throw ArgumentError('决议级别必须为 1-3，当前: $level');

    // ideScore = Σ votes（与 voter.js L102 一致，+1/-1/0 直接求和）
    final ideScore = ideVotes.fold<double>(0, (sum, v) => sum + v.vote * _ideWeight);

    // userScore = ideVotes.length * 0.5 * userVote（voter.js L107）
    final userScore = userVote != null
        ? ideVotes.length * 0.5 * userVote
        : 0.0;

    final totalScore = ideScore + userScore;

    // 反对票数（用于通过判断条件）
    final opposedCount = ideVotes.where((v) => v.vote == -1).length;

    final requiredQuorum = _quorum[level] ?? 999;
    final quorumMet = ideVotes.length >= requiredQuorum;

    // passed = totalScore > opposedCount && quorumMet（voter.js L122）
    final passed = totalScore > opposedCount && quorumMet;

    final result = VoteResult(
      proposalId: proposalId,
      level: level,
      ideScore: ideScore,
      userScore: userScore,
      totalScore: totalScore,
      opposedCount: opposedCount,
      actualParticipants: ideVotes.length,
      requiredQuorum: requiredQuorum,
      quorumMet: quorumMet,
      passed: passed,
      completedAt: DateTime.now(),
    );

    if (!quiet) {
      log.info('[AuditRelay] 提案 $proposalId 计算完成: $result');
    }
    return result;
  }

  // ─────────────────────────────────────────
  // TraceID 生成（Dart 层输出 UUID v4）
  // ─────────────────────────────────────────

  /// 生成 UUID v4 格式的分布式追踪 ID，透传至 Go 内核。
  String generateTraceId() => _uuid.v4();

  // ─────────────────────────────────────────
  // 内部工具
  // ─────────────────────────────────────────

  /// 向上查找 .subjects.json（最多三级目录）
  File? _locateSubjectsFile() {
    var dir = Directory.current;
    for (var i = 0; i < 4; i++) {
      final f = File('${dir.path}/.subjects.json');
      if (f.existsSync()) return f;
      dir = dir.parent;
    }
    return null;
  }
}
