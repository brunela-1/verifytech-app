import apiClient from './client';

export interface WalletTransactionData {
  id: string;
  amount: number;
  type: 'recharge' | 'commission' | 'subscription' | 'bonus';
  status: 'pending' | 'completed' | 'rejected';
  reference?: string;
  created_at: string;
}

export interface WalletBalanceData {
  balance: number;
  is_vip: boolean;
  transactions: WalletTransactionData[];
}

export const getWalletBalance = () => apiClient.get<WalletBalanceData>('/api/wallet/');
export const requestRecharge = (amount: number, reference: string) => 
  apiClient.post('/api/wallet/recharge', { amount, reference });
