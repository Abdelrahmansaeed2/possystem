const { getDefaultConfig } = require("@expo/metro-config");
const path = require("path");

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(__dirname, "..", "components"),
  path.resolve(__dirname, "..", "lib"),
];

module.exports = config;
