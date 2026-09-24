const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

module.exports = defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                login: 'login.html',
                dashboard: 'stitch-index-backup.html',
            },
        },
    },
})