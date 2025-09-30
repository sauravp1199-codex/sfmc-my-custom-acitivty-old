# `config-json.js`

## Role in the System
Generates the `config.json` payload consumed by SFMC Journey Builder when loading the Custom Activity canvas. It resolves runtime URLs, icons, metadata, and execution schema for the activity.

## Public API

| Function | Description |
| --- | --- |
| `resolveBaseUrl(req)` | Determines the fully qualified base URL used to assemble asset and webhook endpoints, favoring `PUBLIC_BASE_URL` before deriving from the incoming request. |
| `module.exports = function configJSON(req)` | Builds and returns the Custom Activity configuration object expected by Journey Builder. |

## Key Parameters and Return Types

* `req` (Express request) is optional. When provided, it should expose `get()` and `protocol` for header inspection.
* Returns a JSON-compatible object containing `workflowApiVersion`, metadata, localized labels, execution arguments, configuration hooks, and schema definitions.

## External Dependencies

* Relies on process environment variables: `PUBLIC_BASE_URL` to override base URL detection and `APPLICATION_EXTENSION_ID` to satisfy Journey Builder validation.
* References static assets stored under `/images`.

## Data Flow

1. `resolveBaseUrl` inspects `PUBLIC_BASE_URL`, `x-forwarded-proto`, `req.protocol`, and `host` headers to infer deployment URL.
2. The base URL seeds icon locations and webhook endpoints for lifecycle (`/save`, `/publish`, `/validate`, `/stop`) and execute (`/execute`).
3. `APPLICATION_EXTENSION_ID` populates the required `configurationArguments.applicationExtensionId` property so Journey Builder can link the activity to its installed package.
4. Schema definitions describe expected Journey Builder inArguments (`message`, `firstNameAttribute`, `mobilePhoneAttribute`), informing Journey validation.

## Error Handling and Edge Cases

* If `PUBLIC_BASE_URL` is absent and headers are missing, the function returns empty strings, resulting in relative URLs. Ensure hosting layers forward protocol/host headers correctly.
* Schema enforces non-nullable fields for required arguments, reducing runtime errors during execution.

## Usage Example

```js
const express = require('express');
const configJSON = require('./config-json');

const app = express();
app.get('/config.json', (req, res) => {
  res.status(200).json(configJSON(req));
});
```

## Related Files

* `app.js` exposes `/config.json` using this module.
* `src/index.js` populates the fields described in the schema.
* `lib/activity-validation.js` enforces the same required fields at runtime.

## Troubleshooting

* **Missing icons or broken URLs** – Verify `PUBLIC_BASE_URL` matches the deployed domain and that proxies forward `x-forwarded-proto` and `host` headers.
* **Journey Builder cannot load the activity** – Inspect network calls to `/config.json` and confirm the JSON contains valid schema definitions and accessible URLs.
* **Lifecycle hooks returning 404** – Ensure `baseUrl` resolves correctly so Journey Builder targets the right endpoints.

## Glossary

* **Config.json** – JSON definition file that registers a Custom Activity with Journey Builder.
* **Lifecycle Hook** – Journey Builder HTTP callback (save, publish, validate, stop) triggered during canvas configuration.
* **In Arguments** – Data passed from Journey Builder into the activity during execution.
