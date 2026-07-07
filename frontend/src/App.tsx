import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';

// 懒加载各模块页面
const CockpitOverview = React.lazy(() => import('./pages/cockpit/Overview'));
const CockpitReport = React.lazy(() => import('./pages/cockpit/Report'));
const CockpitExport = React.lazy(() => import('./pages/cockpit/Export'));
const CockpitTeam = React.lazy(() => import('./pages/cockpit/Team'));

const ProjectOverview = React.lazy(() => import('./pages/project/Overview'));
const ProjectNodes = React.lazy(() => import('./pages/project/Nodes'));
const ProjectMeeting = React.lazy(() => import('./pages/project/Meeting'));
const ProjectKanban = React.lazy(() => import('./pages/project/Kanban'));
const ProjectCost = React.lazy(() => import('./pages/project/Cost'));
const ProjectReturn = React.lazy(() => import('./pages/project/Return'));
const ProjectReview = React.lazy(() => import('./pages/project/Review'));

const CustomerAssets = React.lazy(() => import('./pages/customer/Assets'));
const CustomerMap = React.lazy(() => import('./pages/customer/Map'));
const CustomerNetwork = React.lazy(() => import('./pages/customer/Network'));

const OpsRecords = React.lazy(() => import('./pages/ops/Records'));
const OpsPlan = React.lazy(() => import('./pages/ops/Plan'));
const OpsLog = React.lazy(() => import('./pages/ops/Log'));
const OpsAssets = React.lazy(() => import('./pages/ops/Assets'));

const BizPool = React.lazy(() => import('./pages/biz/Pool'));
const BizFollow = React.lazy(() => import('./pages/biz/Follow'));
const BizVisit = React.lazy(() => import('./pages/biz/Visit'));

const KnowledgeTraining = React.lazy(() => import('./pages/knowledge/Training'));
const KnowledgeMaterial = React.lazy(() => import('./pages/knowledge/Material'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 200 }} />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <PrivateRoute>
                <MainLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="/cockpit" replace />} />

            {/* 作战台 */}
            <Route path="cockpit" element={<CockpitOverview />} />
            <Route path="cockpit/report" element={<CockpitReport />} />
            <Route path="cockpit/export" element={<CockpitExport />} />
            <Route path="cockpit/team" element={<CockpitTeam />} />

            {/* 项目交付 */}
            <Route path="project/overview" element={<ProjectOverview />} />
            <Route path="project/nodes" element={<ProjectNodes />} />
            <Route path="project/meeting" element={<ProjectMeeting />} />
            <Route path="project/kanban" element={<ProjectKanban />} />
            <Route path="project/cost" element={<ProjectCost />} />
            <Route path="project/return" element={<ProjectReturn />} />
            <Route path="project/review" element={<ProjectReview />} />

            {/* 客户资产 */}
            <Route path="customer/assets" element={<CustomerAssets />} />
            <Route path="customer/map" element={<CustomerMap />} />
            <Route path="customer/network" element={<CustomerNetwork />} />

            {/* 运维管理 */}
            <Route path="ops/records" element={<OpsRecords />} />
            <Route path="ops/plan" element={<OpsPlan />} />
            <Route path="ops/log" element={<OpsLog />} />
            <Route path="ops/assets" element={<OpsAssets />} />

            {/* 商机营销 */}
            <Route path="biz/pool" element={<BizPool />} />
            <Route path="biz/follow" element={<BizFollow />} />
            <Route path="biz/visit" element={<BizVisit />} />

            {/* 知识分享 */}
            <Route path="knowledge/training" element={<KnowledgeTraining />} />
            <Route path="knowledge/material" element={<KnowledgeMaterial />} />

            {/* 兼容旧路由 */}
            <Route path="project/*" element={<Navigate to="/project/overview" replace />} />
            <Route path="customer/*" element={<Navigate to="/customer/assets" replace />} />

            <Route path="*" element={<Navigate to="/cockpit" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
