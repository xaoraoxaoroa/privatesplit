import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import { encrypt, decrypt } from './encryption.js';
import 'dotenv/config';

// Validate required environment variables at startup
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('FATAL: Missing required environment variables SUPABASE_URL and/or SUPABASE_KEY');
  console.error('Copy .env.example to .env and fill in your Supabase credentials');
  process.exit(1);
}

if (!process.env.ENCRYPTION_KEY) {
  console.error('FATAL: Missing ENCRYPTION_KEY environment variable');
  console.error('Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

const PORT = process.env.PORT || 3001;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'privatesplit-backend', version: '2.0.0' });
});

// Get all splits (paginated)
app.get('/api/splits', async (req, res) => {
  try {
    const { status, category, token_type, limit = 50, offset = 0 } = req.query;
    let query = supabase
      .from('splits')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);
    if (token_type) query = query.eq('token_type', token_type);

    const { data, error } = await query;
    if (error) throw error;

    const decrypted = (data || []).map(decryptSplit);
    res.json(decrypted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get splits by creator
app.get('/api/splits/creator/:address', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('splits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Filter in-memory since encrypted addresses can't be queried
    const filtered = (data || [])
      .map(decryptSplit)
      .filter((s) => s.creator === req.params.address);

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent splits
app.get('/api/splits/recent', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('splits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    res.json((data || []).map(decryptSplit));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get network stats
app.get('/api/stats', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('splits')
      .select('*');

    if (error) throw error;

    const splits = (data || []).map(decryptSplit);
    const active = splits.filter((s) => s.status === 'active').length;
    const settled = splits.filter((s) => s.status === 'settled').length;
    const totalVolume = splits.reduce((sum, s) => sum + (Number(s.total_amount) || 0), 0);
    const totalPayments = splits.reduce((sum, s) => sum + (s.payment_count || 0), 0);
    const totalParticipants = splits.reduce((sum, s) => sum + (s.participant_count || 0), 0);

    // Category breakdown
    const categories = {};
    for (const s of splits) {
      const cat = s.category || 'other';
      if (!categories[cat]) categories[cat] = { count: 0, volume: 0 };
      categories[cat].count++;
      categories[cat].volume += Number(s.total_amount) || 0;
    }

    // Daily activity (last 10 days)
    const daily = {};
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      daily[key] = 0;
    }
    for (const s of splits) {
      const key = new Date(s.created_at).toISOString().split('T')[0];
      if (key in daily) daily[key]++;
    }

    res.json({
      total_splits: splits.length,
      active,
      settled,
      total_volume: totalVolume,
      total_payments: totalPayments,
      total_participants: totalParticipants,
      categories,
      daily_activity: Object.entries(daily).map(([date, count]) => ({ date, count })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single split
app.get('/api/splits/:splitId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('splits')
      .select('*')
      .eq('split_id', req.params.splitId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });

    res.json(decryptSplit(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create split
app.post('/api/splits', async (req, res) => {
  try {
    const {
      split_id,
      creator,
      total_amount,
      per_person,
      participant_count,
      salt,
      description,
      category,
      expiry_hours,
      token_type,
      transaction_id,
      participants,
    } = req.body;

    const record = {
      split_id,
      creator: encrypt(creator),
      total_amount: encrypt(String(total_amount)),
      per_person: encrypt(String(per_person)),
      participant_count,
      salt,
      description: description || '',
      category: category || 'other',
      expiry_hours: expiry_hours || 0,
      token_type: token_type || 'credits',
      status: 'active',
      payment_count: 0,
      transaction_id: transaction_id || '',
      participants: (participants || []).map((addr) => encrypt(addr)),
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('splits')
      .insert(record)
      .select()
      .single();

    if (error) throw error;
    res.json(decryptSplit(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update split
app.patch('/api/splits/:splitId', async (req, res) => {
  try {
    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.payment_count !== undefined) updates.payment_count = req.body.payment_count;
    if (req.body.issued_count !== undefined) updates.issued_count = req.body.issued_count;

    const { data, error } = await supabase
      .from('splits')
      .update(updates)
      .eq('split_id', req.params.splitId)
      .select()
      .single();

    if (error) throw error;
    res.json(decryptSplit(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export receipt
app.get('/api/receipt/:splitId/:type', async (req, res) => {
  try {
    const { splitId, type } = req.params;
    const { data, error } = await supabase
      .from('splits')
      .select('*')
      .eq('split_id', splitId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Split not found' });

    const split = decryptSplit(data);

    const receipt = {
      type: type === 'creator' ? 'creator' : 'payer',
      split_id: split.split_id,
      description: split.description,
      category: split.category,
      amount: split.per_person,
      total_amount: split.total_amount,
      participant_count: split.participant_count,
      token_type: split.token_type || 'credits',
      status: split.status,
      created_at: split.created_at,
      transaction_id: split.transaction_id,
      verification_url: `https://testnet.explorer.provable.com/program/private_split_v1.aleo`,
      exported_at: new Date().toISOString(),
      note: 'This receipt was generated from on-chain data. Verify on the Aleo explorer.',
    };

    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function decryptSplit(row) {
  if (!row) return row;
  const tryDecrypt = (val) => {
    if (!val) return val;
    try { return decrypt(String(val)); } catch { return val; }
  };
  return {
    ...row,
    creator: tryDecrypt(row.creator),
    total_amount: parseInt(tryDecrypt(row.total_amount)) || row.total_amount,
    per_person: parseInt(tryDecrypt(row.per_person)) || row.per_person,
    participants: Array.isArray(row.participants)
      ? row.participants.map((p) => (typeof p === 'string' ? tryDecrypt(p) : p))
      : [],
  };
}

app.listen(PORT, () => {
  console.log(`PrivateSplit backend v2 running on port ${PORT}`);
});
