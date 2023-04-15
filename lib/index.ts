import fs from "node:fs";
import path from "node:path";

import type { Plugin } from "vite";

import type { LazyOptions,Route } from "./lazy";
import { getRoutes } from "./lazy";
import { stringifyRoutes } from "./utils";

function plugin(options: LazyOptions = {}): Plugin {
  const virtualModuleId = "virtual:lazy-routes";

  const { appDirectory = "app", ignoredRouteFiles } = options;

  const dir = path.resolve(process.cwd(), appDirectory);
  const prefix = `.${path.sep}${path.relative(process.cwd(), dir)}`;

  if (!fs.existsSync(path.join(dir, "routes")) || !fs.statSync(path.join(dir, "routes")).isDirectory()) {
    throw new Error(
      `[vite-plugin-lazy-routes] routes directory not found in appDirectory: ${path.relative(
        process.cwd(),
        appDirectory,
      )}`,
    );
  }

  return {
    name: "vite-plugin-lazy-routes",

    resolveId(id) {
      if (id === virtualModuleId) {
        return id;
      }
    },

    async load(id) {
      if (id === virtualModuleId) {
        let generatedRoutes = await getRoutes({
          appDirectory: dir,
          ignoredRouteFiles,
        });

        if (options.transformRoute != null) {
          generatedRoutes = generatedRoutes.map(options.transformRoute);
        }
        
        const imports = new Set<string>();
        const routesString = stringifyRoutes(generatedRoutes, prefix, imports);

        return `
          ${Array.from(imports).join(";\n")};\n
          export default ${routesString};\n
        `;
      }
    },
  };
}

export default plugin;
export { getRoutes, stringifyRoutes };

export type { Route };
