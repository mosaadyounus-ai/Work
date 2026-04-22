# Custom Domain Setup Guide - OMEGA Oracle

This guide provides step-by-step instructions for mapping your Cloud Run service (`omega-oracle`) to a branded custom domain (e.g., `oracle.yourdomain.com`).

## 📋 Prerequisites
- A deployed Cloud Run service.
- Access to your domain registrar (DNS settings).

## 🛠️ Phase 1: Cloud Run Configuration
1. Go to the **Google Cloud Console**.
2. Navigate to **Cloud Run** and select the `omega-oracle` service.
3. Click **Manage Custom Domains**.
4. Click **Add Mapping**.
5. Select the domain (you may need to verify ownership via Google Search Console first).
6. Enter the subdomain (e.g., `oracle`).

## 🌍 Phase 2: DNS Provider Configuration

### Google Domains
1. Go to your domain's **DNS settings**.
2. Add a **Custom Resource Record**:
   - **Name:** `oracle`
   - **Type:** `CNAME`
   - **TTL:** `3600`
   - **Data:** `ghs.googlehosted.com.`

### AWS Route 53
1. Go to your **Hosted Zone**.
2. Click **Create Record**.
   - **Record name:** `oracle`
   - **Record type:** `CNAME`
   - **Value:** `ghs.googlehosted.com`
   - **TTL:** `300` (Standard)

### Namecheap / GoDaddy / Other Registrars
- **Type:** `CNAME`
- **Host:** `oracle`
- **Value:** `ghs.googlehosted.com`

## 🧪 Phase 3: Verification
Once the DNS propagates (usually 15-60 minutes):

1. **Check DNS Propagation:**
   ```bash
   dig +short oracle.yourdomain.com
   ```
2. **Verify HTTPS:**
   ```bash
   curl -I https://oracle.yourdomain.com/api/health
   ```
3. **Verify WebSocket:**
   Update your client's WebSocket URL to `wss://oracle.yourdomain.com/` and check browser logs for `[CODEX_WS_CONNECTED]`.

## ⚠️ Troubleshooting
- **Handshake Failed (1006):** Ensure No path suffix is used (use `/` not `/ws`).
- **SSL Certificate Pending:** Google can take up to 24 hours to provision the certificate once DNS is verified.
