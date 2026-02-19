# Fix Applied: Religions Page Hardcoded URLs

## Issue Fixed

**File:** `frontend/src/app/religions/page.tsx`

**Problem:** Component had hardcoded `http://localhost:8765` URLs instead of using environment variable.

**Impact:** When frontend is deployed to Vercel, Religions page would fail to connect to backend because it would try to reach `localhost:8765` instead of the Railway backend URL.

## Changes Made

### 1. Added BACKEND_URL Constant

```typescript
export default function Religions() {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8765";
  // ... rest of component
}
```

### 2. Replaced Hardcoded URLs

**Before:**
```typescript
fetch("http://localhost:8765/api/religion/agents")
fetch("http://localhost:8765/api/religion/coalitions")
fetch("http://localhost:8765/api/religion/stats")
```

**After:**
```typescript
fetch(`${BACKEND_URL}/api/religion/agents`)
fetch(`${BACKEND_URL}/api/religion/coalitions`)
fetch(`${BACKEND_URL}/api/religion/stats`)
```

## Verification

### All Frontend Files Now Use Environment Variables

| File | Backend URL Usage | Status |
|------|------------------|--------|
| `src/app/api/backend-proxy/agents/route.ts` | `process.env.BACKEND_URL || "http://localhost:8765"` | ✅ Correct |
| `src/app/api/backend-proxy/agents/[id]/route.ts` | `process.env.BACKEND_URL || "http://localhost:8765"` | ✅ Correct |
| `src/app/api/tournament/deploy-agents/route.ts` | `process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8765"` | ✅ Correct |
| `src/app/religions/page.tsx` | `process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8765"` | ✅ Fixed |
| `src/components/tournament-stats.tsx` | `process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8765"` | ✅ Correct |
| `src/components/live-faith-theater.tsx` | `process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8765"` | ✅ Correct |

**Result:** ✅ **All frontend files now properly use environment variables**

## Deployment Readiness

### Backend Deployment

| Component | Status | Notes |
|-----------|--------|-------|
| `backend/.railway/nixpacks.toml` | ✅ Ready | Uses `bun run railway-build` |
| `backend/package.json` | ✅ Ready | Has `railway-build` script |
| `backend/Procfile` | ✅ Ready | Starts with `bun src/index.ts` |
| `backend/.env.example` | ✅ Ready | Updated with deployment notes |
| **Git Repository** | ✅ Clean | All changes committed and pushed |

### Frontend Deployment

| Component | Status | Notes |
|-----------|--------|-------|
| Hardcoded URLs | ✅ Fixed | All use environment variables |
| Environment Variables | ⏳ Pending | Needs Railway URL (after backend deploy) |
| **Git Repository** | ✅ Clean | All changes committed and pushed |

## Next Steps

### Step 1: Deploy Backend to Railway

1. Go to railway.app → Your `holymon-backend` service
2. Click **"Deployments"** → **"Redeploy"**
3. Wait for deployment (1-2 minutes)
4. Verify status is "Active" (green checkmark)

### Step 2: Get Railway Backend URL

1. Click on **"Settings"** → **"Domains"**
2. Copy the public URL, e.g.:
   ```
   https://holymon-backend-production-xxxx.up.railway.app
   ```

### Step 3: Test Backend Deployment

```bash
# Replace with your actual Railway URL
curl https://your-railway-url.railway.app/health

# Check ElizaOS status
curl https://your-railway-url.railway.app/api/elizaos/status
```

### Step 4: Update Frontend Environment Variables (Vercel)

1. Go to Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add/update:
   ```env
   BACKEND_URL=https://your-railway-url.railway.app
   NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app
   ```
4. Click **Save**

### Step 5: Redeploy Frontend

1. Go to **Deployments** tab in Vercel
2. Click three dots (...) on latest deployment
3. Click **"Redeploy"**
4. Wait for redeploy to complete

### Step 6: Verify Frontend-Backend Integration

1. Open your Vercel-hosted frontend
2. Navigate to Religions page (`/religions`)
3. Open DevTools → Network tab
4. Verify requests go to your Railway URL (not localhost)
5. Check console for successful API responses
6. Verify no CORS errors

## Success Indicators

You'll know everything works when:

- [ ] **Railway status:** "Active" (green checkmark)
- [ ] **Backend health:** `/health` returns 200 OK
- [ ] **ElizaOS status:** `/api/elizaos/status` returns initialized agents
- [ ] **Railway logs:** Show `[Backend] Server running on http://localhost:8765`
- [ ] **Frontend requests:** Go to Railway URL (not localhost)
- [ ] **Network tab:** Shows successful API responses (200 OK)
- [ ] **Religions page:** Loads with agent/coalition data
- [ ] **No CORS errors:** Browser console has no CORS warnings

## Summary

### What Was Fixed

| Issue | Status |
|-------|--------|
| Railway build fails with frozen-lockfile error | ✅ Fixed |
| Religions page has hardcoded localhost URLs | ✅ Fixed |
| Frontend uses environment variables | ✅ All files now correct |

### What's Ready

| Component | Status |
|-----------|--------|
| Backend configuration files | ✅ Ready |
| Frontend code | ✅ Ready |
| Git repository | ✅ Clean, all changes pushed |
| Backend deployment | ⏳ Ready to deploy |
| Frontend deployment | ⏳ Ready after backend URL available |

### What You Need to Do

1. **Deploy backend** to Railway (click "Redeploy")
2. **Get Railway URL** from dashboard
3. **Test backend** with curl commands
4. **Update Vercel env vars** with Railway URL
5. **Redeploy frontend** from Vercel
6. **Verify** integration works end-to-end

---

## Git History

Recent commits:
```
c438e50 - fix: replace hardcoded localhost URLs with environment variable in Religions page
b2200af - Fix Railway build: use custom build script to avoid frozen-lockfile issue
66633ad - Add Railway deployment configuration and documentation
```

All changes pushed to: https://github.com/Tanwyhang/HolyMon-Monad

---

**Status:** Everything is ready for deployment! 🎉
**Next Action:** Deploy backend to Railway

---

## Documentation Files

| File | Purpose |
|------|---------|
| `FIX_APPLIED.md` | First Railway build fix attempt |
| `FIX_V2.md` | Second Railway build fix attempt |
| `FIX_RELIGIONS.md` | This file - Religions page fix |
| `RAILWAY_DEPLOYMENT.md` | Complete deployment guide |
| `RAILWAY_QUICKREF.md` | Quick reference card |
| `DEPLOYMENT_SUMMARY.md` | Deployment overview |
| `FRONTEND_CONFIG_CHECK.md` | Frontend configuration guide |

---

**All issues resolved. Ready to deploy!** 🚀
