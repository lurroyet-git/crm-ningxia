import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Button, Input, Tag, Modal, Form, Select, message, Spin, Empty
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, DownloadOutlined, HeartOutlined, StarOutlined,
  FileTextOutlined, FileImageOutlined, FilePdfOutlined, VideoCameraOutlined, ToolOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface Material {
  id: string;
  title: string;
  type: string;
  category: string;
  tags: string[];
  downloadCount: number;
  likeCount: number;
  creator: string;
  createdAt: string;
  fileUrl?: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  '文档': <FileTextOutlined />,
  '图片': <FileImageOutlined />,
  'PDF': <FilePdfOutlined />,
  '视频': <VideoCameraOutlined />,
  '工具': <ToolOutlined />,
};

const TYPE_COLOR: Record<string, string> = {
  '文档': '#3b82f6',
  '图片': '#10b981',
  'PDF': '#ef4444',
  '视频': '#8b5cf6',
  '工具': '#f59e0b',
};

const CATEGORIES = ['全部', '方案', '培训', '案例', '工具', '文档'];

export default function KnowledgeMaterial() {
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [activeCategory, setActiveCategory] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/knowledge/materials');
      setMaterials(res.list || []);
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
      await request.post('/knowledge/materials', values);
      message.success('上传成功');
      setIsModalOpen(false);
      fetchData();
    } catch {
      // 表单校验失败
    }
  };

  const handleLike = async (id: string) => {
    try {
      await request.post(`/knowledge/materials/${id}/like`);
      message.success('点赞成功');
      fetchData();
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const handleDownload = async (id: string) => {
    try {
      await request.post(`/knowledge/materials/${id}/download`);
      message.success('下载已开始');
    } catch (e) {
      // 错误已在拦截器中处理
    }
  };

  const filteredMaterials = materials.filter((m) => {
    if (activeCategory !== '全部' && m.category !== activeCategory) return false;
    if (searchText && !m.title.includes(searchText) && !m.tags.some((t) => t.includes(searchText))) return false;
    return true;
  });

  return (
    <div>
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat}
                type={activeCategory === cat ? 'primary' : 'default'}
                onClick={() => setActiveCategory(cat)}
                size="small"
              >
                {cat}
              </Button>
            ))}
            <Input
              placeholder="搜索素材标题/标签..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            上传素材
          </Button>
        </div>

        <Spin spinning={loading}>
          {filteredMaterials.length === 0 ? (
            <Empty description="暂无素材" />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {filteredMaterials.map((item) => (
                <Card
                  key={item.id}
                  hoverable
                  style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: `${TYPE_COLOR[item.type] || '#3b82f6'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TYPE_COLOR[item.type] || '#3b82f6', fontSize: 18 }}>
                      {TYPE_ICON[item.type] || <FileTextOutlined />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.title}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.type} · {item.category}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                    {item.tags?.map((tag) => (
                      <Tag key={tag} size="small" style={{ fontSize: 11 }}>{tag}</Tag>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                    <span><DownloadOutlined style={{ marginRight: 4 }} />{item.downloadCount}</span>
                    <span><HeartOutlined style={{ marginRight: 4 }} />{item.likeCount}</span>
                    <span>{item.creator}</span>
                    <span>{item.createdAt}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button size="small" icon={<EyeOutlined />} block>预览</Button>
                    <Button size="small" icon={<DownloadOutlined />} block onClick={() => handleDownload(item.id)}>下载</Button>
                    <Button size="small" icon={<HeartOutlined />} block onClick={() => handleLike(item.id)}>点赞</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Spin>
      </Card>

      <Modal
        title="上传素材"
        open={isModalOpen}
        onOk={handleSave}
        onCancel={() => setIsModalOpen(false)}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入素材标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="类型" rules={[{ required: true, message: '请选择类型' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="文档">文档</Select.Option>
                  <Select.Option value="图片">图片</Select.Option>
                  <Select.Option value="PDF">PDF</Select.Option>
                  <Select.Option value="视频">视频</Select.Option>
                  <Select.Option value="工具">工具</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select placeholder="请选择">
                  <Select.Option value="方案">方案</Select.Option>
                  <Select.Option value="培训">培训</Select.Option>
                  <Select.Option value="案例">案例</Select.Option>
                  <Select.Option value="工具">工具</Select.Option>
                  <Select.Option value="文档">文档</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" placeholder="输入标签后按回车" />
          </Form.Item>
          <Form.Item name="fileUrl" label="文件上传">
            <Input placeholder="请输入文件URL或上传文件" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
