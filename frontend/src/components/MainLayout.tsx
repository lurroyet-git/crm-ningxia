import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Badge, List, Button, Divider } from 'antd';
import {
  HomeOutlined, FolderOpenOutlined, ToolOutlined, BulbOutlined,
  TeamOutlined, BookOutlined, DownOutlined, BellOutlined, CheckCircleOutlined, MessageOutlined, WarningOutlined, FileTextOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { useAuthStore } from '../store/auth';
import request from '../utils/request';

const { Sider, Header, Content } = Layout;

interface NotificationItem {
  id: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: string;
  link?: string;
}

const menuItems = [
  {
    key: 'cockpit',
    icon: <HomeOutlined />,
    label: '作战台',
    children: [
      { key: '/cockpit', label: '今日概览' },
      { key: '/cockpit/report', label: '经营报表' },
      { key: '/cockpit/export', label: '数据导出' },
      { key: '/cockpit/team', label: '团队设置' },
    ],
  },
  {
    key: 'project',
    icon: <FolderOpenOutlined />,
    label: '项目交付',
    children: [
      { key: '/project/overview', label: '项目概览' },
      { key: '/project/nodes', label: '项目节点' },
      { key: '/project/meeting', label: '会议管理' },
      { key: '/project/kanban', label: '交付看板' },
      { key: '/project/cost', label: '成本管理' },
      { key: '/project/return', label: '回款管理' },
      { key: '/project/review', label: '项目复盘' },
    ],
  },
  {
    key: 'ops',
    icon: <ToolOutlined />,
    label: '运维管理',
    children: [
      { key: '/ops/records', label: '运维记录' },
      { key: '/ops/plan', label: '巡检计划' },
      { key: '/ops/log', label: '巡检记录' },
      { key: '/ops/assets', label: '资产台账' },
    ],
  },
  {
    key: 'biz',
    icon: <BulbOutlined />,
    label: '商机营销',
    children: [
      { key: '/biz/pool', label: '商机池' },
      { key: '/biz/follow', label: '营销跟进' },
      { key: '/biz/visit', label: '拜访计划' },
    ],
  },
  {
    key: 'customer',
    icon: <TeamOutlined />,
    label: '客户资产',
    children: [
      { key: '/customer/assets', label: '客户档案' },
      { key: '/customer/map', label: '区域地图' },
      { key: '/customer/network', label: '关系网络' },
    ],
  },
  {
    key: 'knowledge',
    icon: <BookOutlined />,
    label: '知识分享',
    children: [
      { key: '/knowledge/training', label: '培训计划' },
      { key: '/knowledge/material', label: '方案素材' },
    ],
  },
];

const NOTIFICATION_ICON: Record<string, React.ReactNode> = {
  '系统': <InfoCircleOutlined />,
  '运维': <WarningOutlined />,
  '商机': <FileTextOutlined />,
  '消息': <MessageOutlined />,
};

const NOTIFICATION_COLOR: Record<string, string> = {
  '系统': '#3b82f6',
  '运维': '#ef4444',
  '商机': '#f59e0b',
  '消息': '#10b981',
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await request.get('/notifications');
      const list = res.list || [];
      setNotifications(list.slice(0, 10));
      const unreadRes = await request.get('/notifications/unread-count');
      setUnreadCount(unreadRes.count || 0);
    } catch (e) {
      // 使用模拟数据
      const mockNotifications = [
        { id: '1', title: '系统升级通知', content: '系统将于今晚23:00进行例行升级维护，预计持续30分钟。', time: '10分钟前', read: false, type: '系统' },
        { id: '2', title: '工单待处理', content: '您有一条高优先级工单「服务器故障」待处理。', time: '1小时前', read: false, type: '运维' },
        { id: '3', title: '商机跟进提醒', content: '客户「宁夏人民医院」的商机即将到期，请及时跟进。', time: '2小时前', read: true, type: '商机' },
        { id: '4', title: '巡检计划提醒', content: '今日有3个巡检计划需要执行，请提前准备。', time: '3小时前', read: true, type: '运维' },
        { id: '5', title: '培训计划通知', content: '下周二有产品培训，请准时参加。', time: '昨天', read: true, type: '消息' },
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter((n) => !n.read).length);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await request.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await request.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    handleMarkRead(item.id);
    if (item.link) {
      navigate(item.link);
    }
  };

  const notificationDropdownContent = (
    <div style={{ width: 360, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ padding: '12px 16px', fontWeight: 600, fontSize: 14, borderBottom: '1px solid #f0f0f0' }}>
        通知消息
      </div>
      <List
        dataSource={notifications}
        renderItem={(item) => (
          <List.Item
            style={{ padding: '12px 16px', cursor: 'pointer', background: item.read ? 'transparent' : '#f0f5ff', borderBottom: '1px solid #f0f0f0' }}
            onClick={() => handleNotificationClick(item)}
          >
            <div style={{ display: 'flex', gap: 10, width: '100%' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${NOTIFICATION_COLOR[item.type] || '#3b82f6'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: NOTIFICATION_COLOR[item.type] || '#3b82f6', fontSize: 14, flexShrink: 0 }}>
                {NOTIFICATION_ICON[item.type] || <MessageOutlined />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500, fontSize: 13 }}>{item.title}</span>
                  {!item.read && <Badge color="#ef4444" />}
                </div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4, lineHeight: 1.5 }}>{item.content}</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{item.time}</div>
              </div>
            </div>
          </List.Item>
        )}
      />
      {notifications.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>暂无通知</div>
      )}
      <Divider style={{ margin: 0 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px' }}>
        <Button type="link" size="small" onClick={handleMarkAllRead} icon={<CheckCircleOutlined />}>
          标记全部已读
        </Button>
        <Button type="link" size="small" onClick={() => navigate('/notifications')}>
          查看全部
        </Button>
      </div>
    </div>
  );

  const userMenuItems = [
    { key: 'profile', label: '个人设置' },
    { key: 'logout', label: '退出登录', danger: true },
  ];

  const onMenuClick = (e: any) => {
    if (e.key === 'logout') {
      clearAuth();
      window.location.href = '/login';
    }
  };

  const path = location.pathname;
  const openKeys = menuItems.filter((m) =>
    m.children?.some((c) => path.startsWith(c.key))
  ).map((m) => m.key);

  const selectedKey = path;

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        theme="dark"
        width={220}
        style={{ background: '#0f172a' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>智</span>
            </div>
            <div>
              <div style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>智联运维 CRM</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>运维驱动业务增长</div>
            </div>
          </div>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          style={{ background: '#0f172a', border: 'none' }}
          items={menuItems as any}
          defaultOpenKeys={openKeys}
          selectedKeys={[selectedKey]}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {menuItems.flatMap((m) => m.children || []).find((c) => c.key === path)?.label || '工作台'}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown
              dropdownRender={() => notificationDropdownContent}
              placement="bottomRight"
              trigger={['click']}
            >
              <Badge count={unreadCount} size="small" overflowCount={99}>
                <BellOutlined style={{ fontSize: 18, color: '#6b7280', cursor: 'pointer' }} />
              </Badge>
            </Dropdown>
            <Dropdown menu={{ items: userMenuItems, onClick: onMenuClick }} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Avatar size="small" style={{ background: '#3b82f6' }}>{user?.realName?.charAt(0) || '用'}</Avatar>
                <span style={{ fontSize: 13 }}>{user?.realName || '用户'}</span>
                <DownOutlined style={{ fontSize: 10, color: '#9ca3af' }} />
              </div>
            </Dropdown>
          </div>
        </Header>

        <Content style={{ padding: 16, overflow: 'auto', background: '#f5f7fa' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
