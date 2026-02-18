# Railway Deployment Guide for HolyMon Backend

## Overview
This guide will walk you through deploying the HolyMon backend to Railway using the web dashboard.

## Prerequisites
- ✅ Railway account created
- ✅ GitHub repository: https://github.com/Tanwyhang/HolyMon-Monad
- ✅ Configuration files created: `Procfile`, `.railway/nixpacks.toml`

## Step 1: Create New Railway Project

1. Go to [railway.app](https://railway.app) and log in
2. Click **"New Project"** button
3. Select **"Deploy from GitHub repo"**
4. Find and select **`Tanwyhang/HolyMon-Monad`** repository
5. Click **"Deploy Now"**

## Step 2: Configure Service

Railway will automatically detect the project. We need to configure the backend service:

### Service Settings

1. Click on the project (it will have an auto-generated name like "holy-mon-mono" or similar)
2. Click **"+ New Service"** → **"GitHub"**
3. Select the same repository
4. Set **Root Directory** to: `backend`
5. Set **Name** to: `holymon-backend`
6. Click **"Create Service"**

### Service Configuration

After creating the service, click on it and configure:

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `bun install` |
| **Start Command** | `bun src/index.ts` |
| **Port** | `8765` (Railway should auto-detect this) |

**Note:** Railway will read `Procfile` and `.railway/nixpacks.toml` automatically, so these values might be pre-filled.

## Step 3: Set Environment Variables

Click on the **"Variables"** tab of your `holymon-backend` service and add the following:

### Required Variables

```env
# Monad Network
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=14314

# Backend Wallet (CRITICAL - Replace with your actual private key)
PRIVATE_KEY=your_actual_private_key_here

# ElizaOS (CRITICAL - Get from https://console.groq.com/)
GROQ_API_KEY=gsk_your_actual_groq_key_here
ELIZAOS_MODEL_PROVIDER=groq

# Server
PORT=8765
NODE_ENV=production

# ElizaOS Configuration
ELIZAOS_HYBRID_RATIO=0.5
ELIZAOS_CACHE_TTL=300000
ELIZAOS_LLM_TIMEOUT=10000

# Rate Limits (Optional - defaults shown)
ELIZAOS_RATE_LIMIT_RPM=10
ELIZAOS_RATE_LIMIT_TPM=5000
ELIZAOS_MAX_DAILY_REQUESTS=1000

# Cost Limits (Optional - defaults shown)
ELIZAOS_MAX_DAILY_COST=2.00
ELIZAOS_COST_PER_1K_TOKENS=0.08

# Optional: OpenAI (if you prefer over Groq)
OPENAI_API_KEY=
```

### Optional Variables (Only if deploying contracts)

```env
# Contract Addresses (leave blank for now)
AGENT_REGISTRY_ADDRESS=
TOKEN_LAUNCHPAD_ADDRESS=
MON_STAKING_ADDRESS=

# API Key (for request authentication, if needed)
API_KEY=
```

## Step 4: Deploy

1. Click on the **"Deployments"** tab
2. Click **"Deploy Now"** or **"Redeploy"**
3. Railway will:
   - Clone your GitHub repository
   - Install dependencies using `bun install`
   - Build the application
   - Start the service with `bun src/index.ts`
4. Wait for the deployment to complete (usually 1-2 minutes)
5. The status should change to **"Active"** (green checkmark)

## Step 5: Get Your Public URL

1. Click on the **"holymon-backend"** service
2. Look for the **"Settings"** tab → **"Networking"** or **"Domains"**
3. You'll see a public URL like:
   ```
   https://holymon-backend-production.up.railway.app
   ```
   or
   ```
   https://holymon-backend-production-xxxx.up.railway.app
   ```
4. Copy this URL - you'll need it for the frontend configuration

## Step 6: Verify Deployment

### Test Health Endpoint

```bash
curl https://your-railway-url.railway.app/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "2024-02-18T12:34:56.789Z",
    "uptime": 123.456,
    "services": {
      "elizaos": "operational",
      "tournament": "operational",
      "api": "operational"
    }
  }
}
```

### Test ElizaOS Status

```bash
curl https://your-railway-url.railway.app/api/elizaos/status
```

Expected response:
```json
{
  "success": true,
  "data": {
    "initialized": true,
    "agentsReady": 4,
    "rateLimit": { ... },
    "usage": { ... },
    "cache": { ... }
  }
}
```

### Test WebSocket (Optional)

Install wscat:
```bash
npm install -g wscat
```

Test connection:
```bash
wscat -c https://your-railway-url.railway.app/tournament/ws
```

Expected:
- Connection established
- Server logs: `[WS] Client connected`

## Step 7: Update Frontend Environment (Vercel)

1. Go to your [Vercel Project Dashboard](https://vercel.com/dashboard)
2. Select your HolyMon frontend project
3. Go to **Settings** → **Environment Variables**
4. Add or update the following variables:

```env
BACKEND_URL=https://your-railway-url.railway.app
NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app
```

5. Click **Save**
6. Trigger a redeploy:
   - Go to **Deployments** tab
   - Click the three dots (...) on the latest deployment
   - Click **Redeploy**

## Step 8: Verify Frontend Integration

1. Open your Vercel-hosted frontend in a browser
2. Open **Developer Tools** → **Network** tab
3. Test features that call the backend:
   - Agent creation
   - Tournament features
   - AI interactions
4. Check that requests go to your Railway URL (not localhost)
5. Verify no CORS errors in the console

## Monitoring and Logs

### View Railway Logs

1. Go to Railway project dashboard
2. Click on **"holymon-backend"** service
3. Click on **"Logs"** tab
4. You'll see real-time logs:
   ```
   [Backend] Starting HolyMon backend service...
   [Backend] Configuration validated
   [Backend] ElizaOS agents initialized
   [Backend] Server running on http://localhost:8765
   [WS] Client connected
   ```

### Monitor Deployment Health

1. Click on **"Metrics"** tab
2. Monitor:
   - CPU usage
   - Memory usage
   - Network traffic
   - Response times

### View Deployments

1. Click on **"Deployments"** tab
2. See deployment history
3. Click on any deployment to:
   - View logs
   - See build output
   - Rollback if needed

## Troubleshooting

### Issue: ElizaDB initialization fails

**Symptom:**
```
[Backend] Failed to initialize ElizaOS agents: [error]
[Backend] Tournament will fall back to procedural dialogue
```

**Solution:**
- This is expected on Railway (no persistent storage)
- Backend will continue to work with procedural dialogue
- No action needed

### Issue: Private key missing

**Symptom:**
```
Configuration error: PRIVATE_KEY is required in environment variables for production
```

**Solution:**
- Add `PRIVATE_KEY` to Railway variables
- Ensure it's a valid hex string (starts with `0x`)
- Redeploy service

### Issue: Groq API errors

**Symptom:**
```
[Backend] Groq API request failed: [error]
```

**Solution:**
- Verify `GROQ_API_KEY` is correct
- Check Groq console for API credits
- Ensure key format: `gsk_xxx...`

### Issue: Port already in use

**Symptom:**
```
Error: Port 8765 is already in use
```

**Solution:**
- Railway auto-assigns ports
- Backend reads from `PORT` environment variable
- Set `PORT=8765` explicitly in Railway variables
- Redeploy

### Issue: WebSocket connection fails

**Symptom:**
```
WebSocket upgrade failed
```

**Solution:**
- Check Railway logs for WebSocket errors
- Ensure frontend uses `https://` (not `ws://`)
- Verify CORS settings in backend code (already configured)
- Try connection in browser console or wscat

### Issue: CORS errors from frontend

**Symptom:**
```
Access to fetch at 'https://...' has been blocked by CORS policy
```

**Solution:**
- Verify backend has CORS headers (already configured in `src/index.ts`)
- Check that `BACKEND_URL` matches Railway URL exactly
- Ensure no trailing slashes in URLs

### Issue: Deployment stuck in "Building" phase

**Symptom:**
Deployment hangs for >5 minutes

**Solution:**
- Cancel deployment
- Check `Procfile` and `nixpacks.toml` syntax
- Ensure `bun install` is in build command
- Try redeploying

## Railway Free Tier Limits

| Resource | Limit |
|----------|-------|
| RAM | 512 MB |
| CPU | 0.5 vCPU |
| Storage | 1 GB (ephemeral) |
| Bandwidth | 100 GB/month |
| Build minutes | 500 hours/month |

**Important:**
- Storage is **ephemeral** (not persistent)
- ElizaDB database will reset on each deployment
- Backend handles this gracefully with fallback to procedural dialogue
- Data is stored on-chain via smart contracts (persistent)

## Next Steps

After successful deployment:

1. **Set up monitoring:**
   - Enable Railway alerts for service downtime
   - Monitor API usage and Groq costs

2. **Configure custom domain:**
   - Go to Settings → Domains
   - Add custom domain (e.g., `api.holymon.io`)
   - Update DNS records
   - Update frontend to use custom domain

3. **Optimize for production:**
   - Review and adjust rate limits
   - Set cost limits for Groq API
   - Monitor performance metrics

4. **Deploy smart contracts:**
   - Update `AGENT_REGISTRY_ADDRESS`, etc.
   - Add to Railway variables
   - Redeploy

## Support

If you encounter issues:

1. Check Railway logs first (most issues are logged)
2. Verify environment variables are set correctly
3. Test endpoints locally before deploying
4. Railway community: https://discord.gg/railway
5. Railway docs: https://docs.railway.app

---

**Deployment Status:** Ready to deploy
**Configuration Files:** ✅ Created
**Next Action:** Follow steps in this guide to deploy
