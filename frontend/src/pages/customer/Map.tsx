import React, { useState } from 'react';
import { Card, Row, Col, Badge, Button, Table, Tag } from 'antd';
import { EnvironmentOutlined } from '@ant-design/icons';

interface CityData {
  name: string;
  count: number;
  x: number; // 网格位置 x (0-5)
  y: number; // 网格位置 y (0-3)
}

const CITIES: CityData[] = [
  { name: '银川市', count: 24, x: 2, y: 1 },
  { name: '石嘴山市', count: 12, x: 3, y: 0 },
  { name: '吴忠市', count: 10, x: 3, y: 2 },
  { name: '中卫市', count: 8, x: 1, y: 3 },
  { name: '固原市', count: 6, x: 4, y: 3 },
];

export default function CustomerMap() {
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const cityCustomers: Record<string, any[]> = {
    银川市: [
      { id: '1', name: '宁夏人民医院', type: '医疗机构', industry: '医疗', grade: 'A' },
      { id: '2', name: '银川市教育局', type: '政府机关', industry: '教育', grade: 'A' },
      { id: '3', name: '宁夏电力公司', type: '企业', industry: '能源', grade: 'A' },
      { id: '4', name: '石嘴山银行银川分行', type: '金融机构', industry: '金融', grade: 'B' },
    ],
    石嘴山市: [
      { id: '5', name: '石嘴山银行总行', type: '金融机构', industry: '金融', grade: 'A' },
      { id: '6', name: '石嘴山市人民医院', type: '医疗机构', industry: '医疗', grade: 'B' },
    ],
    吴忠市: [
      { id: '7', name: '吴忠市教育局', type: '政府机关', industry: '教育', grade: 'B' },
      { id: '8', name: '吴忠市中医院', type: '医疗机构', industry: '医疗', grade: 'C' },
    ],
    中卫市: [
      { id: '9', name: '中卫市数据中心', type: '企业', industry: 'IT', grade: 'A' },
      { id: '10', name: '中卫市人民医院', type: '医疗机构', industry: '医疗', grade: 'B' },
    ],
    固原市: [
      { id: '11', name: '固原市教育局', type: '政府机关', industry: '教育', grade: 'C' },
      { id: '12', name: '固原市人民医院', type: '医疗机构', industry: '医疗', grade: 'C' },
    ],
  };

  const columns = [
    { title: '客户名称', dataIndex: 'name', key: 'name' },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '行业', dataIndex: 'industry', key: 'industry' },
    {
      title: '分级',
      dataIndex: 'grade',
      key: 'grade',
      render: (v: string) => <Tag color={v === 'A' ? '#ef4444' : v === 'B' ? '#f59e0b' : '#3b82f6'}>{v}级</Tag>,
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]}>
        {/* 地图区域 */}
        <Col span={14}>
          <Card title={<span><EnvironmentOutlined /> 宁夏客户分布地图</span>} style={{ borderRadius: 8 }}>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 420,
                background: '#e0f2fe',
                borderRadius: 12,
                overflow: 'hidden',
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gridTemplateRows: 'repeat(4, 1fr)',
                gap: 8,
                padding: 16,
              }}
            >
              {/* 背景装饰 */}
              <div style={{ position: 'absolute', inset: 0, opacity: 0.3, background: 'radial-gradient(circle at 40% 50%, #bae6fd 0%, transparent 60%)' }} />

              {CITIES.map((city) => (
                <div
                  key={city.name}
                  style={{
                    gridColumn: city.x + 1,
                    gridRow: city.y + 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    zIndex: 1,
                  }}
                  onClick={() => setSelectedCity(city.name)}
                >
                  <div
                    style={{
                      width: selectedCity === city.name ? 64 : 52,
                      height: selectedCity === city.name ? 64 : 52,
                      borderRadius: '50%',
                      background: selectedCity === city.name ? '#1e3a5f' : '#3b82f6',
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
                      transition: 'all 0.2s ease',
                      transform: selectedCity === city.name ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{city.count}</span>
                    <span style={{ fontSize: 10 }}>家</span>
                  </div>
                  <span
                    style={{
                      marginTop: 6,
                      fontSize: 13,
                      fontWeight: selectedCity === city.name ? 600 : 500,
                      color: selectedCity === city.name ? '#1e3a5f' : '#4b5563',
                    }}
                  >
                    {city.name}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 统计面板 */}
        <Col span={10}>
          <Card title="各城市客户统计" style={{ borderRadius: 8, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CITIES.map((city) => (
                <div
                  key={city.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    background: selectedCity === city.name ? '#eff6ff' : 'transparent',
                    border: selectedCity === city.name ? '1px solid #3b82f6' : '1px solid transparent',
                  }}
                  onClick={() => setSelectedCity(city.name)}
                >
                  <Badge count={city.count} color={selectedCity === city.name ? '#1e3a5f' : '#3b82f6'} style={{ marginRight: 12 }} />
                  <span style={{ flex: 1, fontWeight: selectedCity === city.name ? 500 : 400 }}>{city.name}</span>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>{Math.round((city.count / 60) * 100)}%</span>
                </div>
              ))}
            </div>
          </Card>

          {selectedCity && (
            <Card
              title={`${selectedCity} - 客户列表`}
              style={{ borderRadius: 8 }}
              extra={<Button type="link" size="small" onClick={() => setSelectedCity(null)}>清除选择</Button>}
            >
              <Table
                dataSource={cityCustomers[selectedCity] || []}
                columns={columns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
