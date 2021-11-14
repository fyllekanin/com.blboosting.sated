module.exports = {
    apps: [
        {
            name: 'Sated v2',
            script: './index.js',
            env: {
                NODE_ENV: "production",
            },
            env_production: {
                NODE_ENV: "production",
            },
            error_file: './err.log',
            out_file: './out.log',
            merge_logs: true
        }
    ]
}