import { defineConfig } from "vitest/config";
import { resolve } from "path";

const root = resolve(__dirname);

export default defineConfig({
  resolve: {
    alias: [
      {
        // The solve-stream route uses a 4-level-up relative path which resolves
        // outside the monorepo root. This alias remaps it to the correct location.
        find: /^\.\.\/\.\.\/\.\.\/\.\.\/packages\/(.+)$/,
        replacement: resolve(root, "packages/$1").replace(/\.js$/, ""),
      },
    ],
  },
  test: {
    include: ["tests/**/*.spec.ts"],
  },
});