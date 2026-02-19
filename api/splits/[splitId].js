import { getSplit, updateSplit } from '../_store.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const { splitId } = req.query;

  try {
    if (req.method === 'GET') {
      const split = await getSplit(splitId);
      if (!split) return res.status(404).json({ error: 'Not found' });
      return res.json(split);
    }

    if (req.method === 'PATCH') {
      const updates = {};
      if (req.body.status) updates.status = req.body.status;
      if (req.body.payment_count !== undefined) updates.payment_count = Number(req.body.payment_count);
      if (req.body.issued_count !== undefined) updates.issued_count = Number(req.body.issued_count);
      const updated = await updateSplit(splitId, updates);
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json(updated);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
