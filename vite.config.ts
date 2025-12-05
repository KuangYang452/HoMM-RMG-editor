import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { buildSync } from 'esbuild';

// Simple plugin to build electron main process during vite build
const electronBuildPlugin = () => {
  return {
    name: 'build-electron',
    closeBundle: async () => {
      buildSync({
        entryPoints: ['electron/main.ts'],
        bundle: true,
        platform: 'node',
        outfile: 'dist-electron/main.js',
        external: ['electron'],
      });
    }
  };
};

export default defineConfig({
  plugins: [
    react(),
    electronBuildPlugin()
  ],
  base: './', // Ensure relative paths for Electron
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});