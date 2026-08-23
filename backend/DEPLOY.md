# Vercel hosts the frontend only.
# Publish this API separately (Railway / Render / Azure), then set on Vercel:
#   VITE_API_URL=https://YOUR-API-URL
# and Redeploy the frontend.

# Example Railway:
#   Root Directory: backend
#   Dockerfile path: Dockerfile
# Env:
#   Jwt__Key=long-random-secret
#   Cors__Origins__0=https://samurai-rho.vercel.app
#   PublicBaseUrl=https://YOUR-API-URL
