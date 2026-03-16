/**
 * 配置管理模块
 * 负责管理系统配置、环境变量和路径解析
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 加载环境变量
dotenv.config();

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 项目根目录
const ROOT_DIR = path.resolve(__dirname, '../../');

// 工作区目录
const WORKSPACE = process.env.WORKSPACE || path.join(ROOT_DIR, 'workspace');

// 内存存储目录
const MEMORY_DIR = path.join(WORKSPACE, 'memory');

// SQLite数据库目录
const SQLITE_DIR = path.join(MEMORY_DIR, 'sqlite');

// 技能目录
const SKILLS_DIR = path.join(WORKSPACE, 'skills');

/**
 * 安全路径解析
 * 防止路径遍历攻击
 */
export function resolveSafePath(relativePath) {
  const resolved = path.resolve(WORKSPACE, relativePath);
  // 确保路径在工作区内
  if (!resolved.startsWith(WORKSPACE)) {
    throw new Error('路径超出工作区范围');
  }
  return resolved;
}

/**
 * 配置对象
 */
export const config = {
  // 项目信息
  project: {
    name: 'CloseClaw',
    version: '2.0.0',
    description: '本地 AI 协同调度中枢'
  },
  
  // 目录配置
  paths: {
    root: ROOT_DIR,
    workspace: WORKSPACE,
    memory: MEMORY_DIR,
    sqlite: SQLITE_DIR,
    skills: SKILLS_DIR
  },
  
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost'
  },
  
  // 沙盒配置
  sandbox: {
    timeout: process.env.SANDBOX_TIMEOUT || 30000, // 30秒
    memoryLimit: process.env.SANDBOX_MEMORY_LIMIT || 1024 * 1024 * 1024, // 1GB
    maxProcesses: process.env.SANDBOX_MAX_PROCESSES || 5
  },
  
  // 投票配置
  voting: {
    quorum: {
      level1: 2, // 一级决议法定人数
      level2: 5, // 二级决议法定人数
      level3: 8  // 三级决议法定人数
    },
    weights: {
      user: 1/3, // 用户权重
      swarm: 2/3 // 群体权重
    }
  },
  
  // 模型配置
  models: {
    defaultAdapter: process.env.DEFAULT_ADAPTER || 'openai',
    fallbackChain: ['openai', 'claude', 'gemini']
  }
};

// 导出常用路径
export { WORKSPACE, ROOT_DIR, MEMORY_DIR, SQLITE_DIR, SKILLS_DIR };
