#!/bin/bash
# OMEGA Cloud Run Deployment Helper

# Ensure PROJECT_ID is set
if [ -z "$PROJECT_ID" ]; then
  echo "Error: PROJECT_ID environment variable is not set."
  echo "Usage: PROJECT_ID=your-project-id ./deploy.sh"
  exit 1
fi

SERVICE_NAME="omega-oracle"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "--- Authenticating Docker with GCR ---"
gcloud auth configure-docker --quiet

echo "--- Building Docker Image: ${IMAGE_NAME} ---"
docker build -t ${IMAGE_NAME} .

echo "--- Pushing Image to GCR ---"
docker push ${IMAGE_NAME}

echo "--- Deploying to Cloud Run: ${SERVICE_NAME} ---"
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME} \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"

echo "--- Deployment Complete ---"
