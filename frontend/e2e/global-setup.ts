import { chromium, FullConfig } from '@playwright/test';

/**
 * Playwright 全局 setup
 * 在所有测试运行前执行一次登录，保存认证状态供后续测试复用
 */
export default async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // 访问登录页并执行登录
  await page.goto(`${baseURL}/login`);
  await page.fill('input[placeholder="用户名"]', 'zhangwei');
  await page.fill('input[placeholder="密码"]', '123456');
  await page.click('button:has-text("登录")');

  // 等待登录成功跳转
  await page.waitForURL(`${baseURL}/cockpit`, { timeout: 10000 });

  // 将认证状态（cookies + localStorage）保存到文件
  await context.storageState({ path: './e2e/auth-state.json' });

  await browser.close();
  console.log('✅ 全局登录完成，认证状态已保存至 e2e/auth-state.json');
}
