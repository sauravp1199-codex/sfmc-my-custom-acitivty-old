# SFMC Custom SMS Send Activity

## Overview
This repository contains a Salesforce Marketing Cloud (SFMC) Journey Builder custom activity that collects SMS delivery parameters inside the configuration canvas and forwards them to an external SMS orchestration API during journey execution. The project bundles a lightweight Express server for hosting the activity assets, the client-side Journey Builder integration built with Postmonger, and the supporting configuration metadata required by SFMC.

## Architecture
```
+--------------------+        +---------------------------+        +--------------------------------+
| Journey Builder UI |<------>| Front-end (src/index.js) |<------>| Express Server (app.js)        |
| (iframe)           |  PM    |  • Renders configuration |  HTTP  |  • Serves static assets       |
|                    | events |  • Emits Postmonger msgs |  REST  |  • Hosts REST endpoints       |
+--------------------+        +---------------------------+        +--------------------------------+
                                                                   |                                |
                                                                   |  Execution webhook (/executeV2)|
                                                                   +----------------+---------------+
                                                                                    |
                                                                                    v
                                                                  External SMS orchestration API
```
* **Postmonger (PM)** events bridge the Journey Builder iframe with the activity configuration UI.
* The Express server exposes the SFMC lifecycle endpoints (`/save`, `/publish`, `/validate`, `/stop`) and the execution webhook (`/executeV2`).
* `config-json.js` dynamically generates the `config.json` contract consumed by Journey Builder to install the activity.

## Getting Started

### Prerequisites
* Node.js 16.x or later
* npm 8.x or later
* SFMC account with Journey Builder admin permissions (for deployment and testing)

### Installation
```bash
npm install
```

### Local Development
1. Run the local server and webpack watcher:
   ```bash
   npm run dev
   ```
   * `npm start` serves the Express app on `http://localhost:3001`.
   * `webpack --watch` rebundles `src/index.js` into `main.js` when client code changes.
2. Open `http://localhost:3001` in a browser to load the configuration UI.
3. Use the in-browser test harness (`window.jb.ready()`) to simulate Journey Builder events during development.

### Build
The project relies on webpack to produce `main.js`. A one-off production bundle can be generated with:
```bash
npx webpack --mode production
```

### Testing
Automated tests are not defined. Validate functionality manually by triggering the Journey Builder simulator (see `setupExampleTestHarness` in `src/index.js`) or by connecting the activity to a sandbox Journey.

## Environment Configuration
| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Express server listening port. |
| `SFMC_BASE_URL` | _not set_ | Optionally override the hostname used in `config-json.js` if hosting endpoints under a different domain. Update the file accordingly when customizing. |
| `LOG_LEVEL` | _not set_ | Implement custom logging controls in `app.js` if required (currently a simple console logger is used). |

> **Security note:** `/executeV2` forwards SMS payloads to an external API using static credentials. Store these secrets in environment variables or a secure vault before deploying to production.

## Deployment
* The repository ships with a Heroku-compatible `Procfile` and `app.json`. Deploy to Heroku via `heroku create` followed by `git push heroku main`.
* Ensure that HTTPS endpoints (`/config.json`, `/save`, `/publish`, `/validate`, `/stop`, `/executeV2`) are publicly accessible for SFMC.
* Update `config-json.js` to reference the deployed domain so Journey Builder resolves the correct URLs.
* Configure firewall rules to allow inbound requests from SFMC IP ranges and outbound traffic to the external SMS API.

## Documentation Index
The following guides describe each source file in detail:

- [app.js](docs/files/app.js.md)
- [app.json](docs/files/app.json.md)
- [config-json.js](docs/files/config-json.js.md)
- [index.html](docs/files/index.html.md)
- [main.js](docs/files/main.js.md)
- [package.json](docs/files/package.json.md)
- [Procfile](docs/files/Procfile.md)
- [src/index.js](docs/files/src/index.js.md)
- [webpack.config.js](docs/files/webpack.config.js.md)

## Troubleshooting
| Symptom | Possible Cause | Suggested Action |
| --- | --- | --- |
| Journey Builder cannot load the activity | `config.json` unreachable or misconfigured domain | Verify hosting URL and inspect Express logs for the `/config.json` request. |
| `Done` button remains disabled | Required field missing or Postmonger event not firing | Check browser console for validation warnings and ensure `FIELD_DEFINITIONS` match DOM element IDs. |
| `/executeV2` returns 500 | External SMS API failure or missing credentials | Review server logs, confirm API key validity, and inspect the response body logged in `app.js`. |
| Activity fails during Journey activation | Lifecycle endpoint returns non-200 | Validate `/publish` and `/validate` endpoints respond successfully and review SFMC Journey Builder error logs. |

Log sources:
* Server: terminal running `npm start` (Express logs and outbound API payloads).
* Browser: Developer tools console for Postmonger event traces and validation messages.
* SFMC: Journey Builder error dialog and Interaction logs.

## Glossary
* **Custom Activity** – A pluggable Journey Builder node that executes custom logic during a contact’s path.
* **Journey Builder** – SFMC module for designing customer journeys with activities, decision splits, and waits.
* **Postmonger** – Lightweight message bus used by Journey Builder to communicate with iframe-based activities.
* **In Arguments** – Data payload configured for an activity and delivered during execution.
* **Out Arguments** – Data returned by an activity to Journey Builder (unused in this solution).
* **Execution Webhook** – The HTTP endpoint invoked by SFMC for each contact passing through the activity.
* **Activity Lifecycle Endpoints** – REST endpoints (`/save`, `/publish`, `/validate`, `/stop`) called by SFMC during activity management phases.
