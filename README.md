# SFMC Comsense Messaging Custom Activity

A production-hardened Salesforce Marketing Cloud (SFMC) Journey Builder Custom Activity that collects Journey configuration values, validates execute payloads, and relays requests to the Comsense Execute API with resilient logging and retry logic. The repository bundles both the Express-based middleware and the inspector UI rendered inside Journey Builder.

## Architecture Overview

### Component Diagram

```
Journey Builder Canvas
        │
        │ 1. Load configuration (GET /config.json)
        ▼
Express Server (app.js)
        │
        ├── Serves inspector UI (index.html + main.js)
        │
        └── Runtime execution (POST /execute)
                │
                ├─► Activity Validation (lib/activity-validation.js)
                │        │
                │        └─► Comsense Payload Builder (lib/digo-payload.js)
                │                │
                │                └─► Provider HTTP Client (lib/digo-client.js)
                │                            │
                │                            └─► External Comsense Execute API
                │
                └─► Structured Logging (lib/logger.js)
```

### Flow Summary

1. Journey Builder loads `/config.json` to render the Custom Activity on the canvas.
2. The inspector iframe loads `index.html` and the bundled `main.js`, which use Postmonger to exchange data with Journey Builder.
3. When a contact hits the activity, Journey Builder sends a POST to `/execute`.
4. The server validates payloads, constructs the Comsense Execute API request, retries transient failures, and returns status metadata to Journey Builder.

## Getting Started

### Prerequisites

* Node.js 16+ and npm
* Access to an SFMC account with Journey Builder and Custom Activity package
* Optional: Heroku (or similar) account for hosting

### Installation

```bash
npm install
```

### Local Development

```bash
# Run Express and webpack watcher together
npm run dev

# Or run the API alone (requires existing dist/main.js)
npm start
```

The server listens on `http://localhost:3001` by default. For Journey Builder integration, expose the port via a tunneling tool such as `ngrok` and configure your Custom Activity package to use the tunnel URL.

### Journey Data Binding Tokens

Use the inspector's attribute picker to map Data Extension values into the activity. The **Campaign Name** and **Message Body** fields accept plain text or personalization tokens. The **Recipient (To)** field must resolve to a phone number token in the `{{Contact.Attribute.<DataExtensionName>.<FieldName>}}` format (for example, `{{Contact.Attribute.SMSAudience.Mobile}}`). Optional **Media URL** and **Button Label** inputs can pull from data extension columns the same way. Journey Builder resolves the tokens at execution time, so do not wrap them in quotes or add additional braces.

### Testing and Tooling

* `npm test` – Placeholder script (update when automated tests are added).
* Postman collection: `postman/sfmc-custom-activity.postman_collection.json` includes requests for every endpoint.

### Static Test Data Mode

Local testing outside of Journey Builder often lacks resolved journey attributes. Enable deterministic fixture values by setting
`ENABLE_STATIC_TEST_DATA=true` (environment variable) or by sending the `X-Use-Static-Test-Data: true` header / `useStaticTestData`
flag in the request body. When enabled, lifecycle (`/validate`, `/save`, `/publish`, `/stop`) and `/execute` requests receive
default message, contact, and mapped values so validation succeeds without SFMC token resolution.

## Environment Variables

| Variable | Description |
| --- | --- |
| `PUBLIC_BASE_URL` | Fully qualified base URL used to generate config links (overrides proxy-derived host/protocol). |
| `APPLICATION_EXTENSION_ID` | Journey Builder **Application Extension ID** generated when installing the Custom Activity package. Required for canvas validation. May also be supplied via the `x-application-extension-id`, `x-application-key`, or `x-app-key` header (Salesforce varies by stack) or the `applicationExtensionId` query string on `/config.json` for local tooling. |
| `PORT` | Express listen port (defaults to `3001`). |
| `LOG_LEVEL` | Minimum log level (`debug`, `info`, `warn`, `error`). Defaults to `info`. |
| `DIGO_API_URL` | Comsense Execute API endpoint. Defaults to `https://sfmc.comsensetechnologies.com/modules/custom-activity/execute` when unset. |
| `COMSENSE_BASIC_AUTH` | Base64-encoded `username:password` string used for HTTP Basic authentication. |
| `DIGO_HTTP_TIMEOUT_MS` | HTTP timeout in milliseconds (default `15000`). |
| `DIGO_RETRY_ATTEMPTS` | Maximum retry attempts on transient errors (default `3`). |
| `DIGO_RETRY_BACKOFF_MS` | Initial backoff delay in ms (default `500`, doubles per retry). |
| `DIGO_STUB_MODE` | When set to `true`, skips outbound provider calls and returns stub responses (ideal for testing). |
| `ENABLE_STATIC_TEST_DATA` | When `true`, injects static fixture values into lifecycle and execute requests for local testing. |

## Deployment Notes

* **Heroku** – Repository includes `app.json` and `Procfile`. Deploy via the Heroku Dashboard or the "Deploy to Heroku" button and configure environment variables under Settings → Config Vars.
* **Salesforce Platform / Other Node Hosts** – Ensure build steps run `npm install` and `npx webpack --mode=production` so that `dist/main.js` exists before starting `node app.js`.
* **Static Assets** – SLDS assets are served from `node_modules/@salesforce-ux/design-system`. Confirm your hosting platform allows static files via Express middleware.

## Troubleshooting

| Symptom | Suggested Checks |
| --- | --- |
| Journey Builder inspector fails to load | Confirm `/config.json` responds with 200 and that `PUBLIC_BASE_URL` resolves correctly. Inspect browser console for Postmonger errors. |
| `/execute` returns `status: 'invalid'` | Review the JSON response `details` array and ensure Journey data extensions map required fields. Logs include correlation IDs for tracing. |
| Provider request failures | Validate provider credentials (e.g., `COMSENSE_BASIC_AUTH`) and network reachability. When `DIGO_STUB_MODE` is `true`, outbound calls are skipped. |
| Missing SMS recipients | Confirm the **Recipient (To)** field maps to a resolved phone-number attribute in your Journey data extension. |
| Logs not appearing | Check `LOG_LEVEL` and your hosting platform's log drain or console. |

## Glossary

* **Custom Activity** – Extensible step executed within SFMC Journey Builder.
* **In Arguments** – Data payload Journey Builder passes to the activity during execution.
* **Postmonger** – Messaging bridge used between the Journey Builder canvas and iframe-hosted activities.
* **MSISDN** – International phone number format required by SMS providers.
* **Stub Mode** – Feature that emulates provider responses without reaching external services.

## File-Level Documentation

Detailed documentation is available for every source file under `docs/files/`:

* [`app.js`](docs/files/app.js.md)
* [`config-json.js`](docs/files/config-json.js.md)
* [`lib/logger.js`](docs/files/lib/logger.js.md)
* [`lib/activity-validation.js`](docs/files/lib/activity-validation.js.md)
* [`lib/digo-payload.js`](docs/files/lib/digo-payload.js.md)
* [`lib/digo-client.js`](docs/files/lib/digo-client.js.md)
* [`lib/static-test-data.js`](docs/files/lib/static-test-data.js.md)
* [`src/index.js`](docs/files/src/index.js.md)
* [`index.html`](docs/files/index.html.md)
* [`webpack.config.js`](docs/files/webpack.config.js.md)
* [`Procfile`](docs/files/Procfile.md)
* [`app.json`](docs/files/app.json.md)
* [`package.json`](docs/files/package.json.md)
* [`main.js`](docs/files/main.js.md)

Refer to these documents for function-level API details, data flow diagrams, and troubleshooting guidance.
