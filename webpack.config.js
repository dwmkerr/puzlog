import fs from "fs";
import path from "path";
import CopyPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";

function transformManifest(buffer, mode) {
  //  Load the manifest object, update the versions, from the package.json,
  //  send back to webpack.
  const pkg = JSON.parse(fs.readFileSync("./package.json"));
  const manifest = JSON.parse(buffer.toString());

  //  If we are in development mode, update the name of the extension to make
  //  it more obvious when we are debugging.
  if (mode === "development") {
    //  TODO; add '10s ago' or whatever so that we can see how recent,
    manifest.name = `${manifest.name} - Local`;
  }

  return JSON.stringify({ ...manifest, version: pkg.version }, null, 2);
}

export default (_, argv) => ({
  //  Use cheap and fast inline source maps in development mode.
  //  For prodution, standalone source maps.
  //  Note that the 'eval' or 'sourcemap' options don't seem to load in Chrome
  //  for some reason. So using inline for now.
  devtool:
    argv.mode === "development"
      ? "inline-cheap-module-source-map"
      : "source-map",
  cache: {
    type: "filesystem",
  },
  entry: {
    puzlog: "./src/puzlog.ts",
    popup: "./src/popup.ts",
    content: "./src/content.ts",
  },
  output: {
    publicPath: "",
    path: path.join(process.cwd(), "dist"),
    filename: "[name].js",
    clean: true,
    asyncChunks: false,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "src/popup.html",
      filename: "popup.html",
      hash: true,
    }),
    new HtmlWebpackPlugin({
      template: "src/puzlog.html",
      filename: "puzlog.html",
      hash: true,
    }),
    new CopyPlugin({
      patterns: [
        //  Copy the images, icons etc, as is.
        { from: "src/images", to: "images" },
        //  Copy the manifest - but update its version using the transform fn.
        {
          from: "src/manifest.json",
          to: "manifest.json",
          transform(content) {
            return transformManifest(content, argv.mode);
          },
        },
      ],
    }),
  ],
  //  These hints tell webpack that we can expect much larger than usual assets
  //  and entry points (as we compile things down to a few small files, this is
  //  ok as we load the extension from disk not the web).
  performance: {
    maxEntrypointSize: 5 * 1024 * 1024,
    maxAssetSize: 5 * 1024 * 1024,
  },
});
