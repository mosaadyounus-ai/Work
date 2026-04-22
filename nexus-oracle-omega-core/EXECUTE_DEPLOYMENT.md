# EXECUTE DEPLOYMENT: OMEGA Oracle Launch Paths

This guide defines the three supported paths for deploying the OMEGA Oracle lattice.

---

## ⚡ Path A: Automated Speed-Run (Recommended)
**Target:** Fast, reliable production rollout.
**Time:** 10 minutes.

```bash
# Set credentials
export PROJECT_ID="your-project-id"
export GEMINI_API_KEY="your-api-key"

# Verify and Launch
chmod +x verify-deployment.sh deploy-omega.sh
./verify-deployment.sh && ./deploy-omega.sh
```

---

## 🛠️ Path B: Granular Manual Control
**Target:** Maximum visibility into each layer.
**Time:** 20 minutes.

### 1. Enable Required APIs
```bash
gcloud services enable \
  run.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com
```

### 2. Configure Secrets
Reference `SECURITY_COMPLIANCE.md` for full instructions.
```bash
echo -n "key-content" | gcloud secrets create GEMINI_API_KEY --data-file=-
```

### 3. Deploy Cloud Run
```bash
cd apps/server
./deploy.sh
```

---

## 🤖 Path C: Continuous Delivery (GitOps)
**Target:** Automatic deployment on every commit to `main`.
**Time:** 15 minutes (Setup).

1. **Connect Repository:** Go to Cloud Build in Google Cloud console and connect your GitHub repository.
2. **Create Trigger:** Point the trigger to the `cloudbuild.yaml` in the repository root.
3. **Grant Permissions:** Ensure the Cloud Build service account has `roles/run.admin` and `roles/iam.serviceAccountUser` on the compute service account.

---

## 🔍 Verification Checklist

| Metric | Goal | Method |
| :--- | :--- | :--- |
| **Server Response** | HTTP 200 | `curl [URL]/api/health` |
| **WebSocket** | 101 Switching Protocols | Browser Console |
| **Secret Mount** | Success | Log `[OMEGA_CORE] WebSocket upgrade listener attached` |
| **Telemetry** | Active | JSON payload in `/api/health` contains memory metrics |
