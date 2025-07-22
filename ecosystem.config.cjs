module.exports = {
    apps: [
      {
        name: 'abm-usuarios',
        script: './server.js',
        watch: true,
        max_memory_restart: '1000M',
        instances: 1,
        cron_restart: '59 23 * * *',
        env_production: {
          NODE_ENV: 'production'
        },
        env_development: {
          NODE_ENV: 'development'
        }
      }
    ]
  };