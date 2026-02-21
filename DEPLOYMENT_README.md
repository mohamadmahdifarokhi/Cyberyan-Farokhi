# Deployment Documentation Index 📚

Complete guide to deploying your DID/VC Registration System to production.

## Quick Links

| Document | Purpose | Time | Difficulty |
|----------|---------|------|------------|
| [Quick Start](./QUICK_START_DEPLOY.md) | Fastest deployment | 10 min | Easy |
| [Visual Guide](./DEPLOYMENT_VISUAL_GUIDE.md) | Step-by-step with diagrams | 15 min | Easy |
| [Checklist](./DEPLOYMENT_CHECKLIST.md) | Ensure nothing is missed | 20 min | Easy |
| [Complete Guide](./DEPLOYMENT_RENDER.md) | Detailed instructions | 30 min | Medium |
| [Alternatives](./DEPLOYMENT_ALTERNATIVES.md) | Other platforms | Varies | Medium |

## Choose Your Path

### 🚀 I want to deploy NOW (10 minutes)
→ Follow [QUICK_START_DEPLOY.md](./QUICK_START_DEPLOY.md)

### 📊 I want visual step-by-step (15 minutes)
→ Follow [DEPLOYMENT_VISUAL_GUIDE.md](./DEPLOYMENT_VISUAL_GUIDE.md)

### ✅ I want a checklist (20 minutes)
→ Follow [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

### 📚 I want complete details (30 minutes)
→ Follow [DEPLOYMENT_RENDER.md](./DEPLOYMENT_RENDER.md)

### 🔄 I want to compare platforms
→ Read [DEPLOYMENT_ALTERNATIVES.md](./DEPLOYMENT_ALTERNATIVES.md)

## What You'll Deploy

```
┌─────────────────────────────────────┐
│  Your Complete Application          │
├─────────────────────────────────────┤
│  ✓ Backend API (Node.js)            │
│  ✓ Frontend (React Native Web)      │
│  ✓ MongoDB Database                 │
│  ✓ RabbitMQ Queue                   │
│  ✓ SSL Certificate                  │
│  ✓ Auto-deployments                 │
└─────────────────────────────────────┘
```

## Prerequisites

Before you start, create free accounts:

1. **GitHub** - Code hosting
   - URL: https://github.com
   - Time: 2 minutes

2. **Render.com** - App hosting
   - URL: https://render.com
   - Time: 2 minutes

3. **MongoDB Atlas** - Database
   - URL: https://mongodb.com/cloud/atlas
   - Time: 5 minutes

4. **CloudAMQP** - Message queue
   - URL: https://cloudamqp.com
   - Time: 3 minutes

**Total setup time:** ~12 minutes

## Deployment Methods

### Method 1: Automated (Recommended)

Use the deployment helper script:

```bash
./deploy.sh
```

This will:
- ✅ Check all required files
- ✅ Generate secure keys
- ✅ Guide you through deployment
- ✅ Offer to push to GitHub

### Method 2: Manual

Follow step-by-step guides:
1. [Quick Start](./QUICK_START_DEPLOY.md) - Fastest
2. [Visual Guide](./DEPLOYMENT_VISUAL_GUIDE.md) - Most detailed
3. [Checklist](./DEPLOYMENT_CHECKLIST.md) - Most thorough

### Method 3: CI/CD

Use GitHub Actions (automatic):
- Push to main branch
- GitHub Actions triggers
- Render auto-deploys
- No manual steps needed

## Platform Comparison

| Platform | Cost | Setup Time | Performance | Best For |
|----------|------|------------|-------------|----------|
| **Render** | $0 | 15 min | Good | Full-stack apps |
| Railway | $5 credit | 20 min | Better | Docker apps |
| Fly.io | $0* | 30 min | Best | Global apps |
| Vercel | $0 | 10 min | Excellent | Frontend only |
| Netlify | $0 | 10 min | Excellent | Static sites |

*Requires credit card

**Recommendation:** Start with Render (easiest, completely free)

## What's Included

### Configuration Files

All deployment files are ready:

- ✅ `render.yaml` - Render Blueprint configuration
- ✅ `backend/Dockerfile` - Backend container
- ✅ `frontend/Dockerfile` - Frontend container
- ✅ `backend/.env.render` - Backend environment template
- ✅ `frontend/.env.render` - Frontend environment template
- ✅ `.renderignore` - Files to exclude
- ✅ `.github/workflows/deploy-render.yml` - CI/CD pipeline
- ✅ `deploy.sh` - Deployment helper script

### Documentation

Complete guides for every scenario:

- ✅ Quick start guide
- ✅ Visual step-by-step guide
- ✅ Deployment checklist
- ✅ Complete detailed guide
- ✅ Alternative platforms guide
- ✅ Troubleshooting guide

## Deployment Flow

```
1. Prepare Code
   └─▶ Run ./deploy.sh
   
2. Push to GitHub
   └─▶ git push origin main
   
3. Setup Services
   ├─▶ MongoDB Atlas (database)
   └─▶ CloudAMQP (queue)
   
4. Deploy on Render
   ├─▶ Connect GitHub
   ├─▶ Set environment variables
   └─▶ Deploy
   
5. Test & Monitor
   ├─▶ Test endpoints
   ├─▶ Setup monitoring
   └─▶ Done! 🎉
```

## Cost Breakdown

### Free Tier (Recommended for Demo)

| Service | Cost | Limits |
|---------|------|--------|
| Render | $0 | 750 hrs/month, cold starts |
| MongoDB Atlas | $0 | 512MB storage |
| CloudAMQP | $0 | Limited connections |
| **Total** | **$0** | Perfect for demos |

### Paid Tier (Production)

| Service | Cost | Benefits |
|---------|------|----------|
| Render | $7/mo | No cold starts, better CPU |
| MongoDB Atlas | $9/mo | More storage, backups |
| CloudAMQP | $9/mo | More connections |
| **Total** | **$25/mo** | Production-ready |

## Support & Help

### Documentation
- [Quick Start](./QUICK_START_DEPLOY.md)
- [Visual Guide](./DEPLOYMENT_VISUAL_GUIDE.md)
- [Checklist](./DEPLOYMENT_CHECKLIST.md)
- [Complete Guide](./DEPLOYMENT_RENDER.md)
- [Alternatives](./DEPLOYMENT_ALTERNATIVES.md)

### External Resources
- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- CloudAMQP Docs: https://www.cloudamqp.com/docs/

### Common Issues

**Build fails?**
→ Check [Troubleshooting section](./DEPLOYMENT_RENDER.md#troubleshooting)

**Can't connect to database?**
→ Verify IP whitelist (0.0.0.0/0)

**CORS errors?**
→ Update CORS_ORIGIN with frontend URL

**Service sleeps?**
→ Setup UptimeRobot monitoring

## Quick Commands

### Generate Secure Keys
```bash
# JWT Secret
openssl rand -base64 48

# Encryption Key
openssl rand -hex 16
```

### Test Deployment
```bash
# Health check
curl https://your-backend.onrender.com/health

# Test registration
curl -X POST https://your-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com"}'
```

### Deploy Updates
```bash
# Commit changes
git add .
git commit -m "Update feature"

# Push (auto-deploys)
git push origin main
```

## Success Criteria

Your deployment is successful when:

- ✅ Backend health check returns 200
- ✅ Frontend loads without errors
- ✅ User registration works
- ✅ Credentials are issued
- ✅ Data persists in database
- ✅ No CORS errors
- ✅ HTTPS is enabled
- ✅ Monitoring is active

## Next Steps After Deployment

1. **Add Custom Domain** (optional)
   - Purchase domain
   - Configure DNS
   - Add to Render

2. **Setup Monitoring**
   - UptimeRobot for uptime
   - Render logs for errors
   - MongoDB Atlas for database

3. **Configure Backups**
   - MongoDB Atlas auto-backups
   - Export environment variables
   - Document credentials

4. **Add CI/CD**
   - GitHub Actions (included)
   - Auto-deploy on push
   - Run tests before deploy

5. **Create Staging**
   - Separate environment
   - Test before production
   - Safe experimentation

## Frequently Asked Questions

**Q: How long does deployment take?**
A: 10-20 minutes for first deployment

**Q: Is it really free?**
A: Yes! All services have generous free tiers

**Q: What are cold starts?**
A: Free tier services sleep after 15 min inactivity, take ~30s to wake

**Q: How do I avoid cold starts?**
A: Use UptimeRobot to ping every 5 minutes, or upgrade to paid tier

**Q: Can I use my own domain?**
A: Yes! Add custom domain in Render dashboard

**Q: How do I update my app?**
A: Just push to GitHub, Render auto-deploys

**Q: What if something breaks?**
A: Check logs in Render dashboard, or rollback to previous deployment

**Q: Can I deploy to other platforms?**
A: Yes! See [DEPLOYMENT_ALTERNATIVES.md](./DEPLOYMENT_ALTERNATIVES.md)

## Timeline

### First Deployment
- Preparation: 5 minutes
- Account setup: 10 minutes
- Configuration: 5 minutes
- Deployment: 10 minutes
- Testing: 5 minutes
- **Total: ~35 minutes**

### Subsequent Deployments
- Code changes: varies
- Push to GitHub: 1 minute
- Auto-deploy: 5 minutes
- **Total: ~6 minutes**

## Checklist

Before you start:
- [ ] Code is working locally
- [ ] Tests are passing
- [ ] Dependencies are up to date
- [ ] Environment variables documented
- [ ] GitHub account created
- [ ] Render account created
- [ ] MongoDB Atlas account created
- [ ] CloudAMQP account created

## Get Started

Ready to deploy? Choose your path:

1. **Fastest:** [Quick Start Guide](./QUICK_START_DEPLOY.md)
2. **Visual:** [Visual Guide](./DEPLOYMENT_VISUAL_GUIDE.md)
3. **Thorough:** [Complete Checklist](./DEPLOYMENT_CHECKLIST.md)
4. **Detailed:** [Full Documentation](./DEPLOYMENT_RENDER.md)

Or just run:
```bash
./deploy.sh
```

---

**Need help?** Check the troubleshooting sections in each guide.

**Want alternatives?** See [DEPLOYMENT_ALTERNATIVES.md](./DEPLOYMENT_ALTERNATIVES.md)

**Ready to deploy?** Start with [QUICK_START_DEPLOY.md](./QUICK_START_DEPLOY.md)

🚀 **Happy deploying!**
