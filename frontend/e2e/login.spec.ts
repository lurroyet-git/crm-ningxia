import { test, expect } from '@playwright/test';

/**
 * 登录页 E2E 测试
 * 覆盖：访问登录页、输入凭据、登录跳转、Token 存储
 */
test.describe('登录页面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('应显示登录页面及表单元素', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('text=宁夏CRM作战地图')).toBeVisible();
    await expect(page.locator('text=运维驱动业务增长')).toBeVisible();

    // 验证表单元素存在
    await expect(page.locator('input[placeholder="用户名"]')).toBeVisible();
    await expect(page.locator('input[placeholder="密码"]')).toBeVisible();
    await expect(page.locator('button:has-text("登录")')).toBeVisible();
  });

  test('使用有效凭据登录后应跳转至工作台并存入 Token', async ({ page }) => {
    // 输入用户名和密码
    await page.fill('input[placeholder="用户名"]', 'zhangwei');
    await page.fill('input[placeholder="密码"]', '123456');

    // 点击登录按钮
    await page.click('button:has-text("登录")');

    // 等待 URL 变化到工作台
    await page.waitForURL('/cockpit', { timeout: 10000 });

    // 验证页面已跳转
    await expect(page).toHaveURL('/cockpit');

    // 验证 localStorage 中存储了 Token
    const token = await page.evaluate(() => localStorage.getItem('crm-auth'));
    expect(token).toBeTruthy();
    const parsed = JSON.parse(token!);
    expect(parsed.state.token).toBeTruthy();
    expect(parsed.state.user).toBeTruthy();
    expect(parsed.state.user.username).toBe('zhangwei');
  });

  test('使用错误密码应提示错误且不跳转', async ({ page }) => {
    await page.fill('input[placeholder="用户名"]', 'zhangwei');
    await page.fill('input[placeholder="密码"]', 'wrongpassword');
    await page.click('button:has-text("登录")');

    // 等待错误提示出现
    await page.waitForTimeout(1000);

    // 验证仍停留在登录页
    await expect(page).toHaveURL('/login');
  });

  test('未输入凭据点击登录应触发表单校验', async ({ page }) => {
    await page.click('button:has-text("登录")');

    // Ant Design 表单校验提示
    await expect(page.locator('text=请输入用户名')).toBeVisible();
    await expect(page.locator('text=请输入密码')).toBeVisible();
  });
});
