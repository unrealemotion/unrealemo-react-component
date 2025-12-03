import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "classic", // Use React.createElement for React 16 compatibility
    }),
    Icons({
      compiler: "jsx",
      jsx: "react",
    }),
  ],
  build: {
    target: "es2015", // Target ES2015 for maximum compatibility (no ??, ?., etc.)
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "UnrealEmoReactComponent",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        preserveModules: true,
        preserveModulesRoot: "src",
        entryFileNames: "[name].js",
        assetFileNames: "style.css",
      },
    },
    cssCodeSplit: false,
    sourcemap: true,
    minify: false,
  },
  css: {
    modules: {
      localsConvention: "camelCase",
    },
    preprocessorOptions: {
      scss: {
        api: "modern-compiler",
      },
    },
  },
});

