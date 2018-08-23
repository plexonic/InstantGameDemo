const path = require('path');
const webpack = require('webpack');

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
module.exports = {
    entry: './src/Game.ts',
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'js'),
        publicPath: './',
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    optimization: {
        minimizer: [new UglifyJsPlugin()]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    stats: false,
};
