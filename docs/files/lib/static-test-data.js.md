# `lib/static-test-data.js`

Utility module that injects deterministic fixture values into lifecycle and execute requests when static test mode is enabled. These helpers make it possible to exercise the Custom Activity locally without relying on Journey Builder to resolve attribute tokens.

## Exports

| Function | Description |
| --- | --- |
| `shouldUseStaticTestData(req)` | Evaluates headers, query parameters, body flags, or the `ENABLE_STATIC_TEST_DATA` environment variable to determine whether static fixtures should be merged. |
| `applyLifecycleStaticTestData(req)` | Populates lifecycle payloads with default campaign, message body, and recipient values before validation when static mode is enabled. |
| `applyExecuteStaticTestData(req)` | Populates execute payloads (campaign, message body, recipient, and optional media/button metadata) before validation when static mode is enabled. |
| `STATIC_LIFECYCLE_ARGUMENTS` | Exported fixture map used for lifecycle requests. |
| `STATIC_EXECUTE_ARGUMENTS` | Exported fixture map used for execute requests. |

## How It Works

1. `shouldUseStaticTestData` checks (in order) the `X-Use-Static-Test-Data` header, `useStaticTestData` query parameter, request body flag, and the `ENABLE_STATIC_TEST_DATA` environment variable.
2. When enabled, `apply*` helpers ensure `req.body.inArguments` and `req.body.arguments.execute.inArguments` share a primary object to avoid mutating production payload shapes.
3. Default values override missing, blank, or tokenized (`{{...}}`) fields without touching values that are already resolved.
4. The merge is logged at `info` level so developers can trace when fixtures were applied.

## Usage Tips

* Enable the mode globally by exporting `ENABLE_STATIC_TEST_DATA=true` before starting the Express app, or toggle per-request with the header/body flag.
* The fixture data is limited to basic campaign and messaging details suitable for validation; it does not attempt to mimic full provider responses—combine it with `DIGO_STUB_MODE` to bypass outbound calls entirely during development.
* Because the helpers only fill gaps, you can still supply explicit values in the request body to override specific fixture fields when testing edge cases.

## Related Files

* [`app.js`](../app.js.md) – Calls the helpers before handling lifecycle and execute requests.
* [`lib/activity-validation.js`](activity-validation.js.md) – Performs the validation logic that relies on the merged arguments.
* [`lib/digo-payload.js`](digo-payload.js.md) – Consumes validated arguments when building the provider payload.
