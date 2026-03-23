/**
 * Phase 1 演示脚本
 * 展示从消息触发到 LLM 响应的完整流程
 */

import { registerAdapter, getAdapter } from '../src/adapters/registry.js';
import { LLMAdapter, ChatParams, ChatResponse } from '../src/adapters/base.js';
import { SandboxRunner } from '../src/agent/sandbox-runner.js';
import { ExecutionContext } from '../src/agent/runner.js';

// 模拟 LLM Adapter（用于演示，不需要真实 API Key）
class DemoLLMAdapter extends LLMAdapter {
  async chat(params: ChatParams): Promise<ChatResponse> {
    const prompt = typeof params.message === 'string' 
      ? params.message 
      : params.message.map(p => p.text).join('\n');
    
    // 模拟 LLM 处理延迟
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      text: `你好！我是 AI 助手。你说："${prompt}"。我理解你的问题，让我来帮助你。\n\n这是一个演示响应，展示了 Phase 1 的完整执行链路：\n1. 消息被路由到 processGroup()\n2. SandboxRunner 被创建\n3. 通过 AdapterRegistry 获取 LLM Adapter\n4. Adapter 调用 LLM API\n5. 响应被返回并发送给用户\n\n系统运行正常！✅`,
      functionCall: undefined
    };
  }
}

async function demo() {
  console.log('='.repeat(60));
  console.log('Phase 1 Agent 执行链路演示');
  console.log('='.repeat(60));
  console.log();

  // 1. 注册 Adapter
  console.log('📝 步骤 1: 注册 LLM Adapter...');
  registerAdapter('demo', () => new DemoLLMAdapter());
  console.log('✅ Adapter 注册成功: demo');
  console.log();

  // 2. 验证 Adapter 可用
  console.log('🔍 步骤 2: 验证 Adapter 可用性...');
  const adapter = getAdapter('demo');
  if (adapter) {
    console.log('✅ Adapter 可用');
  } else {
    console.log('❌ Adapter 不可用');
    return;
  }
  console.log();

  // 3. 创建 SandboxRunner
  console.log('🏗️  步骤 3: 创建 SandboxRunner...');
  const runner = new SandboxRunner('demo');
  console.log('✅ SandboxRunner 创建成功');
  console.log();

  // 4. 构建执行上下文
  console.log('📦 步骤 4: 构建执行上下文...');
  const context: ExecutionContext = {
    groupFolder: 'demo-group',
    prompt: '@Andy 你好，请帮我测试一下系统是否正常工作',
    channel: {
      name: 'demo-channel',
      sendMessage: async (jid: string, text: string) => {
        console.log(`\n📤 发送消息到 ${jid}:`);
        console.log('-'.repeat(60));
        console.log(text);
        console.log('-'.repeat(60));
      }
    } as any,
    history: []
  };
  console.log('✅ 执行上下文构建完成');
  console.log(`   - Group: ${context.groupFolder}`);
  console.log(`   - Prompt: ${context.prompt}`);
  console.log();

  // 5. 执行 Agent
  console.log('🚀 步骤 5: 执行 Agent...');
  console.log('⏳ 正在调用 LLM...');
  const response = await runner.execute(context);
  console.log('✅ Agent 执行完成');
  console.log();

  // 6. 显示响应
  console.log('📨 步骤 6: LLM 响应:');
  console.log('-'.repeat(60));
  console.log(response);
  console.log('-'.repeat(60));
  console.log();

  // 7. 清理资源
  console.log('🧹 步骤 7: 清理资源...');
  await runner.close();
  console.log('✅ 资源清理完成');
  console.log();

  console.log('='.repeat(60));
  console.log('✨ Phase 1 演示完成！所有步骤执行成功！');
  console.log('='.repeat(60));
}

// 运行演示
demo().catch(error => {
  console.error('❌ 演示失败:', error);
  process.exit(1);
});
