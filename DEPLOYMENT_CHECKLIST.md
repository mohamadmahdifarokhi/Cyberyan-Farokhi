# Deployment Checklist ✅

Use this checklist to ensure smooth deployment to Render.com.

## Pre-Deployment

### Code Preparation
- [ ] All code committed to Git
- [ ] Tests passing locally
- [ ] Environment variables documented
- [ ] Dependencies up to date
- [ ] Build scripts working

### Accounts Created
- [ ] GitHub account (code hosting)
- [ ] Render.com account (app hosting)
- [ ] MongoDB Atlas account (database)
- [ ] CloudAMQP account (message queue)

### Repository Setup
- [ ] Code pushed to GitHub
- [ ] Repository is public or Render has access
- [ ] Main/master branch is default
- [ ] `.gitignore` excludes sensitive files

## Configuration Files

### Required Files
- [ ] `render.yaml` exists in root
- [ ] `backend/Dockerfile` exists
- [ ] `backend/.env.example` exists
- [ ] `frontend/.env.example` exists
- [ ] `DEPLOYMENT_RENDER.md` exists

### Security Keys Generated
- [ ] JWT_SECRET (min 32 characters)
- [ ] ENCRYPTION_KEY (32 characters)
- [ ] Keys stored securely (password manager)

## Database Setup (MongoDB Atlas)

### Cluster Configuration
- [ ] Free tier cluster created (M0)
- [ ] Region selected (closest to users)
- [ ] Cluster name: `vc-did-cluster`

### Security Settings
- [ ] Database user created
  - Username: `admin`
  - Password: (strong, saved)
- [ ] Network access configured
  - IP whitelist: `0.0.0.0/0`
- [ ] Connection string copied
  - Format: `mongodb+srv://...`

### Database Setup
- [ ] Database name: `vc_did_db`
- [ ] Collections will be auto-created
- [ ] Backup enabled (automatic)

## Message Queue Setup (CloudAMQP)

### Instance Configuration
- [ ] Free tier instance created (Little Lemur)
- [ ] Region selected
- [ ] Instance name: `vc-did-queue`

### Connection Details
- [ ] AMQP URL copied
- [ ] Format: `amqps://...`
- [ ] Management UI accessible

## Render Deployment

### Blueprint Setup
- [ ] Render Dashboard opened
- [ ] "New" → "Blueprint" clicked
- [ ] GitHub repository connected
- [ ] `render.yaml` detected

### Backend Service

#### Environment Variables Set
- [ ] `NODE_ENV=production`
- [ ] `PORT=3001`
- [ ] `HOST=0.0.0.0`
- [ ] `MONGODB_URL` (from Atlas)
- [ ] `JWT_SECRET` (generated)
- [ ] `ENCRYPTION_KEY` (generated)
- [ ] `RABBITMQ_URL` (from CloudAMQP)
- [ ] `CORS_ORIGIN` (frontend URL)
- [ ] `API_VERSION=v1`
- [ ] `API_PREFIX=/api`
- [ ] `LOG_LEVEL=info`

#### Service Configuration
- [ ] Service name: `vc-did-backend`
- [ ] Instance type: Free
- [ ] Auto-deploy enabled
- [ ] Health check path: `/health`

### Frontend Service

#### Environment Variables Set
- [ ] `NODE_ENV=production`
- [ ] `REACT_APP_API_URL` (backend URL)

#### Service Configuration
- [ ] Service name: `vc-did-frontend`
- [ ] Type: Static Site
- [ ] Build command correct
- [ ] Publish directory: `frontend/web-build`
- [ ] Auto-deploy enabled

### Deployment Process
- [ ] Blueprint applied
- [ ] Backend building
- [ ] Frontend building
- [ ] No build errors
- [ ] Services deployed successfully

## Post-Deployment

### Backend Verification
- [ ] Health endpoint responds
  ```bash
  curl https://vc-did-backend.onrender.com/health
  ```
- [ ] API endpoint responds
  ```bash
  curl https://vc-did-backend.onrender.com/api
  ```
- [ ] Registration endpoint works
  ```bash
  curl -X POST https://vc-did-backend.onrender.com/api/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@example.com"}'
  ```

### Frontend Verification
- [ ] Frontend URL loads
- [ ] No console errors
- [ ] Can access registration form
- [ ] API calls work
- [ ] Styling loads correctly

### Database Verification
- [ ] MongoDB Atlas shows connections
- [ ] Collections created automatically
- [ ] Data persists after restart

### Queue Verification
- [ ] CloudAMQP shows connections
- [ ] Messages being processed
- [ ] No connection errors

### CORS Configuration
- [ ] Backend CORS_ORIGIN updated with frontend URL
- [ ] Frontend can call backend
- [ ] No CORS errors in browser console

## Monitoring Setup

### UptimeRobot (Keep Service Awake)
- [ ] Account created
- [ ] Monitor added for backend
- [ ] URL: `https://vc-did-backend.onrender.com/health`
- [ ] Interval: 5 minutes
- [ ] Alert email configured

### Render Monitoring
- [ ] Email notifications enabled
- [ ] Deploy notifications on
- [ ] Error alerts configured

### MongoDB Monitoring
- [ ] Atlas alerts configured
- [ ] Performance monitoring enabled
- [ ] Storage alerts set

## Documentation

### URLs Documented
- [ ] Frontend URL saved
- [ ] Backend URL saved
- [ ] MongoDB connection string saved
- [ ] RabbitMQ URL saved

### Credentials Secured
- [ ] All passwords in password manager
- [ ] Environment variables backed up
- [ ] Access credentials documented

### Team Access
- [ ] Team members added to Render
- [ ] MongoDB access shared (if needed)
- [ ] Documentation shared

## Testing

### Functional Testing
- [ ] User registration works
- [ ] DID generation works
- [ ] VC issuance works
- [ ] JWT authentication works
- [ ] Wallet displays credentials
- [ ] QR code generation works
- [ ] Audit logs visible

### Performance Testing
- [ ] First load time acceptable
- [ ] Cold start time noted (~30s)
- [ ] API response times good
- [ ] No timeout errors

### Security Testing
- [ ] HTTPS enabled (automatic)
- [ ] Environment variables not exposed
- [ ] Rate limiting works
- [ ] Input validation works
- [ ] CORS configured correctly

## Optional Enhancements

### Custom Domain
- [ ] Domain purchased
- [ ] DNS configured
- [ ] Custom domain added in Render
- [ ] SSL certificate issued

### CI/CD Pipeline
- [ ] GitHub Actions configured
- [ ] Auto-deploy on push to main
- [ ] Tests run before deploy
- [ ] Deploy notifications

### Staging Environment
- [ ] Staging branch created
- [ ] Staging services deployed
- [ ] Separate database for staging
- [ ] Testing workflow established

### Analytics
- [ ] Google Analytics added (optional)
- [ ] Error tracking setup (Sentry)
- [ ] Performance monitoring
- [ ] User analytics

## Troubleshooting Checklist

If something goes wrong:

### Build Fails
- [ ] Check build logs in Render
- [ ] Verify Dockerfile syntax
- [ ] Check dependencies in package.json
- [ ] Test build locally

### Service Won't Start
- [ ] Check service logs
- [ ] Verify environment variables
- [ ] Check port configuration
- [ ] Verify health check endpoint

### Database Connection Fails
- [ ] Verify MongoDB connection string
- [ ] Check IP whitelist (0.0.0.0/0)
- [ ] Verify database user credentials
- [ ] Test connection locally

### Frontend Can't Reach Backend
- [ ] Verify REACT_APP_API_URL
- [ ] Check CORS_ORIGIN in backend
- [ ] Verify backend is running
- [ ] Check browser console for errors

### Cold Start Issues
- [ ] Set up UptimeRobot
- [ ] Consider upgrading to paid tier
- [ ] Optimize startup time
- [ ] Add health check endpoint

## Success Criteria

Your deployment is successful when:

- ✅ Backend health check returns 200
- ✅ Frontend loads without errors
- ✅ User can register and receive credentials
- ✅ Data persists in MongoDB
- ✅ Messages process through RabbitMQ
- ✅ No CORS errors
- ✅ HTTPS works
- ✅ Monitoring is active

## Maintenance Schedule

### Daily
- [ ] Check service status
- [ ] Review error logs
- [ ] Monitor uptime

### Weekly
- [ ] Review performance metrics
- [ ] Check database size
- [ ] Review security alerts
- [ ] Update dependencies (if needed)

### Monthly
- [ ] Review costs
- [ ] Backup database
- [ ] Update documentation
- [ ] Review and rotate secrets

## Support Resources

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com/
- **CloudAMQP Docs:** https://www.cloudamqp.com/docs/
- **Project Docs:** [DEPLOYMENT_RENDER.md](./DEPLOYMENT_RENDER.md)

## Rollback Plan

If deployment fails:

1. [ ] Revert to previous Git commit
2. [ ] Redeploy from Render Dashboard
3. [ ] Check environment variables
4. [ ] Review logs for errors
5. [ ] Test locally before redeploying

---

## Deployment Status

**Date:** _______________
**Deployed By:** _______________
**Frontend URL:** _______________
**Backend URL:** _______________
**Status:** ⬜ Success ⬜ Failed ⬜ In Progress

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

**Total Time:** ~15-20 minutes
**Difficulty:** Easy
**Cost:** $0 (free tier)

🎉 **Congratulations on your deployment!**
