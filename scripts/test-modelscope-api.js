#!/usr/bin/env node
/**
 * ModelScope API 测试
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

async function testModelScopeAPI() {
  console.log('🧪 测试 ModelScope API...\n');

  const apiKey = process.env.MODELSCOPE_API_KEY;
  const baseURL = process.env.MODELSCOPE_BASE_URL || 'https://api-inference.modelscope.cn/v1';

  if (!apiKey) {
    console.error('❌ MODELSCOPE_API_KEY 未配置');
    process.exit(1);
  }

  try {
    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'qwen-plus',
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
    console.log('✅ ModelScope API 工作正常！');
    console.log(`   模型: ${data.model}`);
    console.log(`   到期: 2026-04-10`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

testModelScopeAPI();
