import { describe, it, expect } from 'vitest';
import { router } from '../src/router.js';

describe('Router', () => {
  it('should register routes successfully', () => {
    // 测试路由注册
    const routeId = router.registerRoute({
      path: '/test',
      handler: (req) => ({ status: 'ok', data: req })
    });
    
    expect(routeId).toBeTruthy();
  });

  it('should handle requests', () => {
    // 测试请求处理
    router.registerRoute({
      path: '/test',
      handler: (req) => ({ status: 'ok', data: req })
    });
    
    const result = router.handleRequest('/test', { test: 'data' });
    expect(result.status).toBe('ok');
    expect(result.data.test).toBe('data');
  });

  it('should handle 404 errors', () => {
    // 测试404错误处理
    const result = router.handleRequest('/nonexistent', {});
    expect(result.status).toBe('error');
    expect(result.message).toBe('Route not found');
  });
});