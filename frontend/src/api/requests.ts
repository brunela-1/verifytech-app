import apiClient from './client';

export interface CreateRequestBody {
  title: string;
  category: string;
  description?: string;
  address?: string;
}

export const createRequest = (data: CreateRequestBody) => apiClient.post('/api/requests/', data);
export const getMyRequests = () => apiClient.get('/api/requests/');
export const getAvailableRequests = () => apiClient.get('/api/requests/available');
export const getRequest = (id: string) => apiClient.get(`/api/requests/${id}`);
export const cancelRequest = (id: string) => apiClient.put(`/api/requests/${id}/cancel`);
export const addRequestImages = (id: string, image_urls: string[]) =>
  apiClient.post(`/api/requests/${id}/images`, { image_urls });
