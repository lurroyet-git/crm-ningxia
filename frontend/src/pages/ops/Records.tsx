import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Input, Modal, Form, Select, DatePicker, message, Popconfirm, Spin, Badge
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, FileTextOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface OpsRecord {
  id: string;
  ticketNo: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  relatedProject: string;
  handler: string;
  createdAt: string;
  description?: string;
}

interface OpsStatistics {
  total: number;
  pending: number;
  processing: number;
  highPriority: number;
  weeklyCompleted: number;
  avgDuration: string;
}

const STATUS_COLOR: Record<string, string> = {
  '待处理': '#f59e0b',
  '处理中': '#3b82f6',
  '已完成': '#10b981',
  '已关闭': '#6b7280',
};

const PRIORITY_COLOR: Record<string, string> = {
  '高': '#ef4444',
  '中': '#f59e0b',
  '低': '#3b82f6',
};

export default function OpsRecords() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<OpsRecord[]>([]);
  const [statistics, setStatistics] = useState<OpsStatistics | null>(null);
  const [search, setSearch] = useState({ keyword: '', type: '', priority: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OpsRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<OpsRecord | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [search.type, search.priority, search.status, pagination.page, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        request.get('/ops/records', {
          params: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            keyword: search.keyword || undefined,
            type: search.type || undefined,
            priority: search.priority || undefined,
            status: search.status || undefined,
          },
        }),
        request.get('/ops/records/statistics'),
      ]);
      setRecords(recordsRes.list || []);
      setPagination((prev) => ({ ...prev, total: recordsRes.total || 0 }));
      setStatistics(statsRes);
    } catch (e) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: OpsRecord) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/ops/records/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingRecord) {
        await request.put(`/ops/records/${editingRecord.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/ops/records', values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const handleViewDetail = (record: OpsRecord) => {
    setViewingRecord(record);
    setDetailModalOpen(true);
  };

  const kpiCards = [
    { title: '工单总数', value: statistics?.total ?? 0, color: '#1e3a5f' },
    { title: '待处理', value: statistics?.pending ?? 0, color: '#f59e0b' },
    { title: '处理中', value: statistics?.processing ?? 0, color: '#3b82f6' },
    { title: '高优先级', value: statistics?.highPriority ?? 0, color: '#ef4444' },
    { title: '本周完成', value: statistics?.weeklyCompleted ?? 0, color: '#10b981' },
    { title: '平均处理时长', value: statistics?.avgDuration ?? '-', color: '#6366f1' },
  ];

  const columns = [
    { title: '工单编号', dataIndex: 'ticketNo', key: 'ticketNo', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '标题', dataIndex: 'title', key: 'title', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag>{v}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: (v: string) => <Badge color={PRIORITY_COLOR[v] || '#6b7280'} text={v} /> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={STATUS_COLOR[v] || '#6b7280'}>{v}</Tag> },
    { title: '关联项目', dataIndex: 'relatedProject', key: 'relatedProject' },
    { title: '处理人', dataIndex: 'handler', key: 'handler' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: OpsRecord) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该工单？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
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
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{kpi.title}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 8, marginTop: 16 }}>
        {/* 筛选栏 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索工单标题/编号..."
              prefix={<SearchOutlined />}
              value={search.keyword}
              onChange={(e) => setSearch((prev) => ({ ...prev, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Select placeholder="类型" style={{ width: 120 }} value={search.type || undefined} onChange={(v) => setSearch((prev) => ({ ...prev, type: v }))} allowClear>
              <Select.Option value="故障">故障</Select.Option>
              <Select.Option value="变更">变更</Select.Option>
              <Select.Option value="咨询">咨询</Select.Option>
            </Select>
            <Select placeholder="优先级" style={{ width: 120 }} value={search.priority || undefined} onChange={(v) => setSearch((prev) => ({ ...prev, priority: v }))} allowClear>
              <Select.Option value="高">高</Select.Option>
              <Select.Option value="中">中</Select.Option>
              <Select.Option value="低">低</Select.Option>
            </Select>
            <Select placeholder="状态" style={{ width: 120 }} value={search.status || undefined} onChange={(v) => setSearch((prev) => ({ ...prev, status: v }))} allowClear>
              <Select.Option value="待处理">待处理</Select.Option>
              <Select.Option value="处理中">处理中</Select.Option>
              <Select.Option value="已完成">已完成</Select.Option>
              <Select.Option value="已关闭">已关闭</Select.Option>
            </Select>
            <Button type="primary" onClick={handleSearch}>查询</Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建工单
          </Button>
        </div>

        {/* 工单列表 */}
        <Spin spinning={loading}>
          <Table
            dataSource={records}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <span style={{ color: '#6b7280', fontSize: 13 }}>
              共 {pagination.total} 条数据
            </span>
          </div>
        </Spin>
      </Card>

      {/* 新建/编辑 Modal */}
      <Modal
        title={editingRecord ? '编辑工单' : '新建工单'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入工单标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="故障">故障</Select.Option>
                  <Select.Option value="变更">变更</Select.Option>
                  <Select.Option value="咨询">咨询</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请选择优先级' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="高">高</Select.Option>
                  <Select.Option value="中">中</Select.Option>
                  <Select.Option value="低">低</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="relatedProject" label="关联项目">
                <Input placeholder="请输入关联项目名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="handler" label="处理人">
                <Input placeholder="请输入处理人" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} placeholder="请详细描述问题或需求..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 Modal */}
      <Modal
        title="工单详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={560}
      >
        {viewingRecord && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileTextOutlined style={{ color: 'white', fontSize: 18 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{viewingRecord.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{viewingRecord.ticketNo}</div>
              </div>
              <Tag color={STATUS_COLOR[viewingRecord.status]}>{viewingRecord.status}</Tag>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>类型</div>
                <div style={{ fontWeight: 500 }}>{viewingRecord.type}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>优先级</div>
                <div style={{ fontWeight: 500 }}><Badge color={PRIORITY_COLOR[viewingRecord.priority]} text={viewingRecord.priority} /></div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>关联项目</div>
                <div style={{ fontWeight: 500 }}>{viewingRecord.relatedProject || '-'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>处理人</div>
                <div style={{ fontWeight: 500 }}>{viewingRecord.handler || '-'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>创建时间</div>
                <div style={{ fontWeight: 500 }}>{viewingRecord.createdAt}</div>
              </Col>
            </Row>
            {viewingRecord.description && (
              <div style={{ marginTop: 16 }}>
                <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>描述</div>
                <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, lineHeight: 1.6 }}>{viewingRecord.description}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
