import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

const PORT = process.env.PORT || 4000;

// Load settings
const settingsPath = path.join(process.cwd(), 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));

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
  .use(staticPlugin({
    assets: 'web',
    prefix: '/'
  }))
  .onBeforeHandle(({ set }) => {
    // Add operator to all JSON responses
    set.headers['Content-Type'] = 'application/json';
  })
  .transform(({ response, set }) => {
    // Middleware to augment JSON responses
    if (response && typeof response === 'object') {
      return {
        status: response.status || 'success',
        operator: (settings.apiSettings && settings.apiSettings.operator) || "Created Using Rynn UI",
        ...response
      };
    }
    return response;
  });

// Load API modules recursively
const loadModules = async (dir: string) => {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      await loadModules(filePath); // Recurse into subfolder
    } else if (stat.isFile() && (path.extname(file) === '.js' || path.extname(file) === '.ts')) {
      try {
        // Dynamic import for ES modules
        const module: ApiModule = await import(filePath);
        
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
          app.get(routePath, ({ request, set }) => {
            console.log(chalk.bgHex('#99FF99').hex('#333').bold(`Handling GET request for ${routePath}`));
            const req = { url: new URL(request.url), query: Object.fromEntries(new URL(request.url).searchParams) };
            const res = { json: (data: any) => data, status: (code: number) => ({ status: code }) };
            return module.onStart({ req, res });
          });
        } else if (method === 'post') {
          app.post(routePath, ({ request, body, set }) => {
            console.log(chalk.bgHex('#99FF99').hex('#333').bold(`Handling POST request for ${routePath}`));
            const req = { url: new URL(request.url), body, query: Object.fromEntries(new URL(request.url).searchParams) };
            const res = { json: (data: any) => data, status: (code: number) => ({ status: code }) };
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
if (fs.existsSync(apiFolder)) {
  await loadModules(apiFolder);
}

console.log(chalk.bgHex('#90EE90').hex('#333').bold('Load Complete! ✓'));
console.log(chalk.bgHex('#90EE90').hex('#333').bold(`Total Routes Loaded: ${totalRoutes}`));

// Define routes
app
  // Serve settings.json
  .get('/settings.json', () => {
    return Bun.file(settingsPath);
  })
  
  // API info endpoint
  .get('/api/info', () => {
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
    
    return { categories: Object.values(categories) };
  })
  
  // Root route
  .get('/', () => {
    return Bun.file(path.join(process.cwd(), 'web', 'portal.html'));
  })
  
  // Docs route
  .get('/docs', () => {
    return Bun.file(path.join(process.cwd(), 'web', 'docs.html'));
  })
  
  // 404 handler
  .onError(({ code, error, set }) => {
    if (code === 'NOT_FOUND') {
      set.status = 404;
      return Bun.file(path.join(process.cwd(), 'web', '404.html'));
    }
    
    // 500 error handler
    console.error(error);
    set.status = 500;
    return Bun.file(path.join(process.cwd(), 'web', '500.html'));
  })
  
  .listen(PORT);

console.log(chalk.bgHex('#90EE90').hex('#333').bold(`Server is running on port ${PORT}`));

export default app;
