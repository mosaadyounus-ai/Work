#!/bin/bash
# OMEGA Oracle: Pre-flight Verification Script

echo "--- 🛡️ Starting OMEGA Pre-flight Verification ---"

# 1. Check for gcloud CLI
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi
echo "✅ gcloud CLI installed"

# 2. Check for Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Error: docker not found. Please install Docker."
    exit 1
fi
echo "✅ Docker installed"

# 3. Check for Project ID
if [ -z "$PROJECT_ID" ]; then
    echo "⚠️ Warning: PROJECT_ID environment variable is not set locally."
    CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
    if [ -n "$CURRENT_PROJECT" ]; then
        echo "   Using active gcloud project: $CURRENT_PROJECT"
        export PROJECT_ID=$CURRENT_PROJECT
    else
        echo "❌ Error: No PROJECT_ID set. Run 'export PROJECT_ID=your-project-id'"
        exit 1
    fi
fi
echo "✅ Project ID detected: $PROJECT_ID"

# 4. Check for Gemini API Key (only for deployment)
if [ -z "$GEMINI_API_KEY" ]; then
    echo "⚠️ Warning: GEMINI_API_KEY environment variable is not set."
    echo "   Note: This is required if you are running 'deploy-omega.sh' for the first time."
fi

# 5. Check for local server health
if [ -f "./apps/server/server.ts" ]; then
    echo "✅ Server source found at /apps/server/server.ts"
else
    echo "❌ Error: Server source not found. Check repository structure."
    exit 1
fi

echo "--- ✨ Pre-flight Complete: System Ready for OMEGA Launch ---"
