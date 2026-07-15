import apiClient from './client';

export const getMyServices = () => apiClient.get('/api/services/');
export const getService = (id: string) => apiClient.get(`/api/services/${id}`);
export const updateServiceStatus = (id: string, status: string) =>
  apiClient.put(`/api/services/${id}/status`, { status });
export const getServiceHistory = () => apiClient.get('/api/services/history');
