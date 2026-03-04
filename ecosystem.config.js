module.exports = {
    apps:[
    {
      name: 'Friendzo_Server',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000, 
      },
      max_memory_restart: '500M',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      watch: false,
      kill_timeout: 5000,
    },
  ],
}; 
