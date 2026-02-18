# Quick Reference: Railway Deployment

## URLs You'll Need

| Service | URL |
|---------|-----|
| Railway Dashboard | https://railway.app |
| GitHub Repository | https://github.com/Tanwyhang/HolyMon-Monad |
| Vercel Dashboard | https://vercel.com/dashboard |
| Groq Console (get API key) | https://console.groq.com |

## Environment Variables Checklist

### Required Variables (Copy These to Railway)

```env
# Monad Network
MONAD_RPC_URL=https://testnet-rpc.monad.xyz
CHAIN_ID=14314

# Backend Wallet (REPLACE WITH YOUR KEY)
PRIVATE_KEY=your_private_key_here

# ElizaOS (REPLACE WITH YOUR KEY)
GROQ_API_KEY=gsk_your_groq_key_here
ELIZAOS_MODEL_PROVIDER=groq

# Server
PORT=8765
NODE_ENV=production

# ElizaOS Configuration (keep defaults)
ELIZAOS_HYBRID_RATIO=0.5
ELIZAOS_CACHE_TTL=300000
ELIZAOS_LLM_TIMEOUT=10000
```

### Vercel Variables (Replace Railway URL After Deployment)

```env
BACKEND_URL=https://your-railway-url.railway.app
NEXT_PUBLIC_BACKEND_URL=https://your-railway-url.railway.app
```

## Configuration Summary

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `bun install` |
| **Start Command** | `bun src/index.ts` |
| **Port** | `8765` |

## Test Commands

```bash
# Health check (copy your Railway URL here)
curl https://your-railway-url.railway.app/health

# ElizaOS status
curl https://your-railway-url.railway.app/api/elizaos/status

# WebSocket test
wscat -c https://your-railway-url.railway.app/tournament/ws
```

## Expected URLs

### Your Railway Backend URL
After deployment, it will look like:
```
https://holymon-backend-production-xxxx.up.railway.app
```

### Your Vercel Frontend URL
Already deployed on Vercel, look like:
```
https://your-frontend-name.vercel.app
```

## Deployment Steps (Quick Version)

1. **Railway**: New Project → Deploy from GitHub → Select `Tanwyhang/HolyMon-Monad`
2. **Create Service**: + New Service → GitHub → Root dir: `backend`
3. **Variables**: Add environment variables (see above)
4. **Deploy**: Click "Deploy Now"
5. **Get URL**: Copy Railway URL from Settings → Domains
6. **Vercel**: Update `BACKEND_URL` and `NEXT_PUBLIC_BACKEND_URL` with Railway URL
7. **Test**: Run curl commands to verify

## Common Issues

| Issue | Solution |
|-------|----------|
| ElizaDB fails | Expected (no persistent storage), backend continues to work |
| Private key error | Add `PRIVATE_KEY` in Railway variables |
| Groq API error | Check `GROQ_API_KEY` format: `gsk_xxx...` |
| CORS errors | Verify `BACKEND_URL` matches Railway URL exactly |
| WebSocket fails | Check Railway logs, ensure using `https://` |

## Files Created

✅ `backend/Procfile` - Railway start command
✅ `backend/.railway/nixpacks.toml` - Railway build config
✅ `backend/.env.example` - Environment variables template
✅ `RAILWAY_DEPLOYMENT.md` - Detailed deployment guide

## Next Steps

1. Get your wallet private key (for Monad testnet)
2. Get Groq API key from https://console.groq.com/
3. Follow steps in `RAILWAY_DEPLOYMENT.md`
4. Test deployment with curl commands
5. Update Vercel environment variables
6. Verify frontend works with deployed backend

---

**Ready to deploy? Start at Step 1 above!**
