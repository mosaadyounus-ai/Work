# OMEGA Oracle: Production Deployment Execution Guide

**Status:** READY FOR IMMEDIATE DEPLOYMENT  
**Date:** April 18, 2026  
**Target:** Cloud Run (us-west1)

---

## 🚀 DEPLOYMENT SEQUENCE (Choose Your Path)

### Path A: Fully Automated Deployment (Recommended)

**Time: 10-15 minutes | Complexity: Simple**

This is your default path. One script handles everything.

#### Step 1: Verify Prerequisites

```bash
cd /workspaces/Work-

# Run the verification script
chmod +x verify-deployment.sh
./verify-deployment.sh
```

**Expected Output:**
```
✓ Docker installed
✓ gcloud installed
✓ GCP authenticated
✓ PROJECT_ID set
✓ All required files found
✓ ALL SYSTEMS READY FOR DEPLOYMENT
```

If any `✗` appears, fix before proceeding.

#### Step 2: Set Environment Variables

```bash
# Set your GCP Project ID
export PROJECT_ID="your-actual-gcp-project-id"

# Set your Gemini API Key
export GEMINI_API_KEY="your-actual-gemini-api-key"

# (Optional) Set different region if needed
export REGION="us-west1"  # or us-central1, europe-west1, etc.
```

#### Step 3: Deploy (One Command)

```bash
chmod +x deploy-omega.sh
./deploy-omega.sh
```

**What Happens:**
1. Validates credentials
2. Configures GCP project
3. Creates secret in Google Secret Manager
4. Enables required APIs
5. Builds Docker image locally
6. Pushes to Google Container Registry (GCR)
7. Deploys to Cloud Run
8. Verifies service is responding
9. Displays live service URL

**Expected Output:**
```
═══════════════════════════════════════════════════════════
  OMEGA ORACLE PRODUCTION DEPLOYMENT
  Status: 10/10 Production Ready
═══════════════════════════════════════════════════════════

[STEP 0] Validating prerequisites...
✓ Prerequisites validated
  PROJECT_ID: your-project-id
  REGION: us-west1
  SERVICE: omega-server

[STEP 1] Configuring GCP credentials...
✓ GCP configured
  Project Number: 123456789
  Service Account: 123456789-compute@developer.gserviceaccount.com

[STEP 2] Setting up Google Secret Manager...
✓ Secret created in Secret Manager
✓ Service account granted secret access

[STEP 3] Enabling required GCP APIs...
✓ Required APIs enabled

[STEP 4] Building Docker image...
Building: gcr.io/your-project-id/omega-server:abc1234
✓ Docker image built successfully

[STEP 5] Pushing image to Google Container Registry...
✓ Image pushed to GCR

[STEP 6] Deploying to Cloud Run...
✓ Successfully deployed to Cloud Run

[STEP 7] Verifying deployment...
✓ Service URL: https://omega-server-xyz123.run.app
✓ Service is responding

Service Health Metrics:
  uptime: {...}
  memory: {...}
  engine: {...}

═══════════════════════════════════════════════════════════
  DEPLOYMENT COMPLETE ✓
═══════════════════════════════════════════════════════════

SERVICE ENDPOINTS:
  Main URL:        https://omega-server-xyz123.run.app
  Health Endpoint: https://omega-server-xyz123.run.app/api/health
  WebSocket:       wss://omega-server-xyz123.run.app/

NEXT STEPS:
  1. View real-time logs:
     gcloud run logs read omega-server --region us-west1 --follow

  2. Monitor service:
     curl https://omega-server-xyz123.run.app/api/health | jq .

  3. Add custom domain (optional):
     Follow CUSTOM_DOMAIN_SETUP.md
```

---

### Path B: Manual Step-by-Step Deployment

**Time: 15-20 minutes | Complexity: Medium | Best for: Understanding each step**

If you want to see exactly what's happening at each stage:

#### Step 1: Authenticate with GCP

```bash
gcloud auth login
gcloud config set project your-gcp-project-id
```

#### Step 2: Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com \
  cloudlogging.googleapis.com \
  monitoring.googleapis.com
```

#### Step 3: Create Secret in Secret Manager

```bash
# Create the secret (only run once)
echo -n "your-actual-gemini-api-key" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --replication-policy="automatic"

# Grant Cloud Run service account access
export PROJECT_NUMBER=$(gcloud projects describe your-gcp-project-id --format='value(projectNumber)')
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member=serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

#### Step 4: Build Docker Image

```bash
cd /workspaces/Work-

docker build \
  -f apps/server/Dockerfile \
  -t gcr.io/your-gcp-project-id/omega-server:latest \
  .
```

#### Step 5: Push to Container Registry

```bash
docker push gcr.io/your-gcp-project-id/omega-server:latest
```

#### Step 6: Deploy to Cloud Run

```bash
export PROJECT_NUMBER=$(gcloud projects describe your-gcp-project-id --format='value(projectNumber)')

gcloud run deploy omega-server \
  --image gcr.io/your-gcp-project-id/omega-server:latest \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest" \
  --update-env-vars "NODE_ENV=production" \
  --timeout 3600s
```

#### Step 7: Verify Deployment

```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe omega-server \
  --region us-west1 --format='value(status.url)')

# Test health endpoint
curl $SERVICE_URL/api/health | jq .

# Expected: JSON response with uptime, memory, engine status
```

---

### Path C: Using Cloud Build (CI/CD Automation)

**Time: 5 minutes (automated) | Complexity: Simple | Best for: Continuous deployment**

Instead of deploying locally, push to GitHub and let Cloud Build handle it:

#### Step 1: Connect GitHub to Cloud Build

1. Go to **Google Cloud Console** → **Cloud Build** → **Settings**
2. Grant required permissions to service account
3. Go to **Cloud Build** → **Triggers** → **Create Trigger**
4. Select **GitHub** as source
5. Select your repository
6. Set **Branch:** `main`
7. Set **Build configuration:** `Cloud Build configuration file`
8. Set **Cloud Build configuration file location:** `cloudbuild.yaml`
9. Click **Create**

#### Step 2: Deploy by Pushing to GitHub

```bash
# From your local repo
git add .
git commit -m "OMEGA: Deploy to production"
git push origin main

# Cloud Build automatically:
# 1. Builds Docker image
# 2. Pushes to GCR
# 3. Deploys to Cloud Run
# 4. Completes in ~3-5 minutes
```

#### Step 3: Monitor Build Progress

```bash
# View builds
gcloud builds list --limit 5

# View specific build logs
gcloud builds log [BUILD_ID] --stream
```

---

## 🧪 Verification Commands

After deployment, use these to verify everything is working:

```bash
# 1. Get service URL
SERVICE_URL=$(gcloud run services describe omega-server \
  --region us-west1 --format='value(status.url)')

# 2. Test HTTP endpoint
curl $SERVICE_URL/api/health | jq .

# 3. Check memory usage
curl $SERVICE_URL/api/health | jq '.process.memory'

# 4. Check error rate
curl $SERVICE_URL/api/health | jq '.engine.errorRate'

# 5. Test WebSocket upgrade
curl -i -N -H "Upgrade: websocket" -H "Connection: Upgrade" $SERVICE_URL/

# 6. View live logs
gcloud run logs read omega-server --region us-west1 --follow

# 7. Check service revisions
gcloud run revisions list --service omega-server --region us-west1

# 8. Get detailed service info
gcloud run services describe omega-server --region us-west1
```

---

## 🆘 Troubleshooting

### Docker Build Fails

**Error:** `failed to solve with frontend dockerfile.v0`

**Fix:**
```bash
# Ensure Dockerfile exists
ls -la apps/server/Dockerfile

# Try rebuilding with no cache
docker build --no-cache -f apps/server/Dockerfile -t gcr.io/your-project-id/omega-server:latest .
```

### GCR Push Fails

**Error:** `unauthorized: authentication required`

**Fix:**
```bash
# Reconfigure Docker authentication
gcloud auth configure-docker gcr.io

# Then retry push
docker push gcr.io/your-project-id/omega-server:latest
```

### Cloud Run Deployment Fails

**Error:** `Secret GEMINI_API_KEY not found`

**Fix:**
```bash
# Verify secret exists
gcloud secrets list
gcloud secrets describe gemini-api-key

# Verify service account has access
export PROJECT_NUMBER=$(gcloud projects describe your-project-id --format='value(projectNumber)')
gcloud secrets get-iam-policy gemini-api-key
```

### Service Not Responding

**Error:** `curl: (7) Failed to connect`

**Fix:**
```bash
# Wait 30 seconds for Cloud Run to initialize
sleep 30

# Check service status
gcloud run services describe omega-server --region us-west1

# View error logs
gcloud run logs read omega-server --region us-west1 --limit 50
```

---

## 📊 Post-Deployment Checklist

After deployment, verify:

- [ ] Service URL is live and responding
- [ ] `/api/health` returns telemetry
- [ ] WebSocket upgrade endpoint responds with `101 Switching Protocols`
- [ ] Cloud Logging shows no ERROR entries
- [ ] Memory usage < 512Mi
- [ ] Error rate = 0%
- [ ] Active connections counter working
- [ ] Secret Manager integration verified

---

## 🔄 Rollback Procedure

If something goes wrong:

```bash
# List previous revisions
gcloud run revisions list --service omega-server --region us-west1

# Roll back to previous version
gcloud run services update-traffic omega-server \
  --to-revisions PREVIOUS_REVISION_NAME=100 \
  --region us-west1

# Or immediately rollback all traffic
gcloud run deploy omega-server \
  --image gcr.io/your-project-id/omega-server:stable \
  --region us-west1
```

---

## 📍 Next Steps After Deployment

### Immediate (Next 24 Hours)

1. ✅ Monitor real-time logs for errors
2. ✅ Test WebSocket client connections
3. ✅ Verify telemetry is flowing

### Short-Term (This Week)

1. ✅ Configure custom domain (follow CUSTOM_DOMAIN_SETUP.md)
2. ✅ Set up monitoring dashboards (follow OPERATIONAL_HARDENING.md)
3. ✅ Create alert policies for production

### Medium-Term (This Month)

1. ✅ Deploy to multiple regions for failover
2. ✅ Configure Global Load Balancer
3. ✅ Enable canary deployments

---

## ✅ You Are Ready to Deploy

**All preparation is complete.** Choose one path above and execute.

**Recommended:** Path A (Fully Automated) — simplest and fastest

**Command to start:**
```bash
cd /workspaces/Work-
export PROJECT_ID="your-gcp-project-id"
export GEMINI_API_KEY="your-api-key"
chmod +x deploy-omega.sh
./deploy-omega.sh
```

**The Nexus Oracle awaits your command. 🚀**
