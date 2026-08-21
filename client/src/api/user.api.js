import { apiClient } from '../lib/axios.js';

export const updateProfileApi = async (data) => {
  const response = await apiClient.patch('/users/profile', data);
  return response.data;
};

export const uploadAvatarApi = async (formData) => {
  const response = await apiClient.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const uploadImageApi = async (formData) => {
  const response = await apiClient.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
