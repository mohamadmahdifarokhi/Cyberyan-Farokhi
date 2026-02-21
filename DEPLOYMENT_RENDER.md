# Deployment Guide: Render.com

Complete guide to deploy your DID/VC Registration System to Render.com for free.

## Prerequisites

- GitHub account with your code pushed
- Render.com account (free tier)
- MongoDB Atlas account (free tier)
- CloudAMQP account (free tier) - for RabbitMQ

## Step-by-Step Deployment

### 1. Prepare MongoDB (Free Tier)

**Option A: MongoDB Atlas (Recommended)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account and cluster (M0 Free tier)
3. Create database user:
   - Username: `admin`
   - Password: (generate strong password)
4. Whitelist IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/vc_did_db?retryWrites=true&w=majority
   ```

**Option B: Use Render's PostgreSQL + Prisma**
- If you prefer, you can migrate to PostgreSQL (Render provides free tier)

### 2. Setup RabbitMQ (Free Tier)

1. Go to [CloudAMQP](https://www.cloudamqp.com/)
2. Create free account
3. Create new instance:
   - Plan: Little Lemur (Free)
   - Region: Choose closest to your users
4. Get AMQP URL:
   ```
   amqps://username:password@host.cloudamqp.com/vhost
   ```

### 3. Deploy to Render

#### Method A: Using render.yaml (Automatic)

1. Push code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com/)
3. Click "New" → "Blueprint"
4. Connect your GitHub repository
5. Render will detect `render.yaml` and create all services
6. Set environment variables (see below)

#### Method B: Manual Setup

**Deploy Backend:**

1. Go to Render Dashboard
2. Click "New" → "Web Service"
3. Connect GitHub repository
4. Configure:
   - Name: `vc-did-backend`
   - Environment: `Docker`
   - Dockerfile Path: `./backend/Dockerfile`
   - Docker Context: `./backend`
   - Instance Type: `Free`
5. Add environment variables (see section below)
6. Click "Create Web Service"

**Deploy Frontend:**

1. Click "New" → "Static Site"
2. Connect GitHub repository
3. Configure:
   - Name: `vc-did-frontend`
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/web-build`
4. Add environment variables:
   - `REACT_APP_API_URL`: Your backend URL (e.g., `https://vc-did-backend.onrender.com`)
5. Click "Create Static Site"

### 4. Environment Variables

#### Backend Environment Variables

Set these in Render Dashboard → Your Service → Environment:

```bash
# Required
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# MongoDB (from Atlas)
MONGODB_URL=mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/vc_did_db

# JWT Secret (generate random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long

# Encryption Key (generate 32 character string)
ENCRYPTION_KEY=your-32-char-encryption-key-here

# RabbitMQ (from CloudAMQP)
RABBITMQ_URL=amqps://username:password@host.cloudamqp.com/vhost

# CORS (your frontend URL)
CORS_ORIGIN=https://vc-did-frontend.onrender.com

# Optional: Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# API Configuration
API_VERSION=v1
API_PREFIX=/api
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_REGISTRATION_MAX=5
RATE_LIMIT_REGISTRATION_WINDOW_MS=900000
```

#### Frontend Environment Variables

```bash
# Backend API URL (your Render backend URL)
REACT_APP_API_URL=https://vc-did-backend.onrender.com

NODE_ENV=production
```

### 5. Generate Secure Keys

Use these commands to generate secure keys:

```bash
# JWT Secret (64 characters)
openssl rand -base64 48

# Encryption Key (32 characters)
openssl rand -hex 16
```

### 6. Update Backend Code for Production

Make sure your backend handles CORS properly. Check `backend/src/server.ts`:

```typescript
import cors from 'cors';

const corsOrigin = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

app.use(cors({
  origin: corsOrigin,
  credentials: true
}));
```

### 7. Update Frontend API Configuration

Update `frontend/src/services/api.ts`:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
```

### 8. Test Deployment

Once deployed, test your endpoints:

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

### 9. Access Your Application

- Frontend: `https://vc-did-frontend.onrender.com`
- Backend API: `https://vc-did-backend.onrender.com`
- API Docs: `https://vc-did-backend.onrender.com/api`

## Important Notes

### Free Tier Limitations

- Services sleep after 15 minutes of inactivity
- Cold start takes ~30 seconds
- 750 hours/month per service (enough for 1 service 24/7)
- Limited bandwidth and build minutes

### Keeping Services Awake

Use a service like [UptimeRobot](https://uptimerobot.com/) (free) to ping your backend every 5 minutes:

1. Create UptimeRobot account
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://vc-did-backend.onrender.com/health`
   - Interval: 5 minutes

### Database Backups

MongoDB Atlas free tier includes:
- Automatic backups (retained for 2 days)
- Manual backup/restore via UI

## Troubleshooting

### Build Fails

Check build logs in Render Dashboard:
- Ensure all dependencies are in `package.json`
- Check Dockerfile syntax
- Verify build commands

### Service Won't Start

1. Check environment variables are set correctly
2. Verify MongoDB connection string
3. Check logs: Dashboard → Your Service → Logs
4. Ensure port is set to `3001` (or PORT env var)

### CORS Errors

1. Verify `CORS_ORIGIN` includes your frontend URL
2. Check frontend is using correct backend URL
3. Ensure credentials are handled properly

### Database Connection Issues

1. Verify MongoDB Atlas IP whitelist includes `0.0.0.0/0`
2. Check connection string format
3. Ensure database user has correct permissions
4. Test connection string locally first

### RabbitMQ Connection Issues

1. Verify CloudAMQP URL is correct
2. Check if free tier has limits
3. Monitor CloudAMQP dashboard for errors

## Alternative: Deploy Without RabbitMQ

If you want to simplify deployment, you can disable RabbitMQ:

1. Comment out RabbitMQ code in backend
2. Remove RabbitMQ environment variables
3. Use direct database writes instead of message queue

## Monitoring

### Render Dashboard

- View logs in real-time
- Monitor CPU/Memory usage
- Check deployment history
- View metrics

### MongoDB Atlas

- Monitor database performance
- View query patterns
- Check storage usage

### CloudAMQP

- Monitor message queue
- View connection stats
- Check message rates

## Scaling

When you outgrow free tier:

1. Upgrade to Render paid plan ($7/month)
   - No sleep
   - Better performance
   - More resources

2. Upgrade MongoDB Atlas ($9/month)
   - More storage
   - Better performance
   - Advanced features

3. Upgrade CloudAMQP ($9/month)
   - More connections
   - Better throughput

## Cost Comparison

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Render | $0 (with sleep) | $7/month |
| MongoDB Atlas | $0 (512MB) | $9/month |
| CloudAMQP | $0 (limited) | $9/month |
| **Total** | **$0** | **$25/month** |

## Security Checklist

- [ ] Strong JWT secret (min 32 chars)
- [ ] Unique encryption key
- [ ] MongoDB user with limited permissions
- [ ] CORS configured correctly
- [ ] Environment variables set (not hardcoded)
- [ ] HTTPS enabled (automatic on Render)
- [ ] Rate limiting configured
- [ ] Input validation enabled

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificate (automatic on Render)
3. Set up monitoring and alerts
4. Configure backup strategy
5. Add CI/CD pipeline
6. Set up staging environment

## Support

- Render Docs: https://render.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com/
- CloudAMQP Docs: https://www.cloudamqp.com/docs/

## Demo URL

Once deployed, add your URLs here:

- Frontend: `https://your-app.onrender.com`
- Backend: `https://your-api.onrender.com`
- API Docs: `https://your-api.onrender.com/api`

---

**Deployment Time:** ~15-20 minutes
**Cost:** $0 (free tier)
**Maintenance:** Minimal
