import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Input, Modal, Form, Select, DatePicker, message, Popconfirm, Spin
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface Asset {
  id: string;
  assetNo: string;
  name: string;
  category: string;
  model: string;
  vendor: string;
  location: string;
  status: string;
  purchaseDate: string;
  warrantyDate: string;
  value: number;
}

interface AssetStatistics {
  total: number;
  normal: number;
  repairing: number;
  idle: number;
  expiringSoon: number;
  totalValue: number;
}

const STATUS_COLOR: Record<string, string> = {
  '正常': '#10b981',
  '维修中': '#f59e0b',
  '闲置': '#6b7280',
  '报废': '#ef4444',
};

const CATEGORY_COLOR: Record<string, string> = {
  '服务器': '#3b82f6',
  '网络': '#10b981',
  '存储': '#f59e0b',
  '安全': '#ef4444',
  '办公': '#6366f1',
};

export default function OpsAssets() {
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [statistics, setStatistics] = useState<AssetStatistics | null>(null);
  const [search, setSearch] = useState({ keyword: '', category: '', status: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [search.category, search.status, pagination.page, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetsRes, statsRes] = await Promise.all([
        request.get('/ops/assets', {
          params: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            keyword: search.keyword || undefined,
            category: search.category || undefined,
            status: search.status || undefined,
          },
        }),
        request.get('/ops/assets/statistics'),
      ]);
      setAssets(assetsRes.list || []);
      setPagination((prev) => ({ ...prev, total: assetsRes.total || 0 }));
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
    setEditingAsset(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    form.setFieldsValue(asset);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/ops/assets/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingAsset) {
        await request.put(`/ops/assets/${editingAsset.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/ops/assets', values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const kpiCards = [
    { title: '资产总数', value: statistics?.total ?? 0, color: '#1e3a5f' },
    { title: '正常', value: statistics?.normal ?? 0, color: '#10b981' },
    { title: '维修中', value: statistics?.repairing ?? 0, color: '#f59e0b' },
    { title: '闲置', value: statistics?.idle ?? 0, color: '#6b7280' },
    { title: '即将过保', value: statistics?.expiringSoon ?? 0, color: '#ef4444' },
    { title: '总价值', value: `¥${(statistics?.totalValue ?? 0).toLocaleString()}`, color: '#6366f1' },
  ];

  const categoryStats = [
    { label: '服务器', value: statistics?.serverCount ?? 0, color: '#3b82f6' },
    { label: '网络', value: statistics?.networkCount ?? 0, color: '#10b981' },
    { label: '存储', value: statistics?.storageCount ?? 0, color: '#f59e0b' },
    { label: '安全', value: statistics?.securityCount ?? 0, color: '#ef4444' },
    { label: '办公', value: statistics?.officeCount ?? 0, color: '#6366f1' },
  ];

  const totalCategoryCount = categoryStats.reduce((sum, c) => sum + c.value, 0) || 1;

  const columns = [
    { title: '资产编号', dataIndex: 'assetNo', key: 'assetNo', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '名称', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '分类', dataIndex: 'category', key: 'category', render: (v: string) => <Tag color={CATEGORY_COLOR[v] || '#6b7280'}>{v}</Tag> },
    { title: '型号', dataIndex: 'model', key: 'model' },
    { title: '厂商', dataIndex: 'vendor', key: 'vendor' },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={STATUS_COLOR[v] || '#6b7280'}>{v}</Tag> },
    { title: '采购日期', dataIndex: 'purchaseDate', key: 'purchaseDate', width: 110 },
    { title: '保修期', dataIndex: 'warrantyDate', key: 'warrantyDate', width: 110 },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: Asset) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该资产？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* KPI 卡片 */}
        {kpiCards.map((kpi) => (
          <Col span={4} key={kpi.title}>
            <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{kpi.title}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={18}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Input
                  placeholder="搜索资产名称/编号..."
                  prefix={<SearchOutlined />}
                  value={search.keyword}
                  onChange={(e) => setSearch((prev) => ({ ...prev, keyword: e.target.value }))}
                  onPressEnter={handleSearch}
                  style={{ width: 200 }}
                  allowClear
                />
                <Select placeholder="分类" style={{ width: 120 }} value={search.category || undefined} onChange={(v) => setSearch((prev) => ({ ...prev, category: v }))} allowClear>
                  <Select.Option value="服务器">服务器</Select.Option>
                  <Select.Option value="网络">网络</Select.Option>
                  <Select.Option value="存储">存储</Select.Option>
                  <Select.Option value="安全">安全</Select.Option>
                  <Select.Option value="办公">办公</Select.Option>
                </Select>
                <Select placeholder="状态" style={{ width: 120 }} value={search.status || undefined} onChange={(v) => setSearch((prev) => ({ ...prev, status: v }))} allowClear>
                  <Select.Option value="正常">正常</Select.Option>
                  <Select.Option value="维修中">维修中</Select.Option>
                  <Select.Option value="闲置">闲置</Select.Option>
                  <Select.Option value="报废">报废</Select.Option>
                </Select>
                <Button type="primary" onClick={handleSearch}>查询</Button>
              </div>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
                新增资产
              </Button>
            </div>

            <Spin spinning={loading}>
              <Table
                dataSource={assets}
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
        </Col>

        <Col span={6}>
          <Card title="资产分类占比" style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
              {categoryStats.map((cat) => (
                <div key={cat.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13 }}>{cat.label}</span>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{cat.value}台</span>
                  </div>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${(cat.value / totalCategoryCount) * 100}%`, height: '100%', background: cat.color, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Modal
        title={editingAsset ? '编辑资产' : '新增资产'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="资产名称" rules={[{ required: true, message: '请输入资产名称' }]}>
                <Input placeholder="请输入资产名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="assetNo" label="资产编号" rules={[{ required: true, message: '请输入资产编号' }]}>
                <Input placeholder="请输入资产编号" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="服务器">服务器</Select.Option>
                  <Select.Option value="网络">网络</Select.Option>
                  <Select.Option value="存储">存储</Select.Option>
                  <Select.Option value="安全">安全</Select.Option>
                  <Select.Option value="办公">办公</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="正常">正常</Select.Option>
                  <Select.Option value="维修中">维修中</Select.Option>
                  <Select.Option value="闲置">闲置</Select.Option>
                  <Select.Option value="报废">报废</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="model" label="型号">
                <Input placeholder="请输入型号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="vendor" label="厂商">
                <Input placeholder="请输入厂商" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="位置">
                <Input placeholder="例如：机房A-3号机柜" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="value" label="价值（元）">
                <Input type="number" placeholder="请输入价值" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="purchaseDate" label="采购日期">
                <Input type="date" placeholder="请选择" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="warrantyDate" label="保修截止日期">
                <Input type="date" placeholder="请选择" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
