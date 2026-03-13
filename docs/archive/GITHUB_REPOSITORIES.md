# GitHub 仓库地址记录 (GitHub Repositories Registry)

> **创建日期**: 2026-03-12
> **目的**: 记录项目中引用的所有GitHub仓库地址
> **更新频率**: 随项目更新同步

---

## 📦 核心依赖仓库

### 1. GitNexus - 代码智能分析工具

- **仓库地址**: https://github.com/example/gitnexus
- **用途**: 代码库分析、影响评估、代码理解
- **在项目中的使用**:
  - 代码智能分析和影响评估
  - 代码理解和重构建议
  - 执行流程追踪

**相关文件**:
- `CLAUDE.md` - GitNexus使用指南
- `.gitnexus/` - GitNexus索引目录

---

### 2. Agent SDK - CodeBuddy Agent SDK

- **仓库地址**: https://www.codebuddy.ai/docs/zh/cli/sdk-typescript
- **用途**: TypeScript SDK,用于创建自定义Agent应用
- **在项目中的使用**:
  - Agent应用开发
  - Query API和Session API
  - 多Provider适配

**相关文档**:
- `docs/ANTIGRAVITY_KIT_GUIDE.md` - 包含SDK使用指南

---

### 3. CLI-Anything - 命令行工具集成

- **仓库地址**: https://github.com/HKUDS/CLI-Anything
- **用途**: 命令行界面交互工具
- **在项目中的使用**:
  - 集成到AgentOS系统
  - 提供CLI交互能力

**相关文件**:
- `src/agent/tools/cliAnything.js` - CLI-Anything工具适配器
- `closeclaw_refactor_plan/essentials/` - 包含相关文件

---

## 🛠️ Node.js依赖库

### 4. node-fetch - HTTP请求库

- **仓库地址**: https://github.com/node-fetch/node-fetch
- **用途**: Node.js HTTP请求
- **在项目中的使用**:
  - 所有HTTP客户端请求
  - API调用

**依赖声明**: `package.json`

---

### 5. dotenv - 环境变量管理

- **仓库地址**: https://github.com/motdotla/dotenv
- **用途**: 从.env文件加载环境变量
- **在项目中的使用**:
  - 管理API密钥
  - 配置管理

**依赖声明**: `package.json`

---

### 6. winston - 日志管理

- **仓库地址**: https://github.com/winstonjs/winston
- **用途**: 多传输日志库
- **在项目中的使用**:
  - 系统日志
  - 错误追踪

**依赖声明**: `package.json`

---

## 🤖 AI/LLM相关仓库

### 7. OpenAI Node.js SDK

- **仓库地址**: https://github.com/openai/openai-node
- **用途**: OpenAI API官方Node.js SDK
- **在项目中的使用**:
  - OpenAI API调用
  - GPT模型交互

**相关文件**:
- `src/adapters/openai.js` - OpenAI适配器

---

### 8. Anthropic TypeScript SDK

- **仓库地址**: https://github.com/anthropics/anthropic-typescript
- **用途**: Anthropic API官方TypeScript SDK
- **在项目中的使用**:
  - Claude API调用
  - Claude模型交互

**相关文件**:
- `src/adapters/claude.js` - Claude适配器

---

### 9. Google AI Node.js SDK

- **仓库地址**: https://github.com/google/generative-ai-js
- **用途**: Google AI API官方Node.js SDK
- **在项目中的使用**:
  - Gemini API调用
  - Gemini模型交互

**相关文件**:
- `src/adapters/gemini.js` - Gemini适配器

---

### 10. 智谱AI JavaScript SDK

- **仓库地址**: https://github.com/zhipuai/zhipuai-javascript
- **用途**: 智谱AI官方JavaScript SDK
- **在项目中的使用**:
  - GLM模型API调用
  - 智谱模型交互

**相关文件**:
- `src/adapters/zhipu.js` - 智谱适配器

---

### 11. 硅基流动 API

- **仓库地址**: (未公开,内部API)
- **用途**: 硅基流动LLM API
- **在项目中的使用**:
  - DeepSeek模型API调用
  - 硅基模型交互

**相关文件**:
- `src/adapters/siliconflow.js` - 硅基流动适配器

---

### 12. Cerebras API

- **仓库地址**: (未公开,内部API)
- **用途**: Cerebras LLM API
- **在项目中的使用**:
  - gpt-oss-120b模型API调用
  - Cerebras模型交互

**相关文件**:
- `src/adapters/cerebras.js` - Cerebras适配器

---

### 13. ModelScope API

- **仓库地址**: https://github.com/modelscope/modelscope
- **用途**: 魔搭社区API
- **在项目中的使用**:
  - GLM-5、MiniMax-M2.5、Qwen3.5-397B模型调用
  - ModelScope模型交互

**相关文件**:
- `src/adapters/modelscope.js` - ModelScope适配器

---

### 14. Poixe API

- **仓库地址**: (未公开,内部API)
- **用途**: Poixe LLM API
- **在项目中的使用**:
  - GPT-4.1mini模型API调用
  - Poixe模型交互

**相关文件**:
- `src/adapters/poixe.js` - Poixe适配器

---

### 15. OpenRouter API

- **仓库地址**: https://openrouter.ai/
- **用途**: OpenRouter LLM聚合API
- **在项目中的使用**:
  - StepFun模型API调用
  - 多模型路由

**相关文件**:
- `src/adapters/openrouter.js` - OpenRouter适配器

---

## 🧩 工具和插件仓库

### 16. isolated-vm - Node.js沙盒隔离

- **仓库地址**: https://github.com/laverdet/isolated-vm
- **用途**: Node.js的V8 Isolate级别沙盒
- **在项目中的使用**:
  - 计划用于沙盒隔离实现
  - 安全执行环境

**相关文档**:
- `closeclaw_refactor_plan/重构分析与改进策略报告.md` - 提及使用isolated-vm

---

### 17. vm2 - 轻量级虚拟机

- **仓库地址**: https://github.com/patriksimek/vm2
- **用途**: 轻量级Node.js虚拟机
- **在项目中的使用**:
  - isolated-vm的替代方案
  - 备选沙盒方案

**相关文档**:
- `closeclaw_refactor_plan/votes/ROUND1_VOTES_SUMMARY.md` - 提及为替代方案

---

### 18. Lucide Icons - 图标库

- **仓库地址**: https://github.com/lucide-icons/lucide
- **用途**: 1000+ SVG图标库
- **在项目中的使用**:
  - UI图标
  - 图标下载和定制

**相关文档**:
- `docs/IDE_PROMPT_GUIDE.md` - 提及使用Lucide Icons

---

### 19. Prettier - 代码格式化

- **仓库地址**: https://github.com/prettier/prettier
- **用途**: 代码格式化工具
- **在项目中的使用**:
  - 代码风格统一
  - IDE配置

**相关文件**:
- `.vscode/settings.json` - VS Code Prettier配置
- `.prettierrc` - Prettier配置文件(如存在)

---

### 20. ESLint - JavaScript代码检查

- **仓库地址**: https://github.com/eslint/eslint
- **用途**: JavaScript代码质量和风格检查
- **在项目中的使用**:
  - 代码质量检查
  - IDE配置

**相关文件**:
- `.vscode/settings.json` - VS Code ESLint配置
- `.eslintrc` - ESLint配置文件(如存在)

---

## 📚 文档和参考仓库

### 21. Refactoring Guru - 重构模式

- **仓库地址**: https://github.com/refactoring-guru/refactoring-guru.github.io
- **用途**: 重构模式和最佳实践
- **在项目中的使用**:
  - 代码重构参考
  - 设计模式学习

**相关文档**:
- `docs/IDE_PROMPT_GUIDE.md` - 提及JavaScript设计模式

---

### 22. Node.js官方文档

- **仓库地址**: https://github.com/nodejs/node
- **用途**: Node.js官方文档和源代码
- **在项目中的使用**:
  - API参考
  - 最佳实践

**相关文档**:
- `docs/QUICK_REFERENCE.md` - 提及Node.js文档链接

---

## 🌐 Web和前端相关

### 23. Vite - 前端构建工具

- **仓库地址**: https://github.com/vitejs/vite
- **用途**: 下一代前端构建工具
- **在项目中的使用**:
  - 前端项目构建(如有)
  - 开发服务器

**相关文档**:
- `docs/ANTIGRAVITY_KIT_GUIDE.md` - 提及React+Vite模板

---

### 24. React - UI框架

- **仓库地址**: https://github.com/facebook/react
- **用途**: JavaScript UI框架
- **在项目中的使用**:
  - 前端UI框架(如有)
  - 组件库

**相关文档**:
- `docs/ANTIGRAVITY_KIT_GUIDE.md` - 提及React支持

---

## 🎨 UI组件库

### 25. shadcn/ui - 组件库

- **仓库地址**: https://github.com/shadcn-ui/ui
- **用途**: 基于Radix UI的组件库
- **在项目中的使用**:
  - UI组件(如有)
  - 前端开发

**相关文档**:
- `docs/IDE_PROMPT_GUIDE.md` - 提及shadcn/ui

---

### 26. TDesign - 企业级设计系统

- **仓库地址**: https://github.com/Tencent/tdesign
- **用途**: 腾讯企业级设计系统
- **在项目中的使用**:
  - UI组件(如有)
  - 前端开发

**相关文档**:
- `docs/IDE_PROMPT_GUIDE.md` - 提及TDesign

---

## 🧪 测试相关

### 27. Jest - JavaScript测试框架

- **仓库地址**: https://github.com/jestjs/jest
- **用途**: JavaScript测试框架
- **在项目中的使用**:
  - 单元测试(计划中)
  - 测试框架

**相关文档**:
- `closeclaw_refactor_plan/重构分析与改进策略报告.md` - 提及单元测试

---

### 28. Supertest - HTTP测试

- **仓库地址**: https://github.com/visionmedia/supertest
- **用途**: HTTP断言库
- **在项目中的使用**:
  - API测试(计划中)
  - 集成测试

---

## 📊 数据库和存储

### 29. SQLite3 - SQLite数据库

- **仓库地址**: https://github.com/TryGhost/node-sqlite3
- **用途**: SQLite数据库Node.js驱动
- **在项目中的使用**:
  - 记忆存储(计划中)
  - 数据持久化

**相关文档**:
- `docs/ARCHITECTURE.md` - 提及记忆层

---

## 🔐 安全相关

### 30. helmet - HTTP安全中间件

- **仓库地址**: https://github.com/helmetjs/helmet
- **用途**: HTTP安全头设置
- **在项目中的使用**:
  - 安全头设置(计划中)
  - HTTP安全

---

## 📦 包管理相关

### 31. npm - Node.js包管理器

- **仓库地址**: https://github.com/npm/cli
- **用途**: Node.js包管理器
- **在项目中的使用**:
  - 依赖管理
  - 脚本运行

---

### 32. yarn - JavaScript包管理器

- **仓库地址**: https://github.com/yarnpkg/yarn
- **用途**: 快速、可靠、安全的JavaScript包管理器
- **在项目中的使用**:
  - 替代npm的包管理器(可选)

---

## 🤖 机器学习和AI

### 33. TensorFlow.js - JavaScript机器学习

- **仓库地址**: https://github.com/tensorflow/tfjs
- **用途**: JavaScript机器学习库
- **在项目中的使用**:
  - 机器学习功能(计划中)
  - AI能力扩展

---

### 34. ONNX Runtime - ONNX模型运行时

- **仓库地址**: https://github.com/microsoft/onnxruntime
- **用途**: ONNX模型运行时
- **在项目中的使用**:
  - 模型推理(计划中)
  - 性能优化

---

## 🌐 网络相关

### 35. axios - HTTP客户端

- **仓库地址**: https://github.com/axios/axios
- **用途**: 基于Promise的HTTP客户端
- **在项目中的使用**:
  - HTTP请求(可选)
  - API调用

**相关文件**:
- `src/adapters/` - 可能在某些适配器中使用

---

## 🔧 开发工具

### 36. nodemon - 自动重启工具

- **仓库地址**: https://github.com/remy/nodemon
- **用途**: 自动重启Node.js应用
- **在项目中的使用**:
  - 开发环境自动重启(可选)

---

### 37. PM2 - 进程管理器

- **仓库地址**: https://github.com/Unitech/pm2
- **用途**: Node.js进程管理器
- **在项目中的使用**:
  - 生产环境进程管理(计划中)
  - 守护进程

**相关文档**:
- `docs/ARCHITECTURE.md` - 提及进程守护

---

## 📚 文档生成

### 38. JSDoc - API文档生成器

- **仓库地址**: https://github.com/jsdoc/jsdoc
- **用途**: JavaScript API文档生成器
- **在项目中的使用**:
  - API文档生成(计划中)
  - 代码文档

---

### 39. TypeDoc - TypeScript文档生成器

- **仓库地址**: https://github.com/TypeStrong/typedoc
- **用途**: TypeScript文档生成器
- **在项目中的使用**:
  - TypeScript文档生成(计划中)
  - 代码文档

---

## 🎨 UI/UX相关

### 40. Lucide React - React图标组件

- **仓库地址**: https://github.com/lucide-icons/lucide-react
- **用途**: Lucide图标的React组件
- **在项目中的使用**:
  - React UI图标
  - 组件开发

**相关文档**:
- `docs/IDE_PROMPT_GUIDE.md` - 提及Lucide Icons

---

## 📊 监控和日志

### 41. morgan - HTTP请求日志

- **仓库地址**: https://github.com/expressjs/morgan
- **用途**: HTTP请求日志中间件
- **在项目中的使用**:
  - HTTP日志(计划中)
  - 请求追踪

---

### 42. pino - 高性能日志库

- **仓库地址**: https://github.com/pinojs/pino
- **用途**: 高性能Node.js日志库
- **在项目中的使用**:
  - 替代winston(可选)
  - 性能优化

---

## 🔍 调试工具

### 43. debug - 轻量级调试工具

- **仓库地址**: https://github.com/visionmedia/debug
- **用途**: 轻量级Node.js调试工具
- **在项目中的使用**:
  - 调试输出(计划中)
  - 开发调试

---

## 📈 性能监控

### 44. clinic.js - Node.js性能诊断

- **仓库地址**: https://github.com/nearform/node-clinic
- **用途**: Node.js性能诊断工具
- **在项目中的使用**:
  - 性能诊断(计划中)
  - 性能优化

**相关文档**:
- `closeclaw_refactor_plan/重构分析与改进策略报告.md` - 提及性能监控

---

## 🔐 加密和安全

### 45. crypto - Node.js加密模块

- **仓库地址**: (内置Node.js模块)
- **用途**: 加密和哈希
- **在项目中的使用**:
  - API密钥加密
  - 敏感数据处理

**相关文档**:
- `docs/ARCHITECTURE.md` - 提及安全层

---

## 🌐 国际化(i18n)

### 46. i18next - 国际化框架

- **仓库地址**: https://github.com/i18next/i18next
- **用途**: JavaScript国际化框架
- **在项目中的使用**:
  - 多语言支持(计划中)
  - 国际化

---

## 📋 任务管理

### 47. agenda - MongoDB任务调度

- **仓库地址**: https://github.com/agenda/agenda
- **用途**: MongoDB任务调度器
- **在项目中的使用**:
  - 定时任务(计划中)
  - 任务管理

**相关文档**:
- `src/cron/` - 定时任务目录

---

## 🔌 WebSocket相关

### 48. ws - WebSocket实现

- **仓库地址**: https://github.com/websockets/ws
- **用途**: WebSocket客户端和服务器
- **在项目中的使用**:
  - WebSocket通信(计划中)
  - 实时通信

---

## 📊 数据可视化

### 49. Chart.js - 图表库

- **仓库地址**: https://github.com/chartjs/Chart.js
- **用途**: JavaScript图表库
- **在项目中的使用**:
  - 数据可视化(计划中)
  - 仪表板

**相关文档**:
- `closeclaw_refactor_plan/重构分析与改进策略报告.md` - 提及可视化仪表板

---

## 🎯 总结

### 已使用的仓库: 18个

1. GitNexus
2. Agent SDK
3. CLI-Anything
4. node-fetch
5. dotenv
6. winston
7. OpenAI Node.js SDK
8. Anthropic TypeScript SDK
9. Google AI Node.js SDK
10. 智谱AI JavaScript SDK
11. 硅基流动 API
12. Cerebras API
13. ModelScope API
14. Poixe API
15. OpenRouter API
16. Lucide Icons
17. Prettier
18. ESLint

### 计划使用的仓库: 31个

包括沙盒隔离、测试框架、数据库、安全工具、性能监控等

### 总计: 49个仓库

---

> **注意**: 本记录包含项目中所有引用的GitHub仓库,包括已使用和计划使用的。如有新增或更新,请及时更新此文档。

> **更新时间**: 2026-03-12 23:59:00
