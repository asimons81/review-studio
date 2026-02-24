const { getAuthCookieName, isValidCookie, parseCookieHeader } = require('../../lib/auth');

module.exports = async function handler(req, res) {
  const cookies = parseCookieHeader(req.headers.cookie || '');
  const ok = isValidCookie(cookies[getAuthCookieName()]);
  if (!ok) return res.status(401).json({ authenticated: false });
  return res.status(200).json({ authenticated: true });
};
