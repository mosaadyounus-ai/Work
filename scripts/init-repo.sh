#!/bin/bash

# OMEGA LATTICE // GitHub Initialization Orchestrator
# This script initializes a local git repository and prepares it for GitHub linkage.

set -e

echo "🚀 Initializing OMEGA LATTICE locally..."

# Initialize git if not already present
if [ ! -d ".git" ]; then
    git init
    echo "✅ Git repository initialized."
else
    echo "ℹ️ Git repository already exists."
fi

# Add all production-hardened files
git add .

# Create initial commit
git commit -m "Initial commit: OMEGA LATTICE Production Core v1.0"

echo "--------------------------------------------------------"
echo "✅ Local repository is READY."
echo ""
echo "NEXT STEPS:"
echo "1. Create a repository on GitHub (manually or via 'gh repo create')"
echo "2. Add the remote: git remote add origin https://github.com/YOUR_USER/omega-lattice.git"
echo "3. Push the core: git push -u origin main"
echo "--------------------------------------------------------"
