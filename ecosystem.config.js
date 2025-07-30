module.exports = {
    apps: [
        {
            name: 'digital-animal',
            script: './dist/server.js',
            args: 'start',
            env: {
                NODE_ENV: 'production',
            },
        },
    ],
}; 