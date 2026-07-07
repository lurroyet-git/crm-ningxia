import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Select, Modal, Form, Rate, message, Popconfirm, Spin, Statistic, Timeline, Divider, List
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, BookOutlined, CheckCircleOutlined, ExclamationCircleOutlined, BulbOutlined, FileDoneOutlined, StarOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface ReviewItem {
  id: string;
  type: string;
  stage: string;
  summary: string;
  problems: any;
  experiences: any;
  improvements: any;
  deliverables: any;
  score: number;
  reviewedBy: string;
  reviewedAt: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

const TYPE_COLOR: Record<string, string> = {
  '过程复盘': '#3b82f6',
  '验收复盘': '#10b981',
};

export default function ProjectReview() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [filterType, setFilterType] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState<ReviewItem | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      fetchReviews();
    }
  }, [selectedProject, filterType]);

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

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await request.get(`/projects/${selectedProject}/reviews`, { params: { type: filterType || undefined } });
      const list = (res.list || []).map((r: any) => ({
        ...r,
        problems: parseJson(r.problems),
        experiences: parseJson(r.experiences),
        improvements: parseJson(r.improvements),
        deliverables: parseJson(r.deliverables),
      }));
      setReviews(list);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const parseJson = (v: any) => {
    if (!v) return [];
    if (typeof v === 'string') {
      try { return JSON.parse(v); } catch { return []; }
    }
    return v;
  };

  const handleAdd = () => {
    setEditingReview(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (review: ReviewItem) => {
    setEditingReview(review);
    form.setFieldsValue({
      ...review,
      problems: review.problems.map((p: any) => `${p.issue}(${p.severity})`).join('\n'),
      experiences: review.experiences.map((e: any) => `${e.item}(${e.value})`).join('\n'),
      improvements: review.improvements.map((i: any) => `${i.item}→${i.owner}`).join('\n'),
      deliverables: review.deliverables.map((d: any) => `${d.name}(${d.type})`).join('\n'),
    });
    setIsModalOpen(true);
  };

  const handleView = (review: ReviewItem) => {
    setViewingReview(review);
    setDetailModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await request.delete(`/projects/${selectedProject}/reviews/${id}`);
      message.success('删除成功');
      fetchReviews();
    } catch (e) {
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        problems: values.problems ? values.problems.split('\n').filter(Boolean).map((line: string) => {
          const m = line.match(/(.+)\((.+)\)/);
          return m ? { issue: m[1].trim(), severity: m[2].trim() } : { issue: line, severity: '中' };
        }) : [],
        experiences: values.experiences ? values.experiences.split('\n').filter(Boolean).map((line: string) => {
          const m = line.match(/(.+)\((.+)\)/);
          return m ? { item: m[1].trim(), value: m[2].trim() } : { item: line, value: '中' };
        }) : [],
        improvements: values.improvements ? values.improvements.split('\n').filter(Boolean).map((line: string) => {
          const m = line.match(/(.+)→(.+)/);
          return m ? { item: m[1].trim(), owner: m[2].trim() } : { item: line, owner: '项目经理' };
        }) : [],
        deliverables: values.deliverables ? values.deliverables.split('\n').filter(Boolean).map((line: string) => {
          const m = line.match(/(.+)\((.+)\)/);
          return m ? { name: m[1].trim(), type: m[2].trim() } : { name: line, type: '文档' };
        }) : [],
      };
      if (editingReview) {
        await request.put(`/projects/${selectedProject}/reviews/${editingReview.id}`, data);
        message.success('更新成功');
      } else {
        await request.post(`/projects/${selectedProject}/reviews`, data);
        message.success('创建成功');
      }
      setIsModalOpen(false);
      fetchReviews();
    } catch {
    }
  };

  const columns = [
    { title: '复盘类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={TYPE_COLOR[v] || '#6b7280'}>{v}</Tag> },
    { title: '阶段', dataIndex: 'stage', key: 'stage' },
    { title: '综合评分', dataIndex: 'score', key: 'score', render: (v: number) => <Rate disabled defaultValue={Math.round((v || 0) / 20)} /> },
    { title: '复盘人', dataIndex: 'reviewedBy', key: 'reviewedBy' },
    { title: '复盘日期', dataIndex: 'reviewedAt', key: 'reviewedAt', width: 120 },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: ReviewItem) => (
        <div style={{ display: 'flex', gap: 4 }}>
          <Button type="link" size="small" onClick={() => handleView(record)}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const avgScore = reviews.length > 0 ? Math.round(reviews.reduce((sum, r) => sum + (r.score || 0), 0) / reviews.length) : 0;

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
            <Statistic title="复盘次数" value={reviews.length} prefix={<BookOutlined />} valueStyle={{ color: '#1e3a5f' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card style={{ borderRadius: 8 }}>
            <Statistic title="平均评分" value={avgScore} suffix="/ 100" prefix={<StarOutlined />} valueStyle={{ color: avgScore >= 80 ? '#10b981' : avgScore >= 60 ? '#f59e0b' : '#ef4444' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <Select placeholder="复盘类型" style={{ width: 120 }} value={filterType || undefined} onChange={setFilterType} allowClear>
              <Select.Option value="过程复盘">过程复盘</Select.Option>
              <Select.Option value="验收复盘">验收复盘</Select.Option>
            </Select>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增复盘</Button>
        </div>

        <Spin spinning={loading}>
          <Table dataSource={reviews} columns={columns} rowKey="id" pagination={false} size="small" />
        </Spin>
      </Card>

      {/* 复盘详情 */}
      <Modal
        title="复盘详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={720}
      >
        {viewingReview && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <Tag color={TYPE_COLOR[viewingReview.type] || '#6b7280'}>{viewingReview.type}</Tag>
                <span style={{ marginLeft: 8, color: '#6b7280' }}>{viewingReview.stage}</span>
              </div>
              <div><Rate disabled defaultValue={Math.round((viewingReview.score || 0) / 20)} /> <span style={{ marginLeft: 8, fontWeight: 600 }}>{viewingReview.score}分</span></div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}><BookOutlined style={{ marginRight: 8 }} />总体总结</div>
            <div style={{ padding: 12, background: '#f9fafb', borderRadius: 6, marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
              {viewingReview.summary || '暂无总结'}
            </div>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}><ExclamationCircleOutlined style={{ marginRight: 8, color: '#ef4444' }} />问题清单</div>
                <List
                  size="small"
                  dataSource={viewingReview.problems || []}
                  renderItem={(item: any) => (
                    <List.Item>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.issue}</span>
                        <Tag size="small" color={item.severity === '高' ? 'error' : item.severity === '中' ? 'warning' : 'default'}>{item.severity}</Tag>
                      </div>
                    </List.Item>
                  )}
                />
              </Col>
              <Col span={12}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}><BulbOutlined style={{ marginRight: 8, color: '#f59e0b' }} />经验沉淀</div>
                <List
                  size="small"
                  dataSource={viewingReview.experiences || []}
                  renderItem={(item: any) => (
                    <List.Item>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.item}</span>
                        <Tag size="small" color={item.value === '高' ? 'success' : 'default'}>{item.value}</Tag>
                      </div>
                    </List.Item>
                  )}
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={12}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}><CheckCircleOutlined style={{ marginRight: 8, color: '#3b82f6' }} />改进建议</div>
                <List
                  size="small"
                  dataSource={viewingReview.improvements || []}
                  renderItem={(item: any) => (
                    <List.Item>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.item}</span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>负责人：{item.owner}</span>
                      </div>
                    </List.Item>
                  )}
                />
              </Col>
              <Col span={12}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}><FileDoneOutlined style={{ marginRight: 8, color: '#10b981' }} />可复用交付物</div>
                <List
                  size="small"
                  dataSource={viewingReview.deliverables || []}
                  renderItem={(item: any) => (
                    <List.Item>
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <span>{item.name}</span>
                        <Tag size="small">{item.type}</Tag>
                      </div>
                    </List.Item>
                  )}
                />
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: 12 }}>
              <span>复盘人：{viewingReview.reviewedBy}</span>
              <span>复盘日期：{viewingReview.reviewedAt}</span>
            </div>
          </div>
        )}
      </Modal>

      {/* 新增/编辑复盘 */}
      <Modal
        title={editingReview ? '编辑复盘' : '新增复盘'}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width="640"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="复盘类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="过程复盘">过程复盘</Select.Option>
                  <Select.Option value="验收复盘">验收复盘</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="stage" label="阶段">
                <Select placeholder="请选择">
                  <Select.Option value="需求阶段">需求阶段</Select.Option>
                  <Select.Option value="实施阶段">实施阶段</Select.Option>
                  <Select.Option value="验收阶段">验收阶段</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="summary" label="总体总结">
            <Input.TextArea rows={3} placeholder="请输入项目复盘总体总结" />
          </Form.Item>
          <Form.Item name="problems" label="问题清单">
            <Input.TextArea rows={3} placeholder="每行一条，格式：问题描述(严重程度)，例如：培训时间安排紧张(中)" />
          </Form.Item>
          <Form.Item name="experiences" label="经验沉淀">
            <Input.TextArea rows={3} placeholder="每行一条，格式：经验描述(价值)，例如：提前与客户确认培训人员清单(高)" />
          </Form.Item>
          <Form.Item name="improvements" label="改进建议">
            <Input.TextArea rows={3} placeholder="每行一条，格式：改进项→负责人，例如：增加培训预演环节→培训负责人" />
          </Form.Item>
          <Form.Item name="deliverables" label="可复用交付物">
            <Input.TextArea rows={2} placeholder="每行一条，格式：交付物名称(类型)，例如：培训材料模板(文档)" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="score" label="综合评分" initialValue={80}>
                <Input type="number" min={0} max={100} suffix="分" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="reviewedBy" label="复盘人" rules={[{ required: true, message: '请输入复盘人' }]}>
                <Input placeholder="请输入复盘人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="reviewedAt" label="复盘日期" rules={[{ required: true }]} initialValue={new Date().toISOString().split('T')[0]}>
            <Input type="date" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
