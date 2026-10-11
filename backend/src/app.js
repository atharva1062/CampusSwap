const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const listingRoutes = require('./routes/listingRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const messageRoutes = require('./routes/messageRoutes');
const statsRoutes = require('./routes/statsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Root Health Check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  let userCount = 0;

  try {
    let prisma = null;
    try {
      prisma = require('./config/db');
    } catch (importErr) {
      dbError = 'Prisma Client module load error: ' + importErr.message;
    }

    if (prisma && prisma.user) {
      userCount = await prisma.user.count().then(c => {
        dbStatus = 'connected';
        return c;
      }).catch(qErr => {
        dbError = 'Database query failed: ' + qErr.message;
        return 0;
      });
    }
  } catch (err) {
    dbError = err.message;
  }

  return res.status(200).json({
    status: 'online',
    platform: 'CampusSwap API',
    database: dbStatus,
    userCount,
    dbError,
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Route handler for API endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on this server.`,
  });
});

// Serve frontend production build if available (local/VPS only — Vercel CDN handles this)
if (process.env.VERCEL !== '1') {
  const fs = require('fs');
  const rootDist = path.join(__dirname, '../../../dist');
  const featureDist = path.join(__dirname, '../../frontend/dist');
  const frontendDistPath = fs.existsSync(path.join(rootDist, 'index.html')) ? rootDist : featureDist;

  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        res.status(404).send('CampusSwap frontend not built. Run: npm run build');
      }
    });
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
