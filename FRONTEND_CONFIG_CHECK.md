# Frontend Configuration Check

## Current Frontend Configuration

The frontend is currently configured for local development:

### `/frontend/.env` (Current)

```env
# Backend Service
BACKEND_URL=http://localhost:8765
NEXT_PUBLIC_BACKEND_URL=http://localhost:8765
```

### Files That Use Backend URL

| File | Usage |
|------|-------|
| `src/app/api/backend-proxy/agents/route.ts` | Server-side API proxy |
| `src/app/api/backend-proxy/agents/[id]/route.ts` | Server-side API proxy |
| `src/app/api/tournament/deploy-agents/route.ts` | Server-side tournament API |
| `src/components/tournament-stats.tsx` | Client-side tournament stats |
| `src/components/live-faith-theater.tsx` | Client-side WebSocket connection |

---

## What Needs to Change After Backend Deployment

### Step 1: Get Railway Backend URL

After deploying to Railway, you'll get a URL like:
```
https://holymon-backend-production-xxxx.up.railway.app
```

### Step 2: Update Vercel Environment Variables

Go to your Vercel project dashboard and update:

#### Server-Side Variables (for API routes)

```env
BACKEND_URL=https://your-railway-url.railway.app
```

#### Public Variables (for client-side)

```env
NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app
```

### Step 3: Redeploy Frontend

After updating environment variables, redeploy the frontend to pick up the new values.

---

## Verification Checklist

After updating the frontend environment variables, verify:

### 1. Check Environment Variables in Browser

Open your Vercel-hosted frontend and check:
```javascript
// In browser console
console.log(process.env.NEXT_PUBLIC_BACKEND_URL);
// Should print: https://your-railway-url.railway.app
```

### 2. Check Network Requests

1. Open DevTools → Network tab
2. Test a feature that calls the backend
3. Verify requests go to your Railway URL (not localhost)

Example request:
```
GET https://your-railway-url.railway.app/health
```

### 3. Check Console for Errors

Look for:
- ❌ CORS errors (should not exist)
- ❌ Network errors (failed requests)
- ✅ Successful API responses

### 4. Test WebSocket Connection

If your app uses WebSocket (tournament features):

1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Look for connection to:
   ```
   wss://your-railway-url.railway.app/tournament/ws
   ```
4. Connection should be "101 Switching Protocols" (success)

---

## Common Issues After URL Update

### Issue: Still connecting to localhost

**Cause:** Frontend still using old environment variables

**Solution:**
1. Verify Vercel environment variables are saved
2. Trigger a fresh redeploy (not a build cache)
3. Wait for redeploy to complete
4. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)

### Issue: CORS errors after URL update

**Cause:** Backend CORS configuration missing or incorrect

**Solution:**
Backend already has CORS configured in `src/index.ts`:
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

If you still see CORS errors:
1. Check Railway logs for backend startup
2. Verify backend deployed successfully
3. Test backend directly with curl first

### Issue: WebSocket fails with mixed content

**Cause:** Frontend uses HTTP but backend uses HTTPS (or vice versa)

**Solution:**
Both should use HTTPS (Vercel and Railway both provide HTTPS):
- Frontend: `https://your-frontend.vercel.app`
- Backend: `https://your-backend.railway.app`

WebSocket should use `wss://` (secure):
```
wss://your-railway-url.railway.app/tournament/ws
```

### Issue: API proxy routes not working

**Cause:** Server-side variables not updated

**Solution:**
- Ensure `BACKEND_URL` (without `NEXT_PUBLIC_`) is set in Vercel
- This is used by API routes in `/app/api/backend-proxy/`
- Redeploy frontend after updating

---

## Environment Variables Reference

### Frontend Environment Variables Explained

| Variable | Scope | Usage | Value After Deployment |
|----------|-------|-------|----------------------|
| `BACKEND_URL` | Server-side | API proxy routes | `https://your-railway-url.railway.app` |
| `NEXT_PUBLIC_BACKEND_URL` | Client-side | Browser fetch calls | `https://your-railway-url.railway.app` |

### Why Two Variables?

**Server-side (`BACKEND_URL`):**
- Used by Next.js API routes
- Not exposed to browser
- Used in `src/app/api/backend-proxy/*`

**Client-side (`NEXT_PUBLIC_BACKEND_URL`):**
- Exposed to browser (prefixed with `NEXT_PUBLIC_`)
- Used by React components
- Used in `src/components/*` for direct API calls

### Backend-Only Variables

These are only needed in Railway, not in Vercel:

```env
# Only needed in Railway backend
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=14314
PRIVATE_KEY=your_private_key
GROQ_API_KEY=gsk_your_key
ELIZAOS_MODEL_PROVIDER=groq
PORT=8765
NODE_ENV=production
```

---

## Frontend Configuration Summary

| Setting | Current (Local) | After Deployment |
|---------|-----------------|-----------------|
| `BACKEND_URL` | `http://localhost:8765` | `https://your-railway-url.railway.app` |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:8765` | `https://your-railway-url.railway.app` |

**Note:** Do NOT change `.env` file locally. Update Vercel environment variables instead.

---

## Test Commands After Frontend Update

### Test from Browser Console

```javascript
// Test backend health
fetch('https://your-railway-url.railway.app/health')
  .then(r => r.json())
  .then(console.log);

// Test ElizaOS status
fetch('https://your-railway-url.railway.app/api/elizaos/status')
  .then(r => r.json())
  .then(console.log);
```

### Test with cURL

```bash
# Health check
curl https://your-railway-url.railway.app/health

# ElizaOS status
curl https://your-railway-url.railway.app/api/elizaos/status
```

---

## Next Steps

1. **Deploy backend to Railway** (follow `RAILWAY_DEPLOYMENT.md`)
2. **Get Railway URL** from Railway dashboard
3. **Update Vercel env vars** with Railway URL
4. **Redeploy frontend** from Vercel dashboard
5. **Test** using the commands above
6. **Verify** frontend-backend integration works

---

**Status:** Frontend is correctly configured for local development. Update Vercel environment variables after backend deployment.
