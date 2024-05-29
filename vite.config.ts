import {existsSync, readFileSync} from "fs";
import {resolve} from "path";
import {defineConfig} from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import dts from "vite-plugin-dts";
import tsconfigPaths from "vite-tsconfig-paths";

let outDir = "./dist";
const configPath = "./vite.config.json";
if (existsSync(configPath)) {
  const config = JSON.parse(readFileSync(configPath).toString());
  if (config?.outDir) {
    outDir = config.outDir;
  }
}

export default defineConfig(({mode}) => {
  switch (mode) {
    case "development":
      return {
        plugins: [dts(), cssInjectedByJsPlugin(), tsconfigPaths()],
        build: {
          outDir,
          emptyOutDir: true,
          watch: {},
          lib: {
            entry: resolve(__dirname, "src/index.ts"),
            formats: ["umd"],
            fileName: () => "extension.js",
            name: "lucilor.extension"
          },
          minify: false,
          sourcemap: true
        }
      };
    case "production":
      return {
        plugins: [cssInjectedByJsPlugin(), tsconfigPaths()],
        build: {
          outDir,
          emptyOutDir: true,
          lib: {
            entry: resolve(__dirname, "src/index.ts"),
            formats: ["umd"],
            fileName: () => "extension.js",
            name: "lucilor.extension"
          },
          minify: false
        }
      };
    default:
      return {};
  }
});
