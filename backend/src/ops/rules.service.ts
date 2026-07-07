import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface RuleMatchResult {
  matched: boolean;
  ruleCode: string;
  signalType: string;
  priority: string;
  priorityScore: number;
  triggerReason: string;
  recommendedAction: string;
}

@Injectable()
export class RulesService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluate(record: any): Promise<RuleMatchResult[]> {
    const results: RuleMatchResult[] = [];
    const rules = await this.prisma.opsRule.findMany({ where: { enabled: true } });

    for (const rule of rules) {
      const match = await this.matchRule(rule, record);
      if (match.matched) {
        results.push(match);
      }
    }

    return results;
  }

  private async matchRule(rule: any, record: any): Promise<RuleMatchResult> {
    const baseResult: RuleMatchResult = {
      matched: false,
      ruleCode: rule.name || 'R000',
      signalType: rule.type || '其他',
      priority: 'P3',
      priorityScore: 0,
      triggerReason: '',
      recommendedAction: '',
    };

    // Parse condition JSON
    let condition: any = {};
    try {
      condition = JSON.parse(rule.condition || '{}');
    } catch {
      condition = {};
    }

    // Keyword matching
    if (condition.keywords && condition.keywords.length > 0) {
      const text = (record.description || '').toLowerCase() + ' ' + (record.content || '').toLowerCase();
      const hasKeyword = condition.keywords.some((kw: string) => text.includes(kw.toLowerCase()));
      if (!hasKeyword) {
        return baseResult;
      }
    }

    // Get customer info for priority calculation
    let customerGrade = 'D';
    if (record.customerId) {
      try {
        const customer = await this.prisma.customer.findUnique({
          where: { id: record.customerId },
          select: { grade: true },
        });
        customerGrade = customer?.grade || 'D';
      } catch {
        // ignore
      }
    }

    const levelScore = { A: 100, B: 80, C: 60, D: 40 }[customerGrade] || 40;

    // Base score calculation
    let score = 0;
    score += (condition.priorityBase || 50) * 0.3;
    score += levelScore * 0.2;
    score += 20 * 0.2; // asset importance placeholder
    score += 0 * 0.15; // recurrence placeholder
    score += 0 * 0.1; // active demand placeholder
    score += 50 * 0.05; // credibility placeholder

    const priority = score >= 80 ? 'P0' : score >= 60 ? 'P1' : score >= 40 ? 'P2' : 'P3';

    const triggerReasons: Record<string, string> = {
      'R001': '维保/授权/证书将在30天内到期',
      'R002': '维保/授权/证书将在60天内到期',
      'R003': `检测到性能问题：${condition.keywords?.find((k: string) => record.description?.includes(k)) || '资源不足'}`,
      'R004': '同一资产30天内多次性能问题',
      'R005': `检测到安全问题：${condition.keywords?.find((k: string) => record.description?.includes(k)) || '安全隐患'}`,
      'R006': '客户表达新需求意向',
      'R007': '客户反馈服务体验问题',
      'R008': '客户提及竞品或替换意向',
    };

    const actions: Record<string, string> = {
      'R001': '联系客户确认续约或替代方案',
      'R002': '先核实到期日，再安排沟通',
      'R003': '安排技术诊断，判断扩容/优化方案',
      'R004': '输出问题分析，建议拜访',
      'R005': '安排安全检查或加固方案',
      'R006': '客户经理确认场景与预算',
      'R007': '判断服务包升级可能',
      'R008': '主管或客户经理确认真实意图',
    };

    return {
      matched: true,
      ruleCode: rule.name || 'R000',
      signalType: rule.type || '其他',
      priority,
      priorityScore: Math.round(score),
      triggerReason: triggerReasons[rule.name || ''] || condition.triggerReason || '匹配规则触发',
      recommendedAction: actions[rule.name || ''] || condition.recommendedAction || '客户经理确认',
    };
  }

  async createSignals(record: any, results: RuleMatchResult[]): Promise<void> {
    for (const result of results) {
      // Find owner
      let ownerId: string | null = null;
      if (record.customerId) {
        try {
          const customer = await this.prisma.customer.findUnique({
            where: { id: record.customerId },
            select: { ownerId: true },
          });
          ownerId = customer?.ownerId || null;
        } catch {
          // ignore
        }
      }

      // Send notification for P0/P1
      if (result.priority === 'P0' || result.priority === 'P1') {
        try {
          await this.prisma.notification.create({
            data: {
              type: 'biz',
              title: `${result.priority} 商机信号: ${result.signalType}`,
              content: result.triggerReason,
              userId: ownerId || 'system',
              read: false,
            },
          });
        } catch {
          // ignore in offline mode
        }
      }
    }
  }

  async seedRules(): Promise<void> {
    const rules = [
      {
        name: 'R001',
        type: '续约',
        condition: JSON.stringify({ priorityBase: 80, triggerReason: '维保/授权/证书将在30天内到期', recommendedAction: '联系客户确认续约或替代方案' }),
        action: JSON.stringify({ notify: true, priority: 'P0' }),
      },
      {
        name: 'R002',
        type: '续约',
        condition: JSON.stringify({ priorityBase: 60, triggerReason: '维保/授权/证书将在60天内到期', recommendedAction: '先核实到期日，再安排沟通' }),
        action: JSON.stringify({ notify: true, priority: 'P1' }),
      },
      {
        name: 'R003',
        type: '扩容',
        condition: JSON.stringify({ priorityBase: 70, keywords: ['CPU高', '内存不足', '磁盘满', '并发高', '响应慢'], triggerReason: '资源不足或性能问题', recommendedAction: '安排技术诊断，判断扩容/优化方案' }),
        action: JSON.stringify({ notify: true, priority: 'P1' }),
      },
      {
        name: 'R004',
        type: '性能优化',
        condition: JSON.stringify({ priorityBase: 65, triggerReason: '同一客户同一资产30天内3次性能问题', recommendedAction: '输出问题分析，建议拜访' }),
        action: JSON.stringify({ notify: true, priority: 'P1' }),
      },
      {
        name: 'R005',
        type: '安全加固',
        condition: JSON.stringify({ priorityBase: 70, keywords: ['漏洞', '弱口令', '被攻击', '病毒', '备份失败', '日志审计'], triggerReason: '安全相关问题', recommendedAction: '安排安全检查或加固方案' }),
        action: JSON.stringify({ notify: true, priority: 'P1' }),
      },
      {
        name: 'R006',
        type: '新需求',
        condition: JSON.stringify({ priorityBase: 50, keywords: ['能不能', '希望', '想要', '有没有', '是否支持', '领导要求'], triggerReason: '客户表达新需求意向', recommendedAction: '客户经理确认场景与预算' }),
        action: JSON.stringify({ notify: true, priority: 'P2' }),
      },
      {
        name: 'R007',
        type: '服务升级',
        condition: JSON.stringify({ priorityBase: 50, keywords: ['响应慢', '服务不及时', '驻场', '巡检频率'], triggerReason: '服务体验相关问题', recommendedAction: '判断服务包升级可能' }),
        action: JSON.stringify({ notify: true, priority: 'P2' }),
      },
      {
        name: 'R008',
        type: '竞品/流失',
        condition: JSON.stringify({ priorityBase: 45, keywords: ['竞品', '替换', '别家', '重新招标'], triggerReason: '客户提及竞品或替换', recommendedAction: '主管或客户经理确认真实意图' }),
        action: JSON.stringify({ notify: true, priority: 'P2' }),
      },
    ];

    for (const rule of rules) {
      const existing = await this.prisma.opsRule.findFirst({ where: { name: rule.name } });
      if (existing) {
        await this.prisma.opsRule.update({ where: { id: existing.id }, data: rule });
      } else {
        await this.prisma.opsRule.create({ data: rule });
      }
    }
  }
}
