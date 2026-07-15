import apiClient from './client';

export interface OverviewStats {
  total_clients: number;
  total_techs: number;
  total_requests: number;
  open_requests: number;
  total_services: number;
  active_services: number;
  completed_services: number;
  total_proposals: number;
  accepted_proposals: number;
  pending_verifications: number;
  verified_techs: number;
  total_reviews: number;
  avg_rating: number;
}

export interface MetricsDashboard {
  total_clients: number;
  total_requests: number;
  request_creation_rate: number;
  proposal_acceptance_rate: number;
  history_view_avg_7d: number;
  client_offer_abandonment_rate: number;
  total_techs: number;
  tech_profile_completion_rate: number;
  avg_proposals_first_week: number;
  tech_weekly_login_avg: number;
  file_upload_abandonment_rate: number;
  acquisition_client_rate: number;
  acquisition_tech_rate: number;
  activation_client_rate: number;
  activation_tech_rate: number;
  retention_client_recurrence_rate: number;
  retention_tech_login_4x_rate: number;
  total_revenue: number;
  referral_rate: number;
  liquidity_rate: number;
}

export interface AdminUser {
  user_id: string;
  role: string;
  referral_source: string | null;
  created_at: string | null;
}

export interface PendingTech {
  user_id: string;
  full_name: string;
  specialty: string | null;
  photo_url: string | null;
  dni_front_url: string | null;
  dni_back_url: string | null;
  cert_url: string | null;
  verification_status: string;
  rating_avg: number;
  created_at: string | null;
}

export interface AdminRequest {
  id: string;
  client_id: string;
  title: string;
  category: string;
  status: string;
  created_at: string | null;
}

export interface AdminService {
  id: string;
  tech_id: string;
  client_id: string;
  status: string;
  scheduled_start: string | null;
  created_at: string | null;
}

export const fetchOverviewStats = (): Promise<OverviewStats> =>
  apiClient.get('/api/admin/stats/overview').then(r => r.data);

export const fetchMetricsDashboard = (): Promise<MetricsDashboard> =>
  apiClient.get('/api/metrics/dashboard').then(r => r.data);

export const fetchAdminUsers = (role?: string): Promise<AdminUser[]> =>
  apiClient.get('/api/admin/users', { params: role ? { role } : {} }).then(r => r.data);

export const fetchPendingTechs = (status = 'pending'): Promise<PendingTech[]> =>
  apiClient.get('/api/admin/techs/pending', { params: { status } }).then(r => r.data);

export const verifyTech = (techId: string, status: 'verified' | 'rejected') =>
  apiClient.put(`/api/admin/techs/${techId}/verify`, { status }).then(r => r.data);

export const fetchAllRequests = (status?: string): Promise<AdminRequest[]> =>
  apiClient.get('/api/admin/requests', { params: status ? { status } : {} }).then(r => r.data);

export const fetchAllServices = (status?: string): Promise<AdminService[]> =>
  apiClient.get('/api/admin/services', { params: status ? { status } : {} }).then(r => r.data);

export interface AdminRecharge {
  id: string;
  tech_id: string;
  amount: number;
  type: string;
  status: string;
  reference: string | null;
  created_at: string;
}

export const fetchPendingRecharges = (): Promise<AdminRecharge[]> =>
  apiClient.get('/api/admin/wallet/recharges').then(r => r.data);

export const approveRecharge = (txId: string) =>
  apiClient.put(`/api/admin/wallet/recharges/${txId}/approve`).then(r => r.data);

export const rejectRecharge = (txId: string) =>
  apiClient.put(`/api/admin/wallet/recharges/${txId}/reject`).then(r => r.data);
