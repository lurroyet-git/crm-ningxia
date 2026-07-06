import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 开始填充种子数据...');

  const existingAdmin = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (existingAdmin) {
    console.log('ℹ️ 种子数据已存在，跳过初始化。');
    return;
  }

  // 1. 创建角色
  const adminRole = await prisma.role.create({
    data: {
      name: '系统管理员',
      code: 'admin',
      description: '全部权限',
      permissions: JSON.stringify([
        { menuId: '*', actions: ['*'] }
      ]),
    },
  });

  const pmRole = await prisma.role.create({
    data: {
      name: '项目经理',
      code: 'pm',
      description: '项目管理、客户管理',
      permissions: JSON.stringify([
        { menuId: 'cockpit', actions: ['read', 'export'] },
        { menuId: 'project', actions: ['create', 'read', 'update'] },
        { menuId: 'customer', actions: ['create', 'read', 'update'] },
        { menuId: 'ops', actions: ['read'] },
        { menuId: 'biz', actions: ['create', 'read', 'update'] },
        { menuId: 'knowledge', actions: ['read'] },
      ]),
    },
  });

  const opsRole = await prisma.role.create({
    data: {
      name: '运维工程师',
      code: 'ops',
      description: '运维管理、资产管理',
      permissions: JSON.stringify([
        { menuId: 'cockpit', actions: ['read'] },
        { menuId: 'ops', actions: ['create', 'read', 'update'] },
        { menuId: 'project', actions: ['read'] },
        { menuId: 'customer', actions: ['read'] },
      ]),
    },
  });

  const salesRole = await prisma.role.create({
    data: {
      name: '销售经理',
      code: 'sales',
      description: '商机管理、客户跟进',
      permissions: JSON.stringify([
        { menuId: 'cockpit', actions: ['read'] },
        { menuId: 'biz', actions: ['create', 'read', 'update'] },
        { menuId: 'customer', actions: ['create', 'read', 'update'] },
        { menuId: 'project', actions: ['read'] },
      ]),
    },
  });

  console.log('✅ 角色创建完成:', adminRole.id, pmRole.id, opsRole.id, salesRole.id);

  // 2. 创建测试用户
  const hash = await bcrypt.hash('123456', 10);

  const users = await prisma.user.createMany({
    data: [
      { username: 'admin', password: hash, realName: '系统管理员', roleId: adminRole.id, department: 'IT部' },
      { username: 'zhangwei', password: hash, realName: '张伟', roleId: pmRole.id, department: '交付部', phone: '13800138001' },
      { username: 'lihua', password: hash, realName: '李华', roleId: pmRole.id, department: '交付部', phone: '13800138002' },
      { username: 'wangtao', password: hash, realName: '王涛', roleId: opsRole.id, department: '运维部', phone: '13800138003' },
      { username: 'chenxi', password: hash, realName: '陈希', roleId: salesRole.id, department: '销售部', phone: '13800138004' },
      { username: 'liuyang', password: hash, realName: '刘洋', roleId: salesRole.id, department: '销售部', phone: '13800138005' },
    ],
  });
  console.log('✅ 用户创建完成:', users.count, '个');

  // 3. 创建示例客户
  const customers = await prisma.customer.createMany({
    data: [
      { name: '华信科技集团', type: '企业', city: '银川', district: '金凤区', industry: '信息技术', grade: 'A', healthStatus: '健康', ownerId: (await prisma.user.findFirst({ where: { username: 'zhangwei' } }))!.id },
      { name: '中航工业股份', type: '企业', city: '银川', district: '西夏区', industry: '制造业', grade: 'A', healthStatus: '关注', ownerId: (await prisma.user.findFirst({ where: { username: 'lihua' } }))!.id },
      { name: '宁夏智慧城市建设', type: '政府', city: '银川', district: '兴庆区', industry: '智慧城市', grade: 'A', healthStatus: '健康', ownerId: (await prisma.user.findFirst({ where: { username: 'zhangwei' } }))!.id },
      { name: '西部矿业集团', type: '企业', city: '石嘴山', district: '大武口区', industry: '采矿', grade: 'B', healthStatus: '健康', ownerId: (await prisma.user.findFirst({ where: { username: 'chenxi' } }))!.id },
      { name: '银川第一人民医院', type: '医院', city: '银川', district: '兴庆区', industry: '医疗', grade: 'B', healthStatus: '健康', ownerId: (await prisma.user.findFirst({ where: { username: 'liuyang' } }))!.id },
      { name: '宁夏大学', type: '高校', city: '银川', district: '西夏区', industry: '教育', grade: 'B', healthStatus: '关注', ownerId: (await prisma.user.findFirst({ where: { username: 'chenxi' } }))!.id },
      { name: '国电宁夏新能源', type: '企业', city: '吴忠', district: '利通区', industry: '能源', grade: 'C', healthStatus: '风险', ownerId: (await prisma.user.findFirst({ where: { username: 'wangtao' } }))!.id },
      { name: '宁夏农垦集团', type: '企业', city: '银川', district: '金凤区', industry: '农业', grade: 'B', healthStatus: '健康', ownerId: (await prisma.user.findFirst({ where: { username: 'liuyang' } }))!.id },
    ],
  });
  console.log('✅ 客户创建完成:', customers.count, '个');

  // 4. 创建示例项目
  const zhangwei = await prisma.user.findFirst({ where: { username: 'zhangwei' } });
  let hxkj = await prisma.customer.findFirst({ where: { name: '华信科技集团' } });

  if (zhangwei && hxkj) {
    await prisma.project.create({
      data: {
        projectNo: 'HS-2024-001',
        name: '智慧园区平台',
        customerId: hxkj.id,
        pmId: zhangwei.id,
        stage: '开发',
        status: '正常',
        progress: 65,
        planStart: new Date('2024-03-01'),
        planEnd: new Date('2024-06-30'),
        description: '华信科技智慧园区数据平台建设',
      },
    });
  }

  // 5. 系统配置
  await prisma.systemConfig.createMany({
    data: [
      { key: 'company_name', value: '宁夏智联运维科技有限公司', desc: '公司名称' },
      { key: 'region', value: '宁夏回族自治区', desc: '服务区域' },
      { key: 'data_sync_interval', value: '3600', desc: '数据同步间隔(秒)' },
      { key: 'sla_response_time', value: '30', desc: 'SLA响应时间(分钟)' },
    ],
  });

  // 6. 变更检测模拟数据（工商变更/人事变动）
  hxkj = await prisma.customer.findFirst({ where: { name: '华信科技集团' } });
  const zhgy = await prisma.customer.findFirst({ where: { name: '中航工业股份' } });

  if (hxkj && zhgy) {
    await prisma.changeDetection.createMany({
      data: [
        {
          customerId: hxkj.id,
          changeType: '工商变更',
          oldValue: '华信科技有限公司',
          newValue: '华信科技集团股份有限公司',
          source: '天眼查',
          status: '未处理',
        },
        {
          customerId: hxkj.id,
          changeType: '人事变动',
          oldValue: '张三',
          newValue: '李四',
          source: '企业公示系统',
          status: '未处理',
        },
        {
          customerId: zhgy.id,
          changeType: '工商变更',
          oldValue: '注册资本 5000万',
          newValue: '注册资本 1亿',
          source: '天眼查',
          status: '未处理',
        },
        {
          customerId: zhgy.id,
          changeType: '业务扩展',
          oldValue: '经营范围：航空制造',
          newValue: '经营范围：航空制造、新能源',
          source: '工商信息',
          status: '已确认',
          handledBy: (await prisma.user.findFirst({ where: { username: 'zhangwei' } }))?.id,
          handledAt: new Date(),
        },
      ],
    });
    console.log('✅ 变更检测模拟数据创建完成');
  }

  console.log('🎉 种子数据填充完成！');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
