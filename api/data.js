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
      // Parse body manually in case Vercel hasn't done it
      let body = req.body;
      if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch(e) {}
      }
      if (!body || typeof body !== 'object') {
        // Try reading raw body
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const raw = Buffer.concat(chunks).toString();
        try { body = JSON.parse(raw); } catch(e) { body = {}; }
      }

      const { key, value } = body;
      if (!key) return res.status(400).json({ error: 'key required', body: JSON.stringify(body).substring(0,100) });
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      const r = await fetch(`${url}/set/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: auth,
        body: val
      });
      const data = await r.json();
      return res.status(200).json({ ok: data.result === 'OK', raw: data });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
