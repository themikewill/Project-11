export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  // Debug: show what we have
  if (req.method === 'GET' && req.query.debug === '1') {
    return res.status(200).json({
      hasUrl: !!url,
      hasToken: !!token,
      url: url || 'missing',
      tokenLen: token ? token.length : 0
    });
  }

  if (!url || !token) {
    return res.status(500).json({ error: 'KV not configured' });
  }

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  try {
    if (req.method === 'GET') {
      const { key } = req.query;
      if (!key) return res.status(400).json({ error: 'key required' });
      const r = await fetch(`${url}/get/${encodeURIComponent(key)}`, { headers });
      const text = await r.text();
      const data = JSON.parse(text);
      return res.status(200).json({ value: data.result ?? null });
    }

    if (req.method === 'POST') {
      const { key, value } = req.body || {};
      if (!key) return res.status(400).json({ error: 'key required' });
      const val = typeof value === 'string' ? value : JSON.stringify(value);
      // Use pipeline format - most reliable
      const r = await fetch(`${url}/pipeline`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify([['SET', key, val]])
      });
      const text = await r.text();
      const data = JSON.parse(text);
      const ok = Array.isArray(data) && data[0]?.result === 'OK';
      return res.status(200).json({ ok, raw: data, status: r.status });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
