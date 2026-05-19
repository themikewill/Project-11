export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'KV not configured' });
  }

  const auth = { 'Authorization': `Bearer ${token}` };

  try {
    if (req.method === 'GET') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key required' });
      const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers: auth });
      const data = await r.json();
      return res.status(200).json({ value: data.result ?? null });
    }

    if (req.method === 'POST') {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: 'key required' });
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      // Simplest Upstash REST write: GET-style URL with value in path
      const r = await fetch(`${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(val)}`, {
        method: 'GET',
        headers: auth
      });
      const data = await r.json();
      return res.status(200).json({ ok: data.result === 'OK', raw: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
