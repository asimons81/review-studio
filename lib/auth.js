const crypto = require('node:crypto');

const COOKIE_NAME = 'caption_auth';

function secret() {
  return process.env.AUTH_SECRET || process.env.CAPTION_AUTH_SECRET || 'change-me-in-production';
}

function password() {
  return process.env.APP_PASSWORD || process.env.CAPTION_APP_PASSWORD || process.env.CAPTION_PASSWORD || '';
}

function hasPasswordConfigured() {
  return Boolean(password());
}

function validatePassword(candidate) {
  const configured = password();
  if (!configured) return false;
  const a = Buffer.from(candidate || '');
  const b = Buffer.from(configured);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function sign(value) {
  return crypto.createHmac('sha256', secret()).update(value).digest('hex');
}

function makeCookieValue() {
  const base = `ok.${Math.floor(Date.now() / 1000)}`;
  return `${base}.${sign(base)}`;
}

function isValidCookie(value) {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 3) return false;
  const [prefix, ts, signature] = parts;
  if (prefix !== 'ok' || !/^\d+$/.test(ts)) return false;
  const base = `${prefix}.${ts}`;
  return sign(base) === signature;
}

function parseCookieHeader(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.indexOf('=');
        if (idx === -1) return [pair, ''];
        return [pair.slice(0, idx), decodeURIComponent(pair.slice(idx + 1))];
      })
  );
}

function authCookieHeader(value) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=2592000`;
}

function clearAuthCookieHeader() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`;
}

function getAuthCookieName() {
  return COOKIE_NAME;
}

module.exports = {
  hasPasswordConfigured,
  validatePassword,
  makeCookieValue,
  isValidCookie,
  parseCookieHeader,
  authCookieHeader,
  clearAuthCookieHeader,
  getAuthCookieName
};
