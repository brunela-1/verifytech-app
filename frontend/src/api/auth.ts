import apiClient from './client';

export const syncProfile = (role?: string, referral_source?: string | null) =>
  apiClient.post('/api/auth/sync-profile', { role, referral_source });
export const getMe = () => apiClient.get(`/api/auth/me?t=${Date.now()}`);
