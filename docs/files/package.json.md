# `package.json`

## Role in the System
Defines the Node.js project metadata, dependencies, and npm scripts for the Custom Activity service and its client bundle.

## Key Sections

| Section | Description |
| --- | --- |
| `name`, `version`, `description` | Package metadata used by npm and documentation tooling. |
| `main` | Placeholder entry point (not actively used in this project). |
| `scripts` | Commands for starting the server (`npm start`), running combined dev/watch (`npm run dev`), and placeholder tests. |
| `dependencies` | Runtime packages required by the server and bundler (Express, axios, postmonger, etc.). |
| `devDependencies` | Build-time tooling including webpack and Babel presets. |

## Dependencies Overview

* **Runtime** – `express`, `axios`, `postmonger`, `uuid`, `@salesforce-ux/design-system`, etc.
* **Build** – `webpack`, `webpack-cli`, `babel-loader`, `babel-core`, `babel-preset-es2015`, `babel-preset-react`.

## Scripts

* `npm start` – Runs `node ./app.js` to serve the Custom Activity.
* `npm run dev` – Uses `concurrently` to start the server and run `webpack --watch` for automatic bundle rebuilds.
* `npm test` – Placeholder script (returns an error until replaced with real tests).

## Related Files

* `app.js` – Executed by the `start` script.
* `webpack.config.js` – Consumed when running webpack via the `dev` script.
* `Procfile` – Points to the same `node app.js` command for production deployments.

## Troubleshooting

* **Missing dependency errors** – Run `npm install` to ensure both runtime and dev dependencies are available.
* **Build failures** – Confirm webpack CLI version compatibility with config syntax and that Babel presets are installed.
* **Tests failing by default** – Replace the placeholder `npm test` script with actual test runner commands.

## Glossary

* **Dependency** – External package required for the application to build or run.
* **npm Script** – Named command defined in `package.json` executed via `npm run <script>`.
