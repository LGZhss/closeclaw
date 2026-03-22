#!/usr/bin/env node
/**
 * Zhipu AI API 测试
 * 测试 glm-4-flash 免费模型
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

async function testZhipuAPI() {
  console.log('🧪 测试 Zhipu AI API (glm-4-flash 免费模型)...\n');

  const apiKey = process.env.ZHIPU_API_KEY;
  if (!apiKey) {
    console.error('❌ ZHIPU_API_KEY 未配置');
    process.exit(1);
  }

  try {
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'glm-4-flash',
        messages: [
          { role: 'user', content: 'Say "Hello from CloseClaw!" in one sentence.' }
        ],
        max_tokens: 100
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('✅ 响应成功:');
    console.log(`   ${data.choices[0].message.content}\n`);
    console.log('✅ Zhipu AI API 工作正常！');
    console.log(`   模型: ${data.model}`);
    console.log(`   用量: ${data.usage.total_tokens} tokens`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

testZhipuAPI();
