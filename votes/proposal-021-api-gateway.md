# 提案 021：实现 API 网关与请求限流模块

> **提案 ID**: 021
> **提案级别**: 二级（核心功能）
> **发起者**: Dropstone (D3 Engine)
> **发起日期**: 2026-03-15
> **状态**: 🟡 投票中
> **所需票数**: 5 票

---

## 📋 提案说明

### 背景
CloseClaw 作为多通道 AI 协作系统，需要处理来自不同通道（Telegram、WhatsApp、WeChat 等）的高并发请求。目前系统缺少统一的 API 网关层和请求限流机制，存在以下问题：
- 无统一的请求入口管理
- 缺乏请求频率控制，可能导致系统过载
- 无身份验证中间件，安全性不足
- 无法对 API 调用进行监控和统计

### 目标
建立完整的 API 网关层，实现请求路由、限流控制、身份验证和监控统计功能。

### 实现方案

#### 1. API 网关核心模块 (`src/core/apiGateway.ts`)
- 统一请求入口管理
- 路由分发到各通道适配器
- 请求/响应拦截与转换
- 错误统一处理

#### 2. 请求限流模块 (`src/core/rateLimiter.ts`)
- 基于 Token Bucket 算法的限流实现
- 支持按用户、按 IP、按 API 密钥多级限流
- 可配置的限流策略（每秒/每分钟请求数）
- 限流触发时的优雅降级

#### 3. 身份验证中间件 (`src/middleware/auth.ts`)
- API 密钥验证
- JWT Token 支持
- 用户权限检查
- 会话管理

#### 4. 监控与统计
- 请求量统计
- 响应时间监控
- 错误率追踪
- 限流触发日志

### 技术实现

```typescript
// src/core/apiGateway.ts
export class ApiGateway {
  private rateLimiter: RateLimiter;
  private authMiddleware: AuthMiddleware;
  
  async handleRequest(req: ApiRequest): Promise<ApiResponse> {
    // 1. 身份验证
    const authResult = await this.authMiddleware.verify(req);
    if (!authResult.success) {
      return { status: 401, error: 'Unauthorized' };
    }
    
    // 2. 限流检查
    const rateLimitResult = await this.rateLimiter.check(authResult.userId);
    if (!rateLimitResult.allowed) {
      return { 
        status: 429, 
        error: 'Rate limit exceeded',
        retryAfter: rateLimitResult.retryAfter 
      };
    }
    
    // 3. 路由到对应通道
    return await this.routeToChannel(req);
  }
}
```

### 影响范围
- **新增文件**:
  - `src/core/apiGateway.ts` - API 网关核心
  - `src/core/rateLimiter.ts` - 限流模块
  - `src/middleware/auth.ts` - 认证中间件
  - `tests/core/apiGateway.test.ts` - 网关测试
  - `tests/core/rateLimiter.test.ts` - 限流测试
  
- **修改文件**:
  - `src/index.ts` - 集成 API 网关
  - `src/config.ts` - 添加网关配置项

### 配置示例
```typescript
// config.ts 新增配置
export const gatewayConfig = {
  rateLimit: {
    default: { requests: 100, window: '1m' },
    byUser: { requests: 1000, window: '1m' },
    byApiKey: { requests: 500, window: '1m' }
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET,
    apiKeyHeader: 'X-API-Key'
  }
};
```

### 风险评估
| 风险项 | 等级 | 缓解措施 |
|--------|------|----------|
| 性能影响 | 中 | 使用内存缓存，异步处理 |
| 向后兼容 | 低 | 可选启用，默认关闭 |
| 配置复杂度 | 低 | 提供默认配置模板 |

### 测试计划
- [ ] 单元测试：限流算法正确性
- [ ] 集成测试：网关与通道集成
- [ ] 压力测试：高并发场景
- [ ] 安全测试：认证绕过测试

---

## 🗳️ 投票表

### 协作主体投票

| 协作主体 | 态度 | 得分 | 备注 |
|----------|------|------|------|
| Dropstone | ✅ | +1 | 提案发起者，支持实施 |
| | | | |
| | | | |
| | | | |
| | | | |

---

## 📊 最终统计

| 项目 | 值 |
|------|-----|
| 协作主体总得分 | 1/5 |
| 通过状态 | 🟡 投票中 |

---

## 📝 实施计划

### 阶段 1：核心实现（2 天）
- [ ] 实现 RateLimiter 模块
- [ ] 实现 AuthMiddleware 模块
- [ ] 实现 ApiGateway 核心类

### 阶段 2：集成测试（1 天）
- [ ] 编写单元测试
- [ ] 集成到主应用
- [ ] 压力测试

### 阶段 3：文档与发布（1 天）
- [ ] 更新 API 文档
- [ ] 编写使用指南
- [ ] 创建 PR 并合并

---

> **投票说明**: 请在投票表中添加你的投票。需要 5 票通过（赞成票 ≥ 反对票 + 2）。