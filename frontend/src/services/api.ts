import { BACKEND_URL } from '../utils/constants';
import type { Split, SplitCategory, TokenType } from '../types/split';

const API = BACKEND_URL + '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface NetworkStats {
  total_splits: number;
  active: number;
  settled: number;
  total_volume: number;
  total_payments: number;
  total_participants: number;
  categories: Record<string, { count: number; volume: number }>;
  daily_activity: { date: string; count: number }[];
}

export const api = {
  getSplits: (filters?: { status?: string; category?: string; token_type?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set('status', filters.status);
    if (filters?.category) params.set('category', filters.category);
    if (filters?.token_type) params.set('token_type', filters.token_type);
    const qs = params.toString();
    return request<Split[]>(`/splits${qs ? `?${qs}` : ''}`);
  },

  getSplitsByCreator: (address: string) => request<Split[]>(`/splits/creator/${address}`),

  getSplit: (splitId: string) => request<Split>(`/splits/${splitId}`),

  getRecentSplits: () => request<Split[]>('/splits/recent'),

  getStats: () => request<NetworkStats>('/stats'),

  createSplit: (data: {
    split_id: string;
    creator: string;
    total_amount: number;
    per_person: number;
    participant_count: number;
    salt: string;
    description: string;
    category?: SplitCategory;
    expiry_hours?: number;
    token_type?: TokenType;
    transaction_id: string;
    participants: string[];
  }) => request<Split>('/splits', { method: 'POST', body: JSON.stringify(data) }),

  updateSplit: (splitId: string, updates: Partial<Split>) =>
    request<Split>(`/splits/${splitId}`, { method: 'PATCH', body: JSON.stringify(updates) }),

  exportReceipt: (splitId: string, type: 'payer' | 'creator') =>
    request<any>(`/receipt/${splitId}/${type}`),
};
