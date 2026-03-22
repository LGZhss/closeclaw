#!/usr/bin/env node
/**
 * OpenAI Adapter 实际调用测试
 * 使用 OpenRouter 的免费模型测试 Adapter 是否正常工作
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// 手动加载 .env 文件
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key.trim()] = value.trim();
      }
    }
  } catch (error) {
    console.error('无法加载 .env 文件:', error.message);
  }
}

loadEnv();

// 动态导入 OpenAI Adapter
async function testAdapter() {
  console.log('🧪 测试 OpenAI Adapter 实际调用...\n');

  try {
    // 导入 OpenAI Adapter
    const { OpenAIAdapter } = await import('../dist/adapters/openai.js');
    
    // 使用 OpenRouter 的免费模型
    const adapter = new OpenAIAdapter({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1'
    });

    // 覆盖模型配置，使用 OpenRouter 的免费模型
    adapter.models = {
      pro: 'meta-llama/llama-3.3-70b-instruct:free',
      flash: 'qwen/qwen-2.5-7b-instruct:free',
      lite: 'google/gemma-3-4b-it:free'
    };

    console.log('📡 发送测试消息到 OpenRouter (免费模型)...');
    
    const response = await adapter.chat({
      systemInstruction: 'You are a helpful assistant.',
      history: [],
      message: 'Say "Hello from CloseClaw!" in one sentence.',
      preferredLevel: 'lite'
    });

    console.log('\n✅ 响应成功:');
    console.log(`   ${response.text}\n`);
    
    if (response.functionCall) {
      console.log('🔧 函数调用:', response.functionCall);
    }

    console.log('✅ OpenAI Adapter 工作正常！');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }
}

testAdapter();
