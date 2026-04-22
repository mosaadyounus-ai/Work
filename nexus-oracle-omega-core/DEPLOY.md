# DEPLOY: OMEGA Oracle Master Guide

**Your destination is 10 minutes away.**

This is the central entry point for your production launch. The OMEGA Oracle is a hardened, enterprise-grade strategic console ready for deployment to Google Cloud Run.

## 🏁 Quick Launch (The "Fast" Path)

```bash
# 1. Provide your environment context
export PROJECT_ID="your-project-id"
export GEMINI_API_KEY="your-api-key"

# 2. Verify readiness
./verify-deployment.sh

# 3. Deploy
./deploy-omega.sh
```

## 📂 Core Deployment Package

- **[EXECUTE_DEPLOYMENT.md](./EXECUTE_DEPLOYMENT.md)** — Detailed rollout paths (Manual, Automated, CD).
- **[DEPLOYMENT_STATUS.md](./DEPLOYMENT_STATUS.md)** — The 10/10 Readiness Matrix.
- **[SECURITY_COMPLIANCE.md](./SECURITY_COMPLIANCE.md)** — Hardening your secrets and network.
- **[OPERATIONAL_HARDENING.md](./OPERATIONAL_HARDENING.md)** — Monitoring, Dashboards, and Alerts.

## 🛠️ Automated Scripts

- `deploy-omega.sh`: The master orchestrator. Handles secrets, IAM, and Cloud Run.
- `verify-deployment.sh`: Pre-flight diagnostic tool.

---

**Next Strategic Move:** Execute `./deploy-omega.sh` to go live.
