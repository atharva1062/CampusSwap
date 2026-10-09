#!/usr/bin/env bash
# ==============================================================================
# 🚀 CampusSwap Production VPS Automated Deployment Script
# Supports: Ubuntu 20.04 / 22.04 / 24.04 LTS, Debian 11 / 12
# ==============================================================================

set -e

echo "🎓 ============================================================"
echo "   CampusSwap Full-Stack Production Deployment Starting..."
echo "============================================================"

# Step 1: Check Node.js and PM2 / Docker
echo "📦 Step 1: Checking dependencies..."
if ! command -v node &> /dev/null; then
    echo "⚙️ Node.js not found. Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

echo "✅ Node.js $(node -v) is active."

# Step 2: Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ Installing PM2 process manager globally..."
    sudo npm install -g pm2
fi

# Step 3: Build Frontend
echo "🎨 Step 2: Installing & Building Frontend..."
cd frontend
npm ci
npm run build
cd ..

# Step 4: Install Backend Dependencies & Prisma
echo "⚙️ Step 3: Installing Backend dependencies..."
cd backend
npm ci --omit=dev

echo "🗄️ Step 4: Running Prisma database migration..."
npx prisma generate
npx prisma db push

echo "🌱 Step 5: Seeding official campus roster & admin account..."
node seedOfficialData.js
cd ..

# Step 5: Start or Restart with PM2
echo "🚀 Step 6: Starting CampusSwap with PM2 Cluster..."
mkdir -p logs
pm2 startOrRestart ecosystem.config.js --env production
pm2 save

echo ""
echo "🎉 ============================================================"
echo "   CampusSwap is now LIVE in PRODUCTION!"
echo "   Local URL: http://localhost:5050"
echo "   PM2 Status: Run 'pm2 status' or 'pm2 logs campusswap-server'"
echo "============================================================"
