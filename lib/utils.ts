import fs from "node:fs";
import path from "node:path";

import type { Route } from "./lazy";

export type RequireOnly<Object, Keys extends keyof Object> = Omit<Object, Keys> & Required<Pick<Object, Keys>>;

export function stringifyRoutes(routes: Route[], prefix: string) {
  return "[" + routes.map((route) => routeToString(route, prefix)).join(",") + "]";
}

function routeToString(route: Route, prefix: string): string {
  const componentPath = `${prefix}${path.sep}${route.file}`.split(path.sep).join(path.posix.sep);
  const loaderPath = getLoaderPath(componentPath);

  const props = new Map<string, string>();

  if (route.path !== "") {
    props.set("path", `'${route.path}'`);
  }

  if (route.index === true) {
    props.set("index", "true");
  }

  if (fs.existsSync(loaderPath)) {
    props.set(
      "loader",
      `async function loader(ctx) {
        const { loader } = await import("${loaderPath}");
        return await loader(ctx);
      }`,
    );
  }

  props.set("lazy", `() => import("${componentPath}")`);

  if (route.children.length) {
    const children = stringifyRoutes(route.children, prefix);
    props.set("children", children);
  }

  return (
    "{" +
    Array.from(props.entries())
      .map(([k, v]) => `${k}:${v}`)
      .join(",") +
    "}"
  );
}

function getLoaderPath(componentPath: string) {
  const parts = componentPath.split(path.posix.sep);
  parts.pop();
  parts.push("loader.ts");
  return parts.join(path.posix.sep);
}
