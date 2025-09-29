# `webpack.config.js`

## Role in the System
Defines the bundling configuration for transforming the client-side source (`src/index.js`) into the distributable `dist/main.js` file served to Journey Builder.

## Public API

* Exports a function `(env, argv) => config` to allow mode-specific adjustments when webpack is invoked from the CLI.

## Key Configuration Options

| Option | Description |
| --- | --- |
| `mode` | Set dynamically based on `argv.mode`; defaults to `development` when unspecified. |
| `devtool` | Uses `cheap-source-map` to balance debugging needs with bundle size. |
| `entry` | Absolute path to `./src/index.js`, the browser entry point. |
| `output.path` | Resolves to `<repo>/dist`. |
| `output.filename` | Outputs bundle as `main.js`. |
| Commented `CopyPlugin` | Placeholder to copy SLDS assets into `dist/` (currently disabled due to previous issues). |

## External Dependencies

* `path` (Node core) for directory resolution.
* `copy-webpack-plugin` (commented) if re-enabled to migrate static assets.

## Data Flow

1. When `webpack` runs, it evaluates the exported function with CLI-provided arguments.
2. The returned config instructs webpack to transpile `src/index.js` (and dependencies) into `dist/main.js`.
3. `app.js` serves the generated bundle to browsers via the `/main.js` route or `/dist` static directory.

## Error Handling and Edge Cases

* If `argv.mode` is undefined, webpack defaults to development mode with watchers still able to override.
* CopyPlugin remains commented due to prior errors; re-enable cautiously and verify asset paths.

## Usage Example

```bash
# Development watch
npx webpack --watch --mode=development

# Production build
npx webpack --mode=production
```

## Related Files

* `src/index.js` is the entry file bundled by this configuration.
* `dist/main.js` (generated) is served by `app.js`.
* `package.json` `dev` script runs webpack alongside `npm start` for local development.

## Troubleshooting

* **Bundle missing** – Run `npx webpack --mode=development` to regenerate `dist/main.js` before starting the server.
* **SLDS assets unavailable** – Consider re-enabling `CopyPlugin` and updating paths to copy required design assets.
* **Source maps inaccurate** – Adjust `devtool` settings (e.g., `source-map`) for more precise debugging at the cost of build speed.

## Glossary

* **Bundle** – Combined JavaScript output produced by webpack for browser delivery.
* **Entry Point** – Initial file webpack starts from to build dependency graph.
