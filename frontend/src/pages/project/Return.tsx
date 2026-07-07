import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Select, Modal, Form, Progress, message, Popconfirm, Spin, Statistic, Timeline, Badge
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, UserOutlined, FileTextOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface ReturnItem {
  id: string;
  amount: string;
  plannedDate: string;
  actualDate: string | null;
  status: string;
  progress: number;
  requiredDocs: any;
  decisionChain: any;
  remark: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

const STATUS_COLOR: Record<string, string> = {
  '待回款': '#f59e0b',
  '部分回款': '#3b82f6',
  '已回款': '#10b981',
  '逾期': '#ef4444',
};

export default function ProjectReturn() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<ReturnItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchReturns();
    }
  }, [selectedProject]);

  const fetchProjects = async () => {
    try {
      const res = await request.get('/projects?page=1&pageSize=100');
      const list = (res.list || []).map((p: any) => ({ id: p.id, name: p.name }));
      setProjects(list);
      if (list.length > 0 && !selectedProject) {
        setSelectedProject(list[0].id);
      }
    } catch (e) {
      setProjects([
        { id: 'demo-1', name: '宁夏人民医院信息化升级项目' },
        { id: 'demo-2', name: '银川市政务云平台建设' },
      ]);
      setSelectedProject('demo-1');
    }
  };

  const fetchReturns = async () => {
    setLoading(true);
    try {
      const [returnsRes, statsRes] = await Promise.all([
        request.get(`/projects/${selectedProject}/returns`),
        request.get(`/projects/${selectedProject}/returns/statistics`),
      ]);
      const list = (returnsRes.list || []).map((r: any) => ({
        ...r,
        requiredDocs: typeof r.requiredDocs === 'string' ? JSON.parse(r.requiredDocs) : r.requiredDocs,
        decisionChain: typeof r.decisionChain === 'string' ? JSON.parse(r.decisionChain) : r.decisionChain,
      }));
      setReturns(list);
      setStatistics(statsRes);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingReturn(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (ret: ReturnItem) => {
    setEditingReturn(ret);
    form.setFieldsValue({
      ...ret,
      requiredDocs: ret.requiredDocs ? ret.requiredDocs.join(', ') : '',
      decisionChain: ret.decisionChain,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/projects/${selectedProject}/returns/${id}`);
      message.success('删除成功');
      fetchReturns();
    } catch (e) {
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        requiredDocs: values.requiredDocs ? values.requiredDocs.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        decisionChain: values.decisionChain || [],
      };
      if (editingReturn) {
        await request.put(`/projects/${selectedProject}/returns/${editingReturn.id}`, data);
        message.success('更新成功');
      } else {
        await request.post(`/projects/${selectedProject}/returns`, { ...data, customerId: 'demo-customer' });
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchReturns();
    } catch {
    }
  };

  const expandedRowRender = (record: ReturnItem) => (
    <div style={{ padding: '12px 24px', background: '#f9fafb', borderRadius: 8 }}>
      <Row gutter={[24, 16]}>
        <Col span={12}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>所需资料</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(record.requiredDocs || []).map((doc: string, idx: number) => (
              <Badge key={idx} color={doc ? '#10b981' : '#9ca3af'} text={doc} />
            )) || <span style={{ color: '#9ca3af' }}>暂无</span>}
          </div>
        </Col>
        <Col span={12}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8 }}>决策链</div>
          <Timeline
            mode="left"
            items={(record.decisionChain || []).map((d: any, idx: number) => ({
              label: d.role,
              color: d.status === '已审批' ? 'green' : d.status === '已确认' ? 'blue' : 'gray',
              children: (
                <div>
                  <span style={{ fontWeight: 500 }}>{d.name}</span>
                  <Tag size="small" style={{ marginLeft: 8 }} color={d.status === '已审批' ? 'success' : d.status === '已确认' ? 'processing' : 'default'}>{d.status}</Tag>
                </div>
              ),
            }))}
          />
        </Col>
      </Row>
      {record.remark && (
        <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
          <FileTextOutlined style={{ marginRight: 4 }} />备注：{record.remark}
        </div>
      )}
    </div>
  );

  const columns = [
    { title: '回款金额', dataIndex: 'amount', key: 'amount', render: (v: string) => <span style={{ fontWeight: 600, color: '#1e3a5f' }}>¥{Number(v).toLocaleString()}</span> },
    { title: '计划回款日', dataIndex: 'plannedDate', key: 'plannedDate', width: 120 },
    { title: '实际回款日', dataIndex: 'actualDate', key: 'actualDate', width: 120, render: (v: string | null) => v || <span style={{ color: '#9ca3af' }}>-</span> },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (v: number) => <Progress percent={v} size="small" status={v === 100 ? 'success' : 'active'} />,
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={STATUS_COLOR[v] || '#6b7280'}>{v}</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: ReturnItem) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>项目选择</div>
            <Select
              style={{ width: '100%' }}
              value={selectedProject}
              onChange={setSelectedProject}
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
              placeholder="请选择项目"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="回款总额"
              value={`¥${(statistics?.total || 0).toLocaleString()}`}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1e3a5f' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="已回款"
              value={`¥${(statistics?.received || 0).toLocaleString()}`}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="待回款金额"
              value={`¥${(statistics?.pending || 0).toLocaleString()}`}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic
              title="回款计划数"
              value={statistics?.count || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#3b82f6' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>回款计划</div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增回款计划</Button>
        </div>

        <Spin spinning={loading}>
          <Table
            dataSource={returns}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            expandable={{ expandedRowRender }}
          />
        </Spin>
      </Card>

      <Modal
        title={editingReturn ? '编辑回款计划' : '新增回款计划'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="amount" label="回款金额" rules={[{ required: true, message: '请输入金额' }]}>
                <Input type="number" placeholder="请输入回款金额" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]} initialValue="待回款">
                <Select>
                  <Select.Option value="待回款">待回款</Select.Option>
                  <Select.Option value="部分回款">部分回款</Select.Option>
                  <Select.Option value="已回款">已回款</Select.Option>
                  <Select.Option value="逾期">逾期</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="plannedDate" label="计划回款日期">
                <Input type="date" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="actualDate" label="实际回款日期">
                <Input type="date" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="progress" label="回款进度" initialValue={0}>
            <Input type="number" min={0} max={100} suffix="%" />
          </Form.Item>
          <Form.Item name="requiredDocs" label="所需资料">
            <Input placeholder="多个资料用逗号分隔，例如：合同,验收单,发票" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
