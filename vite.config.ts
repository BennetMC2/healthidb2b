import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { handleCopilotRequest } from './server/copilot/handler'

function copilotDevApi() {
  return {
    name: 'copilot-dev-api',
    configureServer(server: {
      middlewares: {
        use: (path: string, handler: (req: import('http').IncomingMessage, res: import('http').ServerResponse, next: () => void) => void) => void;
      };
    }) {
      server.middlewares.use('/api/copilot', (req, res, next) => {
        if (req.method !== 'POST') {
          next();
          return;
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
        req.on('end', async () => {
          try {
            const headers = new Headers();
            Object.entries(req.headers).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                value.forEach((entry) => headers.append(key, entry));
              } else if (typeof value === 'string') {
                headers.set(key, value);
              }
            });

            const request = new Request('http://localhost/api/copilot', {
              method: 'POST',
              headers,
              body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
            });

            const response = await handleCopilotRequest(request);
            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            const body = Buffer.from(await response.arrayBuffer());
            res.end(body);
          } catch (error) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end(`Local copilot API error: ${error instanceof Error ? error.message : 'unknown error'}`);
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), copilotDevApi()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@sim': path.resolve(__dirname, './src/simulator-agentic'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  server: {
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/anthropic/, ''),
      },
    },
  },
})
