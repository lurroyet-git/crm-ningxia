import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Input, Modal, Form, Select, message, Popconfirm, Spin, Dropdown
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ArrowRightOutlined, DollarOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface Opportunity {
  id: string;
  oppNo: string;
  title: string;
  customer: string;
  amount: number;
  stage: string;
  winRate: number;
  owner: string;
  expectedCloseDate: string;
  description?: string;
  industry?: string;
}

interface OppStatistics {
  total: number;
  monthlyNew: number;
  leadCount: number;
  proposalCount: number;
  quoteCount: number;
  wonAmount: number;
}

const STAGE_COLOR: Record<string, string> = {
  '线索': '#6b7280',
  '商机': '#3b82f6',
  '方案': '#8b5cf6',
  '报价': '#f59e0b',
  '谈判': '#ec4899',
  '赢单': '#10b981',
  '丢单': '#ef4444',
};

const STAGES = ['线索', '商机', '方案', '报价', '谈判', '赢单', '丢单'];

export default function BizPool() {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [statistics, setStatistics] = useState<OppStatistics | null>(null);
  const [search, setSearch] = useState({ keyword: '', stage: '', minAmount: '', maxAmount: '', industry: '' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [viewingOpp, setViewingOpp] = useState<Opportunity | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [search.stage, pagination.page, pagination.pageSize]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [oppRes, statsRes] = await Promise.all([
        request.get('/biz/opportunities', {
          params: {
            page: pagination.page,
            pageSize: pagination.pageSize,
            keyword: search.keyword || undefined,
            stage: search.stage || undefined,
          },
        }),
        request.get('/biz/opportunities/statistics'),
      ]);
      setOpportunities(oppRes.list || []);
      setPagination((prev) => ({ ...prev, total: oppRes.total || 0 }));
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
    setEditingOpp(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (opp: Opportunity) => {
    setEditingOpp(opp);
    form.setFieldsValue(opp);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/biz/opportunities/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleStageChange = async (id: string, stage: string) => {
    try {
      await request.put(`/biz/opportunities/${id}/stage`, { stage });
      message.success('阶段推进成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingOpp) {
        await request.put(`/biz/opportunities/${editingOpp.id}`, values);
        message.success('更新成功');
      } else {
        await request.post('/biz/opportunities', values);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const handleViewDetail = (opp: Opportunity) => {
    setViewingOpp(opp);
    setDetailModalOpen(true);
  };

  const kpiCards = [
    { title: '商机总数', value: statistics?.total ?? 0, color: '#1e3a5f' },
    { title: '本月新增', value: statistics?.monthlyNew ?? 0, color: '#3b82f6' },
    { title: '线索', value: statistics?.leadCount ?? 0, color: '#6b7280' },
    { title: '方案', value: statistics?.proposalCount ?? 0, color: '#8b5cf6' },
    { title: '报价', value: statistics?.quoteCount ?? 0, color: '#f59e0b' },
    { title: '赢单金额', value: `¥${(statistics?.wonAmount ?? 0).toLocaleString()}`, color: '#10b981' },
  ];

  const stageMenuItems = (recordId: string) =>
    STAGES.map((stage) => ({
      key: stage,
      label: stage,
      onClick: () => handleStageChange(recordId, stage),
    }));

  const columns = [
    { title: '商机编号', dataIndex: 'oppNo', key: 'oppNo', width: 120, render: (v: string) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { title: '标题', dataIndex: 'title', key: 'title', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '客户', dataIndex: 'customer', key: 'customer' },
    {
      title: '预计金额',
      dataIndex: 'amount',
      key: 'amount',
      sorter: (a: Opportunity, b: Opportunity) => a.amount - b.amount,
      render: (v: number) => <span style={{ fontWeight: 500, color: '#1e3a5f' }}>¥{v.toLocaleString()}</span>,
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      key: 'stage',
      render: (v: string, record: Opportunity) => (
        <Dropdown menu={{ items: stageMenuItems(record.id) }}>
          <Tag color={STAGE_COLOR[v] || '#6b7280'} style={{ cursor: 'pointer' }}>
            {v} <ArrowRightOutlined style={{ fontSize: 10 }} />
          </Tag>
        </Dropdown>
      ),
    },
    { title: '赢单概率', dataIndex: 'winRate', key: 'winRate', render: (v: number) => `${v}%` },
    { title: '负责人', dataIndex: 'owner', key: 'owner' },
    { title: '预计成交', dataIndex: 'expectedCloseDate', key: 'expectedCloseDate', width: 110 },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Opportunity) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除该商机？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {kpiCards.map((kpi) => (
          <Col span={4} key={kpi.title}>
            <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{kpi.title}</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card style={{ borderRadius: 8, marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input
              placeholder="搜索商机标题/客户..."
              prefix={<SearchOutlined />}
              value={search.keyword}
              onChange={(e) => setSearch((prev) => ({ ...prev, keyword: e.target.value }))}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              allowClear
            />
            <Select placeholder="阶段" style={{ width: 120 }} value={search.stage || undefined} onChange={(v) => setSearch((prev) => ({ ...prev, stage: v }))} allowClear>
              {STAGES.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
            </Select>
            <Select placeholder="行业" style={{ width: 120 }} value={search.industry || undefined} onChange={(v) => setSearch((prev) => ({ ...prev, industry: v }))} allowClear>
              <Select.Option value="医疗">医疗</Select.Option>
              <Select.Option value="教育">教育</Select.Option>
              <Select.Option value="政府">政府</Select.Option>
              <Select.Option value="金融">金融</Select.Option>
              <Select.Option value="企业">企业</Select.Option>
            </Select>
            <Button type="primary" onClick={handleSearch}>查询</Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建商机
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            dataSource={opportunities}
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

      <Modal
        title={editingOpp ? '编辑商机' : '新建商机'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="商机标题" rules={[{ required: true, message: '请输入商机标题' }]}>
            <Input placeholder="请输入商机标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer" label="客户" rules={[{ required: true, message: '请输入客户名称' }]}>
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="amount" label="预计金额" rules={[{ required: true, message: '请输入预计金额' }]}>
                <Input type="number" prefix="¥" placeholder="请输入金额" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stage" label="阶段" rules={[{ required: true, message: '请选择阶段' }]}>
                <Select placeholder="请选择">
                  {STAGES.map((s) => <Select.Option key={s} value={s}>{s}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="winRate" label="赢单概率" rules={[{ required: true, message: '请输入赢单概率' }]}>
                <Input type="number" suffix="%" placeholder="0-100" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="owner" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
                <Input placeholder="请输入负责人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expectedCloseDate" label="预计成交日期" rules={[{ required: true, message: '请选择预计成交日期' }]}>
                <Input type="date" placeholder="请选择" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="补充商机描述..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="商机详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={560}
      >
        {viewingOpp && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: '#1e3a5f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarOutlined style={{ color: 'white', fontSize: 18 }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{viewingOpp.title}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{viewingOpp.oppNo}</div>
              </div>
              <Tag color={STAGE_COLOR[viewingOpp.stage]}>{viewingOpp.stage}</Tag>
            </div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>客户</div>
                <div style={{ fontWeight: 500 }}>{viewingOpp.customer}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>预计金额</div>
                <div style={{ fontWeight: 500 }}>¥{viewingOpp.amount.toLocaleString()}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>赢单概率</div>
                <div style={{ fontWeight: 500 }}>{viewingOpp.winRate}%</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>负责人</div>
                <div style={{ fontWeight: 500 }}>{viewingOpp.owner}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>预计成交日期</div>
                <div style={{ fontWeight: 500 }}>{viewingOpp.expectedCloseDate}</div>
              </Col>
            </Row>
            {viewingOpp.description && (
              <div style={{ marginTop: 16 }}>
                <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>描述</div>
                <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, lineHeight: 1.6 }}>{viewingOpp.description}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
