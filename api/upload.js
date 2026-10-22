export default async function handler(req, res) {
  // 1. التأكد من أن الطلب هو POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 2. استقبال البيانات من التطبيق
    const { fileName, contentBase64 } = req.body || {};
    if (!fileName || !contentBase64) {
      return res.status(400).json({ error: 'Missing fileName or contentBase64' });
    }

    // 3. جلب المتغيرات السرية من Vercel
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo  = process.env.GITHUB_REPO;
    
    if (!token || !owner || !repo) {
      return res.status(500).json({ error: 'Missing GitHub env vars in Vercel settings' });
    }

    // 4. رابط GitHub API
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;

    // 5. البحث عن SHA ديال الملف (ضروري إلا كان الملف كاين باش نقدرو نعدلوه)
    let sha = undefined;
    const getRes = await fetch(apiUrl, {
      headers: { 
        Authorization: `Bearer ${token}`, 
        'User-Agent': 'loki-skin-tools' 
      }
    });
    
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }

    // 6. إرسال البيانات الجديدة لـ GitHub (إنشاء أو تعديل)
    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'loki-skin-tools'
      },
      body: JSON.stringify({
        message: `Update ${fileName} from App`,
        content: contentBase64,
        ...(sha ? { sha } : {}) // كيزيد الـ SHA غير إلا كان الملف موجود
      })
    });

    const putData = await putRes.json();
    
    if (!putRes.ok) {
      return res.status(putRes.status).json({ error: putData.message || 'GitHub error', details: putData });
    }
    
    // 7. نجاح العملية
    return res.status(200).json({ ok: true, commit: putData.commit?.sha });

  } catch (e) {
    return res.status(500).json({ error: e.message, stack: e.stack });
  }
}
