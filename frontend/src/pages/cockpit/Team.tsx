import React, { useState } from 'react';
import {
  Card, Table, Avatar, Tag, Button, Input, Modal, Form, Select, message, Popconfirm, Row, Col
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, UserOutlined
} from '@ant-design/icons';

interface Member {
  id: string;
  name: string;
  avatar?: string;
  department: string;
  role: string;
  status: string;
  email: string;
  phone: string;
}

export default function CockpitTeam() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();

  const [members, setMembers] = useState<Member[]>([
    { id: '1', name: '张伟', department: '销售部', role: '销售经理', status: '在职', email: 'zhangwei@example.com', phone: '13800138001' },
    { id: '2', name: '李娜', department: '运维部', role: '运维主管', status: '在职', email: 'lina@example.com', phone: '13800138002' },
    { id: '3', name: '王强', department: '交付部', role: '项目经理', status: '在职', email: 'wangqiang@example.com', phone: '13800138003' },
    { id: '4', name: '赵敏', department: '销售部', role: '客户经理', status: '休假', email: 'zhaomin@example.com', phone: '13800138004' },
    { id: '5', name: '刘洋', department: '运维部', role: '运维工程师', status: '在职', email: 'liuyang@example.com', phone: '13800138005' },
  ]);

  const filteredMembers = members.filter(
    (m) =>
      m.name.includes(searchText) ||
      m.department.includes(searchText) ||
      m.role.includes(searchText) ||
      m.email.includes(searchText)
  );

  const handleAdd = () => {
    setEditingMember(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (member: Member) => {
    setEditingMember(member);
    form.setFieldsValue(member);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    message.success('删除成功');
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingMember) {
        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, ...values } : m))
        );
        message.success('更新成功');
      } else {
        const newMember: Member = {
          id: Date.now().toString(),
          ...values,
          status: '在职',
        };
        setMembers((prev) => [...prev, newMember]);
        message.success('添加成功');
      }
      setIsModalOpen(false);
    } catch {
      // 表单校验失败
    }
  };

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      key: 'avatar',
      width: 60,
      render: (_: string, record: Member) => (
        <Avatar style={{ background: '#3b82f6' }} icon={<UserOutlined />}>
          {record.name.charAt(0)}
        </Avatar>
      ),
    },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '部门', dataIndex: 'department', key: 'department' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { title: '电话', dataIndex: 'phone', key: 'phone' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => (
        <Tag color={v === '在职' ? '#10b981' : v === '休假' ? '#f59e0b' : '#6b7280'}>{v}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Member) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确认删除该成员？"
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
        title="团队设置"
        style={{ borderRadius: 8 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加成员
          </Button>
        }
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder="搜索成员姓名、部门、角色..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
        </Row>

        <Table
          dataSource={filteredMembers}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>

      <Modal
        title={editingMember ? '编辑成员' : '添加成员'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item name="department" label="部门" rules={[{ required: true, message: '请选择部门' }]}>
            <Select placeholder="请选择部门">
              <Select.Option value="销售部">销售部</Select.Option>
              <Select.Option value="运维部">运维部</Select.Option>
              <Select.Option value="交付部">交付部</Select.Option>
              <Select.Option value="财务部">财务部</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请输入角色' }]}>
            <Input placeholder="例如：销售经理" />
          </Form.Item>
          <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="电话" rules={[{ required: true, message: '请输入电话' }]}>
            <Input placeholder="请输入电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
