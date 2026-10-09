module.exports = {
  apps: [
    {
      name: 'campusswap-server',
      script: './backend/src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5050,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5050,
      },
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      autorestart: true,
      watch: false,
    },
  ],
};
