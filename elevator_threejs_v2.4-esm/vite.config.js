import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: '../app',
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'three',
              test: /node_modules[\\/]three[\\/]/
            }
          ]
        }
      }
    }
  }
});
