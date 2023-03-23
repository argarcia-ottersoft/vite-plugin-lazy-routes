# vite-plugin-lazy-routes

Use [Remix](https://github.com/remix-run/remix) lazy flat-route routing in your [Vite](https://github.com/vitejs/vite) project.

## Plugin config

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import lazyRoutes from "vite-plugin-lazy-routes";

export default defineConfig({
  plugins: [react(), lazyRoutes()],
});
```

**With options:**

```js
lazyRoutes({
  /* options here */
});
```

## Options

### appDirectory

https://remix.run/docs/en/v1/api/conventions#appdirectory

- **Optional**
- **Type**: `string`
- **Default**: `path.join(process.cwd(), "app")`

An absolute path to the folder containing the `routes` folder.

### ignoredRouteFiles

- **Optional**
- **Type**: `string[]`

https://remix.run/docs/en/v1/api/conventions#ignoredroutefiles

This is an array of globs (via minimatch) that Remix will match to files while reading your app/routes directory. If a file matches, it will be ignored rather that treated like a route module. This is useful for ignoring dotfiles (like .DS_Store files) or CSS/test files you wish to colocate.

## Usage

```js
import lazyRoutes from "virtual:lazy-routes";
```

**Example**

```jsx
import { render } from "react-dom";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import lazyRoutes from "virtual:lazy-routes";

// Note: This example only works with react-router >= 6.4
const router = createBrowserRouter([
  {
    path: "/",
    children: lazyRoutes,
    // You can add your own `element`, `errorElement`, `loader`, ...
  },
]);

render(
  <RouterProvider router={router}>
    <App />
  </RouterProvider>,
  document.querySelector("#app")
);
```

## TypeScript

If you use TypeScript you can add the following to your `vite-env.d.ts` file.\
This will add types for the `virtual:lazy-routes` module.

```ts
/// <reference types="vite-plugin-lazy-routes/virtual" />
```

## Similar projects

### vite-plugin-pages

This project is inspired by [`vite-plugin-remix-routes`](https://github.com/vjee/vite-plugin-remix-routes)

## License

[MIT](https://github.com/argarcia-ottersoft/vite-plugin-lazy-routes/blob/main/LICENSE)