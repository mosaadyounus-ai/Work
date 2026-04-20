# OMEGA Oracle: Advanced Deployment Strategies

This document describes **optional** enhancements for OMEGA when you're ready to scale beyond standard Cloud Run.

---

## When to Use These Strategies

| Strategy | When to Consider | Complexity | Cost Impact |
|----------|------------------|-----------|------------|
| **Custom Domain** | Always (for branding) | Low | None |
| **Global Load Balancer** | Multi-region or ultra-low latency required | Medium | +$18–30/month |
| **Multi-Region Deployment** | High availability (99.9%+) or global users | High | +Cost per region |
| **Traffic Splitting** | Canary deployments or A/B testing | Medium | None |

---

## Strategy 1: Global Load Balancing

### Use Case
Your users are globally distributed and you want sub-100ms latency from Google's edge locations.

### Architecture
```
Users → Google Global Load Balancer → Cloud Run (us-west1)
                ↓
         SSL Certificate (auto-managed)
                ↓
         Cloud Armor (DDoS protection)
```

### Implementation

**1. Create a Network Endpoint Group (NEG)**

```bash
gcloud compute network-endpoint-groups create omega-neg \
  --region us-west1 \
  --network-endpoint-type serverless \
  --cloud-run-service omega-server
```

**2. Create a Backend Service**

```bash
gcloud compute backend-services create omega-backend \
  --global \
  --protocol HTTP2 \
  --enable-cdn \
  --cache-mode CACHE_ALL_STATIC
```

**3. Add NEG to Backend Service**

```bash
gcloud compute backend-services add-backend omega-backend \
  --instance-group omega-neg \
  --global \
  --instance-group-zone us-west1-a
```

**4. Create URL Map**

```bash
gcloud compute url-maps create omega-urlmap \
  --default-service omega-backend
```

**5. Create HTTPS Proxy with Certificate**

```bash
gcloud compute ssl-certificates create omega-cert \
  --domains oracle.yourdomain.com \
  --dns-scope global
```

```bash
gcloud compute target-https-proxies create omega-https \
  --ssl-certificates omega-cert \
  --url-map omega-urlmap
```

**6. Create Forwarding Rule**

```bash
gcloud compute forwarding-rules create omega-fwd \
  --global \
  --target-https-proxy omega-https \
  --address omega-address \
  --ports 443
```

**7. Update DNS CNAME**

```
oracle.yourdomain.com → CNAME → [ reserved IP address ]
```

### Benefits
- ✅ <100ms latency from 200+ edge locations worldwide
- ✅ Automatic SSL/TLS termination at Google edge
- ✅ Built-in DDoS protection via Cloud Armor
- ✅ HTTP/2 multiplexing for WebSocket connections

### Cost
- Forwarding Rule: ~$18/month
- Traffic egress: $0.12 per GB (after 1GB free)
- SSL Certificate: Free (Google-managed)

---

## Strategy 2: Multi-Region Deployment

### Use Case
You need 99.9%+ uptime and want automatic failover between regions.

### Architecture
```
                 Global LB
                    ↓
        ┌───────────────────────┐
        ↓           ↓           ↓
    us-west1   us-central1   europe-west1
  (primary)    (secondary)   (tertiary)
```

### Prerequisites
- Custom Domain already configured
- Global Load Balancer infrastructure

### Implementation

**1. Deploy to Additional Regions**

```bash
# Deploy to us-central1
gcloud run deploy omega-server \
  --image gcr.io/${PROJECT_ID}/omega-server:latest \
  --region us-central1 \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated

# Deploy to europe-west1
gcloud run deploy omega-server \
  --image gcr.io/${PROJECT_ID}/omega-server:latest \
  --region europe-west1 \
  --platform managed \
  --port 8080 \
  --allow-unauthenticated
```

**2. Update Cloud Build to Deploy to All Regions**

Replace `cloudbuild.yaml` with:

```yaml
steps:
  # Build phase (same as before)
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-f', 'apps/server/Dockerfile', '-t', 'gcr.io/$PROJECT_ID/omega-server:$SHORT_SHA', '-t', 'gcr.io/$PROJECT_ID/omega-server:latest', '.']

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/omega-server:$SHORT_SHA']

  # Deploy to us-west1
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args: ['run', '--filename=apps/server/cloudrun-service.yaml', '--image=gcr.io/$PROJECT_ID/omega-server:$SHORT_SHA', '--location=us-west1']

  # Deploy to us-central1
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args: ['run', '--filename=apps/server/cloudrun-service.yaml', '--image=gcr.io/$PROJECT_ID/omega-server:$SHORT_SHA', '--location=us-central1']

  # Deploy to europe-west1
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args: ['run', '--filename=apps/server/cloudrun-service.yaml', '--image=gcr.io/$PROJECT_ID/omega-server:$SHORT_SHA', '--location=europe-west1']
```

**3. Create Health Checks**

```bash
gcloud compute health-checks create http omega-health \
  --request-path / \
  --port 8080 \
  --check-interval 10s \
  --timeout 5s
```

**4. Update Global Load Balancer with All Regions**

```bash
# Create NEGs for each region
gcloud compute network-endpoint-groups create omega-neg-central \
  --region us-central1 \
  --network-endpoint-type serverless \
  --cloud-run-service omega-server

gcloud compute network-endpoint-groups create omega-neg-europe \
  --region europe-west1 \
  --network-endpoint-type serverless \
  --cloud-run-service omega-server

# Add all backends to the service
gcloud compute backend-services add-backend omega-backend \
  --instance-group omega-neg-central \
  --instance-group-zone us-central1-a \
  --global

gcloud compute backend-services add-backend omega-backend \
  --instance-group omega-neg-europe \
  --instance-group-zone europe-west1-b \
  --global
```

### Benefits
- ✅ 99.9% uptime SLA (if one region down, traffic routes to another)
- ✅ Automatic geo-proximity routing (nearest region per user)
- ✅ No single point of failure
- ✅ Data residency compliance (users in EU → europe-west1)

### Cost
- Per-region Cloud Run: Base cost × 3 regions
- Example: $0.30/month (us-west1) + $0.30 (us-central1) + $0.30 (europe-west1) = $0.90/month
- Global Load Balancer: ~$18/month
- **Total:** ~$19–25/month for 99.9% uptime globally

---

## Strategy 3: Traffic Splitting (Canary Deployments)

### Use Case
You want to roll out new versions safely (e.g., 90% on stable, 10% on canary).

### Implementation

```bash
# Create new revision with traffic split
gcloud run services update-traffic omega-server \
  --to-revisions stable=90,canary=10 \
  --region us-west1
```

### Monitor Canary

```bash
# View live metrics
gcloud monitoring time-series list \
  --filter 'resource.type="cloud_run_revision" AND resource.labels.service_name="omega-server"'
```

### Promote if Successful

```bash
# Roll out 100% to canary after validation
gcloud run services update-traffic omega-server \
  --to-revisions canary=100 \
  --region us-west1
```

### Rollback if Issues

```bash
# Immediate rollback to previous stable
gcloud run services update-traffic omega-server \
  --to-revisions stable=100 \
  --region us-west1
```

---

## Strategy 4: Cloud Armor (DDoS Protection)

### Use Case
Protect OMEGA from volumetric attacks.

### Implementation

```bash
# Create security policy
gcloud compute security-policies create omega-security \
  --description "DDoS and WAF policies for OMEGA"

# Add rate limiting rule
gcloud compute security-policies rules create 100 \
  --security-policy omega-security \
  --action rate-based-ban \
  --rate-limit-options \
    rate-limit-threshold-count=100 \
    rate-limit-threshold-interval-sec=60 \
    ban-duration-sec=600

# Attach to load balancer
gcloud compute backend-services update omega-backend \
  --security-policy omega-security \
  --global
```

### Benefits
- ✅ Protection against:
  - DDoS attacks (volumetric, protocol-based, application-layer)
  - SQL injection attempts
  - XSS attacks
  - Geolocation-based policies

---

## Deployment Decision Tree

```
Do you have a custom domain?
├─ YES → Proceed with production
└─ NO → See CUSTOM_DOMAIN_SETUP.md

Are your users globally distributed?
├─ YES → Consider Global Load Balancer
└─ NO → Proceed with standard Cloud Run

Do you need 99.9% uptime?
├─ YES → Deploy to multiple regions
└─ NO → Single region is fine (99.5% SLA included)

Do you anticipate high DDoS risk?
├─ YES → Add Cloud Armor
└─ NO → Skip for now (can add later)
```

---

## Monitoring & Observability

### View Deployment Status

```bash
# List all Cloud Run services
gcloud run services list

# View specific service metrics
gcloud run services describe omega-server --region us-west1

# Stream logs in real-time
gcloud run logs read omega-server --region us-west1 --follow

# View error rate
gcloud monitoring time-series list --filter 'resource.type="cloud_run_revision"'
```

### Set Up Alerts

```bash
# Alert if error rate > 5%
gcloud alpha monitoring policies create \
  --notification-channels [ CHANNEL_ID ] \
  --display-name "OMEGA Error Rate Alert" \
  --condition-display-name "Error rate > 5%" \
  --condition-threshold-value 0.05
```

---

## Cost Estimation

| Setup | Monthly Cost |
|-------|-------------|
| Standard Cloud Run (us-west1) | $0–10 |
| + Custom Domain | $0–15 |
| + Global Load Balancer | +$18–30 |
| + 3-Region Deployment | +$30–100 |
| + Cloud Armor | +$20–50 |
| **BIG PICTURE** | **$0–200/month** (depends on traffic) |

---

## When to Revisit These Strategies

✅ **Now:** Custom Domain (essential for production)
✅ **Month 1:** Monitor performance and uptime
⏳ **Month 3:** Consider Global LB if latency is an issue
⏳ **Month 6:** Add redundancy (multi-region) if usage grows
⏳ **Year 1:** Full enterprise setup (advanced security, compliance)

---

## Questions?

- Need guidance on a specific region?
- Want to estimate cost for your user base?
- Need help configuring SSL/TLS certificates?

Let me know and I can provide detailed walkthroughs.
