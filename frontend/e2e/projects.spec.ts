import { test, expect } from '@playwright/test';

/**
 * 项目交付模块 E2E 测试
 * 覆盖：项目列表加载、筛选功能、新建项目 Modal
 */
test.describe('项目交付页面', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.fill('input[placeholder="用户名"]', 'zhangwei');
    await page.fill('input[placeholder="密码"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForURL('/cockpit', { timeout: 10000 });

    // 导航到项目概览页
    await page.goto('/project/overview');
    await page.waitForLoadState('networkidle');
  });

  test('应加载项目概览页并显示 KPI 卡片', async ({ page }) => {
    await page.waitForSelector('text=项目总数', { timeout: 15000 });

    const kpiTitles = ['项目总数', '进行中', '本周到期', '延期风险', '本周验收', '交付进度'];
    for (const title of kpiTitles) {
      await expect(page.locator(`text=${title}`).first()).toBeVisible();
    }
  });

  test('应加载项目列表表格', async ({ page }) => {
    await page.waitForSelector('text=项目编号', { timeout: 15000 });

    // 验证表格列头
    await expect(page.locator('th:has-text("项目编号")')).toBeVisible();
    await expect(page.locator('th:has-text("项目名称")')).toBeVisible();
    await expect(page.locator('th:has-text("客户")')).toBeVisible();
    await expect(page.locator('th:has-text("当前阶段")')).toBeVisible();
    await expect(page.locator('th:has-text("负责人")')).toBeVisible();
    await expect(page.locator('th:has-text("状态")')).toBeVisible();
  });

  test('应支持按阶段筛选', async ({ page }) => {
    await page.waitForSelector('.ant-select', { timeout: 15000 });

    // 点击阶段筛选下拉框（第二个 Select）
    const selects = page.locator('.ant-select');
    await selects.nth(1).click();

    // 选择"开发实施"
    await page.click('.ant-select-item:has-text("开发实施")');

    // 等待数据刷新
    await page.waitForTimeout(1000);

    // 表格应刷新（无断言失败即为通过）
    await expect(page.locator('th:has-text("项目编号")')).toBeVisible();
  });

  test('应支持按状态筛选', async ({ page }) => {
    await page.waitForSelector('.ant-select', { timeout: 15000 });

    // 点击状态筛选下拉框（第三个 Select）
    const selects = page.locator('.ant-select');
    await selects.nth(2).click();

    // 选择"正常"
    await page.click('.ant-select-item:has-text("正常")');

    await page.waitForTimeout(1000);
    await expect(page.locator('th:has-text("项目编号")')).toBeVisible();
  });

  test('应支持关键词搜索', async ({ page }) => {
    await page.waitForSelector('input[placeholder*="搜索"]', { timeout: 15000 });

    // 输入关键词
    await page.fill('input[placeholder*="搜索"]', '智慧园区');
    await page.press('input[placeholder*="搜索"]', 'Enter');

    await page.waitForTimeout(1000);
    await expect(page.locator('th:has-text("项目编号")')).toBeVisible();
  });

  test('点击新建项目应弹出 Modal', async ({ page }) => {
    await page.waitForSelector('button:has-text("新建项目")', { timeout: 15000 });
    await page.click('button:has-text("新建项目")');

    // 等待 Modal 出现
    await page.waitForSelector('.ant-modal', { timeout: 5000 });

    // 验证 Modal 标题
    await expect(page.locator('.ant-modal-title:has-text("新建项目")')).toBeVisible();

    // 验证表单字段
    await expect(page.locator('label:has-text("项目编号")')).toBeVisible();
    await expect(page.locator('label:has-text("项目名称")')).toBeVisible();
    await expect(page.locator('label:has-text("客户名称")')).toBeVisible();
    await expect(page.locator('label:has-text("当前阶段")')).toBeVisible();
    await expect(page.locator('label:has-text("负责人")')).toBeVisible();
    await expect(page.locator('label:has-text("计划日期")')).toBeVisible();
    await expect(page.locator('label:has-text("当前进度")')).toBeVisible();
  });

  test('新建项目 Modal 表单校验应生效', async ({ page }) => {
    await page.waitForSelector('button:has-text("新建项目")', { timeout: 15000 });
    await page.click('button:has-text("新建项目")');
    await page.waitForSelector('.ant-modal', { timeout: 5000 });

    // 直接点击确定（不填任何字段）
    await page.click('.ant-modal-footer button:has-text("确")');

    // 验证校验提示出现
    await expect(page.locator('text=请输入项目编号').first()).toBeVisible();
    await expect(page.locator('text=请输入项目名称').first()).toBeVisible();
    await expect(page.locator('text=请输入客户名称').first()).toBeVisible();
  });
});
