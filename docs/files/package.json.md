# package.json

## Role in the System
Defines project metadata, npm scripts, and dependency versions required to build and run the custom activity.

## Public Interface
| Field | Description |
| --- | --- |
| `name`, `version`, `description` | Metadata describing the npm package. |
| `scripts.start` | Executes `node ./app.js` to launch the Express server. |
| `scripts.dev` | Runs both `npm start` and `webpack --watch` concurrently for local development. |
| `scripts.test` | Placeholder script returning an error (no automated tests defined). |
| `dependencies` | Runtime packages required by the server or build (Express, Postmonger, request, etc.). |
| `devDependencies` | Build tooling such as webpack and Babel presets. |

## Key Parameters and Return Values
Not applicable; JSON configuration consumed by npm and Node.js tooling.

## External Dependencies
* Runtime dependencies include `express`, `postmonger`, `request`, `axios`, `@salesforce-ux/design-system`, etc.
* Development dependencies include `webpack`, `webpack-cli`, and Babel tooling.

## Data Flow
Controls which modules are installed in the deployment environment and determines available npm commands for build/run workflows.

## Error Handling and Edge Cases
* Missing dependencies will cause `npm install` to fail; ensure the listed versions exist on npm.
* Update scripts cautiously to avoid breaking deployment automation (e.g., Heroku relies on `npm start`).

## Usage Example
Install dependencies and run the app:
```bash
npm install
npm run dev
```

## Related Files
* `app.js` – Entry point invoked by `npm start`.
* `webpack.config.js` – Consumed by the `webpack --watch` script.
* `Procfile` – Alternative process definition used in production deployments.

## Troubleshooting
| Issue | Resolution |
| --- | --- |
| `npm install` fails | Clear the lock file if inconsistent, update package versions, or ensure network access to npm registry. |
| `npm run dev` exits immediately | Confirm `concurrently` is installed globally or replace with `npx concurrently`. |
| Security vulnerabilities reported | Audit dependencies and upgrade to patched versions (consider replacing deprecated `request`). |

## Glossary
* **npm Script** – Named command defined in `package.json` executed via `npm run <script>`.
* **Dependency** – Package required at runtime or build time by the application.
