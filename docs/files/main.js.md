# main.js

## Role in the System
Webpack-generated bundle that packages the client-side logic from `src/index.js` (and dependencies) into a single script served to Journey Builder. This is the file referenced by `index.html`.

## Public Interface
The bundle exposes the same runtime behaviour as `src/index.js`, executed immediately in the browser context. No additional globals are exported beyond those intentionally attached to `window` (e.g., `window.jb` in development mode).

## Key Parameters and Return Values
Not directly authored; mirrors the functions described in [`src/index.js`](src/index.js.md). Each function operates on DOM elements and Postmonger sessions without exporting module-level APIs.

## External Dependencies
* Includes compiled versions of the `postmonger` library and any other modules imported by `src/index.js`.
* Relies on the browser DOM, same as the source module.

## Data Flow
Identical to `src/index.js`: receives Journey Builder events via Postmonger, reads form values, and pushes configuration updates and execution payloads back to Journey Builder.

## Error Handling and Edge Cases
* Minified output can make debugging difficult; use source maps (`main.js.map`) during development for readable stack traces.
* Ensure webpack rebuilds the bundle after changes to `src/index.js`; otherwise, the browser will continue running stale code.

## Usage Example
Include the bundle in the configuration page:
```html
<script src="main.js"></script>
```
During debugging, open browser DevTools with source maps enabled to inspect the original source code.

## Related Files
* `src/index.js` – Authoritative source module compiled into this file.
* `main.js.map` – Source map linking the bundle to original source files.
* `webpack.config.js` – Build configuration controlling bundle output.

## Troubleshooting
| Issue | Resolution |
| --- | --- |
| Console stack traces minified | Enable source maps in browser DevTools and ensure `devtool` is set to `cheap-source-map` (default in `webpack.config.js`). |
| Bundle outdated after code change | Re-run `webpack --watch` or restart `npm run dev` to trigger a rebuild. |
| File not served in production | Confirm the compiled `main.js` is deployed alongside `index.html` and that Express static routes are configured. |

## Glossary
* **Bundle** – Aggregated JavaScript file produced by a build tool such as webpack.
* **Source Map** – Mapping file that correlates minified bundle code to original source for debugging. |
