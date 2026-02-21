#!/bin/bash

# Load Test Runner Script
# This script runs all load tests and generates reports

set -e

echo "=========================================="
echo "Starting Load Tests for VC/DID System"
echo "=========================================="
echo ""

# Check if Artillery is installed
if ! command -v artillery &> /dev/null; then
    echo "Artillery is not installed. Installing globally..."
    npm install -g artillery
fi

# Create reports directory
mkdir -p reports

# Get timestamp for report naming
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "1. Running Registration Endpoint Load Test..."
echo "   Target: 100 req/s for 5 minutes"
artillery run registration.yml \
  --output reports/registration_${TIMESTAMP}.json \
  2>&1 | tee reports/registration_${TIMESTAMP}.log

echo ""
echo "2. Running Credential Retrieval Load Test..."
echo "   Target: 200 req/s for 5 minutes"
artillery run credential-retrieval.yml \
  --output reports/credential-retrieval_${TIMESTAMP}.json \
  2>&1 | tee reports/credential-retrieval_${TIMESTAMP}.log

echo ""
echo "3. Running Analytics Endpoint Load Test..."
echo "   Target: 50 req/s for 5 minutes"
artillery run analytics.yml \
  --output reports/analytics_${TIMESTAMP}.json \
  2>&1 | tee reports/analytics_${TIMESTAMP}.log

echo ""
echo "=========================================="
echo "Load Tests Complete!"
echo "=========================================="
echo ""
echo "Generating HTML reports..."

# Generate HTML reports
artillery report reports/registration_${TIMESTAMP}.json \
  --output reports/registration_${TIMESTAMP}.html

artillery report reports/credential-retrieval_${TIMESTAMP}.json \
  --output reports/credential-retrieval_${TIMESTAMP}.html

artillery report reports/analytics_${TIMESTAMP}.json \
  --output reports/analytics_${TIMESTAMP}.html

echo ""
echo "Reports generated in ./reports/"
echo "  - registration_${TIMESTAMP}.html"
echo "  - credential-retrieval_${TIMESTAMP}.html"
echo "  - analytics_${TIMESTAMP}.html"
echo ""
echo "To view reports, open the HTML files in a browser"
