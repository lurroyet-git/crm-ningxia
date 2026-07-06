import { test, expect } from '@playwright/test';

/**
 * 作战台（驾驶舱）E2E 测试
 * 覆盖：KPI 卡片显示、项目表格加载、时间线显示
 */
test.describe('作战台页面', () => {
  test.beforeEach(async ({ page }) => {
    // 先登录
    await page.goto('/login');
    await page.fill('input[placeholder="用户名"]', 'zhangwei');
    await page.fill('input[placeholder="密码"]', '123456');
    await page.click('button:has-text("登录")');
    await page.waitForURL('/cockpit', { timeout: 10000 });
  });

  test('应加载并显示 6 个 KPI 卡片', async ({ page }) => {
    // 等待 KPI 区域加载完成
    await page.waitForSelector('text=今日待办', { timeout: 15000 });

    // 验证 6 个 KPI 卡片都存在
    const kpiTitles = [
      '今日待办',
      '本周项目',
      '客户跟进',
      '风险提醒',
      '拜访计划',
      '平均进度',
    ];
    for (const title of kpiTitles) {
      await expect(page.locator(`text=${title}`).first()).toBeVisible();
    }
  });

  test('应加载本周项目进度表格', async ({ page }) => {
    await page.waitForSelector('text=本周项目进度', { timeout: 15000 });
    await expect(page.locator('text=本周项目进度').first()).toBeVisible();

    // 验证表格列头
    await expect(page.locator('th:has-text("项目名称")')).toBeVisible();
    await expect(page.locator('th:has-text("客户")')).toBeVisible();
    await expect(page.locator('th:has-text("当前阶段")')).toBeVisible();
    await expect(page.locator('th:has-text("进度")')).toBeVisible();
    await expect(page.locator('th:has-text("状态")')).toBeVisible();
  });

  test('应加载运维与商机动态时间线', async ({ page }) => {
    await page.waitForSelector('text=运维与商机动态', { timeout: 15000 });
    await expect(page.locator('text=运维与商机动态').first()).toBeVisible();

    // 时间线应至少存在（可能为空态）
    const timeline = page.locator('.ant-timeline');
    await expect(timeline).toBeVisible();
  });

  test('应显示快捷入口按钮', async ({ page }) => {
    await page.waitForSelector('text=快捷入口', { timeout: 15000 });
    await expect(page.locator('text=快捷入口').first()).toBeVisible();

    const shortcuts = ['项目概览', '客户档案', '运维记录', '商机池', '数据导出', '团队设置'];
    for (const label of shortcuts) {
      await expect(page.locator(`text=${label}`).first()).toBeVisible();
    }
  });

  test('个人工作负载区域应显示环形图', async ({ page }) => {
    await page.waitForSelector('text=个人工作负载', { timeout: 15000 });
    await expect(page.locator('text=个人工作负载').first()).toBeVisible();

    // 验证环形图标签
    await expect(page.locator('text=本周饱和度').first()).toBeVisible();
    await expect(page.locator('text=项目完成率').first()).toBeVisible();
  });
});
