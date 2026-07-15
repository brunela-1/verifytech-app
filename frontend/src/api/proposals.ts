import apiClient from './client';

export interface CreateProposalBody {
  request_id: string;
  price: number;
  estimated_time?: string;
  observations?: string;
}

export interface AcceptProposalBody {
  selected_block_id?: string | null;
}

export const sendProposal = (data: CreateProposalBody) => apiClient.post('/api/proposals/', data);
export const getProposalsForRequest = (reqId: string) => apiClient.get(`/api/proposals/request/${reqId}`);
export const getMyProposals = () => apiClient.get('/api/proposals/my');
export const acceptProposal = (id: string, data: AcceptProposalBody) =>
  apiClient.put(`/api/proposals/${id}/accept`, data);
export const rejectProposal = (id: string) => apiClient.put(`/api/proposals/${id}/reject`);
