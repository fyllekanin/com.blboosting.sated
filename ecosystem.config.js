module.exports = {
    apps: [
        {
            name: 'test',
            script: './dist/main.js',
            env: {
                NODE_ENV: "production",
            },
            exec_mode: 'fork',
            instances: 'max',
            error_file: './err.log',
            out_file: './out.log',
            merge_logs: true
        }
    ]
}