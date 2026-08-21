import { apiClient } from '../lib/axios.js';

export const getConversationsApi = async () => {
  const response = await apiClient.get('/conversations');
  return response.data;
};

export const createDirectConversationApi = async (recipientId) => {
  const response = await apiClient.post('/conversations/direct', { recipientId });
  return response.data;
};

export const getMessagesApi = async (conversationId, params = {}) => {
  const response = await apiClient.get(`/messages/${conversationId}`, { params });
  return response.data;
};

export const sendMessageApi = async (data) => {
  const response = await apiClient.post('/messages', data);
  return response.data;
};

export const searchUsersApi = async (query) => {
  const response = await apiClient.get('/users/search', { params: { q: query } });
  return response.data;
};
