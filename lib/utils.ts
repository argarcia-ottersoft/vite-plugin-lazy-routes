import fs from "node:fs";
import path from "node:path";
import ts from 'typescript';

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
    imports.add(`import * as ${componentName} from '${componentPath}'`);

    const foundExports = parseAndFindExports(componentPath);
    if (foundExports.includes('shouldRevalidate')) {
      props.set("shouldRevalidate", `${componentName}.shouldRevalidate`);
    }
    if (foundExports.includes('handle')) {
      props.set("handle", `${componentName}.handle`);
    }
    if (foundExports.includes('ErrorBoundary')) {
      props.set("ErrorBoundary", `${componentName}.ErrorBoundary`);
    }
    if (foundExports.includes('action')) {
      props.set("action", `${componentName}.action`);
    }
    if (foundExports.includes('loader')) {
      props.set("loader", `${componentName}.loader`);
    }
    if (foundExports.includes('Component')) {
      props.set("Component", `${componentName}.Component`);
    } else {
      props.set("Component", `() => null`);
    }
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

function parseAndFindExports(file: string) {
  try {
    const sourceFile = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ true,
      ts.ScriptKind.TSX
    );

    const exportNames = ['shouldRevalidate', 'handle', 'ErrorBoundary', 'action', 'loader', 'Component'];
    const foundExports: string[] = [];

    function visit(node: ts.Node) {
      if (
        ts.isVariableStatement(node) &&
        node.modifiers &&
        node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
      ) {
        node.declarationList.declarations.forEach(declaration => {
          const name = declaration.name.getText();
          if (exportNames.includes(name)) {
            foundExports.push(name);
          }
        });
      }

      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return foundExports;
  } catch (parseErr) {
    console.error('Error parsing file:', parseErr);
    throw parseErr;
  }
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
