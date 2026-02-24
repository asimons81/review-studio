const { getAuthCookieName, isValidCookie, parseCookieHeader } = require('../../lib/auth');

const FALLBACK_SUGGESTIONS = {
  tech: [
    'How does it compare to alternatives at this price?',
    'Did setup feel smooth or annoying?',
    'What feature surprised you most?'
  ],
  audio: [
    'How does it sound at low vs high volume?',
    'Is comfort good after 2+ hours?',
    'Any issues with latency or call quality?'
  ],
  gaming: [
    'How does it hold up in demanding games?',
    'Does it feel responsive for competitive play?',
    'What compromises did you notice?'
  ],
  other: [
    'What problem does it solve best?',
    'Who should skip this product?',
    'Would you buy it again?'
  ]
};

function geminiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || '';
}

function geminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-1.5-flash';
}

async function askGemini({ category, productName, features }) {
  const key = geminiKey();
  if (!key) throw new Error('Gemini API key missing');

  const model = geminiModel();
  const prompt = `Generate exactly 6 concise review prompts for a creator writing a product review. Return plain text list, one item per line, no numbering symbols beyond optional emoji.\nCategory: ${category || 'other'}\nProduct: ${productName || 'Unknown'}\nFeatures: ${features || 'None provided'}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`Gemini request failed (${resp.status}): ${errText.slice(0, 200)}`);
  }

  const data = await resp.json();
  const raw = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n') || '';
  const suggestions = raw
    .split('\n')
    .map((line) => line.replace(/^[-*\d.)\s]+/, '').trim())
    .filter(Boolean)
    .slice(0, 6);

  if (!suggestions.length) throw new Error('Gemini returned empty suggestions');
  return suggestions;
}

function fallback(category, productName, features) {
  const base = FALLBACK_SUGGESTIONS[category] || FALLBACK_SUGGESTIONS.other;
  const items = [...base];
  if (productName) items.unshift(`🎯 What immediately stood out about the ${productName}?`);
  const firstFeature = (features || '').split(',').map((x) => x.trim()).filter(Boolean)[0];
  if (firstFeature) items.splice(2, 0, `💡 How well does "${firstFeature}" actually work in real use?`);
  return items.slice(0, 6);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cookies = parseCookieHeader(req.headers.cookie || '');
  if (!isValidCookie(cookies[getAuthCookieName()])) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const category = String(req.body?.category || 'other').toLowerCase();
  const productName = String(req.body?.productName || '').trim();
  const features = String(req.body?.features || '').trim();

  try {
    const suggestions = await askGemini({ category, productName, features });
    return res.status(200).json({ suggestions, provider: 'gemini' });
  } catch (error) {
    const suggestions = fallback(category, productName, features);
    return res.status(200).json({ suggestions, provider: 'fallback', warning: error.message });
  }
};
