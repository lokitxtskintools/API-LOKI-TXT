export default async function handler(req, res) {
  // إعدادات GitHub
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'lokitxtskintools';
  const REPO_NAME = 'API-LOKI-TXT';

  // 1. قراءة الملفات (GET)
  if (req.method === 'GET') {
    const { file } = req.query;
    if (!file) {
      return res.status(400).json({ error: 'Missing file parameter' });
    }

    const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${file}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'LokiSkinTools'
        }
      });

      if (!response.ok) {
        return res.status(404).json({ error: 'File not found' });
      }

      const text = await response.text();
      return res.status(200).send(text);

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 2. كتابة/تحديث الملفات (POST)
  if (req.method === 'POST') {
    const { fileName, contentBase64 } = req.body;

    if (!fileName || !contentBase64) {
      return res.status(400).json({ error: 'Missing fileName or contentBase64' });
    }

    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${fileName}`;

    try {
      // نجيبو الـ SHA ديال الملف إلا كان كاين
      let sha = null;
      const getResponse = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'User-Agent': 'LokiSkinTools'
        }
      });

      if (getResponse.ok) {
        const data = await getResponse.json();
        sha = data.sha;
      }

      // نرفعو الملف
      const body = {
        message: `Update ${fileName}`,
        content: contentBase64,
        branch: 'main'
      };

      if (sha) {
        body.sha = sha;
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'User-Agent': 'LokiSkinTools'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        return res.status(200).json({ success: true, url: data.content.download_url });
      } else {
        return res.status(response.status).json({ error: data.message });
      }

    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // إلا كان شي طلب آخر
  return res.status(405).json({ error: 'Method not allowed' });
}
