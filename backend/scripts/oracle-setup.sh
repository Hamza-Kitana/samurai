#!/usr/bin/env bash
# Run on the Oracle VM after SSH:
#   curl -fsSL ... | bash
# or upload this file and: bash oracle-setup.sh

set -euo pipefail

APP_DIR="/opt/samurai-api"
DATA_DIR="/opt/samurai-data"
REPO_URL="${REPO_URL:-https://github.com/Hamza-Kitana/samurai.git}"
PUBLIC_IP="$(curl -fsSL https://ifconfig.me || curl -fsSL https://api.ipify.org || echo "")"

echo "==> Installing Docker..."
if ! command -v docker >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
  sudo apt-get update -y
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
  sudo usermod -aG docker "$USER" || true
fi

echo "==> Preparing folders..."
sudo mkdir -p "$APP_DIR" "$DATA_DIR" "$DATA_DIR/uploads"
sudo chown -R "$USER":"$USER" "$APP_DIR" "$DATA_DIR"

if [ ! -d "$APP_DIR/repo/.git" ]; then
  echo "==> Cloning repo..."
  git clone "$REPO_URL" "$APP_DIR/repo"
else
  echo "==> Updating repo..."
  git -C "$APP_DIR/repo" pull --ff-only || true
fi

cd "$APP_DIR/repo/backend"

JWT_KEY="$(openssl rand -hex 32)"
PUBLIC_BASE="http://${PUBLIC_IP}:8080"

echo "==> Building and starting container..."
sudo docker build -t samurai-api .
sudo docker rm -f samurai-api 2>/dev/null || true
sudo docker run -d \
  --name samurai-api \
  --restart unless-stopped \
  -p 8080:8080 \
  -e ASPNETCORE_URLS=http://+:8080 \
  -e ConnectionStrings__DefaultConnection="Data Source=/data/samurai.db" \
  -e Jwt__Key="$JWT_KEY" \
  -e PublicBaseUrl="$PUBLIC_BASE" \
  -e "Cors__Origins__0=https://samurai-rho.vercel.app" \
  -e "Cors__Origins__1=http://localhost:8080" \
  -e "Cors__Origins__2=http://localhost:5173" \
  -v "$DATA_DIR:/data" \
  -v "$DATA_DIR/uploads:/app/uploads" \
  samurai-api

echo
echo "========================================"
echo " API should be running."
echo " Health:  $PUBLIC_BASE/api/health"
echo " Admin:   admin / 222"
echo
echo " Put this in Vercel env VITE_API_URL:"
echo "   $PUBLIC_BASE"
echo " Then Redeploy Vercel."
echo "========================================"
