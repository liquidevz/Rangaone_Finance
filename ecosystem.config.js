module.exports = {
  apps: [{
    name: 'rangaone-fe',
    script: 'npm',
    args: 'start',
    cwd: '/home/cloudpanel/htdocs/your-domain',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}