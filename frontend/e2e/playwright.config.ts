import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright E2E 测试配置
 * 用于宁夏CRM作战地图前端端到端测试
 */
export default defineConfig({
  testDir: '.', // 配置文件所在目录即为测试目录
  timeout: 30000, // 每个测试用例超时 30 秒
  expect: {
    timeout: 5000, // expect 断言超时 5 秒
  },
  fullyParallel: true, // 并行执行测试
  forbidOnly: !!process.env.CI, // CI 环境下禁止 .only
  retries: process.env.CI ? 2 : 0, // CI 失败时重试 2 次
  workers: process.env.CI ? 1 : undefined, // CI 使用单 worker 避免资源冲突
  reporter: [
    ['html', { outputFolder: 'playwright-report' }], // HTML 报告
    ['list'], // 控制台列表输出
  ],

  // 全局登录准备配置
  globalSetup: require.resolve('./global-setup.ts'),

  use: {
    baseURL: 'http://localhost:3000', // 前端开发服务器地址
    trace: 'on-first-retry', // 首次失败时录制 trace
    screenshot: 'only-on-failure', // 失败时截图
    video: 'on-first-retry', // 首次失败时录制视频
    // 复用全局 setup 保存的认证状态
    storageState: 'auth-state.json',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // 本地开发时自动启动前端服务
  webServer: process.env.CI
    ? undefined
    : {
        command: 'cd .. && npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
