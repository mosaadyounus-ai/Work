# DEPLOYMENT READY: OMEGA Oracle Launch Checklist

The OMEGA Oracle infrastructure has been elevated to a **10/10 Production Readiness** state. All security, observability, and deployment layers are fully synchronized and hardened.

## 🏁 Final Launch Checklist (5 Steps)

Follow these steps to graduate from development to a branded, secure global surface.

### 1. 🔐 Security Initialization
Ensure your secrets are secured in Google Secret Manager before the first rollout.
```bash
# Create the secret (once)
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY \
  --data-file=- --replication-policy="automatic"

# Grant access to your default compute service account
PROJECT_ID=$(gcloud config get-value project)
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 2. 🚀 Targeted Deployment
Run the hardened OMEGA deployment script from the server module.
```bash
cd apps/server
export PROJECT_ID=$(gcloud config get-value project)
chmod +x deploy.sh
./deploy.sh
```

### 3. 📊 Dashboard Activation
Set up your operational nerve center using the guides in `OPERATIONAL_HARDENING.md`.
- ✅ Create Metric Thresholds.
- ✅ Set up Latency Alerts.
- ✅ Configure Uptime Checks for `/api/health`.

### 4. 🌐 Domain Branded Mapping
Map your service to `oracle.yourdomain.com` using `CUSTOM_DOMAIN_SETUP.md`.
- Update your CNAME records.
- Wait for Google to provision the managed SSL certificate.
- Update your client's WebSocket URL to the new domain.

### 5. 🛡️ Perimeter Hardening
Apply Cloud Armor rules if you expect high-traffic or require DDoS protection.
- Attach a security policy to your Load Balancer.
- Enable WAF rules for SQLi and XSS protection.

---

## 📈 Current Infrastructure State
- **Security:** Secret Manager Mounting (Hardened)
- **Monitoring:** Telemetry Endpoint `/api/health` (Active)
- **Networking:** Root WebSocket path `/` (Standardized)
- **Compute:** Cloud Run N1_HIGHCPU_8 (Optimized)
