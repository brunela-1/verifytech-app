import apiClient from './client';

export interface TechProfileUpdate {
  full_name?: string;
  specialty?: string;
  experience_years?: number;
  description?: string;
  photo_url?: string;
}

export interface TechDocuments {
  dni_front_url?: string;
  dni_back_url?: string;
  cert_url?: string;
}

export const listVerifiedTechs = () => apiClient.get('/api/techs/');
export const getTechPublic = (id: string) => apiClient.get(`/api/techs/${id}`);
export const getMyTechProfile = () => apiClient.get('/api/techs/me/profile');
export const updateMyTechProfile = (data: TechProfileUpdate) => apiClient.put('/api/techs/me/profile', data);
export const uploadDocuments = (data: TechDocuments) => apiClient.post('/api/techs/me/documents', data);
export const getVerificationStatus = () => apiClient.get('/api/techs/me/verification-status');
