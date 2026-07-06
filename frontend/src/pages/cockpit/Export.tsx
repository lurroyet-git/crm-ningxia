import React, { useState } from 'react';
import {
  Card, Select, DatePicker, Button, Table, Tag, Row, Col, Radio, message
} from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

export default function CockpitExport() {
  const [dataType, setDataType] = useState('project');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf'>('excel');

  const historyData = [
    { id: '1', type: '项目数据', range: '2024-01-01 ~ 2024-01-31', format: 'Excel', status: '已完成', size: '2.4MB', createdAt: '2024-02-01 09:30', operator: '张三' },
    { id: '2', type: '客户数据', range: '2024-01-01 ~ 2024-01-31', format: 'PDF', status: '已完成', size: '1.1MB', createdAt: '2024-02-01 10:15', operator: '李四' },
    { id: '3', type: '工单数据', range: '2024-01-01 ~ 2024-01-31', format: 'Excel', status: '处理中', size: '-', createdAt: '2024-02-02 14:20', operator: '王五' },
    { id: '4', type: '财务数据', range: '2023-10-01 ~ 2023-12-31', format: 'Excel', status: '已完成', size: '5.6MB', createdAt: '2024-01-05 11:00', operator: '张三' },
  ];

  const handleExport = () => {
    message.success(`正在导出${dataType === 'project' ? '项目' : dataType === 'customer' ? '客户' : dataType === 'ticket' ? '工单' : '财务'}数据...`);
  };

  const columns = [
    { title: '导出类型', dataIndex: 'type', key: 'type' },
    { title: '时间范围', dataIndex: 'range', key: 'range' },
    { title: '格式', dataIndex: 'format', key: 'format', render: (v: string) => <Tag color={v === 'Excel' ? '#10b981' : '#ef4444'}>{v}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === '已完成' ? '#10b981' : '#3b82f6'}>{v}</Tag> },
    { title: '大小', dataIndex: 'size', key: 'size' },
    { title: '操作人', dataIndex: 'operator', key: 'operator' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        record.status === '已完成' ? (
          <Button type="link" size="small" icon={<DownloadOutlined />}>下载</Button>
        ) : (
          <span style={{ color: '#9ca3af' }}>-</span>
        )
      ),
    },
  ];

  return (
    <div>
      {/* 导出配置 */}
      <Card title="数据导出配置" style={{ borderRadius: 8, marginBottom: 16 }}>
        <Row gutter={[24, 16]} align="middle">
          <Col span={8}>
            <div style={{ marginBottom: 8, color: '#374151', fontWeight: 500 }}>数据类型</div>
            <Select
              style={{ width: '100%' }}
              value={dataType}
              onChange={setDataType}
            >
              <Select.Option value="project">项目数据</Select.Option>
              <Select.Option value="customer">客户数据</Select.Option>
              <Select.Option value="ticket">工单数据</Select.Option>
              <Select.Option value="finance">财务数据</Select.Option>
            </Select>
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8, color: '#374151', fontWeight: 500 }}>时间范围</div>
            <RangePicker style={{ width: '100%' }} />
          </Col>
          <Col span={8}>
            <div style={{ marginBottom: 8, color: '#374151', fontWeight: 500 }}>导出格式</div>
            <Radio.Group value={exportFormat} onChange={(e) => setExportFormat(e.target.value)}>
              <Radio.Button value="excel"><FileExcelOutlined /> Excel</Radio.Button>
              <Radio.Button value="pdf"><FilePdfOutlined /> PDF</Radio.Button>
            </Radio.Group>
          </Col>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
              开始导出
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 导出历史 */}
      <Card title="导出历史记录" style={{ borderRadius: 8 }}>
        <Table
          dataSource={historyData}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
    </div>
  );
}
