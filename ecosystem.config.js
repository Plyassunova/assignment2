module.exports = {
  apps: [
    {
      name: 'assignment2-api-3000',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: 3000
      }
    },
    {
      name: 'assignment2-api-4000',
      script: 'src/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        PORT: 4000
      }
    }
  ]
};
