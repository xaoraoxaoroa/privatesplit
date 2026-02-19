export interface Split {
  split_id: string;
  creator: string;
  total_amount: number; // microcredits
  per_person: number;
  participant_count: number;
  issued_count: number;
  salt: string;
  description?: string;
  category?: SplitCategory;
  expiry_hours?: number; // 0 = no expiry
  token_type?: TokenType;
  status: SplitStatus;
  payment_count: number;
  created_at: string;
  transaction_id?: string;
  participants?: Participant[];
}

export interface Participant {
  address: string;
  label?: string;
  paid: boolean;
  payment_tx_id?: string;
}

export type SplitStatus = 'active' | 'settled' | 'pending' | 'expired';

export type SplitCategory =
  | 'dinner'
  | 'groceries'
  | 'rent'
  | 'travel'
  | 'utilities'
  | 'entertainment'
  | 'shopping'
  | 'other';

export type TokenType = 'credits' | 'usdcx';

export const CATEGORY_META: Record<SplitCategory, { label: string; icon: string; color: string }> = {
  dinner: { label: 'Dinner', icon: 'UtensilsCrossed', color: '#f97316' },
  groceries: { label: 'Groceries', icon: 'ShoppingCart', color: '#22c55e' },
  rent: { label: 'Rent', icon: 'Home', color: '#6366f1' },
  travel: { label: 'Travel', icon: 'Plane', color: '#0ea5e9' },
  utilities: { label: 'Utilities', icon: 'Zap', color: '#eab308' },
  entertainment: { label: 'Entertainment', icon: 'Film', color: '#ec4899' },
  shopping: { label: 'Shopping', icon: 'ShoppingBag', color: '#a855f7' },
  other: { label: 'Other', icon: 'FileText', color: '#64748b' },
};

export const TOKEN_META: Record<TokenType, { label: string; symbol: string; decimals: number }> = {
  credits: { label: 'Aleo Credits', symbol: 'ALEO', decimals: 6 },
  usdcx: { label: 'USDCx', symbol: 'USDCx', decimals: 6 },
};

export interface SplitFormData {
  description: string;
  total_amount: string; // User enters in credits, we convert
  participant_count: number;
  participants: string[]; // Aleo addresses
  category?: SplitCategory;
  expiry_hours?: number;
  token_type?: TokenType;
}

export interface PaymentParams {
  creator: string;
  amount: string;
  salt: string;
  split_id: string;
  description?: string;
  token_type?: TokenType;
}

export type PaymentStep = 'connect' | 'verify' | 'convert' | 'pay' | 'success' | 'error';

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning' | 'system';
}

// Group templates for recurring splits
export interface GroupTemplate {
  id: string;
  name: string;
  category: SplitCategory;
  participant_count: number;
  participants: string[];
  default_amount?: string;
}

// Receipt export format
export interface ReceiptExport {
  type: 'payer' | 'creator';
  split_id: string;
  amount: number;
  counterparty: string;
  timestamp: string;
  transaction_id?: string;
  token_type: TokenType;
  verification_url: string;
}
