// cmd/lib/cc_parser.dart — CloseClaw 插件 (SKILL.md) 解析器
import 'dart:io';
import 'package:yaml/yaml.dart';

class SkillMetadata {
  final String name;
  final String description;
  final List<String> authors;

  SkillMetadata({required this.name, required this.description, this.authors = const []});
}

class CCParser {
  /// 解析 SKILL.md 中的 YAML Frontmatter
  static SkillMetadata? parseSkill(String filePath) {
    final file = File(filePath);
    if (!file.existsSync()) return null;

    final content = file.readAsStringSync();
    final firstIndex = content.indexOf('---');
    if (firstIndex == -1) return null;

    final secondIndex = content.indexOf('---', firstIndex + 3);
    if (secondIndex == -1) return null;

    final yamlText = content.substring(firstIndex + 3, secondIndex);
    try {
      final yaml = loadYaml(yamlText);
      return SkillMetadata(
        name: yaml['name'] ?? 'Unknown',
        description: yaml['description'] ?? '',
        authors: yaml['authors'] != null ? List<String>.from(yaml['authors']) : [],
      );
    } catch (e) {
      print('解析 YAML 失败: $e');
      return null;
    }
  }
}
