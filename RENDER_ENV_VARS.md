# Render Environment Variables Setup

Quick reference for setting up environment variables in Render Dashboard.

## ✅ What You Already Have

- **RabbitMQ URL**: Already configured in your .env.production ✓
  ```
  amqps://smsdqpkd:uTGZL1RXWIeabekaXB_6Vrx7y7RiJJyE@chameleon.lmq.cloudamqp.com/smsdqpkd
  ```

## 🔑 Generate Secure Keys

Run these commands to generate secure keys:

```bash
# JWT Secret (copy the output)
openssl rand -base64 48

# Encryption Key (copy the output)
openssl rand -hex 16
```

## 📋 Backend Environment Variables

Copy these into Render Dashboard → Backend Service → Environment:

```bash
# Basic Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# MongoDB - GET FROM MONGODB ATLAS
# Format: mongodb+srv://username:password@cluster.mongodb.net/vc_did_db
MONGODB_URL=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vc_did_db?retryWrites=true&w=majority

# RabbitMQ - ALREADY HAVE THIS ✓
RABBITMQ_URL=amqps://smsdqpkd:uTGZL1RXWIeabekaXB_6Vrx7y7RiJJyE@chameleon.lmq.cloudamqp.com/smsdqpkd

# JWT Secret - PASTE FROM COMMAND ABOVE
JWT_SECRET=<paste-generated-jwt-secret-here>
JWT_EXPIRATION=24h

# Encryption Key - PASTE FROM COMMAND ABOVE
ENCRYPTION_KEY=<paste-generated-encryption-key-here>

# CORS - UPDATE AFTER FRONTEND DEPLOYS
CORS_ORIGIN=http://localhost:3000

# API Configuration
API_VERSION=v1
API_PREFIX=/api
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_REGISTRATION_MAX=5
RATE_LIMIT_REGISTRATION_WINDOW_MS=900000

# Security
HELMET_ENABLED=true
```

## 📋 Frontend Environment Variables

Copy these into Render Dashboard → Frontend Service → Environment:

```bash
NODE_ENV=production

# Backend URL - UPDATE AFTER BACKEND DEPLOYS
# Will be something like: https://vc-did-backend.onrender.com
REACT_APP_API_URL=https://vc-did-backend.onrender.com
```

## 🗄️ MongoDB Atlas Setup (If You Don't Have It)

### Option 1: MongoDB Atlas (Recommended)

1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for free account
3. Click **"Create"** or **"Create a deployment"**
4. Choose **"M0 FREE"** (Shared cluster)
5. Select region closest to you
6. Click **"Create Deployment"**
7. Create database user:
   - Username: `admin`
   - Password: (generate strong password, save it!)
8. Add IP: Click **"Allow Access from Anywhere"** (0.0.0.0/0)
9. Get connection string:
   - Click **"Connect"** → **"Connect your application"**
   - Copy the connection string
   - Replace `<password>` with your password
   - Add `/vc_did_db` before the `?`

**Final format:**
```
mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/vc_did_db?retryWrites=true&w=majority
```

### Option 2: Use Render Without Database (Simplest for Testing)

If you want to deploy quickly without database:

1. Comment out database code in backend temporarily
2. Deploy to Render
3. Add database later

### Option 3: Use Railway (Includes Free Database)

Railway gives you $5 credit/month which includes database:

1. Go to https://railway.app
2. Sign up with GitHub
3. Add MongoDB service (included in credit)
4. Deploy your app

## 📝 Deployment Steps

### Step 1: Generate Keys
```bash
openssl rand -base64 48  # JWT_SECRET
openssl rand -hex 16     # ENCRYPTION_KEY
```
Save these outputs!

### Step 2: Setup MongoDB
- Follow Option 1 above to get MongoDB URL
- Or skip for now and deploy without database

### Step 3: Deploy to Render

1. Go to https://dashboard.render.com
2. Click **"New"** → **"Blueprint"**
3. Connect your GitHub repository
4. Render detects `render.yaml`
5. Add environment variables:
   - Click on **"vc-did-backend"** service
   - Go to **"Environment"** tab
   - Add all backend variables from above
   - Click on **"vc-did-frontend"** service
   - Add frontend variables
6. Click **"Apply"** or **"Create Blueprint"**
7. Wait 5-10 minutes for deployment

### Step 4: Update URLs

After deployment:

1. Copy backend URL (e.g., `https://vc-did-backend.onrender.com`)
2. Update frontend's `REACT_APP_API_URL` with backend URL
3. Copy frontend URL (e.g., `https://vc-did-frontend.onrender.com`)
4. Update backend's `CORS_ORIGIN` with frontend URL
5. Services will auto-redeploy

## ✅ Verification

### Test Backend
```bash
curl https://vc-did-backend.onrender.com/health
```

Should return:
```json
{"status":"ok","timestamp":"..."}
```

### Test Frontend
Open in browser:
```
https://vc-did-frontend.onrender.com
```

### Test Registration
Fill out the form and submit. Should work!

## 🚨 Common Issues

### Issue: MongoDB connection fails
**Solution:** 
- Check IP whitelist includes `0.0.0.0/0`
- Verify connection string format
- Check username/password

### Issue: CORS errors
**Solution:**
- Update `CORS_ORIGIN` with actual frontend URL
- Format: `https://vc-did-frontend.onrender.com`

### Issue: Service won't start
**Solution:**
- Check Render logs
- Verify all required env vars are set
- Check for typos in variable names

## 💰 Cost

- Render: $0 (free tier)
- MongoDB Atlas: $0 (M0 free tier, 512MB)
- CloudAMQP: $0 (already have free tier) ✓
- **Total: $0/month**

## 📚 Need More Help?

- Quick Start: `QUICK_START_DEPLOY.md`
- Visual Guide: `DEPLOYMENT_VISUAL_GUIDE.md`
- Complete Guide: `DEPLOYMENT_RENDER.md`

---

**You're ready to deploy!** 🚀

Just need to:
1. Generate keys (2 commands above)
2. Get MongoDB URL (or skip for now)
3. Deploy on Render
