import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Modal, Form, Select, message, Popconfirm, Spin, Badge, Avatar
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  EnvironmentOutlined, TeamOutlined, ApartmentOutlined, GlobalOutlined, LinkOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface Customer {
  id: string;
  name: string;
  type: string;
  city: string;
  industry: string;
  grade: string;
  healthStatus: string;
  owner: string;
  contactName?: string;
  contactPhone?: string;
}

const HEALTH_COLOR: Record<string, string> = {
  健康: '#10b981',
  正常: '#3b82f6',
  关注: '#f59e0b',
  风险: '#ef4444',
};

const GRADE_COLOR: Record<string, string> = {
  A: '#ef4444',
  B: '#f59e0b',
  C: '#3b82f6',
  D: '#6b7280',
};

const FILTER_TABS = [
  { key: 'all', label: '全部客户' },
  { key: 'key', label: '重点客户' },
  { key: 'healthy', label: '健康客户' },
  { key: 'risk', label: '风险客户' },
];

export default function CustomerAssets() {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [distribution, setDistribution] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [form] = Form.useForm();

  const [pagination, setPagination] = useState({ page: 1, pageSize: 10 });

  useEffect(() => {
    fetchData();
  }, [activeFilter, pagination.page, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, distRes] = await Promise.all([
        request.get('/customers', {
          params: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            keyword: searchText || undefined,
            grade: activeFilter === 'key' ? 'A' : undefined,
            healthStatus: activeFilter === 'healthy' ? '健康' : activeFilter === 'risk' ? '风险' : undefined,
          },
        }),
        request.get('/customers/distribution'),
      ]);
      setCustomers(custRes.list || []);
      setDistribution(distRes);
    } catch (e) {
      // 错误已在拦截器中提示
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchData();
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue(customer);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/customers/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中提示
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingCustomer) {
        await request.put(`/customers/${editingCustomer.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/customers', values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const handleViewDetail = (customer: Customer) => {
    setViewingCustomer(customer);
    setDetailModalOpen(true);
  };

  const columns = [
    { title: '客户名称', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '城市', dataIndex: 'city', key: 'city' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    {
      title: '分级',
      dataIndex: 'grade',
      key: 'grade',
      render: (v: string) => <Tag color={GRADE_COLOR[v] || '#6b7280'}>{v}级</Tag>,
    },
    {
      title: '健康度',
      dataIndex: 'healthStatus',
      key: 'healthStatus',
      render: (v: string) => <Badge color={HEALTH_COLOR[v] || '#6b7280'} text={v} />,
    },
    { title: '负责人', dataIndex: 'owner', key: 'owner' },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: Customer) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除该客户？"
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

  // 区域分布数据（模拟）
  const cityStats = distribution?.cities || [
    { city: '银川市', count: 24, percentage: 40 },
    { city: '石嘴山市', count: 12, percentage: 20 },
    { city: '吴忠市', count: 10, percentage: 17 },
    { city: '中卫市', count: 8, percentage: 13 },
    { city: '固原市', count: 6, percentage: 10 },
  ];

  // 权力地图（模拟）
  const powerMap = [
    { role: '决策人', name: '张院长', influence: 95, relation: '良好' },
    { role: '技术负责人', name: '李主任', influence: 80, relation: '紧密' },
    { role: '采购负责人', name: '王科长', influence: 70, relation: '一般' },
    { role: '使用人', name: '赵工程师', influence: 50, relation: '良好' },
  ];

  // 客户树（模拟）
  const customerTree = [
    {
      name: '宁夏人民医院',
      children: [
        { name: '信息中心', children: [{ name: '服务器运维' }, { name: '网络安全' }] },
        { name: '财务科', children: [{ name: '财务系统' }] },
      ],
    },
    {
      name: '银川市教育局',
      children: [
        { name: '信息中心', children: [{ name: '城域网运维' }, { name: '校园安全' }] },
      ],
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 左侧主内容 */}
        <Col span={17}>
          <Card style={{ borderRadius: 8 }}>
            {/* 筛选 + 搜索 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {FILTER_TABS.map((tab) => (
                  <Button
                    key={tab.key}
                    type={activeFilter === tab.key ? 'primary' : 'default'}
                    onClick={() => {
                      setActiveFilter(tab.key);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder="搜索客户名称/城市/行业..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={handleSearch}
                  style={{ width: 260 }}
                  allowClear
                />
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                  新建客户
                </Button>
              </div>
            </div>

            {/* 客户表格 */}
            <Spin spinning={loading}>
              <Table
                dataSource={customers}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
              />
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                {/* 简化分页展示 */}
                <span style={{ color: '#6b7280', fontSize: 13 }}>
                  共 {customers.length} 条数据
                </span>
              </div>
            </Spin>
          </Card>

          {/* 可视协作面板 */}
          <Card title="可视协作面板" style={{ borderRadius: 8, marginTop: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <div style={{ background: '#f0f9ff', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <GlobalOutlined style={{ fontSize: 28, color: '#0ea5e9', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>行业覆盖</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#0ea5e9', marginTop: 4 }}>8</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>个主要行业</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <TeamOutlined style={{ fontSize: 28, color: '#10b981', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>客户总数</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#10b981', marginTop: 4 }}>{customers.length}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>活跃客户</div>
                </div>
              </Col>
              <Col span={8}>
                <div style={{ background: '#faf5ff', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <LinkOutlined style={{ fontSize: 28, color: '#a855f7', marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>关系网络</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: '#a855f7', marginTop: 4 }}>156</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>关键联系人</div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* 右侧侧边栏 */}
        <Col span={7}>
          {/* 区域分布 */}
          <Card title={<span><EnvironmentOutlined /> 区域分布</span>} style={{ borderRadius: 8, marginBottom: 16 }}>
            {cityStats.map((c: any) => (
              <div key={c.city} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{c.city}</span>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>{c.count}家 ({c.percentage}%)</span>
                </div>
                <div style={{ height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${c.percentage}%`, height: '100%', background: '#3b82f6', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </Card>

          {/* 权力地图 */}
          <Card title={<span><TeamOutlined /> 权力地图</span>} style={{ borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {powerMap.map((p) => (
                <div key={p.role} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#f9fafb', borderRadius: 6 }}>
                  <Avatar size="small" style={{ background: '#3b82f6' }}>{p.name.charAt(0)}</Avatar>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{p.role}</div>
                  </div>
                  <Tag color={p.relation === '紧密' ? '#10b981' : p.relation === '良好' ? '#3b82f6' : '#f59e0b'}>{p.relation}</Tag>
                </div>
              ))}
            </div>
          </Card>

          {/* 客户树 */}
          <Card title={<span><ApartmentOutlined /> 客户组织树</span>} style={{ borderRadius: 8 }}>
            {customerTree.map((tree) => (
              <div key={tree.name} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6, color: '#1e3a5f' }}>{tree.name}</div>
                {tree.children?.map((dept) => (
                  <div key={dept.name} style={{ marginLeft: 12, marginBottom: 4 }}>
                    <div style={{ fontSize: 12, color: '#4b5563', marginBottom: 2 }}>├ {dept.name}</div>
                    {dept.children?.map((sys) => (
                      <div key={sys.name} style={{ marginLeft: 24, fontSize: 11, color: '#9ca3af' }}>├ {sys.name}</div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </Card>
        </Col>
      </Row>

      {/* 新建/编辑 Modal */}
      <Modal
        title={editingCustomer ? '编辑客户' : '新建客户'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="客户名称" rules={[{ required: true, message: '请输入客户名称' }]}>
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="客户类型" rules={[{ required: true, message: '请选择客户类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="政府机关">政府机关</Select.Option>
                  <Select.Option value="医疗机构">医疗机构</Select.Option>
                  <Select.Option value="金融机构">金融机构</Select.Option>
                  <Select.Option value="教育机构">教育机构</Select.Option>
                  <Select.Option value="企业">企业</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="city" label="城市" rules={[{ required: true, message: '请输入城市' }]}>
                <Input placeholder="例如：银川市" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="industry" label="行业" rules={[{ required: true, message: '请输入行业' }]}>
                <Input placeholder="例如：医疗" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="grade" label="客户分级" rules={[{ required: true }]} initialValue="B">
                <Select>
                  <Select.Option value="A">A - 战略客户</Select.Option>
                  <Select.Option value="B">B - 重要客户</Select.Option>
                  <Select.Option value="C">C - 普通客户</Select.Option>
                  <Select.Option value="D">D - 潜在客户</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="healthStatus" label="健康度" rules={[{ required: true }]} initialValue="正常">
                <Select>
                  <Select.Option value="健康">健康</Select.Option>
                  <Select.Option value="正常">正常</Select.Option>
                  <Select.Option value="关注">关注</Select.Option>
                  <Select.Option value="风险">风险</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="owner" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
                <Input placeholder="负责人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="contactName" label="联系人">
                <Input placeholder="联系人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="contactPhone" label="联系电话">
            <Input placeholder="联系电话" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情 Modal */}
      <Modal
        title="客户详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={560}
      >
        {viewingCustomer && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
              <Avatar size={48} style={{ background: '#1e3a5f', fontSize: 20 }}>{viewingCustomer.name.charAt(0)}</Avatar>
              <div>
                <h3 style={{ margin: 0 }}>{viewingCustomer.name}</h3>
                <div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>
                  {viewingCustomer.type} · {viewingCustomer.city} · {viewingCustomer.industry}
                </div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <Tag color={GRADE_COLOR[viewingCustomer.grade]}>{viewingCustomer.grade}级</Tag>
                <Tag color={HEALTH_COLOR[viewingCustomer.healthStatus]}>{viewingCustomer.healthStatus}</Tag>
              </div>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>负责人</div>
                <div style={{ fontWeight: 500 }}>{viewingCustomer.owner}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>联系人</div>
                <div style={{ fontWeight: 500 }}>{viewingCustomer.contactName || '-'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>联系电话</div>
                <div style={{ fontWeight: 500 }}>{viewingCustomer.contactPhone || '-'}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>客户ID</div>
                <div style={{ fontWeight: 500, fontFamily: 'monospace' }}>{viewingCustomer.id}</div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
