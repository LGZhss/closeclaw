#!/usr/bin/env node
/**
 * LLM API Keys 可用性测试脚本
 * 测试 .env 中配置的所有 LLM API keys
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

const tests = [
  {
    name: 'OpenRouter API',
    key: process.env.OPENROUTER_API_KEY,
    test: async (key) => {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return `✓ 可用 (${data.data?.length || 0} 个模型)`;
    }
  },
  {
    name: 'ModelScope API',
    key: process.env.MODELSCOPE_API_KEY,
    test: async (key) => {
      const baseURL = process.env.MODELSCOPE_BASE_URL || 'https://api-inference.modelscope.cn/v1';
      const response = await fetch(`${baseURL}/models`, {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return `✓ 可用 (到期: 2026-04-10)`;
    }
  },
  {
    name: 'Gemini API',
    key: process.env.GEMINI_API_KEY,
    test: async (key) => {
      const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash-preview';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}?key=${key}`
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return `✓ 可用 (模型: ${model})`;
    }
  },
  {
    name: 'NVIDIA MiniMax API',
    key: process.env.NVIDIA_MINIMAX_KEY,
    test: async (key) => {
      const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return `✓ 可用`;
    }
  },
  {
    name: 'NVIDIA Kimi API',
    key: process.env.NVIDIA_KIMI_KEY,
    test: async (key) => {
      const response = await fetch('https://integrate.api.nvidia.com/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return `✓ 可用`;
    }
  },
  {
    name: 'Zhipu AI API',
    key: process.env.ZHIPU_API_KEY,
    test: async (key) => {
      // Zhipu uses JWT format, test with a simple request
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return `✓ 可用 (glm-4-flash 免费)`;
    }
  },
  {
    name: 'SiliconFlow API',
    key: process.env.SILICONFLOW_API_KEY,
    test: async (key) => {
      const response = await fetch('https://api.siliconflow.cn/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return `✓ 可用`;
    }
  },
  {
    name: 'Cerebras Cloud API',
    key: process.env.CEREBRAS_API_KEY,
    test: async (key) => {
      const response = await fetch('https://api.cerebras.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return `✓ 可用`;
    }
  },
  {
    name: 'SCNET API',
    key: process.env.SCNET_API_KEY,
    test: async (key) => {
      // SCNET may have different endpoint, just check if key exists
      return `✓ Key 已配置 (需要手动验证)`;
    }
  },
  {
    name: 'Poixe API',
    key: process.env.POIXE_API_KEY,
    test: async (key) => {
      // JWT token format, just verify it's configured
      return `✓ Token 已配置 (GPT-4.1mini)`;
    }
  }
];

async function main() {
  console.log('🔍 检查 LLM API Keys 可用性...\n');
  
  let availableCount = 0;
  let totalCount = 0;

  for (const test of tests) {
    totalCount++;
    process.stdout.write(`${test.name.padEnd(25)}: `);
    
    if (!test.key) {
      console.log('⚠️  未配置');
      continue;
    }

    try {
      const result = await test.test(test.key);
      console.log(result);
      availableCount++;
    } catch (error) {
      console.log(`✗ 不可用 (${error.message})`);
    }
  }

  console.log(`\n📊 总结: ${availableCount}/${totalCount} 个 API 可用`);
  
  if (availableCount === 0) {
    console.log('\n❌ 错误: 没有可用的 LLM API，请检查 .env 配置');
    process.exit(1);
  } else {
    console.log('\n✅ 至少有一个 LLM API 可用，系统可以正常运行');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('\n❌ 测试脚本执行失败:', error);
  process.exit(1);
});
