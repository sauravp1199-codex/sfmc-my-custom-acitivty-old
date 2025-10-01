# `lib/logger.js`

## Role in the System
Provides a lightweight, leveled logging utility for both server routes and provider integrations. It standardizes log formatting and respects a configurable log level.

## Public API

| Function | Description |
| --- | --- |
| `debug(message, meta)` | Logs diagnostic information when `LOG_LEVEL` permits debug output. |
| `info(message, meta)` | Emits informational messages with timestamp and optional metadata. |
| `warn(message, meta)` | Emits warnings (using `console.warn`) for recoverable issues. |
| `error(message, meta)` | Emits errors (using `console.error`) for critical failures. |

## Key Parameters and Return Types

* `message` – String describing the event.
* `meta` – Optional object serialized to JSON and appended to the log line. Non-serializable metadata is gracefully reported as `meta_unserializable`.
* Functions do not return values; they produce console output only.

## External Dependencies

* Reads `process.env.LOG_LEVEL` to determine the minimum log priority (`debug`, `info`, `warn`, `error`). Defaults to `info`.
* No third-party packages required.

## Data Flow

1. Each exported function delegates to a private `log` helper that compares the requested log level against `LOG_LEVEL`.
2. The helper builds an ISO timestamped line, appends serialized metadata, and dispatches to the appropriate console method.

## Error Handling and Edge Cases

* If metadata cannot be serialized (circular references), the helper catches the error and logs `meta_unserializable` with the error message instead of throwing.
* When `LOG_LEVEL` is set lower than the invoked level, the log call is ignored silently.

## Usage Example

```js
const logger = require('./lib/logger');

logger.info('execute endpoint invoked', { correlationId: 'abc-123' });
logger.error('Provider call failed', { attempt: 2, status: 500 });
```

## Related Files

* Used throughout `app.js` and `lib/digo-client.js` for request tracing and retry diagnostics.
* Supports troubleshooting guidance referenced in the README.

## Troubleshooting

* **Logs missing expected entries** – Confirm `LOG_LEVEL` is not set higher than the desired verbosity.
* **Metadata not appearing** – Ensure objects are serializable or simplify to primitives to avoid `meta_unserializable` warnings.

Logs are written to stdout/stderr, so configure platform log drains (Heroku, Docker) accordingly.

## Glossary

* **Log Level** – Threshold controlling which messages are emitted (debug < info < warn < error).
* **Correlation ID** – Unique identifier appended to logs to trace a single Journey execution across systems.
