#!/usr/bin/env node
/**
 * LLM API 综合测试报告
 * 测试所有配置的 API 并生成可用性报告
 */

import { readFileSync } from 'fs';
import { join } from 'path';

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
    name: 'Zhipu AI (glm-4-flash)',
    priority: 'HIGH',
    test: async () => {
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'glm-4-flash',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return `免费模型，${data.usage.total_tokens} tokens`;
    }
  },
  {
    name: 'OpenRouter (免费模型)',
    priority: 'HIGH',
    test: async () => {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen/qwen-2.5-7b-instruct:free',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return '350+ 免费模型可用';
    }
  },
  {
    name: 'ModelScope (Qwen)',
    priority: 'HIGH',
    test: async () => {
      const baseURL = process.env.MODELSCOPE_BASE_URL;
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MODELSCOPE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return '到期: 2026-04-10';
    }
  },
  {
    name: 'SiliconFlow (DeepSeek)',
    priority: 'MEDIUM',
    test: async () => {
      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SILICONFLOW_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'deepseek-ai/DeepSeek-R1-0528-Qwen3-8B',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return '免费 DeepSeek 模型';
    }
  },
  {
    name: 'Cerebras (Llama 3.1)',
    priority: 'MEDIUM',
    test: async () => {
      const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CEREBRAS_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama3.1-8b',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 10
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return 'Llama 3.1 8B';
    }
  }
];

async function main() {
  console.log('🔍 LLM API 可用性测试报告\n');
  console.log('=' .repeat(60));
  
  const results = [];

  for (const test of tests) {
    process.stdout.write(`\n[${test.priority}] ${test.name.padEnd(30)}: `);
    
    try {
      const result = await test.test();
      console.log(`✓ ${result}`);
      results.push({ name: test.name, status: 'available', priority: test.priority, info: result });
    } catch (error) {
      console.log(`✗ ${error.message}`);
      results.push({ name: test.name, status: 'unavailable', priority: test.priority, error: error.message });
    }
  }

  console.log('\n' + '='.repeat(60));
  
  const highPriority = results.filter(r => r.priority === 'HIGH' && r.status === 'available');
  const anyAvailable = results.filter(r => r.status === 'available');

  console.log(`\n📊 总结:`);
  console.log(`   高优先级可用: ${highPriority.length}/${results.filter(r => r.priority === 'HIGH').length}`);
  console.log(`   总计可用: ${anyAvailable.length}/${results.length}`);
  
  if (highPriority.length > 0) {
    console.log('\n✅ 系统可以正常运行！');
    console.log('\n推荐使用:');
    highPriority.forEach(r => {
      console.log(`   • ${r.name} - ${r.info}`);
    });
    process.exit(0);
  } else if (anyAvailable.length > 0) {
    console.log('\n⚠️  只有中低优先级 API 可用，建议配置高优先级 API');
    process.exit(0);
  } else {
    console.log('\n❌ 没有可用的 LLM API');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ 测试脚本执行失败:', error);
  process.exit(1);
});
