#!/usr/bin/env ts-node
/**
 * 历史数据迁移脚本
 * 从 Excel 导入客户数据、项目数据到 PostgreSQL
 * 支持数据清洗、校验和导入日志记录
 *
 * 用法：
 *   npx ts-node scripts/migrate-data.ts --customers ./data/customers.xlsx --projects ./data/projects.xlsx
 *   npx ts-node scripts/migrate-data.ts --help
 */

import { PrismaClient, Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// 简易日志模块
const LOG_DIR = path.join(__dirname, '../logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = path.join(LOG_DIR, `migrate-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);

function log(level: 'INFO' | 'WARN' | 'ERROR', message: string) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level}] ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

const prisma = new PrismaClient();

// ==================== 解析命令行参数 ====================
function parseArgs() {
  const args = process.argv.slice(2);
  const flags: Record<string, string> = {};
  for (let i = 0; i < args.length; i += 2) {
    if (args[i].startsWith('--')) {
      flags[args[i].replace('--', '')] = args[i + 1] || '';
    }
  }
  return flags;
}

const args = parseArgs();

if (args.help !== undefined) {
  console.log(`
历史数据迁移脚本
用法：
  npx ts-node scripts/migrate-data.ts [选项]

选项：
  --customers <path>   客户数据 Excel 文件路径
  --projects <path>    项目数据 Excel 文件路径
  --help               显示帮助信息

示例：
  npx ts-node scripts/migrate-data.ts --customers ./data/customers.xlsx --projects ./data/projects.xlsx
`);
  process.exit(0);
}

// ==================== 数据清洗工具 ====================
class DataCleaner {
  static trim(str: unknown): string {
    return typeof str === 'string' ? str.trim() : String(str || '').trim();
  }

  static normalizePhone(phone: string): string | null {
    const cleaned = phone.replace(/\D/g, '');
    if (/^1[3-9]\d{9}$/.test(cleaned)) return cleaned;
    return null;
  }

  static normalizeEmail(email: string): string | null {
    const trimmed = email.trim();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return trimmed;
    return null;
  }

  static pickGrade(grade: string): string {
    const valid = ['A', 'B', 'C', 'D'];
    const upper = grade.toUpperCase().trim();
    return valid.includes(upper) ? upper : 'B';
  }

  static pickHealthStatus(status: string): string {
    const valid = ['健康', '关注', '风险', '流失'];
    const trimmed = status.trim();
    return valid.includes(trimmed) ? trimmed : '健康';
  }

  static pickStage(stage: string): string {
    const valid = ['需求', '设计', '开发', '测试', '验收', '运维'];
    const map: Record<string, string> = {
      '需求分析': '需求', '方案设计': '设计', '开发实施': '开发',
      '测试验收': '测试', '交付运维': '运维',
    };
    return map[stage.trim()] || (valid.includes(stage.trim()) ? stage.trim() : '需求');
  }

  static pickProjectStatus(status: string): string {
    const valid = ['正常', '预警', '延期', '已完成'];
    const map: Record<string, string> = {
      '进行中': '正常', '风险': '预警',
    };
    return map[status.trim()] || (valid.includes(status.trim()) ? status.trim() : '正常');
  }

  static parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }
}

// ==================== 客户数据导入 ====================
async function importCustomers(filePath: string) {
  log('INFO', `开始导入客户数据: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    log('ERROR', `文件不存在: ${filePath}`);
    return { success: 0, failed: 0, errors: [] as string[] };
  }

  // 注：实际项目中需安装 xlsx 库
  // import * as XLSX from 'xlsx';
  // const workbook = XLSX.readFile(filePath);
  // const sheet = workbook.Sheets[workbook.SheetNames[0]];
  // const rows = XLSX.utils.sheet_to_json(sheet);

  // 模拟读取到的数据（生产环境替换为真实 Excel 解析）
  const rows = mockCustomerRows(); // 演示用

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = DataCleaner.trim(row['客户名称'] || row['name']);
      if (!name) {
        throw new Error('客户名称为空');
      }

      // 数据校验：检查是否已存在
      const existing = await prisma.customer.findFirst({ where: { name } });
      if (existing) {
        log('WARN', `第 ${i + 1} 行: 客户 "${name}" 已存在，跳过`);
        continue;
      }

      // 查找负责人（优先使用 zhangwei）
      const ownerName = DataCleaner.trim(row['负责人'] || row['owner'] || 'zhangwei');
      const owner = await prisma.user.findFirst({
        where: { username: ownerName },
      });
      if (!owner) {
        throw new Error(`负责人 "${ownerName}" 不存在`);
      }

      const phone = DataCleaner.normalizePhone(
        DataCleaner.trim(row['联系电话'] || row['phone'] || '')
      );
      const email = DataCleaner.normalizeEmail(
        DataCleaner.trim(row['联系邮箱'] || row['email'] || '')
      );

      const payload: Prisma.CustomerCreateInput = {
        name,
        type: DataCleaner.trim(row['类型'] || row['type'] || '企业'),
        city: DataCleaner.trim(row['城市'] || row['city'] || '银川'),
        district: DataCleaner.trim(row['区县'] || row['district'] || ''),
        address: DataCleaner.trim(row['地址'] || row['address'] || ''),
        industry: DataCleaner.trim(row['行业'] || row['industry'] || ''),
        grade: DataCleaner.pickGrade(DataCleaner.trim(row['等级'] || row['grade'] || 'B')),
        healthStatus: DataCleaner.pickHealthStatus(
          DataCleaner.trim(row['健康状态'] || row['healthStatus'] || '健康')
        ),
        creditLevel: DataCleaner.trim(row['信用等级'] || row['creditLevel'] || ''),
        source: DataCleaner.trim(row['来源'] || row['source'] || 'Excel导入'),
        annualRevenue: DataCleaner.trim(row['年收入'] || row['annualRevenue'] || ''),
        employeeCount: DataCleaner.trim(row['员工数'] || row['employeeCount'] || ''),
        contactPhone: phone || '',
        contactEmail: email || '',
        remark: DataCleaner.trim(row['备注'] || row['remark'] || ''),
        owner: { connect: { id: owner.id } },
      };

      await prisma.customer.create({ data: payload });
      success++;
      log('INFO', `导入客户成功: ${name}`);
    } catch (err: any) {
      failed++;
      const msg = `第 ${i + 1} 行导入失败: ${err.message}`;
      errors.push(msg);
      log('ERROR', msg);
    }
  }

  log('INFO', `客户导入完成: 成功 ${success}, 失败 ${failed}`);
  return { success, failed, errors };
}

// ==================== 项目数据导入 ====================
async function importProjects(filePath: string) {
  log('INFO', `开始导入项目数据: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    log('ERROR', `文件不存在: ${filePath}`);
    return { success: 0, failed: 0, errors: [] as string[] };
  }

  // 模拟读取数据（生产环境替换为真实 Excel 解析）
  const rows = mockProjectRows();

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const name = DataCleaner.trim(row['项目名称'] || row['name']);
      if (!name) {
        throw new Error('项目名称为空');
      }

      const projectNo = DataCleaner.trim(row['项目编号'] || row['projectNo'] || '');
      if (!projectNo) {
        throw new Error('项目编号为空');
      }

      // 检查项目编号是否已存在
      const existing = await prisma.project.findFirst({ where: { projectNo } });
      if (existing) {
        log('WARN', `第 ${i + 1} 行: 项目 "${projectNo}" 已存在，跳过`);
        continue;
      }

      // 查找客户
      const customerName = DataCleaner.trim(row['客户名称'] || row['customerName'] || '');
      const customer = await prisma.customer.findFirst({ where: { name: customerName } });
      if (!customer) {
        throw new Error(`客户 "${customerName}" 不存在，请先导入客户数据`);
      }

      // 查找项目经理
      const pmName = DataCleaner.trim(row['项目经理'] || row['pm'] || 'zhangwei');
      const pm = await prisma.user.findFirst({ where: { username: pmName } });
      if (!pm) {
        throw new Error(`项目经理 "${pmName}" 不存在`);
      }

      const planStart = DataCleaner.parseDate(row['计划开始'] || row['planStart']);
      const planEnd = DataCleaner.parseDate(row['计划结束'] || row['planEnd']);
      if (!planStart || !planEnd) {
        throw new Error('计划开始或计划结束日期格式无效');
      }

      const payload: Prisma.ProjectCreateInput = {
        projectNo,
        name,
        stage: DataCleaner.pickStage(DataCleaner.trim(row['阶段'] || row['stage'] || '需求')),
        status: DataCleaner.pickProjectStatus(
          DataCleaner.trim(row['状态'] || row['status'] || '正常')
        ),
        progress: parseInt(row['进度'] || row['progress'] || '0', 10) || 0,
        planStart,
        planEnd,
        description: DataCleaner.trim(row['描述'] || row['description'] || ''),
        budget: DataCleaner.trim(row['预算'] || row['budget'] || ''),
        customer: { connect: { id: customer.id } },
        pm: { connect: { id: pm.id } },
      };

      await prisma.project.create({ data: payload });
      success++;
      log('INFO', `导入项目成功: ${projectNo} - ${name}`);
    } catch (err: any) {
      failed++;
      const msg = `第 ${i + 1} 行导入失败: ${err.message}`;
      errors.push(msg);
      log('ERROR', msg);
    }
  }

  log('INFO', `项目导入完成: 成功 ${success}, 失败 ${failed}`);
  return { success, failed, errors };
}

// ==================== 模拟数据（演示用） ====================
function mockCustomerRows() {
  return [
    {
      '客户名称': '导入测试客户A',
      '类型': '企业',
      '城市': '银川',
      '区县': '金凤区',
      '地址': '测试大道1号',
      '行业': '信息技术',
      '等级': 'A',
      '健康状态': '健康',
      '负责人': 'zhangwei',
      '联系电话': '13800138000',
      '联系邮箱': 'testA@example.com',
      '备注': 'Excel导入测试',
    },
    {
      '客户名称': '导入测试客户B',
      '类型': '政府',
      '城市': '石嘴山',
      '区县': '大武口区',
      '行业': '智慧城市',
      '等级': 'B',
      '健康状态': '关注',
      '负责人': 'lihua',
      '联系电话': '13900139000',
      '备注': 'Excel导入测试',
    },
  ];
}

function mockProjectRows() {
  return [
    {
      '项目编号': 'IMP-2024-001',
      '项目名称': '导入测试项目A',
      '客户名称': '导入测试客户A',
      '项目经理': 'zhangwei',
      '阶段': '需求分析',
      '状态': '正常',
      '进度': '30',
      '计划开始': '2024-08-01',
      '计划结束': '2024-12-31',
      '预算': '1000000',
      '描述': '导入测试项目描述',
    },
  ];
}

// ==================== 主函数 ====================
async function main() {
  log('INFO', '========== 宁夏CRM作战地图 - 历史数据迁移开始 ==========');

  const customerFile = args.customers;
  const projectFile = args.projects;

  if (!customerFile && !projectFile) {
    log('WARN', '未指定数据文件，使用演示数据运行');
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  if (customerFile || !projectFile) {
    const customerResult = await importCustomers(customerFile || './data/demo-customers.xlsx');
    totalSuccess += customerResult.success;
    totalFailed += customerResult.failed;
  }

  if (projectFile || !customerFile) {
    const projectResult = await importProjects(projectFile || './data/demo-projects.xlsx');
    totalSuccess += projectResult.success;
    totalFailed += projectResult.failed;
  }

  log('INFO', '========== 迁移摘要 ==========');
  log('INFO', `总成功: ${totalSuccess}`);
  log('INFO', `总失败: ${totalFailed}`);
  log('INFO', `日志文件: ${LOG_FILE}`);
  log('INFO', '========== 历史数据迁移结束 ==========');
}

main()
  .catch((err) => {
    log('ERROR', `迁移脚本异常: ${err.message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
