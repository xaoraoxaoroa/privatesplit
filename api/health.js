import { useSupabase } from './_store.js';

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'ok',
    service: 'privatesplit-api',
    mode: 'serverless',
    storage: useSupabase ? 'supabase' : 'in-memory',
  });
}
