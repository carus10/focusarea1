
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import electron from 'vite-plugin-electron';
import electronRenderer from 'vite-plugin-electron-renderer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isElectron = mode === 'electron' || process.env.ELECTRON === 'true';
    
    return {
      server: {
        port: isElectron ? 5173 : 3000,
        host: '0.0.0.0',
      },
      base: './',
      plugins: [
        tailwindcss(),
        react(),
        ...(isElectron ? [
          electron([
            {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                  rollupOptions: {
                    external: ['electron']
                  }
                }
              }
            },
            {
              entry: 'electron/preload.ts',
              onstart(options) {
                options.reload();
              },
              vite: {
                build: {
                  outDir: 'dist-electron'
                }
              }
            }
          ]),
          electronRenderer()
        ] : [])
      ],
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-charts': ['recharts'],
              'vendor-animation': ['framer-motion'],
              'vendor-dexie': ['dexie'],
              'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable'],
              'vendor-markdown': ['react-markdown', 'remark-gfm'],
              'vendor-pdf': ['jspdf'],
            }
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      }
    };
});
