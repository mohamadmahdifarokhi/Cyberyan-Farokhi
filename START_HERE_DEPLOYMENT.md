# 🚀 Start Here: Deploy Your App

Welcome! This guide will help you deploy your DID/VC Registration System to production for FREE.

## What You're Deploying

A complete identity management system with:
- Backend API (Node.js + Express)
- Frontend (React Native Web)
- MongoDB Database
- RabbitMQ Message Queue
- SSL Certificate
- Auto-deployments

**Cost:** $0/month (free tier)
**Time:** 10-20 minutes
**Difficulty:** Easy

---

## Step 1: Choose Your Path (30 seconds)

Pick the guide that fits your style:

### 🏃 I want the fastest way
→ **[QUICK_START_DEPLOY.md](./QUICK_START_DEPLOY.md)** (10 minutes)
- Minimal explanation
- Quick commands
- Get online fast

### 📊 I want visual step-by-step
→ **[DEPLOYMENT_VISUAL_GUIDE.md](./DEPLOYMENT_VISUAL_GUIDE.md)** (15 minutes)
- Diagrams and flowcharts
- Visual instructions
- Easy to follow

### ✅ I want a complete checklist
→ **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** (20 minutes)
- Nothing missed
- Thorough verification
- Professional approach

### 📚 I want all the details
→ **[DEPLOYMENT_RENDER.md](./DEPLOYMENT_RENDER.md)** (30 minutes)
- Complete explanations
- Troubleshooting
- Deep understanding

### 🤔 I want to compare platforms
→ **[PLATFORM_COMPARISON.md](./PLATFORM_COMPARISON.md)** (5 minutes)
- Render vs Railway vs Fly.io
- Pros and cons
- Cost comparison

---

## Step 2: Quick Setup (2 minutes)

Before you start, run this:

```bash
./deploy.sh
```

This will:
- ✅ Check all deployment files
- ✅ Generate secure keys (save these!)
- ✅ Show you next steps

**Save the generated keys!** You'll need them later.

---

## Step 3: Create Accounts (12 minutes)

You'll need these free accounts:

### 1. GitHub (2 min)
- URL: https://github.com
- Purpose: Code hosting
- Cost: Free

### 2. Render.com (2 min)
- URL: https://render.com
- Purpose: App hosting
- Cost: Free
- Note: No credit card required

### 3. MongoDB Atlas (5 min)
- URL: https://mongodb.com/cloud/atlas
- Purpose: Database
- Cost: Free (512MB)
- Note: Choose M0 Free tier

### 4. CloudAMQP (3 min)
- URL: https://cloudamqp.com
- Purpose: Message queue
- Cost: Free (Little Lemur plan)
- Note: Limited connections

---

## Step 4: Deploy (10 minutes)

### Quick Version

```bash
# 1. Push to GitHub
git add .
git commit -m "Add deployment config"
git push origin main

# 2. Go to Render
# https://dashboard.render.com
# Click: New → Blueprint → Connect GitHub repo

# 3. Set environment variables
# (Use keys from deploy.sh)

# 4. Deploy!
# Render will build and deploy automatically
```

### Detailed Version

Follow your chosen guide from Step 1.

---

## Step 5: Test (3 minutes)

### Test Backend

```bash
curl https://your-backend.onrender.com/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### Test Frontend

Open in browser:
```
https://your-frontend.onrender.com
```

Should see registration form.

### Test Registration

Fill out the form and submit. You should:
- ✅ Get a DID
- ✅ Receive a VC
- ✅ See credentials in wallet
- ✅ Generate QR code

---

## Common Questions

### Q: Which platform should I use?
**A:** Render.com (easiest, completely free, no credit card)

### Q: How long does it take?
**A:** 10-20 minutes for first deployment

### Q: Is it really free?
**A:** Yes! All services have generous free tiers

### Q: What about cold starts?
**A:** Free tier services sleep after 15 min, take ~30s to wake. Use UptimeRobot to keep awake.

### Q: Can I use my own domain?
**A:** Yes! Add custom domain in Render dashboard

### Q: How do I update my app?
**A:** Just push to GitHub, Render auto-deploys

---

## Troubleshooting

### Build fails
→ Check Render logs
→ Verify Dockerfile syntax
→ Test build locally

### Can't connect to database
→ Check MongoDB IP whitelist (0.0.0.0/0)
→ Verify connection string

### CORS errors
→ Update CORS_ORIGIN with frontend URL
→ Check browser console

### Need more help?
→ See troubleshooting section in your chosen guide

---

## What's Included

### Configuration Files ✅
- `render.yaml` - Auto-deploy configuration
- `backend/Dockerfile.render` - Backend container
- `frontend/Dockerfile.render` - Frontend container
- `.env.render` files - Environment templates
- `deploy.sh` - Helper script
- `.github/workflows/deploy-render.yml` - CI/CD

### Documentation ✅
- Quick start guide (10 min)
- Visual guide (15 min)
- Complete checklist (20 min)
- Detailed guide (30 min)
- Platform comparison (5 min)
- Alternatives guide (10 min)

---

## Next Steps After Deployment

1. **Add Monitoring** (5 min)
   - Set up UptimeRobot
   - Keep service awake
   - Get uptime alerts

2. **Custom Domain** (10 min)
   - Purchase domain
   - Configure DNS
   - Add to Render

3. **Backups** (5 min)
   - MongoDB Atlas auto-backups
   - Export environment variables
   - Document credentials

4. **CI/CD** (Already done!)
   - Push to main = auto-deploy
   - GitHub Actions configured
   - No manual steps

---

## Cost Summary

### Free Tier (Perfect for Demos)
- Render: $0
- MongoDB Atlas: $0 (512MB)
- CloudAMQP: $0 (limited)
- **Total: $0/month**

### Paid Tier (Production)
- Render: $7/month (no sleep)
- MongoDB Atlas: $9/month (more storage)
- CloudAMQP: $9/month (more connections)
- **Total: $25/month**

---

## Documentation Index

| Guide | Time | Best For |
|-------|------|----------|
| [Quick Start](./QUICK_START_DEPLOY.md) | 10 min | Speed |
| [Visual Guide](./DEPLOYMENT_VISUAL_GUIDE.md) | 15 min | Clarity |
| [Checklist](./DEPLOYMENT_CHECKLIST.md) | 20 min | Thoroughness |
| [Complete Guide](./DEPLOYMENT_RENDER.md) | 30 min | Understanding |
| [Alternatives](./DEPLOYMENT_ALTERNATIVES.md) | 10 min | Options |
| [Comparison](./PLATFORM_COMPARISON.md) | 5 min | Decision |
| [Summary](./DEPLOYMENT_SUMMARY.md) | 5 min | Overview |

---

## Ready to Deploy?

### Option 1: Automated
```bash
./deploy.sh
```

### Option 2: Quick Start
Read [QUICK_START_DEPLOY.md](./QUICK_START_DEPLOY.md)

### Option 3: Visual Guide
Read [DEPLOYMENT_VISUAL_GUIDE.md](./DEPLOYMENT_VISUAL_GUIDE.md)

---

## Support

**Documentation:**
- [Deployment Index](./DEPLOYMENT_README.md)
- [Summary](./DEPLOYMENT_SUMMARY.md)

**External:**
- Render: https://render.com/docs
- MongoDB: https://docs.atlas.mongodb.com/
- CloudAMQP: https://www.cloudamqp.com/docs/

---

## Success Checklist

Your deployment is successful when:

- ✅ Backend health check works
- ✅ Frontend loads
- ✅ User registration works
- ✅ DID is generated
- ✅ VC is issued
- ✅ Data persists
- ✅ No CORS errors
- ✅ HTTPS enabled

---

**Time to deploy:** 10-20 minutes
**Cost:** $0 (free tier)
**Difficulty:** Easy

🎉 **Let's get your app online!**

Choose your guide above and start deploying.
