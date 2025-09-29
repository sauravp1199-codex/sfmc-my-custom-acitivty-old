# Procfile

## Role in the System
Defines the process type and command used by Heroku (or other Procfile-based platforms) to run the Express server in production.

## Public Interface
| Entry | Description |
| --- | --- |
| `web: node app.js` | Declares a single web dyno that starts the Express application by executing `node app.js`. |

## Key Parameters and Return Values
Not applicable; the Procfile is declarative.

## External Dependencies
* Relies on the Heroku runtime (or compatible orchestrators) to interpret the Procfile and manage processes.

## Data Flow
Controls how incoming HTTP traffic is routed to the Node.js process defined in `app.js` when deployed to Heroku.

## Error Handling and Edge Cases
* If `app.js` fails to start, the dyno will crash and automatically restart; inspect Heroku logs for stack traces.
* Ensure environment variables required by `app.js` (e.g., `PORT`) are configured in the hosting platform.

## Usage Example
Deploying to Heroku automatically detects the Procfile:
```bash
heroku create
git push heroku main
heroku logs --tail
```

## Related Files
* `app.js` – Script executed by the Procfile.
* `app.json` – Describes the app for Heroku review apps or the platform API.

## Troubleshooting
| Issue | Resolution |
| --- | --- |
| Deployment boots but no web process | Confirm the Procfile is committed at the repository root. |
| Dyno crashes repeatedly | Run `heroku logs --tail` to inspect runtime errors from `app.js`. |
| Application bound to wrong port | Ensure the code reads `process.env.PORT` (already handled in `app.js`). |

## Glossary
* **Dyno** – Heroku container that runs a command defined in the Procfile.
* **Web Process** – Process type that listens for HTTP requests in Heroku.
