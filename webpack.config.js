const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    entry: {
        main: './src/devtools.js',
        panel: './src/panel/panel.js',
        background: './src/background.js'
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'none',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js' },
                { from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js.map' },
                { from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js' },
                { from: 'node_modules/webextension-polyfill/dist/browser-polyfill.js.map' },
                { from: 'node_modules/ag-grid-community/dist/styles/ag-grid.css' },
                { from: 'node_modules/ag-grid-community/dist/styles/ag-theme-alpine.css' },
                { from: 'node_modules/ag-grid-community/dist/styles/ag-theme-alpine-dark.css' },
                { from: 'node_modules/ag-grid-community/dist/styles/ag-theme-balham.css' },
                { from: 'node_modules/ag-grid-community/dist/styles/ag-theme-balham-dark.css' },
                { from: 'manifest.json' },
                { from: 'images', to: 'images' },
                { from: 'styles' },
                { from: 'src/devtools.html' },
                { from: 'src/panel/panel.html' },
                { from: 'vendor' }
            ],

        })
    ]
};
