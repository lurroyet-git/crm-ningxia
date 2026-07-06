import React, { useEffect, useState } from 'react';
import {
  Card, Row, Col, Table, Tag, Button, Input, Select, DatePicker, Modal, Spin, Badge, message
} from 'antd';
import {
  SearchOutlined, EyeOutlined, ExclamationCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import request from '../../utils/request';

interface InspectionLog {
  id: string;
  date: string;
  planName: string;
  executor: string;
  totalItems: number;
  abnormalCount: number;
  result: string;
  details: InspectionDetail[];
}

interface InspectionDetail {
  id: string;
  itemName: string;
  result: string;
  remark: string;
  isNormal: boolean;
}

const RESULT_COLOR: Record<string, string> = {
  '正常': '#10b981',
  '异常': '#ef4444',
  '部分异常': '#f59e0b',
};

export default function OpsLog() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<InspectionLog[]>([]);
  const [filter, setFilter] = useState({ date: '', plan: '', executor: '', result: '' });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [viewingLog, setViewingLog] = useState<InspectionLog | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await request.get('/ops/inspection-logs');
      setLogs(res.list || []);
    } catch (e) {
      // 错误已在拦截器中处理
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (log: InspectionLog) => {
    setViewingLog(log);
    setDetailModalOpen(true);
  };

  const filteredLogs = logs.filter((log) => {
    if (filter.date && !log.date.includes(filter.date)) return false;
    if (filter.plan && !log.planName.includes(filter.plan)) return false;
    if (filter.executor && !log.executor.includes(filter.executor)) return false;
    if (filter.result && log.result !== filter.result) return false;
    return true;
  });

  const columns = [
    { title: '巡检时间', dataIndex: 'date', key: 'date', width: 160 },
    { title: '计划名称', dataIndex: 'planName', key: 'planName', render: (v: string) => <span style={{ fontWeight: 500 }}>{v}</span> },
    { title: '执行人', dataIndex: 'executor', key: 'executor' },
    { title: '检查项数', dataIndex: 'totalItems', key: 'totalItems', width: 90 },
    {
      title: '异常数',
      dataIndex: 'abnormalCount',
      key: 'abnormalCount',
      width: 90,
      render: (v: number) => v > 0 ? <span style={{ color: '#ef4444', fontWeight: 700 }}>{v}</span> : <span style={{ color: '#10b981' }}>{v}</span>,
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      render: (v: string) => <Tag color={RESULT_COLOR[v] || '#6b7280'}>{v}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: any, record: InspectionLog) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Input
              placeholder="选择日期"
              value={filter.date}
              onChange={(e) => setFilter((prev) => ({ ...prev, date: e.target.value }))}
              style={{ width: 140 }}
              allowClear
            />
            <Input
              placeholder="计划名称"
              value={filter.plan}
              onChange={(e) => setFilter((prev) => ({ ...prev, plan: e.target.value }))}
              style={{ width: 160 }}
              allowClear
            />
            <Input
              placeholder="执行人"
              value={filter.executor}
              onChange={(e) => setFilter((prev) => ({ ...prev, executor: e.target.value }))}
              style={{ width: 140 }}
              allowClear
            />
            <Select placeholder="结果" style={{ width: 120 }} value={filter.result || undefined} onChange={(v) => setFilter((prev) => ({ ...prev, result: v }))} allowClear>
              <Select.Option value="正常">正常</Select.Option>
              <Select.Option value="异常">异常</Select.Option>
              <Select.Option value="部分异常">部分异常</Select.Option>
            </Select>
          </div>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => { /* 筛选变化已自动响应 */ }}>
            查询
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            dataSource={filteredLogs}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="small"
            rowClassName={(record) => record.abnormalCount > 0 ? 'abnormal-row' : ''}
          />
          <style>{`
            .abnormal-row {
              background-color: #fef2f2 !important;
            }
          `}</style>
        </Spin>
      </Card>

      <Modal
        title="巡检详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={null}
        width={600}
      >
        {viewingLog && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: 16, background: '#f0f5ff', borderRadius: 8 }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, background: viewingLog.abnormalCount > 0 ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {viewingLog.abnormalCount > 0 ? <ExclamationCircleOutlined style={{ color: 'white', fontSize: 18 }} /> : <CheckCircleOutlined style={{ color: 'white', fontSize: 18 }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{viewingLog.planName}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{viewingLog.date} · {viewingLog.executor}</div>
              </div>
              <Tag color={RESULT_COLOR[viewingLog.result]}>{viewingLog.result}</Tag>
            </div>
            <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>检查项明细</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {viewingLog.details?.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: item.isNormal ? '#f0fdf4' : '#fef2f2', borderRadius: 6, border: `1px solid ${item.isNormal ? '#bbf7d0' : '#fecaca'}` }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.isNormal ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.isNormal ? <CheckCircleOutlined style={{ color: 'white', fontSize: 12 }} /> : <ExclamationCircleOutlined style={{ color: 'white', fontSize: 12 }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>{item.itemName}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>结果: {item.result} {item.remark && `· ${item.remark}`}</div>
                  </div>
                </div>
              )) || <span style={{ color: '#9ca3af' }}>暂无明细</span>}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
