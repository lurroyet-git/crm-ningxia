import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Input, Select, Modal, Form, DatePicker, message, Popconfirm, Pagination, Spin
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  FolderOpenOutlined, ClockCircleOutlined, CheckCircleOutlined, WarningOutlined, BarChartOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface Project {
  id: string;
  code: string;
  name: string;
  customerName: string;
  stage: string;
  progress: number;
  owner: string;
  planStartDate: string;
  planEndDate: string;
  status: string;
}

const STATUS_COLOR: Record<string, string> = {
  正常: '#10b981',
  进行中: '#3b82f6',
  关注: '#f59e0b',
  风险: '#ef4444',
  延期: '#ef4444',
  已完成: '#10b981',
  待验收: '#6366f1',
};

const STAGE_OPTIONS = ['全部', '需求分析', '方案设计', '开发实施', '测试验收', '交付运维'];
const STATUS_OPTIONS = ['全部', '正常', '进行中', '关注', '风险', '延期', '已完成', '待验收'];

export default function ProjectOverview() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [form] = Form.useForm();

  const [filters, setFilters] = useState({
    keyword: '',
    stage: '全部',
    status: '全部',
    page: 1,
    pageSize: 10,
  });

  useEffect(() => {
    fetchData();
  }, [filters.page, filters.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projRes, statRes] = await Promise.all([
        request.get('/projects', {
          params: {
            page: filters.page,
            pageSize: filters.pageSize,
            keyword: filters.keyword || undefined,
            stage: filters.stage === '全部' ? undefined : filters.stage,
            status: filters.status === '全部' ? undefined : filters.status,
          },
        }),
        request.get('/projects/statistics'),
      ]);
      setProjects(projRes.list || []);
      setStatistics(statRes);
    } catch (e) {
      // 错误已在拦截器中提示
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleAdd = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      planDate: [project.planStartDate, project.planEndDate],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/projects/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中提示
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const { planDate, ...restValues } = values;
      const payload = {
        ...restValues,
        planStartDate: planDate?.[0]?.format?.('YYYY-MM-DD'),
        planEndDate: planDate?.[1]?.format?.('YYYY-MM-DD'),
      };

      if (editingProject) {
        await request.put(`/projects/${editingProject.id}`, payload);
        message.success('更新成功');
      } else {
        await request.post('/projects', payload);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const kpiCards = [
    { title: '项目总数', value: statistics?.totalCount ?? 0, icon: <FolderOpenOutlined />, color: '#3b82f6' },
    { title: '进行中', value: statistics?.inProgressCount ?? 0, icon: <ClockCircleOutlined />, color: '#6366f1' },
    { title: '本周到期', value: statistics?.dueThisWeekCount ?? 0, icon: <BarChartOutlined />, color: '#f59e0b' },
    { title: '延期风险', value: statistics?.riskCount ?? 0, icon: <WarningOutlined />, color: '#ef4444' },
    { title: '本周验收', value: statistics?.acceptThisWeekCount ?? 0, icon: <CheckCircleOutlined />, color: '#10b981' },
    { title: '交付进度', value: statistics?.avgProgress ?? 0, suffix: '%', icon: <BarChartOutlined />, color: '#06b6d4' },
  ];

  const columns = [
    { title: '项目编号', dataIndex: 'code', key: 'code', width: 120 },
    { title: '项目名称', dataIndex: 'name', key: 'name' },
    { title: '客户', dataIndex: 'customerName', key: 'customerName' },
    { title: '当前阶段', dataIndex: 'stage', key: 'stage' },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (v: number, record: Project) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${v}%`, height: '100%', background: STATUS_COLOR[record.status] || '#3b82f6', borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12, color: '#6b7280', minWidth: 36 }}>{v}%</span>
        </div>
      ),
    },
    { title: '负责人', dataIndex: 'owner', key: 'owner', width: 100 },
    {
      title: '计划日期',
      key: 'planDate',
      width: 180,
      render: (_: any, record: Project) => `${record.planStartDate} ~ ${record.planEndDate}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (v: string) => <Tag color={STATUS_COLOR[v] || '#3b82f6'}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Project) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除该项目？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* KPI 卡片 */}
      <Row gutter={[16, 16]}>
        {kpiCards.map((kpi) => (
          <Col span={4} key={kpi.title}>
            <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, fontSize: 16 }}>
                  {kpi.icon}
                </div>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{kpi.title}</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937' }}>
                {kpi.value}{kpi.suffix || ''}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 筛选栏 */}
      <Card style={{ borderRadius: 8, marginTop: 16, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input
              placeholder="搜索项目名称/编号/客户..."
              prefix={<SearchOutlined />}
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={filters.stage}
              onChange={(v) => { setFilters((prev) => ({ ...prev, stage: v, page: 1 })); handleSearch(); }}
            >
              {STAGE_OPTIONS.map((o) => <Select.Option key={o} value={o}>{o}</Select.Option>)}
            </Select>
          </Col>
          <Col span={4}>
            <Select
              style={{ width: '100%' }}
              value={filters.status}
              onChange={(v) => { setFilters((prev) => ({ ...prev, status: v, page: 1 })); handleSearch(); }}
            >
              {STATUS_OPTIONS.map((o) => <Select.Option key={o} value={o}>{o}</Select.Option>)}
            </Select>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新建项目</Button>
          </Col>
        </Row>
      </Card>

      {/* 项目列表 */}
      <Card style={{ borderRadius: 8 }}>
        <Spin spinning={loading}>
          <Table
            dataSource={projects}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Pagination
              current={filters.page}
              pageSize={filters.pageSize}
              total={statistics?.totalCount ?? 0}
              showSizeChanger
              onChange={(page, pageSize) => setFilters((prev) => ({ ...prev, page, pageSize: pageSize || 10 }))}
            />
          </div>
        </Spin>
      </Card>

      {/* 新建/编辑 Modal */}
      <Modal
        title={editingProject ? '编辑项目' : '新建项目'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="code" label="项目编号" rules={[{ required: true, message: '请输入项目编号' }]}>
                <Input placeholder="例如：PRJ-2024-001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
                <Input placeholder="请输入项目名称" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="customerName" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stage" label="当前阶段" rules={[{ required: true, message: '请选择当前阶段' }]}>
                <Select placeholder="请选择">
                  {STAGE_OPTIONS.filter((o) => o !== '全部').map((o) => <Select.Option key={o} value={o}>{o}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="owner" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
                <Input placeholder="请输入负责人" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="planDate" label="计划日期" rules={[{ required: true, message: '请选择计划日期' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="progress" label="当前进度（%）" initialValue={0} rules={[{ required: true }]}>
            <Input type="number" min={0} max={100} placeholder="0-100" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
