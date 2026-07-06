import React, { useEffect, useState } from 'react';
import {
  Card, Statistic, Row, Col, Table, Tag, Timeline, List, Button, Spin, Skeleton
} from 'antd';
import {
  CheckCircleOutlined, FolderOutlined, UserOutlined, WarningOutlined,
  ArrowUpOutlined, ArrowDownOutlined, CalendarOutlined, ToolOutlined,
  BulbOutlined, TeamOutlined, FileTextOutlined, ExportOutlined, SettingOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import request from '../../utils/request';

interface OverviewData {
  todoCount: number;
  projectCount: number;
  followCount: number;
  riskCount: number;
  visitCount: number;
  avgProgress: number;
}

interface ProjectItem {
  id: string;
  name: string;
  customerName: string;
  stage: string;
  progress: number;
  status: string;
}

interface ActivityItem {
  id: string;
  type: string;
  content: string;
  time: string;
}

const STATUS_COLOR: Record<string, string> = {
  正常: '#10b981',
  进行中: '#3b82f6',
  关注: '#f59e0b',
  风险: '#ef4444',
  延期: '#ef4444',
  已完成: '#10b981',
};

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  运维: <ToolOutlined />,
  商机: <BulbOutlined />,
  项目: <FolderOutlined />,
  客户: <TeamOutlined />,
};

export default function CockpitOverview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ov, pr, ac] = await Promise.all([
          request.get('/dashboard/overview'),
          request.get('/dashboard/projects'),
          request.get('/dashboard/activities'),
        ]);
        setOverview(ov);
        setProjects(pr.list || []);
        setActivities(ac.list || []);
      } catch (e) {
        // 错误已在拦截器中提示
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const kpiCards = [
    {
      title: '今日待办',
      value: overview?.todoCount ?? 0,
      prefix: <CheckCircleOutlined />,
      color: '#3b82f6',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: '本周项目',
      value: overview?.projectCount ?? 0,
      prefix: <FolderOutlined />,
      color: '#06b6d4',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: '客户跟进',
      value: overview?.followCount ?? 0,
      prefix: <UserOutlined />,
      color: '#6366f1',
      trend: '-2%',
      trendUp: false,
    },
    {
      title: '风险提醒',
      value: overview?.riskCount ?? 0,
      prefix: <WarningOutlined />,
      color: '#ef4444',
      trend: '+1',
      trendUp: false,
    },
    {
      title: '拜访计划',
      value: overview?.visitCount ?? 0,
      prefix: <CalendarOutlined />,
      color: '#f59e0b',
      trend: '0%',
      trendUp: true,
    },
    {
      title: '平均进度',
      value: overview?.avgProgress ?? 0,
      suffix: '%',
      prefix: <ArrowUpOutlined />,
      color: '#10b981',
      trend: '+3%',
      trendUp: true,
    },
  ];

  const todoItems = [
    { title: '完成XX医院服务器巡检', priority: '高', status: '进行中' },
    { title: '跟进教育局网络安全项目报价', priority: '高', status: '待处理' },
    { title: '准备明天上午的客户汇报材料', priority: '中', status: '未开始' },
    { title: '更新XX数据中心运维周报', priority: '中', status: '进行中' },
    { title: '回复电力公司关于二期扩容的邮件', priority: '低', status: '待处理' },
  ];

  const projectColumns = [
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '客户', dataIndex: 'customerName', key: 'customerName' },
    { title: '当前阶段', dataIndex: 'stage', key: 'stage' },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (v: number, record: ProjectItem) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${v}%`, height: '100%', background: STATUS_COLOR[record.status] || '#3b82f6', borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, color: '#6b7280', minWidth: 36 }}>{v}%</span>
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={STATUS_COLOR[v] || '#3b82f6'}>{v}</Tag>,
    },
  ];

  const shortcuts = [
    { label: '项目概览', icon: <FolderOutlined />, path: '/project/overview', color: '#3b82f6' },
    { label: '客户档案', icon: <TeamOutlined />, path: '/customer/assets', color: '#6366f1' },
    { label: '运维记录', icon: <ToolOutlined />, path: '/ops/records', color: '#10b981' },
    { label: '商机池', icon: <BulbOutlined />, path: '/biz/pool', color: '#f59e0b' },
    { label: '数据导出', icon: <ExportOutlined />, path: '/cockpit/export', color: '#06b6d4' },
    { label: '团队设置', icon: <SettingOutlined />, path: '/cockpit/team', color: '#8b5cf6' },
  ];

  // 简化版圆环图（SVG）
  const RingChart = ({ percent, color }: { percent: number; color: string }) => {
    const r = 36;
    const cx = 44;
    const cy = 44;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - (percent / 100) * circumference;
    return (
      <svg width={88} height={88} viewBox="0 0 88 88">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <circle
          cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize={14} fontWeight={600} fill="#374151">
          {percent}%
        </text>
      </svg>
    );
  };

  if (loading) {
    return (
      <div>
        <Row gutter={[16, 16]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Col span={4} key={i}><Skeleton active paragraph={{ rows: 2 }} /></Col>
          ))}
        </Row>
        <Skeleton active style={{ marginTop: 16 }} paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div>
      {/* KPI 卡片 */}
      <Row gutter={[16, 16]}>
        {kpiCards.map((kpi) => (
          <Col span={4} key={kpi.title}>
            <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, fontSize: 16 }}>
                  {kpi.prefix}
                </div>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{kpi.title}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                  {kpi.value}{kpi.suffix || ''}
                </span>
                <span style={{ fontSize: 11, color: kpi.trendUp ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 2 }}>
                  {kpi.trendUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {kpi.trend}
                </span>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 今日优先事项 + 本周项目进度 */}
        <Col span={16}>
          <Card title="今日优先事项" style={{ borderRadius: 8, marginBottom: 16 }}>
            <List
              dataSource={todoItems}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Tag color={item.priority === '高' ? '#ef4444' : item.priority === '中' ? '#f59e0b' : '#6b7280'}>{item.priority}</Tag>,
                    <Tag color={STATUS_COLOR[item.status] || '#3b82f6'}>{item.status}</Tag>,
                  ]}
                >
                  <List.Item.Meta
                    title={<span style={{ fontSize: 14 }}>{item.title}</span>}
                  />
                </List.Item>
              )}
            />
          </Card>

          <Card title="本周项目进度" style={{ borderRadius: 8 }}>
            <Table
              dataSource={projects}
              columns={projectColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* 右侧列 */}
        <Col span={8}>
          {/* 工作负载 */}
          <Card title="个人工作负载" style={{ borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '8px 0' }}>
              <div style={{ textAlign: 'center' }}>
                <RingChart percent={72} color="#3b82f6" />
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>本周饱和度</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <RingChart percent={45} color="#10b981" />
                <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>项目完成率</div>
              </div>
            </div>
          </Card>

          {/* 运维与商机动态 */}
          <Card title="运维与商机动态" style={{ borderRadius: 8, marginBottom: 16 }}>
            <Timeline mode="left">
              {activities.map((act) => (
                <Timeline.Item
                  key={act.id}
                  dot={ACTIVITY_ICON[act.type] || <FileTextOutlined />}
                  color={act.type === '商机' ? '#f59e0b' : act.type === '运维' ? '#ef4444' : '#3b82f6'}
                  label={<span style={{ fontSize: 12, color: '#9ca3af' }}>{act.time}</span>}
                >
                  <div style={{ fontSize: 13 }}>{act.content}</div>
                </Timeline.Item>
              ))}
              {activities.length === 0 && (
                <Timeline.Item>
                  <span style={{ color: '#9ca3af' }}>暂无动态</span>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>

          {/* 快捷入口 */}
          <Card title="快捷入口" style={{ borderRadius: 8 }}>
            <Row gutter={[12, 12]}>
              {shortcuts.map((s) => (
                <Col span={8} key={s.label}>
                  <Button
                    type="text"
                    block
                    style={{ height: 64, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                    onClick={() => navigate(s.path)}
                  >
                    <div style={{ fontSize: 20, color: s.color }}>{s.icon}</div>
                    <span style={{ fontSize: 12 }}>{s.label}</span>
                  </Button>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
