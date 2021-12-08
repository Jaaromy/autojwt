const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

module.exports = {
    /* Your regular webpack config, probably including something like this:
    output: {
      path: path.join(__dirname, 'distribution'),
      filename: '[name].js'
    },
    */

    entry: './src/devtools.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    mode: 'none',
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js' },
                { from: 'node_modules/webextension-polyfill/dist/browser-polyfill.min.js.map' },
                { from: 'manifest.json' },
                { from: 'images', to: 'images' },
                { from: 'devtools.html' },
                { from: 'src/background.js' },
            ],

        })
    ]
};
