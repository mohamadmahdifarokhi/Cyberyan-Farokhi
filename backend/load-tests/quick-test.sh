#!/bin/bash

# Quick Load Test Script
# Runs a shorter version of load tests for quick validation

set -e

echo "=========================================="
echo "Quick Load Test (30 seconds each)"
echo "=========================================="
echo ""

# Check if Artillery is installed
if ! command -v artillery &> /dev/null; then
    echo "Artillery is not installed. Please install it:"
    echo "  npm install -g artillery"
    exit 1
fi

# Create reports directory
mkdir -p reports

echo "Testing Registration Endpoint (30s @ 10 req/s)..."
artillery quick --duration 30 --rate 10 \
  --num 10 \
  http://localhost:3000/api/register \
  --payload '{"name":"Test User","email":"test@example.com"}'

echo ""
echo "Testing Health Endpoint (30s @ 20 req/s)..."
artillery quick --duration 30 --rate 20 \
  http://localhost:3000/api/health

echo ""
echo "Quick test complete!"
