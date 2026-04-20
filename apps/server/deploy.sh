#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:-PROJECT-ID}
IMAGE=gcr.io/${PROJECT_ID}/omega-server
REGION=${REGION:-us-west1}
SERVICE_NAME=${SERVICE_NAME:-omega-server}

if [[ "${PROJECT_ID}" == "PROJECT-ID" ]]; then
  echo "ERROR: Set PROJECT_ID environment variable or replace PROJECT-ID in deploy.sh"
  exit 1
fi

echo "Building Docker image ${IMAGE}..."
docker build -f apps/server/Dockerfile -t "${IMAGE}" /workspaces/Work-

echo "Pushing image to Container Registry..."
docker push "${IMAGE}"

echo "Deploying to Cloud Run with Secret Manager integration..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --port 8080 \
  --cpu 1 \
  --memory 512Mi \
  --set-secrets "GEMINI_API_KEY=gemini-api-key:latest" \
  --update-env-vars "NODE_ENV=production" \
  --timeout 3600s

echo "Deployment complete. Service: $SERVICE_NAME"
echo "URL: $(gcloud run services describe ${SERVICE_NAME} --region ${REGION} --format='value(status.url)')"
