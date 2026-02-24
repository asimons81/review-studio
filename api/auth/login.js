const { authCookieHeader, hasPasswordConfigured, makeCookieValue, validatePassword } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!hasPasswordConfigured()) {
    return res.status(500).json({ error: 'Server auth is not configured' });
  }

  const candidate = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!validatePassword(candidate)) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.setHeader('Set-Cookie', authCookieHeader(makeCookieValue()));
  return res.status(200).json({ ok: true });
};
