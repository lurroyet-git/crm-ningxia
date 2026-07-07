import React, { useState, useEffect } from 'react';
import {
  Card, Button, Modal, Form, Input, Select, Tag, Row, Col, Badge, message, Popconfirm, Spin
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ClockCircleOutlined, UserOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import dayjs from 'dayjs';

interface KanbanTask {
  id: string;
  title: string;
  priority: string;
  owner: string;
  deadline: string;
  description?: string;
  column: string;
  assigneeId?: string;
}

const PRIORITY_COLOR: Record<string, string> = {
  P0: '#ef4444',
  P1: '#f59e0b',
  P2: '#3b82f6',
  P3: '#6b7280',
};

const COLUMN_COLOR: Record<string, string> = {
  '本周重点': '#fef3c7',
  '进行中': '#dbeafe',
  '待跟进': '#f3e8ff',
  '已完成': '#d1fae5',
};

const COLUMN_BORDER: Record<string, string> = {
  '本周重点': '#f59e0b',
  '进行中': '#3b82f6',
  '待跟进': '#8b5cf6',
  '已完成': '#10b981',
};

const COLUMNS = ['本周重点', '进行中', '待跟进', '已完成'];

export default function ProjectKanban() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [viewingTask, setViewingTask] = useState<KanbanTask | null>(null);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/tasks', { params: { pageSize: 100 } });
      const list = (res.list || []).map((item: any) => ({
        ...item,
        owner: item.assignee?.realName || item.assigneeId || '-',
        deadline: item.dueDate ? dayjs(item.dueDate).format('YYYY-MM-DD') : '-',
        column: item.column || '待跟进',
        priority: item.priority || 'P2',
      }));
      setTasks(list);
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = (column?: string) => {
    setEditingTask(null);
    form.resetFields();
    if (column) {
      form.setFieldsValue({ column });
    }
    setIsModalOpen(true);
  };

  const handleEdit = (task: KanbanTask) => {
    setEditingTask(task);
    form.setFieldsValue({
      ...task,
      deadline: task.deadline && task.deadline !== '-' ? dayjs(task.deadline) : undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/tasks/${id}`);
      message.success('删除成功');
      fetchData();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        dueDate: values.deadline ? dayjs(values.deadline).format('YYYY-MM-DD') : undefined,
      };
      delete payload.deadline;

      if (editingTask) {
        await request.put(`/tasks/${editingTask.id}`, payload);
        message.success('更新成功');
      } else {
        await request.post('/tasks', payload);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (e) {
      // ignore
    }
  };

  const handleCardClick = (task: KanbanTask) => {
    setViewingTask(task);
    setDetailModalOpen(true);
  };

  const handleMove = async (taskId: string, newColumn: string) => {
    try {
      await request.put(`/tasks/${taskId}/column`, { column: newColumn });
      message.success(`已移动到「${newColumn}」`);
      fetchData();
    } catch (e) {
      message.error('移动失败');
    }
  };

  const getColumnTasks = (col: string) => tasks.filter((t) => t.column === col);

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col);
          return (
            <Col span={6} key={col}>
              <Card
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Badge count={colTasks.length} showZero color={COLUMN_BORDER[col]} />
                    <span>{col}</span>
                  </div>
                }
                style={{ borderRadius: 8, background: COLUMN_COLOR[col], borderColor: COLUMN_BORDER[col] }}
                headStyle={{ borderBottom: `2px solid ${COLUMN_BORDER[col]}`, fontWeight: 600 }}
                extra={
                  <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => handleAdd(col)} />
                }
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minHeight: 200 }}>
                  {colTasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        background: 'white',
                        borderRadius: 8,
                        padding: 12,
                        cursor: 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                      onClick={() => handleCardClick(task)}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 500, flex: 1, paddingRight: 8 }}>{task.title}</span>
                        <Tag color={PRIORITY_COLOR[task.priority]} style={{ fontSize: 11, padding: '0 6px' }}>{task.priority}</Tag>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6b7280' }}>
                          <UserOutlined style={{ fontSize: 10 }} />
                          {task.owner}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#9ca3af' }}>
                          <ClockCircleOutlined style={{ fontSize: 10 }} />
                          {task.deadline}
                        </div>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 13 }}>
                      暂无任务
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal
        title={editingTask ? '编辑任务' : '新建任务'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="任务标题" rules={[{ required: true, message: '请输入任务标题' }]}>
            <Input placeholder="请输入任务标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" rules={[{ required: true }]} initialValue="P1">
                <Select>
                  <Select.Option value="P0">P0 - 紧急</Select.Option>
                  <Select.Option value="P1">P1 - 重要</Select.Option>
                  <Select.Option value="P2">P2 - 一般</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="column" label="所属列" rules={[{ required: true }]}>
                <Select>
                  {COLUMNS.map((c) => <Select.Option key={c} value={c}>{c}</Select.Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="owner" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
                <Input placeholder="负责人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deadline" label="截止日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="任务描述">
            <Input.TextArea rows={3} placeholder="可选：补充任务详情..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="任务详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div>
              <Select
                style={{ width: 120 }}
                placeholder="移动到..."
                onChange={(col) => {
                  if (viewingTask) {
                    handleMove(viewingTask.id, col);
                    setDetailModalOpen(false);
                  }
                }}
              >
                {COLUMNS.filter((c) => c !== viewingTask?.column).map((c) => (
                  <Select.Option key={c} value={c}>{c}</Select.Option>
                ))}
              </Select>
            </div>
            <div>
              <Button onClick={() => setDetailModalOpen(false)}>关闭</Button>
              <Button type="primary" style={{ marginLeft: 8 }} onClick={() => {
                if (viewingTask) {
                  setDetailModalOpen(false);
                  handleEdit(viewingTask);
                }
              }}>编辑</Button>
            </div>
          </div>
        }
      >
        {viewingTask && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{viewingTask.title}</h3>
              <Tag color={PRIORITY_COLOR[viewingTask.priority]}>{viewingTask.priority}</Tag>
            </div>
            <Row gutter={[16, 12]} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>负责人</div>
                <div style={{ fontWeight: 500 }}>{viewingTask.owner}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>截止日期</div>
                <div style={{ fontWeight: 500 }}>{viewingTask.deadline}</div>
              </Col>
              <Col span={12}>
                <div style={{ color: '#6b7280', fontSize: 12 }}>当前状态</div>
                <div style={{ fontWeight: 500 }}>{viewingTask.column}</div>
              </Col>
            </Row>
            {viewingTask.description && (
              <div>
                <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 4 }}>任务描述</div>
                <div style={{ background: '#f9fafb', padding: 12, borderRadius: 8, lineHeight: 1.6 }}>
                  {viewingTask.description}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </Spin>
  );
}
