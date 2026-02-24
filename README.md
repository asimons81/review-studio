# 🎬 Review Studio (Caption Studio)

Private, Gemini-powered review writer for **captions.tonyreviewsthings.com**.

## What changed

- ✅ Rating is now optional (exports never crash)
- ✅ Removed unsafe HTML rendering and inline event handlers
- ✅ Gemini-backed suggestions via secure server endpoint
- ✅ Private login gate for single-user deployment
- ✅ Clipboard copy has fallback + toast notifications
- ✅ Mobile pros/cons layout fixed

## Local run

This app now uses serverless API routes for auth + Gemini.

```bash
# from project root
vercel dev
```

Then open http://localhost:3000

## Environment variables

Set these in `.env.local` (local) and Vercel project env vars (production):

```bash
# Required for login gate
APP_PASSWORD="your-strong-password"

# Required for signed auth cookie
AUTH_SECRET="long-random-secret"

# Gemini key (any one works)
GEMINI_API_KEY="..."
# or GOOGLE_API_KEY="..."
# or GOOGLE_GEMINI_API_KEY="..."

# Optional Gemini model override
GEMINI_MODEL="gemini-1.5-flash"
```

### Env fallback behavior

- API key: `GEMINI_API_KEY` → `GOOGLE_API_KEY` → `GOOGLE_GEMINI_API_KEY`
- App password: `APP_PASSWORD` → `CAPTION_APP_PASSWORD` → `CAPTION_PASSWORD`
- Auth secret: `AUTH_SECRET` → `CAPTION_AUTH_SECRET`

## Deploy to Vercel

1. Import this repo in Vercel.
2. Add env vars above.
3. Deploy.
4. Point `captions.tonyreviewsthings.com` to this Vercel project.

## Security notes

- Suggestions endpoint requires valid auth cookie.
- Login uses constant-time password comparison.
- Auth cookie is `HttpOnly`, `Secure`, `SameSite=Strict`.
- User-provided text is rendered with safe DOM APIs (`textContent`, `createElement`).
- Inline `onclick` handlers were removed.

## API endpoints

- `POST /api/auth/login` — login and set auth cookie
- `GET /api/auth/session` — check auth session
- `POST /api/ai/suggestions` — Gemini suggestions (with graceful fallback)

## QA checklist

- [x] No rating selected → exports as `Rating: Not rated`
- [x] XSS payload in pros/cons appears as text (not executed)
- [x] XSS payload in suggestions appears as text (not executed)
- [x] Mobile layout stacks pros/cons correctly
- [x] Clipboard API failure path shows toast + fallback
- [x] Placeholder category is not exported when unselected

---

Built for Tony Reviews Things.
