import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Port configuration for Render and automatic port finding
const DEFAULT_PORT = 4000;
const PORT = process.env.PORT || process.env.RENDER_EXTERNAL_PORT || DEFAULT_PORT;

// Function to find available port
async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => {
        resolve(port);
      });
    });
    
    server.on('error', async (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Try next port
        try {
          const nextPort = await findAvailablePort(startPort + 1);
          resolve(nextPort);
        } catch (error) {
          reject(error);
        }
      } else {
        reject(err);
      }
    });
  });
}

// Load settings
const settingsPath = path.join(process.cwd(), 'settings.json');
let settings: any = {};
try {
  settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
} catch (error) {
  console.warn('Settings file not found, using defaults');
  settings = { apiSettings: { operator: "Created Using Rynn UI" } };
}

interface ApiModule {
  meta: {
    name: string;
    description: string;
    category: string;
    path: string;
    author: string;
    method?: string;
  };
  onStart: ({ req, res }: { req: any; res: any }) => void;
}

interface ApiModuleInfo {
  name: string;
  description: string;
  category: string;
  path: string;
  author: string;
  method: string;
}

// Store API modules
const apiModules: ApiModuleInfo[] = [];
let totalRoutes = 0;

// Create Elysia app
const app = new Elysia()
  .use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }))
  .derive(({ headers, set }) => {
    return {
      transformResponse: (data: any) => {
        if (data && typeof data === 'object' && !data.status) {
          return {
            status: 'success',
            operator: (settings.apiSettings && settings.apiSettings.operator) || "Created Using Rynn UI",
            ...data
          };
        }
        return data;
      }
    };
  });

// Load API modules recursively
const loadModules = async (dir: string) => {
  if (!fs.existsSync(dir)) {
    console.log(chalk.yellow(`API directory not found: ${dir}`));
    return;
  }

  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await loadModules(filePath);
    } else if (stat.isFile() && (path.extname(file) === '.js' || path.extname(file) === '.ts')) {
      try {
        const fileUrl = `file://${filePath}`;
        const module: ApiModule = await import(fileUrl);
        
        if (!module.meta || !module.onStart || typeof module.onStart !== 'function') {
          console.warn(chalk.bgHex('#FF9999').hex('#333').bold(`Invalid module in ${filePath}: Missing or invalid meta/onStart`));
          continue;
        }

        const basePath = module.meta.path.split('?')[0];
        const routePath = '/api' + basePath;
        const method = (module.meta.method || 'get').toLowerCase();

        if (method === 'get') {
          app.get(routePath, ({ request, query, transformResponse }) => {
            console.log(chalk.bgHex('#99FF99').hex('#333').bold(`Handling GET request for ${routePath}`));
            const req = { 
              url: new URL(request.url), 
              query: query || {},
              headers: Object.fromEntries(request.headers.entries())
            };
            const res = { 
              json: (data: any) => transformResponse ? transformResponse(data) : data,
              status: (code: number) => ({ status: code }),
              send: (data: any) => data
            };
            return module.onStart({ req, res });
          });
        } else if (method === 'post') {
          app.post(routePath, ({ request, body, query, transformResponse }) => {
            console.log(chalk.bgHex('#99FF99').hex('#333').bold(`Handling POST request for ${routePath}`));
            const req = { 
              url: new URL(request.url), 
              body: body || {},
              query: query || {},
              headers: Object.fromEntries(request.headers.entries())
            };
            const res = { 
              json: (data: any) => transformResponse ? transformResponse(data) : data,
              status: (code: number) => ({ status: code }),
              send: (data: any) => data
            };
            return module.onStart({ req, res });
          });
        }

        apiModules.push({
          name: module.meta.name,
          description: module.meta.description,
          category: module.meta.category,
          path: routePath + (module.meta.path.includes('?') ? '?' + module.meta.path.split('?')[1] : ''),
          author: module.meta.author,
          method: module.meta.method || 'get'
        });
        
        totalRoutes++;
        console.log(chalk.bgHex('#FFFF99').hex('#333').bold(`Loaded Route: ${module.meta.name} (${method.toUpperCase()})`));
      } catch (error: any) {
        console.error(chalk.bgHex('#FF9999').hex('#333').bold(`Error loading module ${filePath}: ${error.message}`));
      }
    }
  }
};

// Load modules from api folder
const apiFolder = path.join(process.cwd(), 'api');
await loadModules(apiFolder);

console.log(chalk.bgHex('#90EE90').hex('#333').bold('Load Complete! ✓'));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(`Total Routes Loaded: ${totalRoutes}`));

// Define routes
app
  .get('/settings.json', () => {
    if (fs.existsSync(settingsPath)) {
      return Bun.file(settingsPath);
    }
    return { error: 'Settings file not found' };
  })
  
  .get('/api/info', ({ transformResponse }) => {
    const categories: Record<string, { name: string; items: any[] }> = {};
    
    apiModules.forEach(module => {
      if (!categories[module.category]) {
        categories[module.category] = { name: module.category, items: [] };
      }
      categories[module.category].items.push({
        name: module.name,
        desc: module.description,
        path: module.path,
        author: module.author,
        method: module.method
      });
    });
    
    const result = { categories: Object.values(categories) };
    return transformResponse ? transformResponse(result) : result;
  })
  
  .get('/', () => {
    const portalPath = path.join(process.cwd(), 'web', 'portal.html');
    if (fs.existsSync(portalPath)) {
      return Bun.file(portalPath);
    }
    return new Response(`
      <html>
        <head><title>API Server</title></head>
        <body>
          <h1>🚀 API Server Running</h1>
          <p>Server is running successfully!</p>
          <p><a href="/api/info">View API Documentation</a></p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  })
  
  .get('/docs', () => {
    const docsPath = path.join(process.cwd(), 'web', 'docs.html');
    if (fs.existsSync(docsPath)) {
      return Bun.file(docsPath);
    }
    return new Response(`
      <html>
        <head><title>API Documentation</title></head>
        <body>
          <h1>📚 API Documentation</h1>
          <p><a href="/api/info">View Available APIs</a></p>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  })
  
  .get('/*', ({ params }) => {
    const filePath = path.join(process.cwd(), 'web', (params as any)['*']);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return Bun.file(filePath);
    }
    
    return new Response(`
      <html>
        <head><title>404 - Not Found</title></head>
        <body>
          <h1>404 - Page Not Found</h1>
          <p><a href="/">Go Home</a></p>
        </body>
      </html>
    `, { 
      status: 404,
      headers: { 'Content-Type': 'text/html' }
    });
  })
  
  .onError(({ code, error, set }) => {
    console.error('Server Error:', error);
    
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return new Response('404 - Not Found', { status: 404 });
    }
    
    set.status = 500;
    return new Response('Internal Server Error', { status: 500 });
  });

// Start server with automatic port detection
async function startServer() {
  try {
    let serverPort = Number(PORT);
    
    // If environment doesn't specify a port, find available one
    if (!process.env.PORT && !process.env.RENDER_EXTERNAL_PORT) {
      serverPort = await findAvailablePort(DEFAULT_PORT);
    }
    
    const server = app.listen({
      port: serverPort,
      hostname: '0.0.0.0' // Important for Render deployment
    });
    
    console.log(chalk.bgHex('#90EE90').hex('#333').bold(`🚀 Server is running on port ${serverPort}`));
    console.log(chalk.bgHex('#87CEEB').hex('#333').bold(`🌐 Access your API at: http://localhost:${serverPort}`));
    
    return server;
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.log(chalk.bgHex('#FFB6C1').hex('#333').bold(`Port ${PORT} is in use, finding alternative...`));
      const availablePort = await findAvailablePort(Number(PORT) + 1);
      
      const server = app.listen({
        port: availablePort,
        hostname: '0.0.0.0'
      });
      
      console.log(chalk.bgHex('#90EE90').hex('#333').bold(`🚀 Server started on available port ${availablePort}`));
      return server;
    } else {
      console.error(chalk.bgHex('#FF6B6B').hex('#333').bold(`Failed to start server: ${error.message}`));
      process.exit(1);
    }
  }
}

// Start the server
startServer();

export default app;
