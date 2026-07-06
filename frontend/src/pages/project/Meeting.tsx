import React, { useState } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, DatePicker, Select, message, Popconfirm, Row, Col
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';

interface Meeting {
  id: string;
  title: string;
  projectName: string;
  type: string;
  startTime: string;
  endTime: string;
  location: string;
  attendees: string[];
  status: string;
  summary?: string;
}

export default function ProjectMeeting() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [viewingSummary, setViewingSummary] = useState<Meeting | null>(null);
  const [form] = Form.useForm();

  const [meetings, setMeetings] = useState<Meeting[]>([
    {
      id: '1', title: '宁夏人民医院项目启动会', projectName: '宁夏人民医院数据中心建设',
      type: '项目启动', startTime: '2024-01-03 09:00', endTime: '2024-01-03 11:00',
      location: '会议室A', attendees: ['张伟', '李娜', '王强'], status: '已完成',
      summary: '会议确定了项目整体目标、里程碑节点及各方职责分工。客户方由信息科主任主持，明确需求优先级。',
    },
    {
      id: '2', title: '教育局网络安全方案评审', projectName: '银川市教育局网络安全升级',
      type: '方案评审', startTime: '2024-01-20 14:00', endTime: '2024-01-20 16:00',
      location: '线上会议', attendees: ['刘洋', '赵敏', '客户代表'], status: '已完成',
      summary: '方案通过评审，客户对网络拓扑设计表示认可，需补充等保2.0合规条款说明。',
    },
    {
      id: '3', title: '石嘴山银行周例会', projectName: '石嘴山银行核心网络改造',
      type: '周例会', startTime: '2024-02-05 10:00', endTime: '2024-02-05 11:00',
      location: '客户现场', attendees: ['王强', '刘洋'], status: '待开始',
    },
    {
      id: '4', title: '人民医院设备到货验收', projectName: '宁夏人民医院数据中心建设',
      type: '验收会议', startTime: '2024-02-10 09:30', endTime: '2024-02-10 11:30',
      location: '机房', attendees: ['张伟', '李娜', '供应商'], status: '待开始',
    },
  ]);

  const handleAdd = () => {
    setEditingMeeting(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    form.setFieldsValue({
      ...meeting,
      timeRange: [meeting.startTime, meeting.endTime],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setMeetings((prev) => prev.filter((m) => m.id !== id));
    message.success('删除成功');
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const { timeRange, ...restValues } = values;
      const payload = {
        ...restValues,
        startTime: timeRange?.[0],
        endTime: timeRange?.[1],
      };

      if (editingMeeting) {
        setMeetings((prev) => prev.map((m) => (m.id === editingMeeting.id ? { ...m, ...payload } : m)));
        message.success('更新成功');
      } else {
        setMeetings((prev) => [...prev, { id: Date.now().toString(), ...payload, status: '待开始' }]);
        message.success('创建成功');
      }
      setIsModalOpen(false);
    } catch {
      // 表单校验失败
    }
  };

  const handleViewSummary = (meeting: Meeting) => {
    setViewingSummary(meeting);
    setSummaryModalOpen(true);
  };

  const columns = [
    { title: '会议主题', dataIndex: 'title', key: 'title' },
    { title: '所属项目', dataIndex: 'projectName', key: 'projectName' },
    {
      title: '会议类型',
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => <Tag color="#3b82f6">{v}</Tag>,
    },
    {
      title: '时间',
      key: 'time',
      render: (_: any, record: Meeting) => `${record.startTime} ~ ${record.endTime}`,
    },
    { title: '地点', dataIndex: 'location', key: 'location' },
    {
      title: '参会人',
      dataIndex: 'attendees',
      key: 'attendees',
      render: (v: string[]) => v.join('、'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={v === '已完成' ? '#10b981' : '#3b82f6'}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Meeting) => (
        <div style={{ display: 'flex', gap: 4 }}>
          {record.summary && (
            <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => handleViewSummary(record)}>查看纪要</Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除该会议？"
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
      <Card
        title="会议管理"
        style={{ borderRadius: 8 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新建会议
          </Button>
        }
      >
        <Table
          dataSource={meetings}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* 新建/编辑 Modal */}
      <Modal
        title={editingMeeting ? '编辑会议' : '新建会议'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="会议主题" rules={[{ required: true, message: '请输入会议主题' }]}>
            <Input placeholder="请输入会议主题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="projectName" label="所属项目" rules={[{ required: true, message: '请输入所属项目' }]}>
                <Input placeholder="所属项目" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="会议类型" rules={[{ required: true, message: '请选择会议类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="项目启动">项目启动</Select.Option>
                  <Select.Option value="方案评审">方案评审</Select.Option>
                  <Select.Option value="周例会">周例会</Select.Option>
                  <Select.Option value="验收会议">验收会议</Select.Option>
                  <Select.Option value="其他">其他</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="timeRange" label="会议时间" rules={[{ required: true, message: '请选择会议时间' }]}>
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="location" label="会议地点" rules={[{ required: true, message: '请输入会议地点' }]}>
                <Input placeholder="例如：会议室A / 线上会议" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="attendees" label="参会人" rules={[{ required: true, message: '请输入参会人' }]}>
                <Select mode="tags" placeholder="输入参会人姓名，回车确认" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="summary" label="会议纪要">
            <Input.TextArea rows={4} placeholder="会议结束后填写纪要..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看纪要 Modal */}
      <Modal
        title="会议纪要"
        open={summaryModalOpen}
        onCancel={() => setSummaryModalOpen(false)}
        footer={null}
      >
        {viewingSummary && (
          <div style={{ marginTop: 16 }}>
            <h4 style={{ marginBottom: 8 }}>{viewingSummary.title}</h4>
            <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 16 }}>
              时间：{viewingSummary.startTime} ~ {viewingSummary.endTime} | 地点：{viewingSummary.location}
            </p>
            <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, lineHeight: 1.8 }}>
              {viewingSummary.summary}
            </div>
            <div style={{ marginTop: 16 }}>
              <span style={{ color: '#6b7280', fontSize: 13 }}>参会人：</span>
              {viewingSummary.attendees.map((a) => (
                <Tag key={a} style={{ marginRight: 4 }}>{a}</Tag>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
