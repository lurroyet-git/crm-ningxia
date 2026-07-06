import React, { useState } from 'react';
import {
  Card, Select, Timeline, Tag, Button, Modal, Form, Input, DatePicker, message, Row, Col
} from 'antd';
import { PlusOutlined, ClockCircleOutlined, CheckCircleOutlined, ExclamationCircleOutlined, MinusCircleOutlined } from '@ant-design/icons';

interface NodeItem {
  id: string;
  title: string;
  description: string;
  status: '未开始' | '进行中' | '已完成' | '已延期';
  planDate: string;
  actualDate?: string;
  owner: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  未开始: { color: '#9ca3af', icon: <MinusCircleOutlined /> },
  进行中: { color: '#3b82f6', icon: <ClockCircleOutlined /> },
  已完成: { color: '#10b981', icon: <CheckCircleOutlined /> },
  已延期: { color: '#ef4444', icon: <ExclamationCircleOutlined /> },
};

export default function ProjectNodes() {
  const [selectedProject, setSelectedProject] = useState('1');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const [nodes, setNodes] = useState<Record<string, NodeItem[]>>({
    '1': [
      { id: 'n1', title: '需求调研', description: '完成客户需求调研与初步沟通', status: '已完成', planDate: '2024-01-05', actualDate: '2024-01-04', owner: '张伟' },
      { id: 'n2', title: '方案设计', description: '输出技术方案与项目计划', status: '已完成', planDate: '2024-01-15', actualDate: '2024-01-14', owner: '李娜' },
      { id: 'n3', title: '设备采购', description: '完成服务器及网络设备采购', status: '进行中', planDate: '2024-02-01', owner: '王强' },
      { id: 'n4', title: '环境部署', description: '服务器上架与基础环境配置', status: '未开始', planDate: '2024-02-15', owner: '刘洋' },
      { id: 'n5', title: '系统联调', description: '各子系统联调测试', status: '未开始', planDate: '2024-03-01', owner: '赵敏' },
      { id: 'n6', title: '验收交付', description: '客户验收与项目交付', status: '未开始', planDate: '2024-03-15', owner: '张伟' },
    ],
    '2': [
      { id: 'n7', title: '现场勘查', description: '数据中心现场勘查', status: '已完成', planDate: '2024-01-10', actualDate: '2024-01-09', owner: '王强' },
      { id: 'n8', title: '安全评估', description: '网络安全风险评估', status: '已延期', planDate: '2024-01-25', actualDate: '2024-02-01', owner: '刘洋' },
      { id: 'n9', title: '整改实施', description: '按评估结果实施整改', status: '进行中', planDate: '2024-02-15', owner: '赵敏' },
    ],
  });

  const currentNodes = nodes[selectedProject] || [];

  const handleAddNode = async () => {
    try {
      const values = await form.validateFields();
      const newNode: NodeItem = {
        id: Date.now().toString(),
        ...values,
        status: '未开始',
        planDate: values.planDate?.format?.('YYYY-MM-DD'),
      };
      setNodes((prev) => ({
        ...prev,
        [selectedProject]: [...(prev[selectedProject] || []), newNode],
      }));
      message.success('节点添加成功');
      setIsModalOpen(false);
      form.resetFields();
    } catch {
      // 表单校验失败
    }
  };

  return (
    <div>
      {/* 项目选择器 */}
      <Card style={{ borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <span style={{ color: '#374151', fontWeight: 500, marginRight: 12 }}>选择项目：</span>
            <Select
              style={{ width: 320 }}
              value={selectedProject}
              onChange={setSelectedProject}
            >
              <Select.Option value="1">PRJ-2024-001 宁夏人民医院数据中心建设</Select.Option>
              <Select.Option value="2">PRJ-2024-002 银川市教育局网络安全升级</Select.Option>
              <Select.Option value="3">PRJ-2024-003 石嘴山银行核心网络改造</Select.Option>
            </Select>
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              添加节点
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 时间线 */}
      <Card title="项目节点进度" style={{ borderRadius: 8 }}>
        <Timeline mode="left">
          {currentNodes.map((node) => {
            const config = STATUS_CONFIG[node.status];
            return (
              <Timeline.Item
                key={node.id}
                dot={config.icon}
                color={config.color}
                label={
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{node.planDate}</div>
                    {node.actualDate && (
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>实际：{node.actualDate}</div>
                    )}
                  </div>
                }
              >
                <div style={{ marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{node.title}</span>
                  <Tag color={config.color}>{node.status}</Tag>
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{node.description}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>负责人：{node.owner}</div>
              </Timeline.Item>
            );
          })}
          {currentNodes.length === 0 && (
            <Timeline.Item>
              <span style={{ color: '#9ca3af' }}>暂无节点数据</span>
            </Timeline.Item>
          )}
        </Timeline>
      </Card>

      {/* 添加节点 Modal */}
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
          <Form.Item name="description" label="节点描述" rules={[{ required: true, message: '请输入节点描述' }]}>
            <Input.TextArea rows={3} placeholder="描述该节点的工作内容..." />
          </Form.Item>
          <Form.Item name="planDate" label="计划日期" rules={[{ required: true, message: '请选择计划日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="owner" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
            <Input placeholder="请输入负责人姓名" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
