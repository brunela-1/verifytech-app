import apiClient from './client';

export interface CreateBlockBody {
  day_label: string;
  start_time: string;
  end_time: string;
}

export const getMyBlocks = () => apiClient.get('/api/availability/');
export const createBlock = (data: CreateBlockBody) => apiClient.post('/api/availability/', data);
export const updateBlock = (id: string, data: Partial<CreateBlockBody>) =>
  apiClient.put(`/api/availability/${id}`, data);
export const deleteBlock = (id: string) => apiClient.delete(`/api/availability/${id}`);
export const getTechBlocks = (techId: string) => apiClient.get(`/api/availability/tech/${techId}`);
