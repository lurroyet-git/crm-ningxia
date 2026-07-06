import React, { useState } from 'react';
import {
  Card, Button, Table, Tag, Modal, Form, Input, Select, message, Popconfirm, Row, Col
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';

interface NetworkNode {
  id: string;
  name: string;
  role: string;
  company: string;
  department: string;
  relation: string;
  influence: number;
  contact: string;
  x: number;
  y: number;
}

const RELATION_COLOR: Record<string, string> = {
  决策人: '#ef4444',
  技术负责人: '#3b82f6',
  采购负责人: '#f59e0b',
  使用人: '#10b981',
  推荐人: '#8b5cf6',
};

export default function CustomerNetwork() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<NetworkNode | null>(null);
  const [form] = Form.useForm();

  const [nodes, setNodes] = useState<NetworkNode[]>([
    { id: '1', name: '张院长', role: '决策人', company: '宁夏人民医院', department: '院办', relation: '直接', influence: 95, contact: '13800138001', x: 50, y: 30 },
    { id: '2', name: '李主任', role: '技术负责人', company: '宁夏人民医院', department: '信息中心', relation: '直接', influence: 80, contact: '13800138002', x: 30, y: 50 },
    { id: '3', name: '王科长', role: '采购负责人', company: '宁夏人民医院', department: '设备科', relation: '间接', influence: 70, contact: '13800138003', x: 70, y: 50 },
    { id: '4', name: '赵工程师', role: '使用人', company: '宁夏人民医院', department: '信息中心', relation: '直接', influence: 50, contact: '13800138004', x: 20, y: 70 },
    { id: '5', name: '陈副局长', role: '决策人', company: '银川市教育局', department: '局办', relation: '直接', influence: 90, contact: '13800138005', x: 50, y: 30 },
    { id: '6', name: '孙主任', role: '技术负责人', company: '银川市教育局', department: '信息中心', relation: '直接', influence: 75, contact: '13800138006', x: 35, y: 55 },
  ]);

  const [selectedCompany, setSelectedCompany] = useState('全部');

  const companies = ['全部', ...Array.from(new Set(nodes.map((n) => n.company)))];

  const filteredNodes = selectedCompany === '全部' ? nodes : nodes.filter((n) => n.company === selectedCompany);

  const handleAdd = () => {
    setEditingNode(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (node: NetworkNode) => {
    setEditingNode(node);
    form.setFieldsValue(node);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    message.success('删除成功');
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingNode) {
        setNodes((prev) => prev.map((n) => (n.id === editingNode.id ? { ...n, ...values } : n)));
        message.success('更新成功');
      } else {
        setNodes((prev) => [...prev, { id: Date.now().toString(), ...values, x: 50, y: 50 }]);
        message.success('添加成功');
      }
      setIsModalOpen(false);
    } catch {
      // 表单校验失败
    }
  };

  const columns = [
    { title: '姓名', dataIndex: 'name', key: 'name', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (v: string) => <Tag color={RELATION_COLOR[v] || '#6b7280'}>{v}</Tag>,
    },
    { title: '单位', dataIndex: 'company', key: 'company' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    {
      title: '影响力',
      dataIndex: 'influence',
      key: 'influence',
      render: (v: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden', width: 60 }}>
            <div style={{ width: `${v}%`, height: '100%', background: v >= 80 ? '#ef4444' : v >= 60 ? '#f59e0b' : '#3b82f6', borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 12 }}>{v}</span>
        </div>
      ),
    },
    { title: '联系方式', dataIndex: 'contact', key: 'contact' },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: NetworkNode) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除该关系人？"
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
      {/* 关系网络图 */}
      <Card
        title="客户关系网络图"
        style={{ borderRadius: 8, marginBottom: 16 }}
        extra={
          <div style={{ display: 'flex', gap: 8 }}>
            <Select style={{ width: 160 }} value={selectedCompany} onChange={setSelectedCompany}>
              {companies.map((c) => <Select.Option key={c} value={c}>{c}</Select.Option>)}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加关系人</Button>
          </div>
        }
      >
        <div style={{ position: 'relative', width: '100%', height: 360, background: '#f8fafc', borderRadius: 8, overflow: 'hidden' }}>
          {/* 中心点（公司） */}
          {selectedCompany !== '全部' && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '20%',
                transform: 'translate(-50%, -50%)',
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: '#1e3a5f',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                textAlign: 'center',
                padding: 8,
                boxShadow: '0 4px 16px rgba(30,58,95,0.3)',
                zIndex: 2,
              }}
            >
              {selectedCompany}
            </div>
          )}

          {/* 节点 */}
          {filteredNodes.map((node) => (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
              }}
            >
              {/* 连线 */}
              {selectedCompany !== '全部' && (
                <svg
                  style={{
                    position: 'absolute',
                    left: selectedCompany !== '全部' ? `calc(50% - ${node.x}%)` : 0,
                    top: selectedCompany !== '全部' ? `calc(20% - ${node.y}%)` : 0,
                    width: selectedCompany !== '全部' ? `${Math.abs(50 - node.x) * 2}%` : 0,
                    height: selectedCompany !== '全部' ? `${Math.abs(20 - node.y) * 2}%` : 0,
                    pointerEvents: 'none',
                    zIndex: 1,
                  }}
                >
                  <line
                    x1="50%"
                    y1="0"
                    x2={node.x > 50 ? '0%' : '100%'}
                    y2={node.y > 20 ? '100%' : '0%'}
                    stroke="#cbd5e1"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                </svg>
              )}

              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: RELATION_COLOR[node.role] || '#6b7280',
                  color: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  cursor: 'pointer',
                }}
              >
                <UserOutlined style={{ fontSize: 14 }} />
                <span style={{ fontSize: 10, marginTop: 2 }}>{node.name.slice(0, 2)}</span>
              </div>
              <div style={{ textAlign: 'center', marginTop: 4 }}>
                <div style={{ fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap' }}>{node.name}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>{node.role}</div>
              </div>
            </div>
          ))}

          {filteredNodes.length === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>
              暂无关系人数据
            </div>
          )}
        </div>
      </Card>

      {/* 关键人列表 */}
      <Card title="关键联系人列表" style={{ borderRadius: 8 }}>
        <Table
          dataSource={filteredNodes}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      {/* 添加/编辑 Modal */}
      <Modal
        title={editingNode ? '编辑关系人' : '添加关系人'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input placeholder="姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="决策人">决策人</Select.Option>
                  <Select.Option value="技术负责人">技术负责人</Select.Option>
                  <Select.Option value="采购负责人">采购负责人</Select.Option>
                  <Select.Option value="使用人">使用人</Select.Option>
                  <Select.Option value="推荐人">推荐人</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="company" label="单位" rules={[{ required: true, message: '请输入单位' }]}>
                <Input placeholder="单位名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="department" label="部门" rules={[{ required: true, message: '请输入部门' }]}>
                <Input placeholder="部门" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="relation" label="关系类型" rules={[{ required: true }]} initialValue="直接">
                <Select>
                  <Select.Option value="直接">直接</Select.Option>
                  <Select.Option value="间接">间接</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="influence" label="影响力（0-100）" rules={[{ required: true }]} initialValue={50}>
                <Input type="number" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="contact" label="联系方式" rules={[{ required: true, message: '请输入联系方式' }]}>
            <Input placeholder="手机号或邮箱" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
