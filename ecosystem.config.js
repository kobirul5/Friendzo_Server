module.exports = {
    apps:[
    {
      name: 'digital-animal',
      script: './dist/server.js',
      // একাধিক CPU core ব্যবহার করো
      instances: 'max',
      exec_mode: 'cluster',
      // Environment
      env: {
        NODE_ENV: 'production',
        PORT: 5000, // তোমার port
      },
      // Restart policy
      max_memory_restart: '500M',
      // Logging configuration
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      // Health monitoring
      watch: false, // production এ watch disable রাখো
      // Graceful shutdown time
      kill_timeout: 5000,
    },
  ],
}; 
// module.exports = {
//     apps: [
//         {
//             name: 'digital-animal',
//             script: './dist/server.js',
//             args: 'start',
//             env: {
//                 NODE_ENV: 'production',
//             },
//         },
//     ],
// }; 