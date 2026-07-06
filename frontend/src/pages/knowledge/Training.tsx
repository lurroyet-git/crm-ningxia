import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Modal, Form, Select, message, Popconfirm, Spin
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, BookOutlined, UserOutlined, CalendarOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface TrainingPlan {
  id: string;
  title: string;
  type: string;
  target: string;
  startDate: string;
  endDate: string;
  instructor: string;
  status: string;
}

const STATUS_COLOR: Record<string, string> = {
  '计划中': '#3b82f6',
  '进行中': '#10b981',
  '已完成': '#6b7280',
};

export default function KnowledgeTraining() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [filter, setFilter] = useState({ keyword: '', type: '', status: '', date: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TrainingPlan | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/knowledge/training-plans');
      setPlans(res.list || []);
    } catch (e) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingPlan(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (plan: TrainingPlan) => {
    setEditingPlan(plan);
    form.setFieldsValue(plan);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/knowledge/training-plans/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await request.put(`/knowledge/training-plans/${id}/status`, { status });
      message.success('状态更新成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingPlan) {
        await request.put(`/knowledge/training-plans/${editingPlan.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/knowledge/training-plans', values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (filter.keyword && !p.title.includes(filter.keyword)) return false;
    if (filter.type && p.type !== filter.type) return false;
    if (filter.status && p.status !== filter.status) return false;
    if (filter.date && !p.startDate.includes(filter.date) && !p.endDate.includes(filter.date)) return false;
    return true;
  });

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '培训对象', dataIndex: 'target', key: 'target' },
    { title: '起止日期', key: 'date', render: (_: any, record: TrainingPlan) => `${record.startDate} ~ ${record.endDate}` },
    { title: '讲师', dataIndex: 'instructor', key: 'instructor' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={STATUS_COLOR[v] || '#6b7280'}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: TrainingPlan) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === '计划中' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, '进行中')}>开始</Button>
          )}
          {record.status === '进行中' && (
            <Button type="link" size="small" onClick={() => handleUpdateStatus(record.id, '已完成')}>完成</Button>
          )}
          <Popconfirm title="确认删除该培训计划？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索培训标题..."
              prefix={<SearchOutlined />}
              value={filter.keyword}
              onChange={(e) => setFilter((prev) => ({ ...prev, keyword: e.target.value }))}
              style={{ width: 200 }}
              allowClear
            />
            <Select placeholder="类型" style={{ width: 120 }} value={filter.type || undefined} onChange={(v) => setFilter((prev) => ({ ...prev, type: v }))} allowClear>
              <Select.Option value="技术培训">技术培训</Select.Option>
              <Select.Option value="产品培训">产品培训</Select.Option>
              <Select.Option value="销售培训">销售培训</Select.Option>
              <Select.Option value="管理培训">管理培训</Select.Option>
            </Select>
            <Select placeholder="状态" style={{ width: 120 }} value={filter.status || undefined} onChange={(v) => setFilter((prev) => ({ ...prev, status: v }))} allowClear>
              <Select.Option value="计划中">计划中</Select.Option>
              <Select.Option value="进行中">进行中</Select.Option>
              <Select.Option value="已完成">已完成</Select.Option>
            </Select>
            <Input
              placeholder="年份/月份"
              value={filter.date}
              onChange={(e) => setFilter((prev) => ({ ...prev, date: e.target.value }))}
              style={{ width: 140 }}
              allowClear
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建计划
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            dataSource={filteredPlans}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Spin>
      </Card>

      <Modal
        title={editingPlan ? '编辑培训计划' : '新建培训计划'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="培训标题" rules={[{ required: true, message: '请输入培训标题' }]}>
            <Input placeholder="请输入培训标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="技术培训">技术培训</Select.Option>
                  <Select.Option value="产品培训">产品培训</Select.Option>
                  <Select.Option value="销售培训">销售培训</Select.Option>
                  <Select.Option value="管理培训">管理培训</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="target" label="培训对象" rules={[{ required: true, message: '请输入培训对象' }]}>
                <Input placeholder="例如：运维团队/销售团队" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startDate" label="开始日期" rules={[{ required: true, message: '请选择开始日期' }]}>
                <Input type="date" placeholder="请选择" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endDate" label="结束日期" rules={[{ required: true, message: '请选择结束日期' }]}>
                <Input type="date" placeholder="请选择" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="instructor" label="讲师" rules={[{ required: true, message: '请输入讲师' }]}>
                <Input placeholder="请输入讲师姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]} initialValue="计划中">
                <Select>
                  <Select.Option value="计划中">计划中</Select.Option>
                  <Select.Option value="进行中">进行中</Select.Option>
                  <Select.Option value="已完成">已完成</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
