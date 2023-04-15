import fs from "node:fs";
import path from "node:path";

import type { Route } from "./lazy";

export type RequireOnly<Object, Keys extends keyof Object> = Omit<Object, Keys> & Required<Pick<Object, Keys>>;

export function stringifyRoutes(routes: Route[], prefix: string, imports: Set<string>) {
  return "[" + routes.map((route) => routeToString(route, prefix, imports)).join(",") + "]";
}

function routeToString(route: Route, prefix: string, imports: Set<string>): string {
  const componentPath = `${prefix}${path.sep}${route.file}`.split(path.sep).join(path.posix.sep);
  const loaderPath = getLoaderPath(componentPath);

  const props = new Map<string, string>();

  if (route.path !== "") {
    props.set("path", `'${route.path}'`);
  }

  if (route.index === true) {
    props.set("index", "true");
  }

  if (route.id != null) {
    props.set("id", `'${route.id}'`);
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

  if (route.isLazy) {
    props.set("lazy", `() => import("${componentPath}")`);
  } else {
    const componentName = getRouteComponentName(route);
    imports.add(`import * as ${componentName} from '${componentPath}';`);
    props.set("Component", `${componentName}.Component ? ${componentName}.Component : () => null`);
    props.set("loader", `${componentName}.loader`);
    props.set("action", `${componentName}.action`);
    props.set("ErrorBoundary", `${componentName}.ErrorBoundary`);
    props.set("handle", `${componentName}.handle`);
    props.set("shouldRevalidate", `${componentName}.shouldRevalidate`);
  }

  if (route.children.length) {
    const children = stringifyRoutes(route.children, prefix, imports);
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

function getRouteComponentName(route: Route) {
  return route.id
    .split(/[/.-]/)
    .map((str) => str.replace(/^\w/, (c) => c.toUpperCase()))
    .join("");
}
