# 根目录清理 Bugfix Design

## Overview

根目录存在大量临时脚本、文档和输出文件，违反了项目文件结构规范（docs/04-reference/file-structure.md）。这些临时文件污染了项目根目录，降低了项目的可维护性和专业性。本次修复将系统性地清理这些临时文件，并更新 .gitignore 规则以防止未来再次出现类似问题。

修复策略采用"删除为主，保留为辅"的原则：
- 删除所有明确的临时文件（临时脚本、输出文件、测试文件）
- 删除不明用途的文件（tash'、logs-*.zip）
- 保留所有核心配置文件和标准目录结构
- 增强 .gitignore 规则以预防未来污染

## Glossary

- **Bug_Condition (C)**: 根目录存在不符合项目文件结构规范的临时文件
- **Property (P)**: 根目录应该只包含核心配置文件和标准目录，所有临时文件应被清理
- **Preservation**: 核心配置文件（package.json, tsconfig.json, README.md, RULES.md, SECURITY.md, .env.example, .gitignore, vitest.config.ts）和标准目录（src/, docs/, scripts/, templates/, votes/, tests/ 等）必须保持不变
- **临时 Python 脚本**: 根目录中用于临时测试或数据处理的 .py 文件（add_vote_temp.py, add_vote.py, addvote.py, find_line_count.py, find_votes.py, find_votes2.py, read_txt.py, read_vote.py）
- **临时 JavaScript 文件**: 根目录中用于临时测试的 .js 文件（findcodex.js, js1.js, script.js, temp.js）
- **临时文档**: 根目录中的临时 Markdown 和文本文件（clean_vote.md, final_check.md, original.md, walkthrough.md, votes_content_copy.txt, votes_content.txt, votes_out.txt, encoding_check.txt）
- **不明文件**: 用途不明的文件（tash'）和临时日志压缩包（logs-*.zip）
- **项目文件结构规范**: docs/04-reference/file-structure.md 中定义的标准文件组织方式

## Bug Details

### Bug Condition

根目录污染发生在开发过程中创建了临时文件但未及时清理，且 .gitignore 规则不够完善，无法自动忽略这些临时文件。

**Formal Specification:**
```
FUNCTION isBugCondition(file)
  INPUT: file of type FileSystemEntry
  OUTPUT: boolean
  
  RETURN file.location == "root_directory"
         AND (
           file.name IN ['add_vote_temp.py', 'add_vote.py', 'addvote.py', 
                         'find_line_count.py', 'find_votes.py', 'find_votes2.py',
                         'read_txt.py', 'read_vote.py',
                         'findcodex.js', 'js1.js', 'script.js', 'temp.js',
                         'clean_vote.md', 'final_check.md', 'original.md', 'walkthrough.md',
                         'votes_content_copy.txt', 'votes_content.txt', 'votes_out.txt',
                         'encoding_check.txt', "tash'"]
           OR file.name MATCHES 'logs-*.zip'
         )
         AND file.type == "regular_file"
END FUNCTION
```

### Examples

- **临时投票脚本**: `add_vote_temp.py`, `add_vote.py`, `addvote.py` - 这些是重复的临时脚本，用于处理投票文件，应该被删除
- **临时查找脚本**: `find_votes.py`, `find_votes2.py`, `read_vote.py` - 临时数据处理脚本，应该被删除
- **临时 JavaScript**: `findcodex.js`, `temp.js` - 临时测试文件，应该被删除
- **临时文档**: `clean_vote.md`, `final_check.md` - 临时记录文档，应该被删除
- **临时输出**: `votes_content.txt`, `encoding_check.txt` - 脚本输出文件，应该被删除
- **不明文件**: `tash'` - 用途不明，应该被删除
- **临时日志**: `logs-*.zip` - 临时日志压缩包，应该被删除

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- 核心配置文件必须保留：package.json, tsconfig.json, README.md, RULES.md, SECURITY.md, .env.example, .gitignore, vitest.config.ts
- 标准目录结构必须保留：src/, docs/, scripts/, templates/, votes/, tests/, data/, dist/, gh_bin/
- IDE 和工具配置目录必须保留：.arts/, .codeartsdoer/, .dropstone/, .git/, .github/, .husky/, .idea/, .jules/, .kiro/, .lingma/, .qoder/
- .gitignore 中现有的忽略规则必须继续生效
- scripts/ 目录中的现有脚本必须继续正常工作

**Scope:**
所有不在临时文件列表中的文件和目录应该完全不受影响。这包括：
- 所有核心配置文件
- 所有标准项目目录
- 所有 IDE 配置目录
- scripts/ 目录中的工具脚本（git-utils.sh, init-dev-dir.sh 等）

## Hypothesized Root Cause

基于 bug 描述和文件分析，根目录污染的主要原因是：

1. **开发过程中的临时文件未清理**: 开发者在调试或测试时创建了临时脚本和输出文件，但完成后未及时删除
   - 投票相关的临时脚本（add_vote*.py, find_votes*.py）
   - 临时测试脚本（temp.js, script.js）
   - 临时输出文件（votes_content*.txt, encoding_check.txt）

2. **.gitignore 规则不够完善**: 当前 .gitignore 缺少对临时文件的通用匹配规则
   - 缺少对 *_temp.* 模式的忽略
   - 缺少对 *_copy.* 模式的忽略
   - 缺少对 temp.* 模式的忽略
   - 缺少对 *.txt（根目录）的忽略

3. **文件命名不规范**: 一些文件使用了不规范的命名（如 tash'），可能是误操作产生的

4. **缺少清理流程**: 项目缺少定期清理临时文件的流程或检查机制

## Correctness Properties

Property 1: Bug Condition - 根目录临时文件清理

_For any_ 文件位于根目录且属于临时文件列表（临时脚本、临时文档、临时输出、不明文件），清理操作 SHALL 将该文件从文件系统中删除，使根目录符合项目文件结构规范。

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

Property 2: Preservation - 核心文件和目录保留

_For any_ 文件或目录不在临时文件列表中（核心配置文件、标准目录、IDE 配置目录），清理操作 SHALL 完全不修改这些文件和目录，保持项目的核心结构和功能完整性。

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

假设我们的根本原因分析是正确的：

**File**: 根目录多个文件 + `.gitignore`

**Function**: 文件系统清理操作 + .gitignore 规则更新

**Specific Changes**:

1. **删除临时 Python 脚本**:
   - 删除 `add_vote_temp.py`
   - 删除 `add_vote.py`
   - 删除 `addvote.py`
   - 删除 `find_line_count.py`
   - 删除 `find_votes.py`
   - 删除 `find_votes2.py`
   - 删除 `read_txt.py`
   - 删除 `read_vote.py`

2. **删除临时 JavaScript 文件**:
   - 删除 `findcodex.js`
   - 删除 `js1.js`（如果存在）
   - 删除 `script.js`（如果存在）
   - 删除 `temp.js`（如果存在）

3. **删除临时 Markdown 文档**:
   - 删除 `clean_vote.md`
   - 删除 `final_check.md`
   - 删除 `original.md`（如果存在）
   - 删除 `walkthrough.md`（如果存在）

4. **删除临时输出文本文件**:
   - 删除 `votes_content_copy.txt`（如果存在）
   - 删除 `votes_content.txt`（如果存在）
   - 删除 `votes_out.txt`（如果存在）
   - 删除 `encoding_check.txt`

5. **删除不明文件和临时日志**:
   - 删除 `tash'`（如果存在）
   - 删除所有 `logs-*.zip` 文件

6. **更新 .gitignore 规则**:
   在 `.gitignore` 文件中添加以下规则（在 "# Temporary files" 部分）：
   ```gitignore
   # Temporary files
   *.tmp
   *.temp
   .cache/
   *_temp.*
   temp.*
   *_copy.*
   *_out.*
   
   # Root directory temporary files
   /*.txt
   /*.py
   /*.js
   /*.md
   !README.md
   !RULES.md
   !SECURITY.md
   !CHANGELOG.md
   ```

## Testing Strategy

### Validation Approach

测试策略采用两阶段方法：首先验证临时文件确实存在于根目录（探索性检查），然后验证清理操作正确删除了临时文件且保留了核心文件（修复检查和保留检查）。

### Exploratory Bug Condition Checking

**Goal**: 在执行清理操作之前，确认临时文件确实存在于根目录，验证 bug 的存在。

**Test Plan**: 列出根目录的所有文件，检查是否存在临时文件列表中的文件。这将在未修复的状态下运行，以确认 bug 的存在。

**Test Cases**:
1. **临时 Python 脚本存在性检查**: 检查 add_vote_temp.py, add_vote.py, addvote.py 等文件是否存在（预期：存在）
2. **临时 JavaScript 文件存在性检查**: 检查 findcodex.js, temp.js 等文件是否存在（预期：部分存在）
3. **临时文档存在性检查**: 检查 clean_vote.md, final_check.md 等文件是否存在（预期：存在）
4. **临时输出文件存在性检查**: 检查 votes_content.txt, encoding_check.txt 等文件是否存在（预期：部分存在）
5. **.gitignore 规则检查**: 检查 .gitignore 是否包含临时文件忽略规则（预期：不包含）

**Expected Counterexamples**:
- 根目录存在多个临时 Python 脚本文件
- 根目录存在临时 JavaScript 和 Markdown 文件
- .gitignore 缺少对临时文件的通用匹配规则

### Fix Checking

**Goal**: 验证对于所有属于临时文件列表的文件，清理操作成功将其删除。

**Pseudocode:**
```
FOR ALL file WHERE isBugCondition(file) DO
  result := cleanupOperation(file)
  ASSERT file_not_exists(file.path)
END FOR

ASSERT gitignore_contains_temp_file_rules()
```

**Test Cases**:
1. **临时脚本删除验证**: 验证所有临时 Python 和 JavaScript 脚本已被删除
2. **临时文档删除验证**: 验证所有临时 Markdown 和文本文件已被删除
3. **不明文件删除验证**: 验证 tash' 和 logs-*.zip 已被删除
4. **.gitignore 更新验证**: 验证 .gitignore 包含新的临时文件忽略规则

### Preservation Checking

**Goal**: 验证对于所有不在临时文件列表中的文件和目录，清理操作完全不影响它们。

**Pseudocode:**
```
FOR ALL file WHERE NOT isBugCondition(file) DO
  ASSERT file_unchanged(file)
END FOR
```

**Testing Approach**: 属性测试推荐用于保留检查，因为：
- 它可以自动生成大量测试用例覆盖所有核心文件
- 它可以捕获手动单元测试可能遗漏的边缘情况
- 它提供了强有力的保证，确保所有非临时文件保持不变

**Test Plan**: 在清理操作前后，记录所有核心文件和目录的状态，验证它们保持不变。

**Test Cases**:
1. **核心配置文件保留**: 验证 package.json, tsconfig.json, README.md, RULES.md, SECURITY.md, .env.example, .gitignore, vitest.config.ts 未被修改
2. **标准目录保留**: 验证 src/, docs/, scripts/, templates/, votes/, tests/ 等目录及其内容未被修改
3. **IDE 配置目录保留**: 验证 .arts/, .git/, .github/, .husky/, .idea/, .kiro/ 等目录未被修改
4. **scripts/ 目录脚本功能**: 验证 scripts/git-utils.sh, scripts/init-dev-dir.sh 等脚本仍然可以正常执行
5. **.gitignore 现有规则**: 验证 .gitignore 中现有的忽略规则（node_modules/, dist/, .env 等）继续生效

### Unit Tests

- 测试临时文件识别逻辑（isBugCondition 函数）
- 测试文件删除操作的正确性
- 测试 .gitignore 规则更新的正确性
- 测试核心文件保留逻辑

### Property-Based Tests

- 生成随机文件列表，验证只有临时文件被删除
- 生成随机核心文件路径，验证它们在清理后保持不变
- 测试 .gitignore 规则对各种临时文件命名模式的匹配

### Integration Tests

- 完整的清理流程测试：列出文件 → 识别临时文件 → 删除 → 验证结果
- 测试清理后项目结构符合 docs/04-reference/file-structure.md 规范
- 测试清理后 git status 不显示未跟踪的临时文件
- 测试 scripts/ 目录中的脚本在清理后仍然正常工作
