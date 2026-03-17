## Project: Stat Badge Scanner

You're picking up a badge scanner web app built for conference/event use. It's a Node.js + Express backend with a single-page HTML/React frontend (no build step). It's ready to deploy on Railway.

### What it does today

1. **Login** — HubSpot OAuth. The Express server handles `/auth/hubspot` (redirect) and `/auth/callback` (token exchange). Session data (access token, owner ID, name) is base64-encoded and passed to the client via URL param.
2. **Scan** — User takes a photo or uploads a badge image via file input (`capture="environment"` for mobile camera).
3. **OCR** — The image is sent to the Anthropic API (Claude Sonnet vision) directly from the browser. It extracts firstname, lastname, email, company, jobtitle as JSON.
4. **Review** — Extracted fields are editable. User can add typed notes or use the Web Speech API for voice notes.
5. **Submit** — Calls `POST /api/contact` on our backend, which creates/updates a HubSpot contact via the HubSpot API (with owner set to whoever is logged in), attaches a note. Then calls `POST /api/webhook` to fire a webhook associating the contact with a hapily event. Then builds a HubSpot meeting link pre-populated with the contact's details.
6. **Done** — Shows success with a "Book Meeting Now" button that opens the meeting link.

### Architecture

```
server.js              — Express backend (OAuth, HubSpot API proxy, webhook proxy, config endpoint)
public/index.html      — Full client app (React 18 via CDN, no JSX, uses createElement)
package.json           — express + node-fetch, no build tooling
.env.example           — Template for required env vars
```

### Environment variables (set in Railway)

- `HUBSPOT_CLIENT_ID` / `HUBSPOT_CLIENT_SECRET` — OAuth app credentials
- `BASE_URL` — Public Railway URL (e.g. https://app.up.railway.app)
- `WEBHOOK_URL` — Hapily event association webhook endpoint
- `MEETING_LINK` — HubSpot meeting booking link
- `PORT` — Auto-set by Railway

### Design

- Light/white theme matching stat.io brand
- Plus Jakarta Sans typography
- Blue gradient primary buttons (#4A7CFF → #6FAAFF)
- Green accent for success states
- Inline SVG logo placeholder (needs real Stat logo swapped in)
- Mobile-first, single-column card layout

### Known TODOs and areas to improve

- **Logo**: The inline SVG is a placeholder. Need to swap in the real Stat logo (either as an imported image asset or an accurate SVG).
- **OCR is client-side**: The Anthropic API call happens in the browser with no API key — this works in Claude.ai artifacts but needs an API key for production. Should move this server-side behind `POST /api/ocr` to keep the key in env vars.
- **Session handling**: Currently just base64 in a URL param, no persistence. Consider adding cookie-based sessions or at minimum storing in sessionStorage so a page refresh doesn't log you out.
- **Token refresh**: We store the HubSpot refresh token but never use it. Should add auto-refresh logic before tokens expire.
- **Error handling**: Minimal. Need better user-facing errors, retry logic, and loading states throughout.
- **No scan history**: Would be great to show a feed of badges scanned in the current session so you can go back and book meetings you skipped.
- **Voice notes**: Uses Web Speech API which is Chrome/Safari only. Should show a graceful fallback or hide the button on unsupported browsers.
- **Meeting link**: Only works if `MEETING_LINK` env var is set. Should handle the case where it's empty more gracefully (hide the button).
- **Webhook payload**: May need to be customized depending on what the hapily event association endpoint expects.
- **No tests**: Zero test coverage.
- **Contact deduplication**: The backend tries to update existing contacts on email conflict, but the logic could be more robust.

### Your first tasks

1. Read through `server.js` and `public/index.html` to understand the codebase.
2. Move the OCR call server-side — create a `POST /api/ocr` endpoint that accepts a base64 image, calls the Anthropic API with the key from `ANTHROPIC_API_KEY` env var, and returns the extracted fields. Update the client to call this instead.
3. Add `ANTHROPIC_API_KEY` to `.env.example`.
4. Add sessionStorage persistence so refreshing the page doesn't lose the login.
5. Then ask me what to work on next.
