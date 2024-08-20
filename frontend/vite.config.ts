import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { defineConfig, loadEnv, Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const hash = createHash("md5")
  .update(Date.now().toString())
  .digest("hex")
  .substring(0, 8);

const queryHashVersion = `v=${hash}`;

function hashEdificeBootstrap(): Plugin {
  return {
    name: "vite-plugin-edifice",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        "/assets/themes/edifice-bootstrap/index.css",
        `/assets/themes/edifice-bootstrap/index.css?${queryHashVersion}`,
      );
    },
  };
}

// https://vitejs.dev/config/
export default ({ mode }: { mode: string }) => {
  // Checking environement files
  const envFile = loadEnv(mode, process.cwd());
  const envs = { ...process.env, ...envFile };
  const hasEnvFile = Object.keys(envFile).length;

  // Proxy variables
  const headers = {
    cookie: `oneSessionId=${envs.VITE_ONE_SESSION_ID};authenticated=true; XSRF-TOKEN=${envs.VITE_XSRF_TOKEN}`,
  };
  const resHeaders = hasEnvFile
    ? {
        "set-cookie": [
          `oneSessionId=${envs.VITE_ONE_SESSION_ID}`,
          `XSRF-TOKEN=${envs.VITE_XSRF_TOKEN}`,
        ],
        "Cache-Control": "public, max-age=300",
      }
    : {};

  const proxyObj = hasEnvFile
    ? {
        target: envs.VITE_RECETTE,
        changeOrigin: true,
        headers,
      }
    : {
        target: envs.VITE_LOCALHOST || "http://localhost:8090",
        changeOrigin: false,
      };

  const proxy = {
    "/applications-list": proxyObj,
    "/conf/public": proxyObj,
    "^/(?=help-1d|help-2d)": proxyObj,
    "^/(?=assets)": proxyObj,
    "^/(?=theme|locale|i18n|skin)": proxyObj,
    "^/(?=auth|appregistry|cas|userbook|directory|communication|conversation|portal|session|timeline|workspace|infra)":
      proxyObj,
    "^/blog(?!#)/": proxyObj,
    "/explorer": proxyObj,
    "/audience": proxyObj,
    "/xiti": proxyObj,
    "/analyticsConf": proxyObj,
  };

  const base = mode === "production" ? "/blog" : "";

  const build = {
    assetsDir: "public",
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      external: ["edifice-ts-client"],
      output: {
        paths: {
          "edifice-ts-client": `/assets/js/edifice-ts-client/index.js?${queryHashVersion}`,
        },
      },
    },
  };

  const plugins = [react(), tsconfigPaths(), hashEdificeBootstrap()];

  const server = {
    proxy,
    host: "0.0.0.0",
    port: 3000,
    headers: resHeaders,
    open: false,
  };

  return defineConfig({
    base,
    build,
    plugins,
    server,
  });
};
