const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    entry: {
        "org-hub": "./src/org-hub/Pivot.tsx",
        "repos-hub": "./src/repos-hub/ServiceHub.tsx"
    },
    output: {
        filename: "[name]/index.js"
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js"],
        alias: {
            "azure-devops-extension-sdk": path.resolve("node_modules/azure-devops-extension-sdk")
        }
    },
    stats: {
        warnings: false
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader"
            },
            {
                test: /\.scss$/,
                use: [
                    "style-loader",
                    "css-loader",
                    "azure-devops-ui/buildScripts/css-variables-loader",
                    {
                        loader: "sass-loader",
                        options: {
                            sassOptions: {
                                loadPaths: [path.resolve(__dirname)]
                            }
                        }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.woff$/,
                type: "asset/inline"
            }
        ]
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: "src/org-hub/index.html", to: "org-hub/index.html" },
                { from: "src/repos-hub/index.html", to: "repos-hub/index.html" }
            ]
        })
    ]
};
