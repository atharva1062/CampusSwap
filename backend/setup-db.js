const { execSync } = require('child_process');
const path = require('path');

// Run this script to push schema + seed on Vercel (run once from Vercel dashboard or build command)
const backendDir = path.join(__dirname, '..');

console.log('🔄 Running prisma db push...');
execSync('npx prisma db push --skip-generate', { cwd: backendDir, stdio: 'inherit' });

console.log('🌱 Seeding official data...');
try {
  execSync('node seedOfficialData.js', { cwd: backendDir, stdio: 'inherit' });
  console.log('✅ Seed complete');
} catch (e) {
  console.log('⚠️ Seed skipped (may already exist):', e.message);
}
