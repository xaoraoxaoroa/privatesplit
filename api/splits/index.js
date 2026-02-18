import { getSplits, addSplit } from '../_store.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { status, limit = 50, offset = 0 } = req.query;
    let splits = getSplits();
    if (status) splits = splits.filter((s) => s.status === status);
    return res.json(splits.slice(Number(offset), Number(offset) + Number(limit)));
  }

  if (req.method === 'POST') {
    const body = req.body;
    const split = {
      split_id: body.split_id,
      creator: body.creator,
      total_amount: body.total_amount,
      per_person: body.per_person,
      participant_count: body.participant_count,
      issued_count: 0,
      salt: body.salt,
      description: body.description || '',
      status: 'active',
      payment_count: 0,
      transaction_id: body.transaction_id || '',
      participants: body.participants || [],
      created_at: new Date().toISOString(),
    };
    addSplit(split);
    return res.json(split);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
