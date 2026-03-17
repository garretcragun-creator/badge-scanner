# Stat Badge Scanner

Scan conference badges, extract contact info with AI, create HubSpot contacts, and book meetings — all from your phone.

## Deploy to Railway

### 1. Create a HubSpot OAuth App

1. Go to [HubSpot Developer](https://developers.hubspot.com/) → your app → **Auth**
2. Set the redirect URL to: `https://your-app.up.railway.app/auth/callback`
3. Required scopes: `crm.objects.contacts.write`, `crm.objects.contacts.read`, `oauth`
4. Copy the **Client ID** and **Client Secret**

### 2. Deploy to Railway

1. Push this folder to a GitHub repo (or use `railway init` + `railway up`)
2. In Railway, add these environment variables:

| Variable | Description |
|---|---|
| `HUBSPOT_CLIENT_ID` | From your HubSpot app |
| `HUBSPOT_CLIENT_SECRET` | From your HubSpot app |
| `BASE_URL` | Your Railway URL, e.g. `https://your-app.up.railway.app` |
| `WEBHOOK_URL` | Your hapily event webhook endpoint |
| `MEETING_LINK` | Your HubSpot meeting link, e.g. `https://meetings.hubspot.com/your-name` |

3. Railway will auto-detect Node.js, run `npm install`, and start the server.

### 3. Update the HubSpot redirect URL

Once Railway gives you a URL, update the redirect URL in your HubSpot app settings to:
```
https://your-railway-url.up.railway.app/auth/callback
```

### 4. Share with your team

Send your team the Railway URL or print a QR code. They sign in with HubSpot, and the app sets the contact owner based on who's logged in.

## How It Works

1. **Sign in** → HubSpot OAuth identifies the team member
2. **Scan** → Take a photo or upload a badge image
3. **OCR** → Claude Vision extracts name, email, company, title
4. **Review** → Edit fields, add notes (typed or voice)
5. **Submit** → Creates/updates HubSpot contact with owner set, fires webhook, opens meeting booking link pre-filled with contact info

## Architecture

```
├── server.js           # Express backend (OAuth, HubSpot API, webhook proxy)
├── public/index.html   # Full client app (React via CDN, no build step)
├── package.json
├── .env.example
└── README.md
```

- **No build step required** — the client is a single HTML file
- **OCR** calls the Anthropic API directly from the client
- **HubSpot API** calls go through the Express backend (keeps tokens secure)
- **Webhook** is proxied through the backend (keeps URL private)
