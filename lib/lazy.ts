import { flatRoutes } from "./flat-routes";
import type { RequireOnly } from "./utils";

interface RouteManifest {
  [routeId: string]: ConfigRoute;
}

export interface LazyOptions {
  /**
   * The path to the `app` directory, relative to `remix.config.js`. Defaults
   * to `"app"`.
   */
  appDirectory?: string;

  /**
   * A list of filenames or a glob patterns to match files in the `app/routes`
   * directory that Remix will ignore. Matching files will not be recognized as
   * routes.
   */
  ignoredRouteFiles?: string[];

  transformRoute?: (route: Route) => Route;
}

type GetRouteOptions = RequireOnly<LazyOptions, "appDirectory">;

/**
 * See `readConfig` in @remix-run/dev/config.ts
 */
export async function getRoutes(options: GetRouteOptions) {
  const { appDirectory, ignoredRouteFiles } = options;

  const routeManifest: RouteManifest = {
    root: { path: "", id: "root", file: "" },
  };

  const conventionalRoutes = flatRoutes(appDirectory, ignoredRouteFiles);

  for (const key of Object.keys(conventionalRoutes)) {
    const route = conventionalRoutes[key];
    routeManifest[route.id] = {
      ...route,
      parentId: route.parentId || "root",
    };
  }

  const routeConfig = createRoutes(routeManifest)[0].children;

  // This is not part of remix.
  const modifyRoute = (route: Route): Route => ({
    ...route,
    path: route.path,
    children: route.children.map(modifyRoute),
  });

  return routeConfig.map(modifyRoute);
}

/**
 * See `createClientRoutes` in @remix-run/react/routes.tsx
 */
export function createRoutes(routeManifest: RouteManifest, parentId?: string): Route[] {
  return Object.keys(routeManifest)
    .filter((key) => routeManifest[key].parentId === parentId)
    .map((key) => {
      const route = createRoute(routeManifest[key]);
      route.children = createRoutes(routeManifest, route.id);
      return route;
    });
}

/**
 * See `createClientRoute` in @remix-run/react/routes.tsx
 */
export function createRoute(route: ConfigRoute): Route {
  return {
    id: route.id,
    file: route.file,
    isLazy: true,
    path: route.path || "",
    index: !!route.index,
    children: [],
  };
}

export interface Route {
  // custom properties
  id: string;
  file: string;
  isLazy: boolean;

  // react-router route properties
  path: string;
  index: boolean;
  children: Route[];
}

/**
 * A route that was created using `defineRoutes` or created conventionally from
 * looking at the files on the filesystem.
 */
export interface ConfigRoute {
  /**
   * The path this route uses to match on the URL pathname.
   */
  path?: string;
  /**
   * Should be `true` if it is an index route. This disallows child routes.
   */
  index?: boolean;
  /**
   * Should be `true` if the `path` is case-sensitive. Defaults to `false`.
   */
  caseSensitive?: boolean;
  /**
   * The unique id for this route, named like its `file` but without the
   * extension. So `app/routes/gists/$username.jsx` will have an `id` of
   * `routes/gists/$username`.
   */
  id: string;
  /**
   * The unique `id` for this route's parent route, if there is one.
   */
  parentId?: string;
  /**
   * The path to the entry point for this route, relative to
   * `config.appDirectory`.
   */
  file: string;
}
