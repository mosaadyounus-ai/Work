# Custom Domain Setup for OMEGA Oracle

This guide takes you from a generic `*.run.app` Cloud Run URL to a branded domain like `https://nexus-oracle-omega-core.vercel.app/`.

---

## Prerequisites

- Active Google Cloud project with OMEGA deployed to Cloud Run
- Domain registered (e.g., via Google Domains, Route 53, Namecheap, etc.)
- Access to your domain registrar's DNS settings
- `gcloud` CLI configured locally

---

## Step 1: Verify Domain Ownership in Cloud Run

### 1a. Get Your Current Cloud Run URL

```bash
gcloud run services describe omega-server \
  --region us-west1 \
  --format='value(status.url)'
```

Example output:
```
https://omega-server-abc123xyz.run.app
```

### 1b. Add Custom Domain in Cloud Run Console

1. Go to **Google Cloud Console** → **Cloud Run** → **Services**
2. Click **omega-server**
3. Click **Manage Custom Domains** (top right)
4. Click **Add Mapping**
5. Enter your desired subdomain:
   - **Subdomain:** `oracle`
   - **Domain:** `yourdomain.com`
   - Full URL: `oracle.yourdomain.com`
6. Click **Continue**

You'll now see a **DNS verification record** (a TXT record). Leave this tab open.

---

## Step 2: Update DNS Records

Your DNS provider will vary, but the process is similar for all. We need to:
1. **Verify domain ownership** (TXT record)
2. **Route traffic to Cloud Run** (CNAME record)

### For Google Domains:

1. Go to [https://domains.google.com](https://domains.google.com)
2. Click your domain → **DNS**
3. Scroll to **Custom Records** section

**Add TXT Record (Verification):**
- **Name:** `_acme-challenge.oracle` (or as shown in Cloud Run)
- **Type:** `TXT`
- **TTL:** `3600`
- **Data:** `[ verification-token-from-cloud-run ]` (copy from the Cloud Run console)
- Click **Create**

**Add CNAME Record (Traffic Routing):**
- **Name:** `oracle`
- **Type:** `CNAME`
- **TTL:** `3600`
- **Data:** `ghs.googleusercontent.com.` (or the exact value provided by Cloud Run)
- Click **Create**

### For Route 53 (AWS):

1. Go to **Route 53** → **Hosted Zones** → Your domain
2. Click **Create Record**

**Create TXT Record:**
- **Record Name:** `_acme-challenge.oracle.yourdomain.com`
- **Record Type:** `TXT`
- **Value:** `"[ verification-token-from-cloud-run ]"`
- Click **Create records**

**Create CNAME Record:**
- **Record Name:** `oracle.yourdomain.com`
- **Record Type:** `CNAME`
- **Value:** `ghs.googleusercontent.com.` (or Cloud Run's value)
- Click **Create records**

### For Namecheap, GoDaddy, Bluehost, etc.:

1. Log in to your registrar
2. Find **DNS Management** or **Advanced DNS** settings
3. Add records with the same names/values as above
4. Save changes

**Note:** DNS propagation can take 5–30 minutes. If verification fails, wait and retry.

---

## Step 3: Complete Domain Verification in Cloud Run

1. Return to the **Cloud Run Console** → **Add Mapping** page
2. Click **Verify Domain** (or wait for automatic verification)
3. Once verified, the status will show **✓ Verified**
4. Click **Add** to complete the mapping

---

## Step 4: Verify HTTPS/WSS is Working

### Test HTTPS Connection:

```bash
curl -i https://oracle.yourdomain.com/
```

Expected: `301 Redirect to https://...` or `200 OK`

### Test WebSocket Connection:

```bash
# Replace with your actual domain
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Origin: https://oracle.yourdomain.com" \
  https://oracle.yourdomain.com/
```

Expected response:
```
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
```

If you see `400 Bad Request`, the WebSocket path may not be exposed correctly. Check the server logs:

```bash
gcloud run logs read omega-server --region us-west1 --limit 50
```

---

## Step 5: Update Client WebSocket URL

Once your custom domain is live, update your client connection:

### In `apps/web` Environment Variables:

```bash
# .env.local or .env.production
NEXT_PUBLIC_WS_URL=wss://oracle.yourdomain.com
```

### Or hardcode in client:

In `apps/web/src/hooks/useLatticeSync.ts` or connection logic:

```typescript
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://oracle.yourdomain.com';
const socket = new WebSocket(wsUrl);
```

### Or in Cloud Run deployment:

If you want the client to auto-discover:

```bash
gcloud run deploy omega-server \
  --update-env-vars NEXT_PUBLIC_WS_URL=wss://oracle.yourdomain.com \
  --region us-west1
```

---

## Step 6: Enable Automatic HTTPS Renewal

Google Cloud Run handles SSL/TLS certificates automatically via Google-managed certificates. No action needed—renewal is handled transparently.

To verify certificate status:

```bash
gcloud run services describe omega-server \
  --region us-west1 \
  --format='value(status.addresses[0].url)'
```

---

## Troubleshooting

### ❌ "Domain not verified" after 30 minutes

**Cause:** DNS records may not have propagated.

**Fix:**
1. Check DNS propagation: [https://mxtoolbox.com/mxlookup.aspx](https://mxtoolbox.com/mxlookup.aspx)
2. Verify TXT and CNAME records are correct
3. Wait another 10–15 minutes and retry verification

### ❌ WebSocket connection fails (101 not received)

**Cause:** Server not handling WebSocket upgrades at root path `/`.

**Fix:**
1. Check server logs for errors:
   ```bash
   gcloud run logs read omega-server --region us-west1
   ```
2. Verify `server.ts` has WebSocket upgrade handler:
   ```typescript
   server.on('upgrade', (req, socket, head) => {
     wss.handleUpgrade(req, socket, head, (ws) => {
       wss.emit('connection', ws, req);
     });
   });
   ```
3. Re-deploy if needed:
   ```bash
   cd /workspaces/Work-
   ./apps/server/deploy.sh
   ```

### ❌ CNAME record conflicts

**Cause:** You may have an A or AAAA record for the same subdomain.

**Fix:**
1. Delete any A/AAAA records for `oracle.yourdomain.com`
2. Keep only the CNAME record
3. Wait 5 minutes and refresh

### ❌ Site shows "default" or generic error page

**Cause:** Cloud Run service may need time to refresh or DNS is still propagating.

**Fix:**
1. Clear browser cache: `Ctrl+Shift+Delete`
2. Try incognito window
3. Wait 5 more minutes

---

## Optional: Enable Custom Domain for Web Client

If you're also hosting the web client on a separate domain:

1. Deploy `apps/web` to Vercel or Firebase Hosting
2. Point your web domain (e.g., `app.yourdomain.com`) to your hosting provider
3. Set `NEXT_PUBLIC_WS_URL=wss://oracle.yourdomain.com` in your web deployment

---

## Next Steps (Advanced)

Once your custom domain is live, you can:

- **Add Global Load Balancer** — Route across multiple regions for <100ms latency worldwide
- **Enable CDN** — Cache static assets at Google's edge locations
- **Set up multi-region failover** — Auto-switch if us-west1 goes down
- **Monitor domain health** — Set up alerts for SSL certificate expiration, uptime

Would you like me to prepare any of these configurations?

---

## Quick Reference

| Step | Command |
|------|---------|
| Get current Cloud Run URL | `gcloud run services describe omega-server --region us-west1 --format='value(status.url)'` |
| Test HTTPS | `curl -i https://oracle.yourdomain.com/` |
| Test WebSocket | `curl -i -N -H "Upgrade: websocket" -H "Connection: Upgrade" https://oracle.yourdomain.com/` |
| View logs | `gcloud run logs read omega-server --region us-west1 --limit 50` |
| Verify domain TTL | `nslookup oracle.yourdomain.com` |
