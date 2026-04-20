#!/bin/bash

###############################################################################
# OMEGA Oracle: Deployment Verification Checklist
#
# Run this script BEFORE deploy-omega.sh to verify all prerequisites
# Exit code 0 = All systems ready
# Exit code 1 = Issues found, review output
#
###############################################################################

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ISSUES_FOUND=0

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       OMEGA ORACLE: PRE-DEPLOYMENT VERIFICATION          ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check Docker
echo -e "${YELLOW}[CHECK 1] Docker installation...${NC}"
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  echo -e "${GREEN}✓${NC} Docker installed: $DOCKER_VERSION"
else
  echo -e "${RED}✗${NC} Docker not found (required for building image)"
  ISSUES_FOUND=1
fi
echo ""

# Check gcloud CLI
echo -e "${YELLOW}[CHECK 2] Google Cloud CLI...${NC}"
if command -v gcloud &> /dev/null; then
  GCLOUD_VERSION=$(gcloud --version | head -1)
  echo -e "${GREEN}✓${NC} gcloud installed: $GCLOUD_VERSION"
else
  echo -e "${RED}✗${NC} gcloud CLI not found (install via: curl https://sdk.cloud.google.com | bash)"
  ISSUES_FOUND=1
fi
echo ""

# Check GCP authentication
echo -e "${YELLOW}[CHECK 3] GCP authentication...${NC}"
if gcloud auth list --filter=status:ACTIVE --format="value(account)" &>/dev/null; then
  ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
  echo -e "${GREEN}✓${NC} GCP authenticated: $ACTIVE_ACCOUNT"
else
  echo -e "${RED}✗${NC} Not authenticated with GCP (run: gcloud auth login)"
  ISSUES_FOUND=1
fi
echo ""

# Check environment variables
echo -e "${YELLOW}[CHECK 4] Environment variables...${NC}"
if [[ -n "${PROJECT_ID:-}" ]]; then
  echo -e "${GREEN}✓${NC} PROJECT_ID set: $PROJECT_ID"
else
  echo -e "${YELLOW}⚠${NC} PROJECT_ID not set (will prompt during deployment)"
fi

if [[ -n "${GEMINI_API_KEY:-}" ]]; then
  echo -e "${GREEN}✓${NC} GEMINI_API_KEY set (***hidden***)"
else
  echo -e "${YELLOW}⚠${NC} GEMINI_API_KEY not set (will prompt during deployment)"
fi
echo ""

# Check repository state
echo -e "${YELLOW}[CHECK 5] Repository state...${NC}"
if [[ -d ".git" ]]; then
  echo -e "${GREEN}✓${NC} Git repository initialized"
  GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  echo -e "  Branch: $GIT_BRANCH"
else
  echo -e "${YELLOW}⚠${NC} Not a git repository (some features may be limited)"
fi
echo ""

# Check Docker files
echo -e "${YELLOW}[CHECK 6] Required files...${NC}"
FILES_NEEDED=(
  "apps/server/Dockerfile"
  "apps/server/server.ts"
  "apps/server/deploy.sh"
  "apps/server/cloudrun-service.yaml"
  "cloudbuild.yaml"
)

for file in "${FILES_NEEDED[@]}"; do
  if [[ -f "$file" ]]; then
    echo -e "${GREEN}✓${NC} Found: $file"
  else
    echo -e "${RED}✗${NC} Missing: $file"
    ISSUES_FOUND=1
  fi
done
echo ""

# Check Dockerfile syntax
echo -e "${YELLOW}[CHECK 7] Dockerfile syntax...${NC}"
if docker build --dry-run -f apps/server/Dockerfile . &>/dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} Dockerfile valid"
else
  echo -e "${YELLOW}⚠${NC} Dockerfile has issues (will check during build)"
fi
echo ""

# Check Node.js files
echo -e "${YELLOW}[CHECK 8] Node.js dependencies...${NC}"
if [[ -f "apps/server/package.json" ]]; then
  echo -e "${GREEN}✓${NC} Found: apps/server/package.json"
else
  echo -e "${RED}✗${NC} Missing: apps/server/package.json"
  ISSUES_FOUND=1
fi

if [[ -f "apps/server/node_modules/.bin/tsc" ]] || [[ -n "${PATH##*node_modules*}" ]]; then
  echo -e "${GREEN}✓${NC} TypeScript tooling available"
else
  echo -e "${YELLOW}⚠${NC} TypeScript not yet installed (will install during build)"
fi
echo ""

# Check documentation
echo -e "${YELLOW}[CHECK 9] Documentation...${NC}"
DOCS_NEEDED=(
  "DEPLOYMENT_READY.md"
  "SECURITY_COMPLIANCE.md"
  "OPERATIONAL_HARDENING.md"
  "CUSTOM_DOMAIN_SETUP.md"
)

for doc in "${DOCS_NEEDED[@]}"; do
  if [[ -f "$doc" ]]; then
    echo -e "${GREEN}✓${NC} Found: $doc"
  else
    echo -e "${YELLOW}⚠${NC} Missing: $doc"
  fi
done
echo ""

# Summary
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
if [[ $ISSUES_FOUND -eq 0 ]]; then
  echo -e "${GREEN}║              ALL SYSTEMS READY FOR DEPLOYMENT            ║${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  echo -e "${GREEN}✓ You can now run: ./deploy-omega.sh${NC}"
  echo ""
  exit 0
else
  echo -e "${RED}║        ISSUES FOUND - FIX BEFORE DEPLOYMENT              ║${NC}"
  echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
  echo ""
  exit 1
fi
