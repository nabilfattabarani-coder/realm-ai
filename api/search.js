export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  // ...sisanya tetap sama
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Pertanyaan kosong' });
  }

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: query }] }
          ],
          system_instruction: {
            parts: [{
              text: `Kamu adalah Biosinc.ai, mesin pencari AI. Jawab pertanyaan berdasarkan hasil pencarian web terkini secara singkat, jelas, dan faktual dalam Bahasa Indonesia. Jangan pakai markdown seperti ** atau ###, tulis dalam paragraf biasa. Maksimal 5-6 kalimat kecuali pertanyaannya butuh detail lebih.`
            }]
          }
        })
      }
    );

    const data = await geminiRes.json();

    if (!geminiRes.ok) {
      console.error(data);
      return res.status(500).json({ error: 'Gagal memanggil Gemini API', detail: data });
    }

    const candidate = data.candidates?.[0];
    const answer = candidate?.content?.parts?.map(p => p.text).join('') || 'Maaf, tidak ada jawaban.';

    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter(c => c.web)
      .map(c => ({ uri: c.web.uri, title: c.web.title }));

    return res.status(200).json({ answer, sources });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
}
