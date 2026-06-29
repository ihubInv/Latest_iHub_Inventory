module.exports = {
  apps: [
    {
      name: 'ihub-inv-backend',
      script: 'server.js',
      cwd: '/root/rohit/latest_ihub_inv/backend',
      interpreter: '/root/.nvm/versions/node/v22.16.0/bin/node',
      env: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '512M',
      restart_delay: 3000,
      exp_backoff_restart_delay: 100,
    },
    {
      name: 'latest-ihub-ui',
      script: 'node_modules/.bin/vite',
      args: '--host 0.0.0.0 --port 5003',
      cwd: '/root/rohit/latest_ihub_inv/frontend',
      interpreter: '/root/.nvm/versions/node/v22.16.0/bin/node',
      env: {
        NODE_ENV: 'development',
      },
      max_memory_restart: '512M',
    },
  ],
};
