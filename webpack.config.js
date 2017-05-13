var path = require('path');

module.exports = [{
    entry: ['./src/app.ts'],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public')
    },
    devServer: {
        contentBase: path.resolve(__dirname, 'public')
    },
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
    devtool: 'inline-source-map',
    module: {
        rules: [{
            test: /\.(jpe?g|png|gif|svg|ico)(\?.+)?$/,
            use: {
//                loader: 'file-loader'
                loader: 'url-loader?limit=10000'
            }
        },
        {
            test: /\.tsx?$/,
            loader: 'ts-loader',
            exclude: /node_modules/,
        },
        {
            test: /\.scss$/,
            use: [
                'style-loader',
                'css-loader',
                'sass-loader'
            ]
        }
        ]
    }
}];
