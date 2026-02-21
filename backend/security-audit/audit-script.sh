#!/bin/bash

# Security Audit Script for VC/DID System
# Performs comprehensive security checks

set -e

echo "=========================================="
echo "Security Audit for VC/DID System"
echo "=========================================="
echo ""

# Create reports directory
mkdir -p reports

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="reports/security-audit_${TIMESTAMP}.md"

# Initialize report
cat > "$REPORT_FILE" << EOF
# Security Audit Report

**Date**: $(date)
**System**: VC/DID Enhancement

## Executive Summary

This report documents the security audit performed on the VC/DID system.

---

EOF

echo "1. Running npm audit on backend..."
echo "## 1. NPM Audit - Backend" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"
npm audit >> "$REPORT_FILE" 2>&1 || true
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "2. Checking for secrets in environment variables..."
echo "## 2. Environment Variables Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Check if secrets are properly configured
if [ -f ".env.example" ]; then
    echo "✅ .env.example file exists" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Environment variables defined:" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    cat .env.example >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
else
    echo "❌ .env.example file not found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

# Check if .env is in .gitignore
if grep -q "\.env" ../.gitignore 2>/dev/null; then
    echo "✅ .env is in .gitignore" >> "$REPORT_FILE"
else
    echo "❌ .env is NOT in .gitignore - SECURITY RISK!" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

echo "3. Checking rate limiting configuration..."
echo "## 3. Rate Limiting Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "express-rate-limit" src/ > /dev/null 2>&1; then
    echo "✅ Rate limiting is implemented" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Rate limiter usage:" >> "$REPORT_FILE"
    echo "\`\`\`typescript" >> "$REPORT_FILE"
    grep -A 5 "rateLimit" src/middleware/*.ts 2>/dev/null | head -20 >> "$REPORT_FILE" || echo "Could not extract rate limiter config" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
else
    echo "❌ Rate limiting not found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

echo "4. Checking encryption implementation..."
echo "## 4. Encryption Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "encrypt\|decrypt" src/ > /dev/null 2>&1; then
    echo "✅ Encryption functions found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Files with encryption:" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    grep -l "encrypt\|decrypt" src/**/*.ts 2>/dev/null >> "$REPORT_FILE" || echo "No TypeScript files with encryption" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
else
    echo "❌ Encryption not found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

echo "5. Checking input validation..."
echo "## 5. Input Validation Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "sanitize\|validate" src/ > /dev/null 2>&1; then
    echo "✅ Input validation/sanitization found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Validation usage:" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
    grep -l "sanitize\|validate" src/**/*.ts 2>/dev/null | head -10 >> "$REPORT_FILE" || echo "No validation files found" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
else
    echo "❌ Input validation not found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

echo "6. Checking security headers (Helmet)..."
echo "## 6. Security Headers Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "helmet" src/ > /dev/null 2>&1; then
    echo "✅ Helmet middleware found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "Helmet usage:" >> "$REPORT_FILE"
    echo "\`\`\`typescript" >> "$REPORT_FILE"
    grep -A 3 "helmet" src/**/*.ts 2>/dev/null | head -15 >> "$REPORT_FILE" || echo "Could not extract helmet config" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
else
    echo "❌ Helmet not found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

echo "7. Checking JWT expiration..."
echo "## 7. JWT Configuration Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

if grep -r "expiresIn\|jwt" src/ > /dev/null 2>&1; then
    echo "✅ JWT implementation found" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "JWT configuration:" >> "$REPORT_FILE"
    echo "\`\`\`typescript" >> "$REPORT_FILE"
    grep -A 2 "expiresIn" src/**/*.ts 2>/dev/null | head -10 >> "$REPORT_FILE" || echo "Could not extract JWT config" >> "$REPORT_FILE"
    echo "\`\`\`" >> "$REPORT_FILE"
else
    echo "❌ JWT configuration not found" >> "$REPORT_FILE"
fi
echo "" >> "$REPORT_FILE"

echo "8. Checking for hardcoded secrets..."
echo "## 8. Hardcoded Secrets Check" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Search for common secret patterns
SECRETS_FOUND=0
echo "Scanning for potential hardcoded secrets..." >> "$REPORT_FILE"
echo "\`\`\`" >> "$REPORT_FILE"

# Check for API keys
if grep -r "api[_-]key.*=.*['\"][a-zA-Z0-9]" src/ 2>/dev/null; then
    echo "⚠️  Potential API keys found" >> "$REPORT_FILE"
    SECRETS_FOUND=1
fi

# Check for passwords
if grep -r "password.*=.*['\"][^$]" src/ 2>/dev/null | grep -v "process.env" | grep -v "req.body"; then
    echo "⚠️  Potential hardcoded passwords found" >> "$REPORT_FILE"
    SECRETS_FOUND=1
fi

# Check for tokens
if grep -r "token.*=.*['\"][a-zA-Z0-9]{20,}" src/ 2>/dev/null | grep -v "process.env"; then
    echo "⚠️  Potential hardcoded tokens found" >> "$REPORT_FILE"
    SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 0 ]; then
    echo "✅ No obvious hardcoded secrets found" >> "$REPORT_FILE"
fi
echo "\`\`\`" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## Summary" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "Audit completed. Review the findings above and address any issues." >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo ""
echo "=========================================="
echo "Audit Complete!"
echo "=========================================="
echo ""
echo "Report saved to: $REPORT_FILE"
echo ""
echo "Next steps:"
echo "1. Review the report"
echo "2. Fix critical and high vulnerabilities"
echo "3. Run: npm audit fix"
echo "4. For breaking changes: npm audit fix --force (carefully)"
echo "5. Re-run this script to verify fixes"
