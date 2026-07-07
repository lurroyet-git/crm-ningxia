import React, { useState, useEffect } from 'react';
import {
  Card, Table, Tag, Button, Modal, Form, Input, DatePicker, Select, message, Popconfirm, Row, Col, Spin
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import dayjs from 'dayjs';

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
  minutes?: string;
}

export default function ProjectMeeting() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [viewingSummary, setViewingSummary] = useState<Meeting | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [form] = Form.useForm();

  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    fetchData();
    fetchProjects();
  }, [pagination.current, pagination.pageSize]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await request.get('/projects', { params: { pageSize: 100 } });
      setProjects(res.list || []);
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchData = async (page = pagination.current, pageSize = pagination.pageSize) => {
    setLoading(true);
    try {
      const res = await request.get('/meetings', { params: { page, pageSize } });
      const list = (res.list || []).map((item: any) => ({
        ...item,
        projectName: item.project?.name || '-',
        attendees: Array.isArray(item.attendees) ? item.attendees.map((a: any) => a.name || a) : [],
        status: item.status || '待开始',
      }));
      setMeetings(list);
      setPagination({ current: page, pageSize, total: res.total || 0 });
    } catch (e) {
      console.error('Failed to fetch meetings', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingMeeting(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    form.setFieldsValue({
      ...meeting,
      timeRange: [dayjs(meeting.startTime), dayjs(meeting.endTime)],
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/meetings/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const { timeRange, ...restValues } = values;
      const payload = {
        ...restValues,
        startTime: timeRange?.[0] ? dayjs(timeRange[0]).format('YYYY-MM-DD HH:mm:ss') : undefined,
        endTime: timeRange?.[1] ? dayjs(timeRange[1]).format('YYYY-MM-DD HH:mm:ss') : undefined,
      };

      if (editingMeeting) {
        await request.put(`/meetings/${editingMeeting.id}`, payload);
        message.success('更新成功');
      } else {
        await request.post('/meetings', payload);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      // 表单校验失败或API错误
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
          {record.minutes && (
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
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize: pageSize || 10, total: pagination.total }),
          }}
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
              <Form.Item name="projectId" label="所属项目" rules={[{ required: true, message: '请选择所属项目' }]}>
                <Select placeholder="请选择项目" loading={projectsLoading}>
                  {projects.map((p) => (
                    <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
                  <Form.Item name="type" label="会议类型" rules={[{ required: true, message: '请选择会议类型' }]}>
                    <Select placeholder="请选择">
                      <Select.Option value="项目启动">项目启动</Select.Option>
                      <Select.Option value="方案评审">方案评审</Select.Option>
                      <Select.Option value="周会">周会</Select.Option>
                      <Select.Option value="复盘会">复盘会</Select.Option>
                      <Select.Option value="汇报会">汇报会</Select.Option>
                      <Select.Option value="协调会">协调会</Select.Option>
                      <Select.Option value="需求确认">需求确认</Select.Option>
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
          <Form.Item name="minutes" label="会议纪要">
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
              {viewingSummary.minutes}
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
