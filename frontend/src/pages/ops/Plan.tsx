import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Modal, Form, Select, DatePicker, message, Popconfirm, Spin, Collapse, Calendar
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, PauseCircleOutlined, CalendarOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface InspectionPlan {
  id: string;
  name: string;
  type: string;
  frequency: string;
  cycle: string;
  executor: string;
  status: string;
  startDate: string;
  endDate: string;
  checkItems: CheckItem[];
}

interface CheckItem {
  id: string;
  name: string;
  standard: string;
}

const STATUS_COLOR: Record<string, string> = {
  '启用': '#10b981',
  '暂停': '#f59e0b',
  '完成': '#3b82f6',
};

export default function OpsPlan() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<InspectionPlan[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<InspectionPlan | null>(null);
  const [form] = Form.useForm();
  const [checkItems, setCheckItems] = useState<CheckItem[]>([{ id: '1', name: '', standard: '' }]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/ops/inspection-plans');
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
    setCheckItems([{ id: '1', name: '', standard: '' }]);
    setIsModalOpen(true);
  };

  const handleEdit = (plan: InspectionPlan) => {
    setEditingPlan(plan);
    form.setFieldsValue(plan);
    setCheckItems(plan.checkItems?.length ? plan.checkItems : [{ id: '1', name: '', standard: '' }]);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/ops/inspection-plans/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await request.put(`/ops/inspection-plans/${id}/toggle`);
      message.success('状态更新成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = { ...values, checkItems: checkItems.filter((i) => i.name.trim()) };
      if (editingPlan) {
        await request.put(`/ops/inspection-plans/${editingPlan.id}`, data);
        message.success('更新成功');
      } else {
        await request.post('/ops/inspection-plans', data);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const addCheckItem = () => {
    setCheckItems((prev) => [...prev, { id: Date.now().toString(), name: '', standard: '' }]);
  };

  const removeCheckItem = (id: string) => {
    setCheckItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateCheckItem = (id: string, field: keyof CheckItem, value: string) => {
    setCheckItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  };

  const columns = [
    { title: '计划名称', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '频率', dataIndex: 'frequency', key: 'frequency' },
    { title: '周期', dataIndex: 'cycle', key: 'cycle' },
    { title: '执行人', dataIndex: 'executor', key: 'executor' },
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
      render: (_: any, record: InspectionPlan) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" onClick={() => handleToggleStatus(record.id)}>
            {record.status === '启用' ? <PauseCircleOutlined /> : <CheckCircleOutlined />}
            {record.status === '启用' ? '暂停' : '启用'}
          </Button>
          <Popconfirm title="确认删除该计划？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const expandedRowRender = (record: InspectionPlan) => (
    <div style={{ padding: '8px 16px' }}>
      <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>检查项明细</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {record.checkItems?.map((item) => (
          <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '8px 12px', background: '#f9fafb', borderRadius: 6 }}>
            <div style={{ flex: 1, fontSize: 13 }}>{item.name}</div>
            <div style={{ color: '#6b7280', fontSize: 12 }}>标准: {item.standard}</div>
          </div>
        )) || <span style={{ color: '#9ca3af', fontSize: 13 }}>暂无检查项</span>}
      </div>
    </div>
  );

  return (
    <div>
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              placeholder="搜索计划名称..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240 }}
              allowClear
            />
            <Button.Group>
              <Button type={viewMode === 'list' ? 'primary' : 'default'} icon={<UnorderedListOutlined />} onClick={() => setViewMode('list')}>列表</Button>
              <Button type={viewMode === 'calendar' ? 'primary' : 'default'} icon={<CalendarOutlined />} onClick={() => setViewMode('calendar')}>日历</Button>
            </Button.Group>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建计划
          </Button>
        </div>

        <Spin spinning={loading}>
          {viewMode === 'list' ? (
            <Table
              dataSource={plans.filter((p) => !searchText || p.name.includes(searchText))}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
              expandable={{ expandedRowRender }}
            />
          ) : (
            <div style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, marginBottom: 8 }}>
                {['周日', '周一', '周二', '周三', '周四', '周五', '周六'].map((d) => (
                  <div key={d} style={{ textAlign: 'center', fontWeight: 600, fontSize: 13, color: '#6b7280' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
                {Array.from({ length: 35 }).map((_, i) => {
                  const day = (i % 31) + 1;
                  const planForDay = plans.filter((p) => day % 7 === 0);
                  return (
                    <div key={i} style={{ minHeight: 80, border: '1px solid #e5e7eb', borderRadius: 6, padding: 4, background: 'white' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{day}</div>
                      {planForDay.slice(0, 2).map((p) => (
                        <div key={p.id} style={{ fontSize: 11, padding: '2px 4px', background: '#dbeafe', borderRadius: 4, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Spin>
      </Card>

      <Modal
        title={editingPlan ? '编辑巡检计划' : '新建巡检计划'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="计划名称" rules={[{ required: true, message: '请输入计划名称' }]}>
                <Input placeholder="请输入计划名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="日常巡检">日常巡检</Select.Option>
                  <Select.Option value="专项巡检">专项巡检</Select.Option>
                  <Select.Option value="应急巡检">应急巡检</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="frequency" label="频率" rules={[{ required: true, message: '请选择频率' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="每日">每日</Select.Option>
                  <Select.Option value="每周">每周</Select.Option>
                  <Select.Option value="每月">每月</Select.Option>
                  <Select.Option value="每季度">每季度</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="cycle" label="周期" rules={[{ required: true, message: '请输入周期' }]}>
                <Input placeholder="例如：2024-01-01 至 2024-12-31" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="executor" label="执行人" rules={[{ required: true, message: '请输入执行人' }]}>
                <Input placeholder="请输入执行人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]} initialValue="启用">
                <Select>
                  <Select.Option value="启用">启用</Select.Option>
                  <Select.Option value="暂停">暂停</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ marginBottom: 8, fontWeight: 600, fontSize: 14 }}>检查项</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {checkItems.map((item, index) => (
              <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Input
                  placeholder="检查项名称"
                  value={item.name}
                  onChange={(e) => updateCheckItem(item.id, 'name', e.target.value)}
                  style={{ flex: 1 }}
                />
                <Input
                  placeholder="检查标准"
                  value={item.standard}
                  onChange={(e) => updateCheckItem(item.id, 'standard', e.target.value)}
                  style={{ flex: 1 }}
                />
                {checkItems.length > 1 && (
                  <Button type="link" danger onClick={() => removeCheckItem(item.id)}>删除</Button>
                )}
              </div>
            ))}
          </div>
          <Button type="dashed" block onClick={addCheckItem}>+ 添加检查项</Button>
        </Form>
      </Modal>
    </div>
  );
}
