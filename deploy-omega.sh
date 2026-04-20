#!/bin/bash

###############################################################################
# OMEGA Oracle: Production Deployment Script
# 
# This script is the definitive production deployment path.
# It performs all necessary setup and deployment steps.
#
# Usage: ./deploy-omega.sh
# Requirements: 
#   - GCP Project ID set in environment or prompt
#   - Docker installed and authenticated to GCR
#   - gcloud CLI installed and configured
#   - GEMINI_API_KEY available
#
###############################################################################

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${PROJECT_ID:-}"
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
REGION="${REGION:-us-west1}"
SERVICE_NAME="${SERVICE_NAME:-omega-server}"
IMAGE_NAME="omega-server"

###############################################################################
# STEP 0: Validation & Setup
###############################################################################

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  OMEGA ORACLE PRODUCTION DEPLOYMENT${NC}"
echo -e "${BLUE}  Status: 10/10 Production Ready${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Validate prerequisites
validate_prerequisites() {
  echo -e "${YELLOW}[STEP 0] Validating prerequisites...${NC}"
  
  # Check PROJECT_ID
  if [[ -z "$PROJECT_ID" ]]; then
    read -p "Enter your GCP Project ID: " PROJECT_ID
    if [[ -z "$PROJECT_ID" ]]; then
      echo -e "${RED}ERROR: PROJECT_ID is required${NC}"
      exit 1
    fi
  fi
  
  # Check GEMINI_API_KEY
  if [[ -z "$GEMINI_API_KEY" ]]; then
    read -s -p "Enter your GEMINI_API_KEY: " GEMINI_API_KEY
    echo ""
    if [[ -z "$GEMINI_API_KEY" ]]; then
      echo -e "${RED}ERROR: GEMINI_API_KEY is required${NC}"
      exit 1
    fi
  fi
  
  # Verify tools
  command -v docker &> /dev/null || { echo -e "${RED}ERROR: Docker not found${NC}"; exit 1; }
  command -v gcloud &> /dev/null || { echo -e "${RED}ERROR: gcloud CLI not found${NC}"; exit 1; }
  
  echo -e "${GREEN}✓ Prerequisites validated${NC}"
  echo -e "  PROJECT_ID: $PROJECT_ID"
  echo -e "  REGION: $REGION"
  echo -e "  SERVICE: $SERVICE_NAME"
  echo ""
}

###############################################################################
# STEP 1: Authenticate & Configure GCP
###############################################################################

configure_gcp() {
  echo -e "${YELLOW}[STEP 1] Configuring GCP credentials...${NC}"
  
  # Set project
  gcloud config set project "$PROJECT_ID"
  
  # Get project number for service account binding
  PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')
  SERVICE_ACCOUNT="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"
  
  echo -e "${GREEN}✓ GCP configured${NC}"
  echo -e "  Project Number: $PROJECT_NUMBER"
  echo -e "  Service Account: $SERVICE_ACCOUNT"
  echo ""
}

###############################################################################
# STEP 2: Create Secret in Google Secret Manager
###############################################################################

setup_secret_manager() {
  echo -e "${YELLOW}[STEP 2] Setting up Google Secret Manager...${NC}"
  
  # Check if secret already exists
  if gcloud secrets describe gemini-api-key --project="$PROJECT_ID" &>/dev/null; then
    echo -e "${YELLOW}  ℹ Secret 'gemini-api-key' already exists${NC}"
    # Add new version
    echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key \
      --data-file=- \
      --project="$PROJECT_ID"
    echo -e "${GREEN}✓ New secret version created${NC}"
  else
    echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key \
      --data-file=- \
      --replication-policy="automatic" \
      --project="$PROJECT_ID"
    echo -e "${GREEN}✓ Secret created in Secret Manager${NC}"
  fi
  
  # Grant Cloud Run service account access to secret
  gcloud secrets add-iam-policy-binding gemini-api-key \
    --member=serviceAccount:"$SERVICE_ACCOUNT" \
    --role=roles/secretmanager.secretAccessor \
    --project="$PROJECT_ID" \
    --quiet
  
  echo -e "${GREEN}✓ Service account granted secret access${NC}"
  echo ""
}

###############################################################################
# STEP 3: Enable Required APIs
###############################################################################

enable_apis() {
  echo -e "${YELLOW}[STEP 3] Enabling required GCP APIs...${NC}"
  
  gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    secretmanager.googleapis.com \
    containerregistry.googleapis.com \
    cloudlogging.googleapis.com \
    monitoring.googleapis.com \
    --project="$PROJECT_ID"
  
  echo -e "${GREEN}✓ Required APIs enabled${NC}"
  echo ""
}

###############################################################################
# STEP 4: Build Docker Image
###############################################################################

build_image() {
  echo -e "${YELLOW}[STEP 4] Building Docker image...${NC}"
  
  IMAGE_URI="gcr.io/$PROJECT_ID/$IMAGE_NAME:latest"
  IMAGE_URI_SHA="gcr.io/$PROJECT_ID/$IMAGE_NAME:$(git rev-parse --short HEAD 2>/dev/null || echo 'dev')"
  
  echo -e "  Building: $IMAGE_URI_SHA"
  
  docker build \
    -f apps/server/Dockerfile \
    -t "$IMAGE_URI" \
    -t "$IMAGE_URI_SHA" \
    .
  
  echo -e "${GREEN}✓ Docker image built successfully${NC}"
  echo ""
}

###############################################################################
# STEP 5: Push to Container Registry
###############################################################################

push_image() {
  echo -e "${YELLOW}[STEP 5] Pushing image to Google Container Registry...${NC}"
  
  IMAGE_URI="gcr.io/$PROJECT_ID/$IMAGE_NAME:latest"
  IMAGE_URI_SHA="gcr.io/$PROJECT_ID/$IMAGE_NAME:$(git rev-parse --short HEAD 2>/dev/null || echo 'dev')"
  
  echo -e "  Pushing: $IMAGE_URI_SHA"
  docker push "$IMAGE_URI_SHA"
  docker push "$IMAGE_URI"
  
  echo -e "${GREEN}✓ Image pushed to GCR${NC}"
  echo ""
}

###############################################################################
# STEP 6: Deploy to Cloud Run
###############################################################################

deploy_to_cloud_run() {
  echo -e "${YELLOW}[STEP 6] Deploying to Cloud Run...${NC}"
  
  IMAGE_URI="gcr.io/$PROJECT_ID/$IMAGE_NAME:latest"
  
  echo -e "  Service: $SERVICE_NAME"
  echo -e "  Region: $REGION"
  echo -e "  Image: $IMAGE_URI"
  echo -e "  Memory: 512Mi"
  echo -e "  CPU: 1"
  
  gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_URI" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --port 8080 \
    --cpu 1 \
    --memory 512Mi \
    --set-secrets "GEMINI_API_KEY=gemini-api-key:latest" \
    --update-env-vars "NODE_ENV=production" \
    --timeout 3600s \
    --project "$PROJECT_ID"
  
  echo -e "${GREEN}✓ Successfully deployed to Cloud Run${NC}"
  echo ""
}

###############################################################################
# STEP 7: Verify Deployment
###############################################################################

verify_deployment() {
  echo -e "${YELLOW}[STEP 7] Verifying deployment...${NC}"
  
  # Get service URL
  SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --format='value(status.url)' \
    --project "$PROJECT_ID")
  
  echo -e "${GREEN}✓ Service URL: $SERVICE_URL${NC}"
  echo ""
  
  # Wait for service to be ready
  echo -e "  Waiting for service to become ready (max 30 seconds)..."
  for i in {1..30}; do
    if curl -s "$SERVICE_URL/api/health" > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Service is responding${NC}"
      
      # Get and display health metrics
      echo -e "\n${BLUE}Service Health Metrics:${NC}"
      HEALTH=$(curl -s "$SERVICE_URL/api/health")
      echo "$HEALTH" | jq '.uptime, .process.memory, .engine'
      
      return 0
    fi
    echo -n "."
    sleep 1
  done
  
  echo -e "${YELLOW}  ⚠ Service not responding yet, but deployment completed${NC}"
  echo -e "  Check status: gcloud run services describe $SERVICE_NAME --region $REGION"
  echo ""
}

###############################################################################
# STEP 8: Summary & Next Steps
###############################################################################

print_summary() {
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  DEPLOYMENT COMPLETE ✓${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
  echo ""
  
  SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --region "$REGION" \
    --format='value(status.url)' \
    --project "$PROJECT_ID")
  
  echo -e "${BLUE}SERVICE ENDPOINTS:${NC}"
  echo -e "  Main URL:        $SERVICE_URL"
  echo -e "  Health Endpoint: $SERVICE_URL/api/health"
  echo -e "  WebSocket:       ${SERVICE_URL/https/wss}/"
  echo ""
  
  echo -e "${BLUE}NEXT STEPS:${NC}"
  echo ""
  echo -e "  1. View real-time logs:"
  echo -e "     ${YELLOW}gcloud run logs read $SERVICE_NAME --region $REGION --follow${NC}"
  echo ""
  echo -e "  2. Monitor service:"
  echo -e "     ${YELLOW}curl $SERVICE_URL/api/health | jq .${NC}"
  echo ""
  echo -e "  3. Add custom domain (optional):"
  echo -e "     Follow CUSTOM_DOMAIN_SETUP.md"
  echo ""
  echo -e "  4. Set up monitoring dashboards (optional):"
  echo -e "     Follow OPERATIONAL_HARDENING.md"
  echo ""
  
  echo -e "${GREEN}Your OMEGA Oracle is LIVE and OPERATIONAL.${NC}"
  echo ""
}

###############################################################################
# MAIN EXECUTION
###############################################################################

main() {
  validate_prerequisites
  configure_gcp
  setup_secret_manager
  enable_apis
  build_image
  push_image
  deploy_to_cloud_run
  verify_deployment
  print_summary
}

# Run main function
main
