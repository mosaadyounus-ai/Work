#!/bin/bash
# OMEGA Oracle: Master Deployment Automation

set -e

echo "--- 🚀 INITIATING OMEGA ORACLE PRODUCTION DEPLOYMENT ---"

# 1. Validation
if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID is required."
  exit 1
fi

# 2. Secret Manager Setup (Idempotent)
if [ -n "$GEMINI_API_KEY" ]; then
  echo "--- 🔐 Configuring Secret Manager ---"
  
  # Check if secret exists
  if ! gcloud secrets describe GEMINI_API_KEY --project="$PROJECT_ID" &>/dev/null; then
    echo "Creating GEMINI_API_KEY secret..."
    echo -n "$GEMINI_API_KEY" | gcloud secrets create GEMINI_API_KEY \
      --data-file=- --replication-policy="automatic" --project="$PROJECT_ID"
  else
    echo "Updating GEMINI_API_KEY secret version..."
    echo -n "$GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY \
      --data-file=- --project="$PROJECT_ID"
  fi

  # IAM Binding for Compute Service Account
  PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
  COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  
  echo "Granting Secret Accessor role to ${COMPUTE_SA}..."
  gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:${COMPUTE_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project="$PROJECT_ID" --quiet
fi

# 3. Build and Deploy
echo "--- 🏗️ Transitioning to Server Module ---"
cd apps/server

# Execute the primary deployment logic
./deploy.sh

echo "--- 🎯 OMEGA ORACLE DEPLOYMENT COMPLETE ---"
echo "Monitor health at: https://omega-oracle-$(gcloud run services describe omega-oracle --region us-central1 --format='value(status.url)' --project=$PROJECT_ID | cut -d'/' -f3)/api/health"
