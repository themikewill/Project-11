export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    return res.status(500).json({ error: 'KV not configured' });
  }

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  try {
    // GET /api/data?key=xxx  — read a key
    if (req.method === 'GET') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key required' });
      const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers });
      const data = await r.json();
      return res.status(200).json({ value: data.result });
    }

    // POST /api/data  { key, value }  — write a key
    if (req.method === 'POST') {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: 'key required' });
      const r = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(value)
      });
      const data = await r.json();
      return res.status(200).json({ ok: data.result === 'OK' });
    }

    // DELETE /api/data?key=xxx  — delete a key
    if (req.method === 'DELETE') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key required' });
      await fetch(`${url}/del/${encodeURIComponent(key)}`, { method: 'POST', headers });
      return res.status(200).json({ ok: true });
    }

    // POST /api/data/keys  { keys: [...] }  — bulk read
    if (req.method === 'POST' && req.url.includes('/keys')) {
      const { keys } = req.body;
      const results = {};
      for (const key of keys) {
        const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers });
        const data = await r.json();
        results[key] = data.result;
      }
      return res.status(200).json(results);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
