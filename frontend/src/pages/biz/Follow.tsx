import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Timeline, Button, Input, Select, Modal, Form, Tag, message, Spin, Avatar
} from 'antd';
import {
  PlusOutlined, PhoneOutlined, MailOutlined, EnvironmentOutlined, TeamOutlined,
  SearchOutlined, CustomerServiceOutlined, FileTextOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface FollowUp {
  id: string;
  date: string;
  customer: string;
  opportunity: string;
  type: string;
  content: string;
  nextPlan: string;
  creator: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  '电话': <PhoneOutlined />,
  '邮件': <MailOutlined />,
  '拜访': <EnvironmentOutlined />,
  '会议': <TeamOutlined />,
  '其他': <CustomerServiceOutlined />,
};

const TYPE_COLOR: Record<string, string> = {
  '电话': '#3b82f6',
  '邮件': '#8b5cf6',
  '拜访': '#10b981',
  '会议': '#f59e0b',
  '其他': '#6b7280',
};

export default function BizFollow() {
  const [loading, setLoading] = useState(true);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [filter, setFilter] = useState({ customer: '', date: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/biz/follow-ups');
      setFollowUps(res.list || []);
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
      await request.post('/biz/follow-ups', values);
      message.success('创建成功');
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const filteredFollowUps = followUps.filter((f) => {
    if (filter.customer && !f.customer.includes(filter.customer)) return false;
    if (filter.date && !f.date.includes(filter.date)) return false;
    if (filter.type && f.type !== filter.type) return false;
    return true;
  });

  return (
    <div>
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input
              placeholder="客户名称"
              value={filter.customer}
              onChange={(e) => setFilter((prev) => ({ ...prev, customer: e.target.value }))}
              style={{ width: 180 }}
              allowClear
            />
            <Input
              placeholder="日期"
              value={filter.date}
              onChange={(e) => setFilter((prev) => ({ ...prev, date: e.target.value }))}
              style={{ width: 140 }}
              allowClear
            />
            <Select placeholder="类型" style={{ width: 120 }} value={filter.type || undefined} onChange={(v) => setFilter((prev) => ({ ...prev, type: v }))} allowClear>
              <Select.Option value="电话">电话</Select.Option>
              <Select.Option value="邮件">邮件</Select.Option>
              <Select.Option value="拜访">拜访</Select.Option>
              <Select.Option value="会议">会议</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增跟进
          </Button>
        </div>

        <Spin spinning={loading}>
          <div style={{ padding: '0 8px' }}>
            {filteredFollowUps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9ca3af' }}>暂无跟进记录</div>
            ) : (
              <Timeline mode="alternate">
                {filteredFollowUps.map((item) => (
                  <Timeline.Item
                    key={item.id}
                    dot={
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${TYPE_COLOR[item.type]}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TYPE_COLOR[item.type], fontSize: 14 }}>
                        {TYPE_ICON[item.type]}
                      </div>
                    }
                    color={TYPE_COLOR[item.type]}
                  >
                    <Card size="small" style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{item.customer}</div>
                          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{item.opportunity}</div>
                        </div>
                        <Tag color={TYPE_COLOR[item.type]}>{item.type}</Tag>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8, color: '#374151' }}>{item.content}</div>
                      {item.nextPlan && (
                        <div style={{ background: '#f0f5ff', padding: '8px 12px', borderRadius: 6, fontSize: 12, color: '#3b82f6' }}>
                          <FileTextOutlined style={{ marginRight: 4 }} /> 下一步: {item.nextPlan}
                        </div>
                      )}
                      <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.date}</div>
                        <div style={{ fontSize: 12, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Avatar size={16} style={{ background: '#3b82f6', fontSize: 10 }}>{item.creator.charAt(0)}</Avatar>
                          {item.creator}
                        </div>
                      </div>
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </div>
        </Spin>
      </Card>

      <Modal
        title="新增跟进记录"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customer" label="客户" rules={[{ required: true, message: '请输入客户名称' }]}>
                <Input placeholder="请输入客户名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="opportunity" label="关联商机">
                <Input placeholder="请输入关联商机" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="type" label="跟进类型" rules={[{ required: true, message: '请选择跟进类型' }]}>
            <Select placeholder="请选择">
              <Select.Option value="电话">电话</Select.Option>
              <Select.Option value="邮件">邮件</Select.Option>
              <Select.Option value="拜访">拜访</Select.Option>
              <Select.Option value="会议">会议</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="content" label="跟进内容" rules={[{ required: true, message: '请输入跟进内容' }]}>
            <Input.TextArea rows={4} placeholder="请详细记录沟通内容..." />
          </Form.Item>
          <Form.Item name="nextPlan" label="下一步计划">
            <Input placeholder="请输入下一步计划（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
