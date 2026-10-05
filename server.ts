import express from 'express';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDistDirectory(): string {
  const candidates = [
    path.resolve(__dirname, 'dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve('/app/applet/dist'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate;
    }
  }
  return path.resolve(__dirname, 'dist');
}

function determineCandidatePorts(): number[] {
  const ports: number[] = [];

  // If a custom PORT is passed (e.g. PORT=3005 for testing or custom runner)
  if (process.env.PORT && process.env.PORT !== '8080' && process.env.PORT !== '3000') {
    const p = Number(process.env.PORT);
    if (!isNaN(p)) ports.push(p);
  }

  // In AI Studio Cloud Run container, DEFAULT_APP_PORT is 3000 and Nginx is 8080
  if (process.env.DEFAULT_APP_PORT) {
    const defaultPort = Number(process.env.DEFAULT_APP_PORT);
    if (!isNaN(defaultPort) && !ports.includes(defaultPort)) {
      ports.push(defaultPort);
    }
  }

  // 3000 is the standard port for the application behind the proxy
  if (!ports.includes(3000)) ports.push(3000);

  // 8080 is Cloud Run direct container port
  if (!ports.includes(8080)) ports.push(8080);

  // Additional fallbacks
  if (!ports.includes(3001)) ports.push(3001);

  return ports;
}

function setupGracefulShutdown(server: http.Server) {
  const shutdown = () => {
    console.log('[ICU-DATA] Received shutdown signal, closing server gracefully...');
    server.close(() => {
      console.log('[ICU-DATA] Closed all server connections.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('[ICU-DATA] Forced shutdown timeout exceeded');
      process.exit(1);
    }, 5000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

function tryListen(app: express.Express, port: number): Promise<http.Server> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.once('error', (err: NodeJS.ErrnoException) => {
      reject(err);
    });
    server.listen(port, '0.0.0.0', () => {
      resolve(server);
    });
  });
}

async function listenOnCandidatePorts(app: express.Express, ports: number[]): Promise<http.Server> {
  let lastError: any = null;
  for (const port of ports) {
    try {
      const server = await tryListen(app, port);
      console.log(`[ICU-DATA] Server successfully listening on http://0.0.0.0:${port}`);
      setupGracefulShutdown(server);
      return server;
    } catch (err: any) {
      lastError = err;
      if (err.code === 'EADDRINUSE') {
        console.warn(`[ICU-DATA] Port ${port} is already in use, trying next candidate...`);
      } else {
        throw err;
      }
    }
  }
  throw lastError || new Error('Could not bind to any candidate port');
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoints for Cloud Run, Kubernetes, and Nginx probes
  app.get(['/health', '/_health', '/healthz'], (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'ICU-DATA',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  const distDir = getDistDirectory();
  const hasIndexHtml = fs.existsSync(path.join(distDir, 'index.html'));

  if (hasIndexHtml) {
    console.log(`[ICU-DATA] Serving static production build from ${distDir}`);
    // Cache static assets in dist/assets
    app.use('/assets', express.static(path.join(distDir, 'assets'), {
      maxAge: '1y',
      immutable: true,
    }));
    // Serve other root static files
    app.use(express.static(distDir, {
      maxAge: '1h',
    }));

    // SPA client-side routing fallback
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    console.warn(`[ICU-DATA] No build found at ${distDir}. Initializing Vite dev middleware...`);
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (viteErr) {
      console.error('[ICU-DATA] Failed to start Vite middleware:', viteErr);
      app.get('*', (_req, res) => {
        res.status(200).send(`<!DOCTYPE html><html><head><title>ICU-DATA</title></head><body><h2>ICU-DATA System</h2><p>Initializing service...</p></body></html>`);
      });
    }
  }

  const ports = determineCandidatePorts();
  await listenOnCandidatePorts(app, ports);
}

startServer().catch((err) => {
  console.error('[ICU-DATA] Fatal error starting server:', err);
  process.exit(1);
});
