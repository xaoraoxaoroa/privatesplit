import { getSplit } from '../../_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { splitId, type } = req.query;

  if (type !== 'payer' && type !== 'creator') {
    return res.status(400).json({ error: 'Type must be "payer" or "creator"' });
  }

  try {
    const split = await getSplit(splitId);
    if (!split) return res.status(404).json({ error: 'Split not found' });

    const receipt = {
      type,
      split_id: split.split_id,
      amount: split.total_amount,
      per_person: split.per_person,
      creator: split.creator,
      participant_count: split.participant_count,
      category: split.category || 'other',
      token_type: split.token_type || 'credits',
      status: split.status,
      created_at: split.created_at,
      transaction_id: split.transaction_id || '',
      exported_at: new Date().toISOString(),
    };

    res.json(receipt);
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
