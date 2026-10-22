export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fileName, contentBase64 } = req.body;

  if (!fileName || !contentBase64) {
    return res.status(400).json({ error: 'Missing fileName or contentBase64' });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const REPO_OWNER = 'lokitxtskintools';
  const REPO_NAME = 'API-LOKI-TXT';
  const FILE_PATH = fileName; 

  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

  try {
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
