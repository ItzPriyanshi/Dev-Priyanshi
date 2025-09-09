// index.ts
import { Elysia } from "elysia";
import { readdirSync, statSync, readFileSync } from "fs";
import path from "path";
import chalk from "chalk";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = parseInt(process.env.PORT || "4000", 10);

// Load settings
const settingsPath = path.join(__dirname, "settings.json");
const settings = JSON.parse(readFileSync(settingsPath, "utf-8"));

// API metadata
interface ApiModule {
  name: string;
  description: string;
  category: string;
  path: string;
  author: string;
  method: string;
}

const apiModules: ApiModule[] = [];
let totalRoutes = 0;

const app = new Elysia();

// JSON augmentation middleware
app.onAfterHandle(({ response }) => {
  if (response && typeof response === "object" && !Array.isArray(response)) {
    return {
      operator: settings.apiSettings?.operator || "Created Using Rynn UI",
      ...response,
    };
  }
  return response;
});

// Static files
app.get("/", () => Bun.file(path.join(__dirname, "web", "portal.html")));
app.get("/docs", () => Bun.file(path.join(__dirname, "web", "docs.html")));
app.get("/settings.json", () => Bun.file(settingsPath));

// API info endpoint
app.get("/api/info", () => {
  const categories: Record<string, any> = {};
  for (const module of apiModules) {
    if (!categories[module.category]) {
      categories[module.category] = { name: module.category, items: [] };
    }
    categories[module.category].items.push({
      name: module.name,
      desc: module.description,
      path: module.path,
      author: module.author,
      method: module.method,
    });
  }
  return { categories: Object.values(categories) };
});

// Global error handling
app.onError(({ code, error }) => {
  if (code === "NOT_FOUND") {
    return Bun.file(path.join(__dirname, "web", "404.html"));
  }
  console.error(error);
  return Bun.file(path.join(__dirname, "web", "500.html"));
});

// Recursive API loader (async)
async function loadModules(dir: string) {
  for (const file of readdirSync(dir)) {
    const filePath = path.join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      await loadModules(filePath); // recurse
    } else if (stat.isFile() && [".ts", ".js"].includes(path.extname(file))) {
      try {
        const module = await import(`file://${filePath}`);

        if (!module.meta || !module.onStart || typeof module.onStart !== "function") {
          console.warn(
            chalk.bgHex("#FF9999").hex("#333").bold(
              `Invalid module in ${filePath}: Missing or invalid meta/onStart`
            )
          );
          continue;
        }

        const basePath = module.meta.path.split("?")[0];
        const routePath = "/api" + basePath;
        const method = (module.meta.method || "get").toLowerCase();

        (app as any)[method](routePath, async ({ request, set }) => {
          await module.onStart({ req: request, res: set });
        });

        apiModules.push({
          name: module.meta.name,
          description: module.meta.description,
          category: module.meta.category,
          path:
            routePath +
            (module.meta.path.includes("?")
              ? "?" + module.meta.path.split("?")[1]
              : ""),
          author: module.meta.author,
          method: module.meta.method || "get",
        });

        totalRoutes++;
        console.log(
          chalk.bgHex("#FFFF99").hex("#333").bold(
            `Loaded Route: ${module.meta.name} (${method.toUpperCase()})`
          )
        );
      } catch (error: any) {
        console.error(
          chalk.bgHex("#FF9999").hex("#333").bold(
            `Error loading module ${filePath}: ${error.message}`
          )
        );
      }
    }
  }
}

// Start server after loading modules
const apiFolder = path.join(__dirname, "api");
await loadModules(apiFolder);

console.log(chalk.bgHex("#90EE90").hex("#333").bold("Load Complete! ✓"));
console.log(
  chalk.bgHex("#90EE90").hex("#333").bold(`Total Routes Loaded: ${totalRoutes}`)
);

app.listen(PORT);
console.log(
  chalk.bgHex("#90EE90").hex("#333").bold(`Server is running on port ${PORT}`)
);

export default app;