# app.js

## Role in the System
Primary Express server responsible for hosting the custom activity assets and exposing the REST endpoints Salesforce Marketing Cloud invokes during the Journey Builder lifecycle and execution phases.

## Public Interface
| Endpoint / Function | Description |
| --- | --- |
| `app.get('/')`, `app.get('/index.html')`, `app.get('/main.js')`, `app.get('/main.js.map')` | Serve the static configuration UI bundle. |
| `app.get('/config.json')` | Returns the dynamically generated activity manifest by invoking `configJSON(req)`. |
| `app.post('/save')` | Acknowledges configuration saves with HTTP 200. |
| `app.post('/publish')` | Confirms Journey activation with HTTP 200. |
| `app.post('/validate')` | Allows Journey Builder to validate the configuration; returns HTTP 200 when valid. |
| `app.post('/stop')` | Handles Journey stop events; currently returns HTTP 200 with no side-effects. |
| `app.post('/executeV2')` | Core execution webhook that constructs the SMS payload, logs requests, and forwards them to the external API. |
| `app.get('/health')` | Lightweight health check returning `Server is up and running`. |
| `app.listen(PORT)` | Boots the HTTP server. |

## Key Parameters and Return Values
| Function | Parameters | Returns | Notes |
| --- | --- | --- | --- |
| `configJSON(req)` | `req` (`express.Request`) | `object` | Imported from `config-json.js`; builds `config.json`. |
| `app.post('/executeV2')` | `req.body` (`object` with `inArguments`, `keyValue`) | `res.json()` result | Generates `transactionID` via `uuid`, constructs payload, and relays to `https://engage-api.digo.link/notify`. |
| `request(options, callback)` | Options include `method`, `url`, `headers`, `json` payload | HTTP response handled in callback | On error, responds with status 500 and `{ errorMessage }`. On success, echoes downstream response in `{ message: body }`. |

## External Dependencies
* `express` – Web framework for routing and static file serving.
* `body-parser` – JSON body parsing middleware.
* `request` – Sends outbound HTTP POST to the SMS API.
* `uuid` – Generates unique transaction IDs.
* `axios` and `https` – Present but not actively used; candidates for cleanup.
* `@salesforce-ux/design-system` – Static assets served from `/assets` for styling.

## Data Flow
* **Inputs:** Journey Builder requests for lifecycle routes, execution payloads containing `inArguments`, `keyValue`, and contact data.
* **Outputs:** HTTP status codes to SFMC; on execution, forwards structured JSON to the external SMS orchestration API and returns its response to SFMC.
* **Data Extensions:** Execution payload can include Data Extension substitutions; values arrive via `inArguments` processed in `/executeV2`.

## Error Handling and Edge Cases
* Wraps `/executeV2` in a `try/catch` to handle synchronous failures.
* Returns HTTP 500 with `errorMessage` when outbound request errors or required inputs are missing.
* Logs incoming payloads and downstream responses for observability; consider integrating a structured logger for production.

## Usage Example
Trigger the execution endpoint manually during development:
```bash
curl --location 'http://localhost:3001/executeV2' \
--header 'Content-Type: application/json' \
--data '{
  "inArguments": [
    {
      "message": "Thank you for your purchase!",
      "firstNameAttribute": "{{Contact.Attribute.MyDE.FirstName}}",
      "mobilePhoneAttribute": "{{Contact.Attribute.MyDE.mobile}}"
    }
  ]
}'
```

## Related Files
* `config-json.js` – Supplies configuration metadata consumed by `/config.json`.
* `index.html` & `main.js` – Static assets served through Express.
* `Procfile` – Defines the production process that runs `node app.js`.

## Troubleshooting
| Issue | Resolution |
| --- | --- |
| Lifecycle endpoints returning 404 | Confirm the Express server is running and that SFMC endpoints point to the correct host. |
| `/executeV2` fails with missing arguments | Validate the activity configuration maps form fields into `inArguments`. |
| External API call returns 401 | Replace hard-coded credentials with environment variables containing valid API keys. |
| Static assets not loading | Ensure webpack built `main.js` and that `/assets` path resolves to the Salesforce Lightning Design System distribution. |

## Glossary
* **Lifecycle Endpoint** – API called by Journey Builder during save, publish, validate, and stop phases.
* **Execution Mode** – Determines how SFMC invokes the activity (real-time vs. testing); available via `req.body`. |
* **Contact Key** – Unique identifier for a contact, found in `req.body.keyValue`.
