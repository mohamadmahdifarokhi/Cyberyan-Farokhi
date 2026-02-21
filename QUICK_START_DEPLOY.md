# Quick Start: Deploy in 10 Minutes

The fastest way to get your DID/VC app online for free.

## Prerequisites (2 minutes)

Create free accounts:
1. [GitHub](https://github.com) - for code hosting
2. [Render](https://render.com) - for app hosting
3. [MongoDB Atlas](https://mongodb.com/cloud/atlas) - for database
4. [CloudAMQP](https://cloudamqp.com) - for message queue

## Step 1: Prepare Code (1 minute)

```bash
# Make sure you're in the project directory
cd /path/to/your/project

# Run deployment helper
./deploy.sh
```

This will:
- Generate secure keys
- Check deployment files
- Show next steps

## Step 2: Push to GitHub (1 minute)

```bash
# If not already done
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Step 3: Setup MongoDB (2 minutes)

1. Go to [MongoDB Atlas](https://mongodb.com/cloud/atlas)
2. Click "Build a Database" → "Free" (M0)
3. Choose cloud provider and region
4. Create cluster (takes ~3 minutes)
5. Security → Database Access → Add User:
   - Username: `admin`
   - Password: (generate and save)
6. Security → Network Access → Add IP:
   - IP: `0.0.0.0/0` (allow all)
7. Database → Connect → Connect your application:
   - Copy connection string
   - Replace `<password>` with your password

**Your MongoDB URL:**
```
mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vc_did_db?retryWrites=true&w=majority
```

## Step 4: Setup RabbitMQ (2 minutes)

1. Go to [CloudAMQP](https://cloudamqp.com)
2. Create account
3. Create instance:
   - Name: `vc-did-queue`
   - Plan: "Little Lemur" (Free)
   - Region: Choose closest
4. Click instance → Details
5. Copy AMQP URL

**Your RabbitMQ URL:**
```
amqps://username:password@host.cloudamqp.com/vhost
```

## Step 5: Deploy to Render (4 minutes)

### 5.1 Connect GitHub

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Blueprint"
3. Connect GitHub account
4. Select your repository
5. Click "Connect"

### 5.2 Set Environment Variables

Render will detect `render.yaml`. Now add environment variables:

**For Backend Service:**

Click on "vc-did-backend" → Environment → Add Environment Variables:

```bash
# Copy these and paste in Render
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# MongoDB (from Step 3)
MONGODB_URL=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vc_did_db

# JWT Secret (from deploy.sh output)
JWT_SECRET=YOUR_GENERATED_JWT_SECRET

# Encryption Key (from deploy.sh output)
ENCRYPTION_KEY=YOUR_GENERATED_ENCRYPTION_KEY

# RabbitMQ (from Step 4)
RABBITMQ_URL=amqps://username:password@host.cloudamqp.com/vhost

# CORS (will update after frontend deploys)
CORS_ORIGIN=http://localhost:3000

# Optional settings
API_VERSION=v1
API_PREFIX=/api
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**For Frontend Service:**

Click on "vc-did-frontend" → Environment → Add Environment Variables:

```bash
NODE_ENV=production

# Backend URL (will be available after backend deploys)
REACT_APP_API_URL=https://vc-did-backend.onrender.com
```

### 5.3 Deploy

1. Click "Apply" or "Create Blueprint"
2. Wait for services to build and deploy (~5-10 minutes)
3. Watch logs for any errors

### 5.4 Update CORS

Once frontend is deployed:

1. Copy frontend URL (e.g., `https://vc-did-frontend.onrender.com`)
2. Go to backend service → Environment
3. Update `CORS_ORIGIN` to your frontend URL
4. Save (service will redeploy)

## Step 6: Test Your App (1 minute)

### Test Backend

```bash
# Health check
curl https://vc-did-backend.onrender.com/health

# Test registration
curl -X POST https://vc-did-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com"
  }'
```

### Test Frontend

Open your frontend URL in browser:
```
https://vc-did-frontend.onrender.com
```

## Troubleshooting

### Backend won't start

**Check logs:**
1. Render Dashboard → vc-did-backend → Logs
2. Look for errors

**Common issues:**
- MongoDB connection string incorrect
- Environment variables missing
- Port not set correctly

**Fix:**
- Verify MongoDB URL format
- Check all env vars are set
- Ensure PORT=3001

### Frontend shows API errors

**Issue:** Can't connect to backend

**Fix:**
1. Check `REACT_APP_API_URL` is correct
2. Verify backend is running
3. Check CORS settings in backend

### Database connection fails

**Issue:** MongoDB connection timeout

**Fix:**
1. MongoDB Atlas → Network Access
2. Ensure `0.0.0.0/0` is whitelisted
3. Check connection string format
4. Verify username/password

### Service sleeps (cold start)

**Issue:** First request takes 30 seconds

**Solution:** Use [UptimeRobot](https://uptimerobot.com) (free):
1. Create account
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://vc-did-backend.onrender.com/health`
   - Interval: 5 minutes
3. This keeps your service awake

## Your Deployed URLs

After deployment, save these:

```
Frontend: https://vc-did-frontend.onrender.com
Backend:  https://vc-did-backend.onrender.com
API Docs: https://vc-did-backend.onrender.com/api
```

## Next Steps

- [ ] Add custom domain (optional)
- [ ] Set up monitoring (UptimeRobot)
- [ ] Configure backups
- [ ] Add CI/CD pipeline
- [ ] Set up staging environment

## Cost

**Total: $0/month** (free tier)

Includes:
- Backend hosting
- Frontend hosting
- MongoDB database (512MB)
- RabbitMQ queue
- SSL certificates
- Auto-deployments

## Upgrade When Needed

When you outgrow free tier:
- Render: $7/month (no sleep, better performance)
- MongoDB Atlas: $9/month (more storage)
- CloudAMQP: $9/month (more connections)

**Total paid: ~$25/month**

## Support

Need help?
- Full guide: [DEPLOYMENT_RENDER.md](./DEPLOYMENT_RENDER.md)
- Alternatives: [DEPLOYMENT_ALTERNATIVES.md](./DEPLOYMENT_ALTERNATIVES.md)
- Render Docs: https://render.com/docs

---

**Deployment time:** ~10 minutes
**Difficulty:** Easy
**Cost:** Free

🎉 Congratulations! Your app is now live!
