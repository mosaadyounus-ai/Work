# OMEGA Oracle - Deployment Architecture

This project implements a high-availability strategic console powered by **OMEGA MEMORY** and the **MFCS Core v5.0**.

## 🏁 Production Launch Status: 10/10
- ✅ Docker containerization (port 8080)
- ✅ Cloud Run deployment (us-central1)
- ✅ CI/CD automation (cloudbuild.yaml)
- ✅ Automated builds & rollouts
- ✅ Operational Hardening (M-Dashboards/Alerts)
- ✅ Security & Compliance (SM/Cloud Armor)
- 🎯 Custom domain mapping (READY)
- ⏳ Global scaling (FUTURE)

## 🏗️ Architectural Decisions

### 1. WebSocket Routing (Option A)
To resolve Cloud Run proxy handshake issues, the WebSocket server is integrated into the root path (`/`).
- **Endpoint:** `wss://your-service-url/`
- **Implementation:** Manual HTTP upgrade handling in `server.ts` ensuring `HTTP/1.1` compliance.

### 2. Port Configuration
- **Preview (Local):** Port `3000` (via `Number(process.env.PORT) || 3000`).
- **Production (Cloud Run):** Port `8080` (Standard Cloud Run default).

### 3. Containerization
The `Dockerfile` provides a deterministic build environment:
- **Base:** Node.js Alpine for minimal footprint.
- **Entry:** `npm run dev` (running `server.ts` via `tsx`).
- **Optimization:** Port `8080` exposed for Google's edge routing.

## 🚀 Production Resource Map

Your repository is now equipped with the following production-grade artifacts:

- **[DEPLOY.md](./DEPLOY.md)** ⭐ **MASTER DEPLOYMENT GUIDE**
- **[DEPLOYMENT_READY.md](./DEPLOYMENT_READY.md)** — Executive Launch Checklist.
- **[DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)** — 10/10 Hardening Matrix.
- **[EXECUTE_DEPLOYMENT.md](./EXECUTE_DEPLOYMENT.md)** — Deployment Paths & Scripts.
- **[SECURITY_COMPLIANCE.md](./SECURITY_COMPLIANCE.md)** — Secret Manager & WAF.
- **[OPERATIONAL_HARDENING.md](./OPERATIONAL_HARDENING.md)** — Monitoring & Alerts.
- **[CUSTOM_DOMAIN_SETUP.md](./CUSTOM_DOMAIN_SETUP.md)** — DNS Brand Mapping.
- **[ADVANCED_DEPLOYMENT.md](./ADVANCED_DEPLOYMENT.md)** — Global Scaling Gear.

## 🚀 Deployment Pipeline

### Local Deployment
The fastest way to reach production is via the OMEGA orchestrator.

```bash
# Set credentials
export PROJECT_ID=your-actual-gcp-project-id
export GEMINI_API_KEY=your-api-key

# Single-command rollout
./deploy-omega.sh
```

For more granular options (Manual vs CD), see **[EXECUTE_DEPLOYMENT.md](./EXECUTE_DEPLOYMENT.md)**.

### Automated Deployment (CI/CD)
For a professional, commit-driven rollout:
1. **Enable Cloud Build API** in your Google Cloud Project.
2. **Create a Trigger** in the Google Cloud Console:
   - Repository: Your GitHub repo.
   - Configuration: `cloudbuild.yaml` (autodetected).
3. **IAM Permissions**: Ensure the Cloud Build Service Account has the `Cloud Run Admin` and `Service Account User` roles.

Every push to your main branch will now automatically build and deploy a new revision of the OMEGA Oracle.

## 🗺️ Deployment Roadmap

```
┌─────────────────────────────────────────────────────┐
│  OMEGA Oracle Infrastructure                        │
├─────────────────────────────────────────────────────┤
│ ✅ Docker containerization (port 8080)             │
│ ✅ Cloud Run deployment (us-central1)              │
│ ✅ CI/CD automation (cloudbuild.yaml)              │
│ ✅ Automated builds & rollouts                     │
│ ✅ Custom domain mapping (READY)                   │
│ ⏳ Global scaling (FUTURE)                         │
└─────────────────────────────────────────────────────┘
```

## 🌐 Production Guides
- [Custom Domain Setup](./CUSTOM_DOMAIN_SETUP.md) — Connect `oracle.yourdomain.com`.
- [Advanced Deployment](./ADVANCED_DEPLOYMENT.md) — Multi-region, GLB, and Security.

## 🛠️ Troubleshooting & Rollbacks

### Common Handshake Failures
- **Status 404/502 on /ws:** Ensure your client is connecting to the root `/` and not `/ws`. Cloud Run proxy layers can be sensitive to path-based WebSocket upgrades.
- **Port Mismatch:** Verify the `Dockerfile` exposes `3000` but the `deploy.sh` and `cloudbuild.yaml` use `--port 8080`.

### Performing a Rollback
If a deployment fails:
```bash
# List revisions
gcloud run revisions list --service omega-oracle

# Roll back to a previous revision
gcloud run services update-traffic omega-oracle --to-revisions=REVISION_NAME=100
```

## 🧪 Verification
- **WS Connection:** Log `[CODEX_WS_CONNECTED]` in the browser console.
- **Health Check:** `GET /api/health` should return `{"status": "ok", "version": "1.5.0-omega"}`.
