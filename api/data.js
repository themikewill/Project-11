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
    // GET /api/data?key=xxx
    if (req.method === 'GET') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key required' });
      const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers });
      const data = await r.json();
      return res.status(200).json({ value: data.result });
    }

    // POST /api/data  { key, value }
    if (req.method === 'POST') {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ error: 'key required' });
      // Upstash REST: POST /set with ["key","value"] array body
      const r = await fetch(`${url}/set`, {
        method: 'POST',
        headers,
        body: JSON.stringify([key, typeof value === 'string' ? value : JSON.stringify(value)])
      });
      const data = await r.json();
      return res.status(200).json({ ok: data.result === 'OK' });
    }

    // DELETE /api/data?key=xxx
    if (req.method === 'DELETE') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key required' });
      await fetch(`${url}/del`, {
        method: 'POST',
        headers,
        body: JSON.stringify([key])
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
