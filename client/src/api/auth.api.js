import { apiClient } from '../lib/axios.js';

export const registerApi = async (data) => {
  const response = await apiClient.post('/auth/register', data);
  return response.data;
};

export const loginApi = async (data) => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const refreshApi = async () => {
  const response = await apiClient.post('/auth/refresh');
  return response.data;
};

export const logoutApi = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const getMeApi = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};
