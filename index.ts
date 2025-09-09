import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const PORT = process.env.PORT || 4000;

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
  .use(cors())
  // Static file serving using Bun's built-in static file serving
  .get('/static/*', ({ params }) => {
    const filePath = path.join(process.cwd(), 'web', (params as any)['*']);
    if (fs.existsSync(filePath)) {
      return Bun.file(filePath);
    }
    return new Response('File not found', { status: 404 });
  })
  .derive(({ headers, set }) => {
    // Add default response transformation
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
      await loadModules(filePath); // Recurse into subfolder
    } else if (stat.isFile() && (path.extname(file) === '.js' || path.extname(file) === '.ts')) {
      try {
        // Use file:// URL for proper ES module import
        const fileUrl = `file://${filePath}`;
        const module: ApiModule = await import(fileUrl);
        
        // Validate module structure
        if (!module.meta || !module.onStart || typeof module.onStart !== 'function') {
          console.warn(chalk.bgHex('#FF9999').hex('#333').bold(`Invalid module in ${filePath}: Missing or invalid meta/onStart`));
          continue;
        }

        const basePath = module.meta.path.split('?')[0];
        const routePath = '/api' + basePath;
        const method = (module.meta.method || 'get').toLowerCase();

        // Register route with Elysia
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
  // Serve settings.json
  .get('/settings.json', () => {
    if (fs.existsSync(settingsPath)) {
      return Bun.file(settingsPath);
    }
    return { error: 'Settings file not found' };
  })
  
  // API info endpoint
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
  
  // Root route - serve portal.html or fallback
  .get('/', () => {
    const portalPath = path.join(process.cwd(), 'web', 'portal.html');
    if (fs.existsSync(portalPath)) {
      return Bun.file(portalPath);
    }
    return new Response('<h1>API Server Running</h1><p>Portal file not found</p>', {
      headers: { 'Content-Type': 'text/html' }
    });
  })
  
  // Docs route
  .get('/docs', () => {
    const docsPath = path.join(process.cwd(), 'web', 'docs.html');
    if (fs.existsSync(docsPath)) {
      return Bun.file(docsPath);
    }
    return new Response('<h1>API Documentation</h1><p>Docs file not found</p>', {
      headers: { 'Content-Type': 'text/html' }
    });
  })
  
  // Serve any file from web directory
  .get('/*', ({ params }) => {
    const filePath = path.join(process.cwd(), 'web', (params as any)['*']);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return Bun.file(filePath);
    }
    
    // 404 fallback
    const notFoundPath = path.join(process.cwd(), 'web', '404.html');
    if (fs.existsSync(notFoundPath)) {
      return new Response(Bun.file(notFoundPath), { status: 404 });
    }
    return new Response('404 - Page Not Found', { status: 404 });
  })
  
  // Global error handler
  .onError(({ code, error, set }) => {
    console.error('Server Error:', error);
    
    if (code === 'NOT_FOUND') {
      set.status = 404;
      const notFoundPath = path.join(process.cwd(), 'web', '404.html');
      if (fs.existsSync(notFoundPath)) {
        return Bun.file(notFoundPath);
      }
      return '404 - Not Found';
    }
    
    // 500 error handler
    set.status = 500;
    const errorPath = path.join(process.cwd(), 'web', '500.html');
    if (fs.existsSync(errorPath)) {
      return Bun.file(errorPath);
    }
    return 'Internal Server Error';
  })
  
  .listen(PORT);

console.log(chalk.bgHex('#90EE90').hex('#333').bold(`🚀 Server is running on port ${PORT}`));

export default app;
