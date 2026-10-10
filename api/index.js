let app;
try {
  app = require('../backend/src/app');
} catch (err) {
  console.error('Fatal API App import error:', err);
  app = (req, res) => {
    res.status(500).json({
      success: false,
      message: 'Server initial load error',
      error: err.message,
    });
  };
}

module.exports = app;
