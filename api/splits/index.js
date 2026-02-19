import { getSplits, addSplit } from '../_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const { status, category, limit = 50, offset = 0 } = req.query;
      const splits = await getSplits({ status, category, limit: Number(limit), offset: Number(offset) });
      return res.json(splits);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body.split_id || !body.creator || !body.total_amount || !body.participant_count) {
        return res.status(400).json({ error: 'Missing required fields: split_id, creator, total_amount, participant_count' });
      }
      if (Number(body.total_amount) <= 0) {
        return res.status(400).json({ error: 'total_amount must be positive' });
      }
      const split = {
        split_id: body.split_id,
        creator: body.creator,
        total_amount: Number(body.total_amount),
        per_person: Number(body.per_person) || 0,
        participant_count: Number(body.participant_count),
        issued_count: 0,
        salt: body.salt || '',
        description: body.description || '',
        category: body.category || 'other',
        expiry_hours: Number(body.expiry_hours) || 0,
        token_type: body.token_type || 'credits',
        status: 'active',
        payment_count: 0,
        transaction_id: body.transaction_id || '',
        participants: body.participants || [],
        created_at: new Date().toISOString(),
      };
      const result = await addSplit(split);
      return res.status(201).json(result);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
