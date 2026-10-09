require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5050;

if (process.env.VERCEL !== '1' && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`=============================================`);
    console.log(`🚀 CampusSwap Backend Server Running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🌱 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=============================================`);
  });
}

module.exports = app;
