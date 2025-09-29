# `app.js`

## Role in the System
Server-side entry point that exposes the Express application used by the Salesforce Marketing Cloud (SFMC) Custom Activity. It serves static assets, exposes Journey Builder lifecycle webhooks, validates Execute requests, and relays outbound SMS payloads to the DIGO provider.

## Public API

| Function / Route | Description |
| --- | --- |
| `acknowledgeLifecycleEvent(routeName)` | Higher-order helper that generates Express handlers for Journey Builder lifecycle routes (`/save`, `/publish`, `/validate`, `/stop`). |
| `app.post('/executeV2', handler)` | Main execution endpoint invoked by Journey Builder during contact processing. Validates input, builds a DIGO payload, and calls the provider API. |
| `app.get('/config.json', handler)` | Provides the dynamic Custom Activity configuration consumed by Journey Builder. |
| Static asset routes (`/`, `/index.html`, `/main.js`, `/main.js.map`, `/assets`, `/images`) | Serve the client-side inspector UI and supporting assets. |
| `app.get('/health')` | Lightweight health check used by deployment platforms. |

## Key Parameters and Return Types

* Lifecycle handlers expect SFMC lifecycle payloads (`req.body`) that contain optional `inArguments`. Successful validations return `{ status: 'ok' }`; validation failures return `{ status: 'invalid', message, details }` with HTTP 400.
* `/executeV2` expects a Marketing Cloud execute payload (`req.body`). After validation it returns `{ status: 'ok', providerStatus, providerResponse }` on success. Validation failures respond with HTTP 400, provider issues respond with HTTP 4xx/5xx plus `{ status: 'provider_error', message, details }`, and unexpected failures respond with HTTP 500 and `{ status: 'error', message }`.

## External Dependencies

* `express` for routing and middleware.
* `body-parser` for JSON request parsing.
* `uuid` to create correlation IDs for traceable logging.
* `./config-json` to build the Custom Activity configuration.
* `./lib/logger` for leveled logging.
* `./lib/activity-validation` for request validation and error types.
* `./lib/digo-payload` to assemble the provider request body.
* `./lib/digo-client` to send payloads with retry logic.

## Data Flow

1. Incoming HTTP requests receive a correlation ID (header `X-Correlation-Id`).
2. Lifecycle requests are optionally validated and return acknowledgement JSON to Journey Builder.
3. `/executeV2` validates incoming Journey execute payloads, builds the DIGO payload (including message content and mapped values), logs a debug preview, and forwards it to the DIGO API via `sendPayloadWithRetry`.
4. Provider responses (or errors) are mapped back to SFMC-compatible JSON responses.

## Error Handling and Edge Cases

* Validation failures throw `ValidationError`, resulting in HTTP 400 responses with detailed messages for Journey Builder diagnostics.
* Provider errors throw `ProviderRequestError`, and the handler converts them into HTTP 4xx/5xx responses with diagnostic details while masking unexpected issues with HTTP 502 or 500 statuses.
* Unexpected exceptions are logged as errors and surfaced as HTTP 500 with a generic message.
* Missing or malformed lifecycle payloads are safely acknowledged without crashing.

## Usage Example

```
POST /executeV2
Content-Type: application/json
X-Correlation-Id: 12345

{
  "inArguments": [
    {
      "message": "Welcome!",
      "mobilePhone": "+12025550123",
      "firstNameAttribute": "{{Contact.Attribute.MyDE.FirstName}}",
      "mobilePhoneAttribute": "{{Contact.Attribute.MyDE.MobilePhone}}"
    }
  ]
}
```

Successful response:

```
{
  "status": "ok",
  "providerStatus": 200,
  "providerResponse": { ... }
}
```

## Related Files

* `config-json.js` defines the Custom Activity metadata returned by `/config.json`.
* `lib/activity-validation.js` performs execute payload validation.
* `lib/digo-payload.js` prepares the outbound provider body.
* `lib/digo-client.js` performs the HTTP call to the DIGO API.
* `src/index.js` hosts the Journey Builder inspector UI that submits configuration data consumed by these endpoints.

## Troubleshooting

* **Lifecycle calls returning `status: 'invalid'`** – Inspect application logs for `ValidationError` warnings with correlation IDs. Confirm the inspector UI populated required fields.
* **Provider errors (`status: 'provider_error'`)** – Check outbound payload logs and verify DIGO credentials and network reachability. Examine DIGO API logs correlated via the returned `X-Correlation-Id`.
* **Static assets not loading** – Ensure the `dist/` bundle has been built (`npm run dev` or webpack) and that the deployment serves `/assets` and `/images`.

Logs are emitted via `lib/logger.js`; review platform-specific log drains (Heroku, SFMC) filtering by correlation ID for full request traces.

## Glossary

* **Journey Builder** – Salesforce Marketing Cloud workflow engine that orchestrates activities such as this Custom Activity.
* **Custom Activity** – A Journey Builder extension invoked during a journey to perform bespoke logic.
* **Execute Call** – Runtime request from Journey Builder when a contact reaches the activity.
* **In Arguments** – Configuration payload provided by the journey, typically mapped from Data Extensions or contact attributes.
* **DIGO** – External SMS provider receiving the activity payload.
