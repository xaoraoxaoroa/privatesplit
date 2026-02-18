import { getSplits } from '../../_store.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { address } = req.query;
  const splits = getSplits().filter((s) => s.creator === address);
  res.json(splits);
}
