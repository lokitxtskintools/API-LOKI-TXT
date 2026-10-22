export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fileName, contentBase64 } = req.body || {};
    if (!fileName || !contentBase64) {
      return res.status(400).json({ error: 'Missing fileName or contentBase64' });
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo  = process.env.GITHUB_REPO;
    if (!token || !owner || !repo) {
      return res.status(500).json({ error: 'Missing GitHub env vars' });
    }

    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;

    // نجيبو SHA إذا الملف موجود
    let sha = undefined;
    const getRes = await fetch(apiUrl, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'loki-skin-tools' }
    });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'loki-skin-tools'
      },
      body: JSON.stringify({
        message: `update ${fileName}`,
        content: contentBase64,
        ...(sha ? { sha } : {})
      })
    });

    const putData = await putRes.json();
    if (!putRes.ok) {
      return res.status(putRes.status).json({ error: putData.message || 'GitHub error', details: putData });
    }
    return res.status(200).json({ ok: true, commit: putData.commit?.sha });
  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
