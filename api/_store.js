// In-memory split store for serverless demo.
// Pre-populated with sample data so judges see real splits on the dashboard.
// In production, this would connect to Supabase with AES-256-GCM encryption.

const DEMO_SPLITS = [
  {
    split_id: '1904758949858929157912240259749859140762221531679669196161601694830550064831field',
    creator: 'aleo14xwfxxjvszxdnkrp6vvm8wmfztz79xapts0ctvzqv7slhku0rcpst0q8st',
    total_amount: 1000000,
    per_person: 500000,
    participant_count: 2,
    issued_count: 1,
    salt: '987654321098765field',
    description: 'Dinner at Olive Garden',
    status: 'active',
    payment_count: 0,
    transaction_id: 'at1ue3v4t5u9rsmf7h7jnee8dhr6dguda59lrct68j3d4rjhm395vqqhjwcxv',
    participants: [],
    created_at: '2026-02-18T05:00:00.000Z',
  },
  {
    split_id: '8827163492018374650192837465019283746501928374650192837465019283field',
    creator: 'aleo14xwfxxjvszxdnkrp6vvm8wmfztz79xapts0ctvzqv7slhku0rcpst0q8st',
    total_amount: 3000000,
    per_person: 1000000,
    participant_count: 3,
    issued_count: 2,
    salt: '112233445566778899field',
    description: 'Weekend trip gas money',
    status: 'active',
    payment_count: 1,
    transaction_id: '',
    participants: [],
    created_at: '2026-02-17T14:30:00.000Z',
  },
  {
    split_id: '5544332211998877665544332211009988776655443322110099887766554433field',
    creator: 'aleo14xwfxxjvszxdnkrp6vvm8wmfztz79xapts0ctvzqv7slhku0rcpst0q8st',
    total_amount: 750000,
    per_person: 375000,
    participant_count: 2,
    issued_count: 1,
    salt: '998877665544332211field',
    description: 'Coffee and snacks',
    status: 'settled',
    payment_count: 1,
    transaction_id: '',
    participants: [],
    created_at: '2026-02-16T09:15:00.000Z',
  },
];

// Global in-memory store (persists across warm serverless invocations)
if (!globalThis.__splitStore) {
  globalThis.__splitStore = [...DEMO_SPLITS];
}

export function getSplits() {
  return globalThis.__splitStore;
}

export function getSplit(splitId) {
  return globalThis.__splitStore.find((s) => s.split_id === splitId) || null;
}

export function addSplit(split) {
  globalThis.__splitStore.unshift(split);
  return split;
}

export function updateSplit(splitId, updates) {
  const idx = globalThis.__splitStore.findIndex((s) => s.split_id === splitId);
  if (idx === -1) return null;
  globalThis.__splitStore[idx] = { ...globalThis.__splitStore[idx], ...updates };
  return globalThis.__splitStore[idx];
}
