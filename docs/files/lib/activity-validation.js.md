# `lib/activity-validation.js`

## Role in the System
Centralizes validation logic for Journey Builder lifecycle and execute payloads. Ensures required fields are present, normalizes user input, and raises consistent errors for API handlers.

## Public API

| Export | Description |
| --- | --- |
| `ValidationError` | Custom `Error` subclass used to signal invalid requests with details and HTTP 400 status codes. |
| `validateExecuteRequest(body)` | Validates the structure and content of a Journey Builder execute payload and returns normalized arguments. |
| `validateLifecycleRequest(body)` | Validates lifecycle payloads (save/publish/validate/stop) to ensure required configuration fields are present. |
| `normalizeString(value)` | Utility that coerces values to trimmed strings, returning an empty string for `null`/`undefined`. |

## Key Parameters and Return Types

* `validateExecuteRequest(body)` expects a Marketing Cloud execute payload object containing `inArguments`.
  * Returns an object `{ message, recipientMobilePhone, mappedValues, rawArguments }`.
  * Throws `ValidationError` with `details` array describing missing or invalid fields.
* `validateLifecycleRequest(body)` expects lifecycle payloads containing configuration arguments.
  * Returns `{ message, mobilePhoneAttribute, rawArguments }` when the payload is complete.
  * Throws `ValidationError` with descriptive error details when required configuration fields are missing.
* `normalizeString(value)` accepts any value and returns a trimmed string.

## External Dependencies

* No external dependencies beyond Node.js built-ins; this module is self-contained.

## Data Flow

1. `validateExecuteRequest` delegates to `parseInArguments` (internal) to ensure the payload contains an object inside `inArguments`.
2. Lifecycle requests validate `message` and `mobilePhoneAttribute`, ensuring configuration completeness.
3. Execute requests validate runtime `message` and `mobilePhone` values, normalize mapped attributes, and surface descriptive errors.
4. Aggregates validation errors and throws once so that API handlers can emit a single structured response.
5. On success, the returned object contains normalized values alongside the raw input object for downstream use.

## Error Handling and Edge Cases

* Missing or non-array `inArguments` raise `ValidationError` with clear messaging.
* Missing or blank `mobilePhoneAttribute` values surface descriptive errors during lifecycle validation so Journey Builder blocks publishing misconfigured activities.
* Missing or blank `mobilePhone` values surface descriptive errors to encourage proper Journey attribute mapping at execute time.
* Trailing/leading spaces are trimmed to avoid mismatches with provider requirements.

## Usage Example

```js
const { validateExecuteRequest, validateLifecycleRequest } = require('./lib/activity-validation');

try {
  const args = validateExecuteRequest(req.body);
  // proceed with building provider payload
} catch (error) {
  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({ status: 'invalid', details: error.details });
  }
}

try {
  validateLifecycleRequest(req.body);
  // acknowledge lifecycle call
} catch (error) {
  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({ status: 'invalid', details: error.details });
  }
}
```

## Related Files

* Used in `app.js` lifecycle and execute routes.
* `lib/digo-payload.js` consumes the normalized values to build the provider payload.
* Aligns with schema defined in `config-json.js` and fields captured in `src/index.js`.

## Troubleshooting

* **Repeated validation failures** – Examine `error.details` returned from API responses; ensure Journey data bindings supply required fields.
* **Missing mobile number** – Confirm the inspector UI maps the contact's mobile attribute or that the execute payload includes `mobilePhone`.
* **Whitespace issues** – Use `normalizeString` in custom scripts when preparing Journey data to match server expectations.

## Glossary

* **In Arguments** – Payload passed by Journey Builder to the Custom Activity during execution.
* **ValidationError** – Standardized error used to communicate field-level validation issues back to Journey Builder.
