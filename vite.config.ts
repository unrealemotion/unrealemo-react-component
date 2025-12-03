import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import Icons from "unplugin-icons/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    react(),
    Icons({
      compiler: "jsx",
      jsx: "react",
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "UnrealEmoReactComponent",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
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

