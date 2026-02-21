#!/bin/bash

# Deployment Helper Script for Render.com
# This script helps you prepare for deployment

set -e

echo "🚀 DID/VC Registration System - Deployment Helper"
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${YELLOW}⚠️  Git not initialized. Initializing...${NC}"
    git init
    git add .
    git commit -m "Initial commit"
fi

# Check if remote is set
if ! git remote | grep -q origin; then
    echo -e "${YELLOW}⚠️  No git remote found.${NC}"
    echo "Please create a GitHub repository and run:"
    echo "  git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git"
    echo "  git push -u origin main"
    exit 1
fi

echo -e "${BLUE}📋 Pre-deployment Checklist:${NC}"
echo ""

# Check for required files
echo "✓ Checking deployment files..."
[ -f "render.yaml" ] && echo "  ✓ render.yaml found" || echo "  ✗ render.yaml missing"
[ -f "DEPLOYMENT_RENDER.md" ] && echo "  ✓ DEPLOYMENT_RENDER.md found" || echo "  ✗ DEPLOYMENT_RENDER.md missing"
[ -f "backend/Dockerfile" ] && echo "  ✓ backend/Dockerfile found" || echo "  ✗ backend/Dockerfile missing"

echo ""
echo -e "${BLUE}🔑 Generate Secure Keys:${NC}"
echo ""

# Generate JWT Secret
echo "JWT_SECRET (copy this):"
echo -e "${GREEN}$(openssl rand -base64 48)${NC}"
echo ""

# Generate Encryption Key
echo "ENCRYPTION_KEY (copy this):"
echo -e "${GREEN}$(openssl rand -hex 16)${NC}"
echo ""

echo -e "${BLUE}📝 Next Steps:${NC}"
echo ""
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add deployment configuration'"
echo "   git push origin main"
echo ""
echo "2. Create accounts (if you haven't):"
echo "   • Render.com: https://render.com"
echo "   • MongoDB Atlas: https://mongodb.com/cloud/atlas"
echo "   • CloudAMQP: https://cloudamqp.com"
echo ""
echo "3. Deploy on Render:"
echo "   • Go to https://dashboard.render.com"
echo "   • Click 'New' → 'Blueprint'"
echo "   • Connect your GitHub repository"
echo "   • Render will detect render.yaml automatically"
echo ""
echo "4. Set environment variables in Render Dashboard"
echo "   (Use the keys generated above)"
echo ""
echo "5. Wait for deployment to complete (~5-10 minutes)"
echo ""
echo -e "${GREEN}✨ Full guide: DEPLOYMENT_RENDER.md${NC}"
echo ""

# Offer to push
read -p "Do you want to commit and push now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "Add deployment configuration for Render.com" || echo "Nothing to commit"
    git push origin main || git push origin master
    echo ""
    echo -e "${GREEN}✅ Code pushed! Now go to Render Dashboard to deploy.${NC}"
fi
