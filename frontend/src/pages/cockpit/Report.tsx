import React, { useState } from 'react';
import {
  Card, Tabs, DatePicker, Select, Button, Table, Tag, Row, Col, Statistic
} from 'antd';
import { DownloadOutlined, LineChartOutlined } from '@ant-design/icons';
import type { TabsProps } from 'antd';

const { RangePicker } = DatePicker;

export default function CockpitReport() {
  const [reportType, setReportType] = useState('revenue');

  const tabItems: TabsProps['items'] = [
    { key: 'revenue', label: '营收报表' },
    { key: 'cost', label: '成本报表' },
    { key: 'profit', label: '利润报表' },
    { key: 'hr', label: '人力报表' },
  ];

  const summaryData = [
    { title: '本月营收', value: 2845000, suffix: '元', color: '#10b981' },
    { title: '环比增长', value: 12.5, suffix: '%', color: '#3b82f6' },
    { title: '目标完成率', value: 86, suffix: '%', color: '#f59e0b' },
    { title: '同比去年', value: 23.8, suffix: '%', color: '#6366f1' },
  ];

  const topCustomers = [
    { id: '1', name: '宁夏人民医院', revenue: 680000, projects: 3, trend: 'up' },
    { id: '2', name: '银川市教育局', revenue: 520000, projects: 2, trend: 'up' },
    { id: '3', name: '宁夏电力公司', revenue: 450000, projects: 4, trend: 'down' },
    { id: '4', name: '石嘴山银行', revenue: 380000, projects: 2, trend: 'up' },
    { id: '5', name: '中卫市数据中心', revenue: 320000, projects: 1, trend: 'up' },
  ];

  const columns = [
    { title: '排名', dataIndex: 'id', key: 'id', width: 60 },
    { title: '客户名称', dataIndex: 'name', key: 'name' },
    { title: '营收金额', dataIndex: 'revenue', key: 'revenue', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '项目数', dataIndex: 'projects', key: 'projects' },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (v: string) => <Tag color={v === 'up' ? '#10b981' : '#ef4444'}>{v === 'up' ? '↑ 上升' : '↓ 下降'}</Tag>,
    },
  ];

  return (
    <div>
      {/* 筛选栏 */}
      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ color: '#6b7280', marginRight: 8 }}>时间范围</span>
            <RangePicker />
          </Col>
          <Col>
            <span style={{ color: '#6b7280', marginRight: 8 }}>部门</span>
            <Select style={{ width: 140 }} placeholder="全部部门" allowClear>
              <Select.Option value="sales">销售部</Select.Option>
              <Select.Option value="ops">运维部</Select.Option>
              <Select.Option value="delivery">交付部</Select.Option>
            </Select>
          </Col>
          <Col>
            <span style={{ color: '#6b7280', marginRight: 8 }}>项目类型</span>
            <Select style={{ width: 140 }} placeholder="全部类型" allowClear>
              <Select.Option value="infra">基础设施</Select.Option>
              <Select.Option value="security">网络安全</Select.Option>
              <Select.Option value="cloud">云计算</Select.Option>
            </Select>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<DownloadOutlined />}>导出报表</Button>
          </Col>
        </Row>
      </Card>

      {/* Tab 切换 */}
      <Tabs activeKey={reportType} onChange={setReportType} items={tabItems} style={{ marginBottom: 16 }} />

      {/* 汇总数据 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {summaryData.map((item) => (
          <Col span={6} key={item.title}>
            <Card style={{ borderRadius: 8 }}>
              <Statistic
                title={item.title}
                value={item.value}
                suffix={item.suffix}
                valueStyle={{ color: item.color, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 图表占位 */}
      <Card title="趋势图表" style={{ borderRadius: 8, marginBottom: 16 }}>
        <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb', borderRadius: 8 }}>
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <LineChartOutlined style={{ fontSize: 48 }} />
            <p>图表区域（接入真实图表库后展示）</p>
          </div>
        </div>
      </Card>

      {/* Top5 客户 */}
      <Card title="Top 5 客户营收" style={{ borderRadius: 8 }}>
        <Table
          dataSource={topCustomers}
          columns={columns}
          rowKey="id"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
