# `lib/digo-payload.js`

## Role in the System
Transforms validated Journey Builder arguments into the payload expected by the DIGO SMS provider, resolving mapped values and recipient contact details.

## Public API

| Export | Description |
| --- | --- |
| `buildDigoPayload(args)` | Constructs the final object sent to the DIGO API using normalized activity arguments. |

## Key Parameters and Return Types

* `args` – Object returned by `validateExecuteRequest`, containing `message`, `mappedValues`, and `recipientMobilePhone`.
* Returns a payload object with `message`, `sender`, and `metaData.mappedValues` suitable for the DIGO SMS API.

## External Dependencies

* `normalizeString` and `ValidationError` from `lib/activity-validation.js` for consistent data handling.
* Environment variables:
  * `DIGO_ORIGINATOR` – Optional alphanumeric sender ID (defaults to `TACMPN`).

## Data Flow

1. `buildDigoPayload` receives normalized activity arguments.
2. Mapped values are sanitized and the mobile phone number is resolved from either `args.mappedValues.mobilePhone` or `args.recipientMobilePhone`.
3. The function returns the provider-ready payload consumed by `lib/digo-client.js`.

## Error Handling and Edge Cases

* Throws `ValidationError` when no recipient mobile phone number can be resolved.
* Sanitizes mapped values to remove blank strings before forwarding them to the provider.

## Usage Example

```js
const { buildDigoPayload } = require('./lib/digo-payload');

const payload = buildDigoPayload({
  message: 'Welcome!',
  mappedValues: {
    mobilePhone: '+12025550123',
    firstName: 'Jamie'
  }
});
```

Resulting payload snippet:

```json
{
  "message": {
    "channel": "sms",
    "content": {
      "type": "text",
      "text": "Welcome!"
    },
    "recipient": {
      "type": "msisdn",
      "address": "+12025550123"
    }
  },
  "sender": {
    "originator": "TACMPN"
  },
  "metaData": {
    "mappedValues": {
      "mobilePhone": "+12025550123",
      "firstName": "Jamie"
    }
  }
}
```

## Related Files

* Consumes validated input from `lib/activity-validation.js`.
* Output is sent via `sendPayloadWithRetry` in `lib/digo-client.js`.
* Called by `/execute` in `app.js`.

## Troubleshooting

* **Validation errors about recipients** – Ensure the Journey activity maps a mobile phone value via `mobilePhone` or `mappedValues.mobilePhone`.
* **Unexpected sender** – Set `DIGO_ORIGINATOR` to the desired short code or alphanumeric sender ID.
* **Missing mapped values** – Confirm the inspector UI passes attribute references (e.g., `mobilePhoneAttribute`) so Journey Builder injects values at runtime.

## Glossary

* **MSISDN** – Mobile Station International Subscriber Directory Number (phone number) used for SMS delivery.
