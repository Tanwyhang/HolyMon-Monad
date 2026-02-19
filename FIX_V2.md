# Railway Build Fix - Version 2

## Problem

Railway was still failing with:
```
error: lockfile had changes, but lockfile is frozen
note: try re-running without --frozen-lockfile and commit the updated lockfile
```

Even though we configured `buildCommand = "bun install"`, Railway was still running `bun install --frozen-lockfile` during the "install" phase.

## Root Cause

The `bun.lock` file is a **workspace lockfile** that includes ALL monorepo packages:
- @holymon/root
- @holymon/backend
- holymon-contracts
- eliza.how (frontend)
- monad-mcp

When Railway tries to build just the `backend` directory, it:
1. Only sees `backend/package.json`
2. Uses the root `bun.lock` (which references other packages)
3. Detects mismatch and fails with frozen-lockfile error

## Solution Applied

### 1. Updated `backend/package.json`

Added a custom build script:
```json
"scripts": {
  "railway-build": "bun install"
}
```

### 2. Updated `backend/.railway/nixpacks.toml`

Configured to use the custom script:
```toml
[build]
builder = "NIXPACKS"
buildCommand = "bun run railway-build"
startCommand = "bun src/index.ts"
```

This ensures Railway uses `bun install` WITHOUT the `--frozen-lockfile` flag.

## Changes Committed and Pushed

✅ `backend/package.json` - Added `railway-build` script
✅ `backend/.railway/nixpacks.toml` - Use custom build command
✅ Pushed to GitHub: https://github.com/Tanwyhang/HolyMon-Monad

## Next Steps

### Step 1: Redeploy on Railway

1. Go to railway.app → Your `holymon-backend` service
2. Click **"Deployments"** tab
3. Click **"Redeploy"** button
4. Wait for deployment (1-2 minutes)

**Expected Result:**
- Build should succeed
- No frozen-lockfile errors
- Service starts with `bun src/index.ts`
- Status: "Active" (green checkmark)

### Step 2: Verify Deployment

```bash
# Replace with your actual Railway URL
curl https://your-railway-url.railway.app/health

# Check ElizaOS status
curl https://your-railway-url.railway.app/api/elizaos/status
```

Expected `/health` response:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "services": {
      "elizaos": "operational",
      "tournament": "operational"
    }
  }
}
```

### Step 3: Check Railway Logs

1. Click on **"Logs"** tab
2. Look for successful startup:
   ```
   [Backend] Starting HolyMon backend service...
   [Backend] Configuration validated
   [Backend] ElizaOS agents initialized
   [Backend] Server running on http://localhost:8765
   ```

### Step 4: Update Frontend (Vercel)

Once backend is deployed:

1. Go to Vercel project settings
2. Update environment variables:
   ```env
   BACKEND_URL=https://your-railway-url.railway.app
   NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app
   ```
3. Redeploy frontend

## What Changed (Technical Details)

### Before

Railway build process:
1. **Install phase**: `bun install --frozen-lockfile` (fails)
2. **Build phase**: `bun install` (never reached)
3. **Deploy phase**: `bun src/index.ts` (never reached)

### After

Railway build process:
1. **Install phase**: Skipped (no `[phases.install]` section)
2. **Build phase**: `bun run railway-build` → `bun install` (no frozen-lockfile flag)
3. **Deploy phase**: `bun src/index.ts` (starts successfully)

## Troubleshooting

### If Build Still Fails

1. **Check logs** for specific error message
2. **Verify** all environment variables are set
3. **Check** `railway-build` script exists in package.json
4. **Confirm** `bun.lock` exists in repository

### If Deployment Hangs

1. **Cancel** deployment
2. **Check** `.railway/nixpacks.toml` syntax
3. **Verify** build command is correct
4. **Redeploy** after fixing

### If Service Starts But Has Errors

1. **Check** Railway logs for startup errors
2. **Verify** environment variables:
   - `PRIVATE_KEY` - wallet private key
   - `GROQ_API_KEY` - Groq API key
   - `MONAD_RPC_URL` - Monad RPC endpoint
3. **Test** endpoints with curl

## Success Indicators

You'll know it works when:

- [ ] Railway status shows "Active" (green)
- [ ] Build completes without errors
- [ ] `/health` endpoint returns `200 OK`
- [ ] `/api/elizaos/status` returns initialized agents
- [ ] Logs show: `[Backend] Server running on http://localhost:8765`
- [ ] No frozen-lockfile errors

## Environment Variables Checklist

### Required Variables (Set in Railway)

```env
# Monad Network
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=14314

# Backend Wallet (CRITICAL - Replace with your key)
PRIVATE_KEY=your_private_key_here

# ElizaOS (CRITICAL - Replace with your key)
GROQ_API_KEY=gsk_your_groq_key_here
ELIZAOS_MODEL_PROVIDER=groq

# Server
PORT=8765
NODE_ENV=production

# ElizaOS Configuration
ELIZAOS_HYBRID_RATIO=0.5
ELIZAOS_CACHE_TTL=300000
ELIZAOS_LLM_TIMEOUT=10000
```

### Frontend Variables (Set in Vercel - AFTER Backend Deployed)

```env
BACKEND_URL=https://your-railway-url.railway.app
NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app
```

## Documentation Files

| File | Purpose |
|------|---------|
| `FIX_APPLIED.md` | First attempt (Version 1) |
| `FIX_V2.md` | This file (Version 2) |
| `RAILWAY_DEPLOYMENT.md` | Complete deployment guide |
| `RAILWAY_QUICKREF.md` | Quick reference |
| `DEPLOYMENT_SUMMARY.md` | Deployment overview |

---

**Status:** Fix V2 pushed to GitHub ✅
**Next Action:** Redeploy on Railway
**Expected Outcome:** Successful deployment without frozen-lockfile errors

---

## What to Do Now

1. **Go to Railway dashboard**
2. **Click "Redeploy" on holymon-backend service**
3. **Wait** for deployment to complete
4. **Check** logs for `[Backend] Server running...`
5. **Test** with curl commands above
6. **Update** Vercel environment variables with Railway URL
7. **Redeploy** frontend

Good luck! 🚀
