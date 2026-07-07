import React, { useState, useEffect } from 'react';
import {
  Card, Select, Timeline, Tag, Button, Modal, Form, Input, DatePicker, message, Row, Col, Spin
} from 'antd';
import { PlusOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';
import request from '../../utils/request';
import dayjs from 'dayjs';

interface NodeItem {
  id: string;
  nodeName: string;
  description?: string;
  status: string;
  planDate: string;
  actualDate?: string;
  ownerId?: string;
  acceptanceCriteria?: string;
  remark?: string;
  sequence: number;
}

interface Project {
  id: string;
  projectNo: string;
  name: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  '未开始': { color: '#9ca3af', icon: <MinusCircleOutlined /> },
  '进行中': { color: '#3b82f6', icon: <ClockCircleOutlined /> },
  '已完成': { color: '#10b981', icon: <CheckCircleOutlined /> },
  '已延期': { color: '#ef4444', icon: <ExclamationCircleOutlined /> },
};

export default function ProjectNodes() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchNodes(selectedProject);
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const res = await request.get('/projects', { params: { pageSize: 100 } });
      const list = res.list || [];
      setProjects(list);
      if (list.length > 0 && !selectedProject) {
        setSelectedProject(list[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchNodes = async (projectId: string) => {
    setLoading(true);
    try {
      const res = await request.get(`/projects/${projectId}/nodes`);
      setNodes(res || []);
    } catch (e) {
      console.error('Failed to fetch nodes', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNode = async () => {
    try {
      const values = await form.validateFields();
      await request.post(`/projects/${selectedProject}/nodes`, {
        nodeName: values.title,
        planDate: values.planDate ? dayjs(values.planDate).format('YYYY-MM-DD') : undefined,
        acceptanceCriteria: values.description,
        remark: values.remark,
        sequence: nodes.length,
      });
      message.success('节点添加成功');
      setIsModalOpen(false);
      form.resetFields();
      fetchNodes(selectedProject);
    } catch (e) {
      // 表单校验失败或API错误
    }
  };

  const handleStatusChange = async (node: NodeItem, newStatus: string) => {
    try {
      await request.put(`/nodes/${node.id}`, { status: newStatus });
      message.success('状态更新成功');
      fetchNodes(selectedProject);
    } catch (e) {
      message.error('状态更新失败');
    }
  };

  const currentNodes = nodes || [];

  return (
    <div>
      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ color: '#374151', fontWeight: 500, marginRight: 12 }}>选择项目：</span>
            <Select
              style={{ width: 320 }}
              value={selectedProject}
              onChange={setSelectedProject}
              loading={projectsLoading}
            >
              {projects.map((p) => (
                <Select.Option key={p.id} value={p.id}>
                  {p.projectNo} {p.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)} disabled={!selectedProject}>
              添加节点
            </Button>
          </Col>
        </Row>
      </Card>

      <Card title="项目节点进度" style={{ borderRadius: 8 }}>
        <Spin spinning={loading}>
          <Timeline mode="left">
            {currentNodes.map((node) => {
              const config = STATUS_CONFIG[node.status] || STATUS_CONFIG['未开始'];
              return (
                <Timeline.Item
                  key={node.id}
                  dot={config.icon}
                  color={config.color}
                  label={
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{node.planDate ? dayjs(node.planDate).format('YYYY-MM-DD') : '-'}</div>
                      {node.actualDate && (
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>实际：{dayjs(node.actualDate).format('YYYY-MM-DD')}</div>
                      )}
                    </div>
                  }
                >
                  <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{node.nodeName}</span>
                    <Tag
                      color={config.color}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        const nextStatus =
                          node.status === '未开始' ? '进行中' :
                          node.status === '进行中' ? '已完成' :
                          node.status === '已完成' ? '未开始' : '进行中';
                        handleStatusChange(node, nextStatus);
                      }}
                    >
                      {node.status}
                    </Tag>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>
                    {node.acceptanceCriteria || node.remark || '-'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af' }}>负责人：{node.ownerId || '未分配'}</div>
                </Timeline.Item>
              );
            })}
            {currentNodes.length === 0 && (
              <Timeline.Item>
                <span style={{ color: '#9ca3af' }}>暂无节点数据</span>
              </Timeline.Item>
            )}
          </Timeline>
        </Spin>
      </Card>

      <Modal
        title="添加项目节点"
        open={isModalOpen}
        onOk={handleAddNode}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="节点名称" rules={[{ required: true, message: '请输入节点名称' }]}>
            <Input placeholder="例如：需求调研" />
          </Form.Item>
          <Form.Item name="description" label="节点描述">
            <Input.TextArea rows={3} placeholder="描述该节点的工作内容..." />
          </Form.Item>
          <Form.Item name="planDate" label="计划日期" rules={[{ required: true, message: '请选择计划日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="备注信息..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
