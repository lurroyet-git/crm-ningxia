import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Select, Modal, Form, DatePicker, message, Popconfirm, Spin, Statistic
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, DollarOutlined, PieChartOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface CostItem {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  vendor: string;
  invoiceNo: string;
  date: string;
  status: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

const STATUS_COLOR: Record<string, string> = {
  '已确认': '#10b981',
  '待确认': '#f59e0b',
  '已取消': '#9ca3af',
};

const TYPE_COLOR: Record<string, string> = {
  '采购': '#3b82f6',
  '施工': '#8b5cf6',
  '差旅': '#f59e0b',
  '人工': '#10b981',
  '其他': '#6b7280',
};

export default function ProjectCost() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [costs, setCosts] = useState<CostItem[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [filterType, setFilterType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<CostItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchCosts();
    }
  }, [selectedProject, filterType]);

  const fetchProjects = async () => {
    try {
      const res = await request.get('/projects?page=1&pageSize=100');
      const list = (res.list || []).map((p: any) => ({ id: p.id, name: p.name }));
      setProjects(list);
      if (list.length > 0 && !selectedProject) {
        setSelectedProject(list[0].id);
      }
    } catch (e) {
      setProjects([
        { id: 'demo-1', name: '宁夏人民医院信息化升级项目' },
        { id: 'demo-2', name: '银川市政务云平台建设' },
      ]);
      setSelectedProject('demo-1');
    }
  };

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const [costsRes, statsRes] = await Promise.all([
        request.get(`/projects/${selectedProject}/costs`, { params: { type: filterType || undefined } }),
        request.get(`/projects/${selectedProject}/costs/statistics`),
      ]);
      setCosts(costsRes.list || []);
      setStatistics(statsRes);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCost(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (cost: CostItem) => {
    setEditingCost(cost);
    form.setFieldsValue(cost);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/costs/${id}`);
      message.success('删除成功');
      fetchCosts();
    } catch (e) {
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingCost) {
        await request.put(`/costs/${editingCost.id}`, values);
        message.success('更新成功');
      } else {
        await request.post(`/projects/${selectedProject}/costs`, values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchCosts();
    } catch {
    }
  };

  const columns = [
    { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={TYPE_COLOR[v] || '#6b7280'}>{v}</Tag> },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (v: string) => <span style={{ fontWeight: 600, color: '#1e3a5f' }}>¥{Number(v).toLocaleString()}</span> },
    { title: '说明', dataIndex: 'description', key: 'description', ellipsis: true },
    { title: '供应商', dataIndex: 'vendor', key: 'vendor' },
    { title: '发票号', dataIndex: 'invoiceNo', key: 'invoiceNo' },
    { title: '日期', dataIndex: 'date', key: 'date', width: 110 },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={STATUS_COLOR[v] || '#6b7280'}>{v}</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: CostItem) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const typeStats = statistics?.byType || {};

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>项目选择</div>
            <Select
              style={{ width: '100%' }}
              value={selectedProject}
              onChange={setSelectedProject}
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
              placeholder="请选择项目"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="成本总额" value={`¥${(statistics?.total || 0).toLocaleString()}`} prefix={<DollarOutlined />} valueStyle={{ color: '#1e3a5f' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="记录条数" value={statistics?.count || 0} prefix={<PieChartOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {Object.entries(typeStats).map(([type, amount]: [string, any]) => (
          <Col span={4} key={type}>
            <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '12px 16px' }}>
              <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{type}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: TYPE_COLOR[type] || '#1e3a5f' }}>¥{Number(amount).toLocaleString()}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select placeholder="费用类型" style={{ width: 120 }} value={filterType || undefined} onChange={setFilterType} allowClear>
              <Select.Option value="采购">采购</Select.Option>
              <Select.Option value="施工">施工</Select.Option>
              <Select.Option value="差旅">差旅</Select.Option>
              <Select.Option value="人工">人工</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增费用</Button>
        </div>

        <Spin spinning={loading}>
          <Table dataSource={costs} columns={columns} rowKey="id" pagination={false} size="small" />
        </Spin>
      </Card>

      <Modal
        title={editingCost ? '编辑费用' : '新增费用'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="费用类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="采购">采购</Select.Option>
                  <Select.Option value="施工">施工</Select.Option>
                  <Select.Option value="差旅">差旅</Select.Option>
                  <Select.Option value="人工">人工</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请输入分类' }]}>
                <Input placeholder="例如：服务器设备" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="金额（元）" rules={[{ required: true, message: '请输入金额' }]}>
                <Input type="number" placeholder="请输入金额" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]} initialValue="待确认">
                <Select>
                  <Select.Option value="已确认">已确认</Select.Option>
                  <Select.Option value="待确认">待确认</Select.Option>
                  <Select.Option value="已取消">已取消</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="费用说明">
            <Input.TextArea rows={2} placeholder="请输入费用说明" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="vendor" label="供应商">
                <Input placeholder="请输入供应商" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="invoiceNo" label="发票号">
                <Input placeholder="请输入发票号" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="date" label="费用日期">
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
