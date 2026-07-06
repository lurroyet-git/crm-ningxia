import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Modal, Form, Select, message, Popconfirm, Spin, Badge
} from 'antd';
import {
  PlusOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, EnvironmentOutlined, CalendarOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface VisitPlan {
  id: string;
  date: string;
  customer: string;
  purpose: string;
  location: string;
  status: string;
  result?: string;
  checkInTime?: string;
}

const STATUS_COLOR: Record<string, string> = {
  '计划': '#3b82f6',
  '已完成': '#10b981',
  '取消': '#6b7280',
};

export default function BizVisit() {
  const [loading, setLoading] = useState(true);
  const [visits, setVisits] = useState<VisitPlan[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/biz/visit-plans');
      setVisits(res.list || []);
    } catch (e) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      await request.post('/biz/visit-plans', values);
      message.success('创建成功');
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await request.put(`/biz/visit-plans/${id}/status`, { status });
      message.success('状态更新成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await request.post(`/biz/visit-plans/${id}/checkin`);
      message.success('签到成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const filteredVisits = visits.filter((v) => !searchText || v.customer.includes(searchText) || v.purpose.includes(searchText));

  const columns = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    { title: '客户', dataIndex: 'customer', key: 'customer', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '拜访目的', dataIndex: 'purpose', key: 'purpose' },
    { title: '地点', dataIndex: 'location', key: 'location' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={STATUS_COLOR[v] || '#6b7280'}>{v}</Tag>,
    },
    { title: '结果', dataIndex: 'result', key: 'result', render: (v: string) => v || '-' },
    {
      title: '操作',
      key: 'action',
      width: 220,
      render: (_: any, record: VisitPlan) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {record.status === '计划' && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record.id, '已完成')}>完成</Button>
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleUpdateStatus(record.id, '取消')}>取消</Button>
              <Button type="link" size="small" icon={<EnvironmentOutlined />} onClick={() => {
                Modal.confirm({
                  title: '确认签到',
                  content: `确认在 ${record.location} 进行签到吗？`,
                  onOk: () => handleCheckIn(record.id),
                });
              }}>签到</Button>
            </>
          )}
          {record.status === '已完成' && <span style={{ color: '#10b981', fontSize: 12 }}>已{record.checkInTime ? `签到(${record.checkInTime})` : '完成'}</span>}
          {record.status === '取消' && <span style={{ color: '#6b7280', fontSize: 12 }}>已取消</span>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Input
              placeholder="搜索客户/目的..."
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
            新建拜访
          </Button>
        </div>

        <Spin spinning={loading}>
          {viewMode === 'list' ? (
            <Table
              dataSource={filteredVisits}
              columns={columns}
              rowKey="id"
              pagination={false}
              size="small"
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
                  const visitForDay = filteredVisits.filter((v) => v.date.endsWith(`-${day.toString().padStart(2, '0')}`) || v.date.endsWith(`-${day}`));
                  return (
                    <div key={i} style={{ minHeight: 80, border: '1px solid #e5e7eb', borderRadius: 6, padding: 4, background: 'white' }}>
                      <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{day}</div>
                      {visitForDay.slice(0, 2).map((v) => (
                        <div key={v.id} style={{ fontSize: 11, padding: '2px 4px', borderRadius: 4, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', background: STATUS_COLOR[v.status] + '15', color: STATUS_COLOR[v.status] }}>
                          {v.customer}
                        </div>
                      ))}
                      {visitForDay.length > 2 && (
                        <div style={{ fontSize: 10, color: '#6b7280', textAlign: 'center' }}>+{visitForDay.length - 2}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Spin>
      </Card>

      <Modal
        title="新建拜访计划"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="customer" label="客户" rules={[{ required: true, message: '请输入客户名称' }]}>
            <Input placeholder="请输入客户名称" />
          </Form.Item>
          <Form.Item name="date" label="拜访日期" rules={[{ required: true, message: '请选择拜访日期' }]}>
            <Input type="date" placeholder="请选择" />
          </Form.Item>
          <Form.Item name="purpose" label="拜访目的" rules={[{ required: true, message: '请输入拜访目的' }]}>
            <Input placeholder="请输入拜访目的" />
          </Form.Item>
          <Form.Item name="location" label="拜访地点" rules={[{ required: true, message: '请输入拜访地点' }]}>
            <Input placeholder="请输入拜访地点" />
          </Form.Item>
          <Form.Item name="result" label="预期结果">
            <Input placeholder="请输入预期结果（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
