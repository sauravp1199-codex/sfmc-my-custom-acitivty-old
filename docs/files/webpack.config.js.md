# webpack.config.js

## Role in the System
Configures webpack to bundle the client-side source from `src/index.js` into `main.js` with source maps for debugging.

## Public Interface
| Export | Description |
| --- | --- |
| `module.exports = (env, argv) => ({ ... })` | Function that receives webpack CLI arguments and returns the configuration object. |

## Key Parameters and Return Values
| Parameter | Type | Description |
| --- | --- | --- |
| `env` | `object` | Optional environment variables passed from the CLI (unused currently). |
| `argv.mode` | `string` | Determines whether the build runs in `development` or `production`. Sets `mode` property accordingly. |

Returned configuration fields:
* `mode` – Derived from `argv.mode`.
* `devtool` – Uses `'cheap-source-map'` to generate source maps.
* `entry` – Points to `./src/index.js`.
* `output.path` – Emits bundles into the repository root.
* `output.filename` – Outputs `main.js`.

## External Dependencies
* `path` – Node.js module for resolving filesystem paths.
* `copy-webpack-plugin` – Imported but currently commented out (intended to copy Lightning Design System assets).

## Data Flow
Defines how source files are transformed into production-ready assets. Takes `src/index.js` as input and outputs `main.js` (+ optional assets when plugins are enabled).

## Error Handling and Edge Cases
* If `argv.mode` is undefined, webpack defaults to development mode.
* Commented `CopyPlugin` section indicates prior asset-copying functionality; re-enable and configure patterns if static assets need to be copied to `dist/`.

## Usage Example
Run webpack in production mode:
```bash
npx webpack --mode production
```

Enable the copy plugin by uncommenting the `plugins` block and adjusting paths to match the desired output directory.

## Related Files
* `src/index.js` – Entry file compiled by webpack.
* `main.js` – Output bundle consumed by the UI.
* `package.json` – Provides `webpack` scripts and dependency declarations.

## Troubleshooting
| Issue | Resolution |
| --- | --- |
| Bundle missing | Ensure the `entry` path exists and that webpack has permission to write to the output directory. |
| Source maps not loading | Confirm `devtool` remains enabled and that browsers can fetch `main.js.map`. |
| Lightning Design System assets absent | Re-enable `CopyPlugin` or copy assets manually into the deployment package. |

## Glossary
* **Webpack** – Module bundler for JavaScript applications.
* **Source Map** – File that maps compiled code back to original source for debugging.
