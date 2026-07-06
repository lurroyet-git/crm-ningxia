import axios from 'axios';
import { message } from 'antd';
import { useAuthStore } from '../store/auth';

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截器：注入Token
request.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 响应拦截器：统一处理
request.interceptors.response.use(
  (response) => {
    const { data } = response;
    if (data.code !== 200) {
      message.error(data.message || '请求失败');
      return Promise.reject(data);
    }
    return data.data;
  },
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      message.error('登录已过期，请重新登录');
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
    } else if (status === 403) {
      message.error('无操作权限');
    } else {
      message.error(error.response?.data?.message || '系统繁忙，请稍后');
    }
    return Promise.reject(error);
  },
);

export default request;
