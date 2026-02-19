import { supabase } from './_supabase.js';

// Demo fallback data (used ONLY if Supabase is not configured)
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
    category: 'dinner',
    token_type: 'credits',
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
    category: 'travel',
    token_type: 'credits',
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
    category: 'dinner',
    token_type: 'credits',
    status: 'settled',
    payment_count: 1,
    transaction_id: '',
    participants: [],
    created_at: '2026-02-16T09:15:00.000Z',
  },
];

if (!globalThis.__splitStore) {
  globalThis.__splitStore = [...DEMO_SPLITS];
}

// --- Supabase functions ---

async function supaGetSplits({ status, category, limit = 50, offset = 0 } = {}) {
  let query = supabase
    .from('splits')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) query = query.eq('status', status);
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function supaGetSplit(splitId) {
  const { data, error } = await supabase
    .from('splits')
    .select('*')
    .eq('split_id', splitId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

async function supaAddSplit(split) {
  const { data, error } = await supabase
    .from('splits')
    .insert(split)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function supaUpdateSplit(splitId, updates) {
  const { data, error } = await supabase
    .from('splits')
    .update(updates)
    .eq('split_id', splitId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function supaGetSplitsByCreator(address) {
  const { data, error } = await supabase
    .from('splits')
    .select('*')
    .eq('creator', address)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function supaGetStats() {
  const { data, error } = await supabase.from('splits').select('*');
  if (error) throw error;
  const splits = data || [];
  return buildStats(splits);
}

// --- In-memory fallback functions ---

function memGetSplits({ status, category, limit = 50, offset = 0 } = {}) {
  let splits = globalThis.__splitStore;
  if (status) splits = splits.filter((s) => s.status === status);
  if (category) splits = splits.filter((s) => (s.category || 'other') === category);
  return splits.slice(offset, offset + limit);
}

function memGetSplit(splitId) {
  return globalThis.__splitStore.find((s) => s.split_id === splitId) || null;
}

function memAddSplit(split) {
  globalThis.__splitStore.unshift(split);
  return split;
}

function memUpdateSplit(splitId, updates) {
  const idx = globalThis.__splitStore.findIndex((s) => s.split_id === splitId);
  if (idx === -1) return null;
  globalThis.__splitStore[idx] = { ...globalThis.__splitStore[idx], ...updates };
  return globalThis.__splitStore[idx];
}

function memGetSplitsByCreator(address) {
  return globalThis.__splitStore.filter((s) => s.creator === address);
}

function memGetStats() {
  return buildStats(globalThis.__splitStore);
}

// --- Shared stats builder ---

function buildStats(splits) {
  const totalVolume = splits.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const activeSplits = splits.filter((s) => s.status === 'active').length;
  const settledSplits = splits.filter((s) => s.status === 'settled').length;
  const categories = {};
  splits.forEach((s) => {
    const cat = s.category || 'other';
    categories[cat] = (categories[cat] || 0) + 1;
  });
  return {
    total_splits: splits.length,
    active_splits: activeSplits,
    settled_splits: settledSplits,
    total_volume: totalVolume,
    categories,
  };
}

// --- Exports: use Supabase if available, else in-memory ---

export const useSupabase = !!supabase;

export async function getSplits(opts) {
  return supabase ? supaGetSplits(opts) : memGetSplits(opts);
}

export async function getSplit(splitId) {
  return supabase ? supaGetSplit(splitId) : memGetSplit(splitId);
}

export async function addSplit(split) {
  return supabase ? supaAddSplit(split) : memAddSplit(split);
}

export async function updateSplit(splitId, updates) {
  return supabase ? supaUpdateSplit(splitId, updates) : memUpdateSplit(splitId, updates);
}

export async function getSplitsByCreator(address) {
  return supabase ? supaGetSplitsByCreator(address) : memGetSplitsByCreator(address);
}

export async function getStats() {
  return supabase ? supaGetStats() : memGetStats();
}
