# OMEGA Oracle: Security & Compliance Guide

This guide details the implementation of **Option C**: securing the OMEGA Oracle against DDoS, unauthorized access, and key leakage.

## 🔐 1. Google Secret Manager Integration
Avoid storing raw API keys in environment variables or hardcoded strings.

### Process:
1.  **Create Secret:** Go to **Secret Manager** and create `GEMINI_API_KEY`.
2.  **IAM Binding:** Grant the Cloud Run Service Account the `Secret Manager Secret Accessor` role.
3.  **Mounting:** In the Cloud Run Console (or YAML), map the secret to an environment variable.

### YAML Example (`cloudrun-service.yaml`):
```yaml
containers:
- image: gcr.io/PROJECT_ID/omega-oracle
  env:
  - name: GEMINI_API_KEY
    valueFrom:
      secretKeyRef:
        name: GEMINI_API_KEY
        key: latest
```

## 🛡️ 2. Cloud Armor (DDoS Protection)
Protect the Oracle from malicious traffic and layer 7 attacks.

1.  **Setup:** Create a **Cloud Armor Security Policy**.
2.  **Rules:**
    -   **Rate Limiting:** Prevent simple bruteforce or scraping.
    -   **WAF Rules:** Enable rule sets like `sqli-v33-stable` and `xss-v33-stable`.
3.  **Deployment:** Attach the policy to your **Global External Load Balancer**.

## 👤 3. Least-Privilege IAM
Ensure OMEGA only has the permissions it needs to function.

| Account | Role | Purpose |
|---------|------|---------|
| **Build Account** | `roles/run.admin` | Deploys new revisions. |
| **Run Account** | `roles/logging.logWriter` | Writes OMEGA engine logs. |
| **Run Account** | `roles/secretmanager.accessor` | Reads the Gemini API Key. |

## 🌐 4. HTTPS/WSS Termination
All traffic to the Nexus Oracle MUST be encrypted.
-   **SSL:** Google-managed certificates (automatic).
-   **HSTS:** Ensure headers are set to enforce secure connections.

## 📦 5. Image Scanning
Scan your OMEGA Docker images for vulnerabilities in **Artifact Registry**.
1.  Enable **Vulnerability Scanning** in the console.
2.  Review Scan Results before each production promotion.
