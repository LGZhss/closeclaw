# Bugfix Requirements Document

## Introduction

根目录存在大量临时 Python 脚本、JavaScript 文件和临时文档，这些文件污染了项目根目录，影响项目整洁度和可维护性。根据项目文件结构规范（docs/04-reference/file-structure.md），根目录应该只包含项目核心配置文件，脚本应该统一放在 scripts/ 目录。

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN 查看项目根目录 THEN 存在多个重复的临时 Python 投票脚本（add_vote_temp.py, add_vote.py, addvote.py）

1.2 WHEN 查看项目根目录 THEN 存在多个临时查找/统计 Python 脚本（find_line_count.py, find_votes.py, find_votes2.py, read_txt.py, read_vote.py）

1.3 WHEN 查看项目根目录 THEN 存在多个临时 JavaScript 文件（findcodex.js, js1.js, script.js, temp.js）

1.4 WHEN 查看项目根目录 THEN 存在多个临时 Markdown 文档（clean_vote.md, final_check.md, original.md, walkthrough.md）

1.5 WHEN 查看项目根目录 THEN 存在多个临时输出文本文件（votes_content_copy.txt, votes_content.txt, votes_out.txt, encoding_check.txt）

1.6 WHEN 查看项目根目录 THEN 存在不明文件（tash'）和临时日志压缩包（logs-*.zip）

1.7 WHEN 检查 .gitignore THEN 缺少对临时脚本文件（*.py, *.js）和临时文档（*_temp.*, temp.*, *_copy.*）的忽略规则

### Expected Behavior (Correct)

2.1 WHEN 查看项目根目录 THEN 不应存在临时 Python 脚本文件，这些文件应该被删除或移动到 scripts/ 目录

2.2 WHEN 查看项目根目录 THEN 不应存在临时 JavaScript 文件，这些文件应该被删除

2.3 WHEN 查看项目根目录 THEN 不应存在临时 Markdown 文档，这些文件应该被删除或移动到 docs/ 相应目录

2.4 WHEN 查看项目根目录 THEN 不应存在临时输出文本文件，这些文件应该被删除

2.5 WHEN 查看项目根目录 THEN 不应存在不明文件和临时日志压缩包，这些文件应该被删除

2.6 WHEN 检查 .gitignore THEN 应该包含对临时文件的忽略规则，防止未来临时文件被提交

2.7 WHEN 根目录需要临时脚本 THEN 应该将有价值的脚本移动到 scripts/ 目录并添加适当的文档说明

### Unchanged Behavior (Regression Prevention)

3.1 WHEN 查看项目根目录 THEN 核心配置文件（package.json, tsconfig.json, README.md, RULES.md, SECURITY.md, .env.example, .gitignore, vitest.config.ts）应该继续保留

3.2 WHEN 查看项目根目录 THEN 核心目录（src/, docs/, scripts/, templates/, votes/, tests/ 等）应该继续保留

3.3 WHEN 查看 .gitignore THEN 现有的忽略规则应该继续生效

3.4 WHEN 开发者需要运行项目脚本 THEN scripts/ 目录中的现有脚本应该继续正常工作

3.5 WHEN 查看项目文档 THEN docs/04-reference/file-structure.md 中定义的文件结构规范应该继续有效
