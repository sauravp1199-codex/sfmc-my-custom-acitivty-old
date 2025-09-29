# `lib/digo-payload.js`

## Role in the System
Transforms validated Journey Builder arguments into the payload expected by the DIGO SMS provider, including dataset resolution and default recipient fallbacks.

## Public API

| Export | Description |
| --- | --- |
| `buildDigoPayload(args, options)` | Constructs the final object sent to the DIGO API using normalized activity arguments and optional overrides. |
| `resolveDataset(message, overrides)` | Produces the recipient `dataSet` array either from overrides/dataSet arguments or environment defaults. |

## Key Parameters and Return Types

* `args` – Object returned by `validateExecuteRequest`, containing `message`, `transactionID`, `campaignName`, `tiny`, `PE_ID`, `TEMPLATE_ID`, `TELEMARKETER_ID`, and optionally `dataSet`.
* `options.dataSetOverride` – Optional array of dataset entries (objects with `msisdn` and optional `message`) used to override Journey-provided `dataSet`.
* Returns a payload object `{ transactionID, campaignName, oa, channel, tiny, tlv, dataSet }` where `tlv` contains provider metadata (`PE_ID`, etc.).
* `resolveDataset` returns an array of `{ msisdn, message }` objects. Throws `ValidationError` if no recipients are supplied.

## External Dependencies

* `normalizeString` and `ValidationError` from `lib/activity-validation.js` for consistent data handling.
* Environment variables:
  * `DIGO_DEFAULT_MSISDNS` – Comma-separated fallback list of MSISDNs when no dataset is provided.
  * `DIGO_ORIGINATOR` – Optional alphanumeric sender ID (defaults to `TACMPN`).

## Data Flow

1. `buildDigoPayload` receives normalized activity arguments.
2. `resolveDataset` determines the final recipient list:
   * Use `options.dataSetOverride` if provided.
   * Otherwise, inspect `args.dataSet` from Journey inArguments.
   * If absent, fall back to `DIGO_DEFAULT_MSISDNS` environment variable.
3. Each dataset entry is normalized and filtered to remove empty MSISDNs.
4. The function returns the provider-ready payload consumed by `lib/digo-client.js`.

## Error Handling and Edge Cases

* Throws `ValidationError` when neither overrides nor defaults yield recipients.
* Ensures `message` is replicated per-recipient if not overridden.
* Strips whitespace and handles dataset entries provided as raw strings or objects with `msisdn`/`message` properties.

## Usage Example

```js
const { buildDigoPayload } = require('./lib/digo-payload');

const payload = buildDigoPayload(validatedArgs, {
  dataSetOverride: [
    { msisdn: '+12025550123' },
    '+12025550124'
  ]
});
```

Resulting payload snippet:

```json
{
  "transactionID": "...",
  "campaignName": "Spring SMS",
  "oa": "TACMPN",
  "channel": "sms",
  "tlv": {
    "PE_ID": "PE123",
    "TEMPLATE_ID": "TMP456",
    "TELEMARKETER_ID": "TEL789"
  },
  "dataSet": [
    { "msisdn": "+12025550123", "message": "Welcome!" },
    { "msisdn": "+12025550124", "message": "Welcome!" }
  ]
}
```

## Related Files

* Consumes validated input from `lib/activity-validation.js`.
* Output is sent via `sendPayloadWithRetry` in `lib/digo-client.js`.
* Called by `/executeV2` in `app.js`.

## Troubleshooting

* **Validation errors about recipients** – Ensure the Journey activity provides a `dataSet` or configure `DIGO_DEFAULT_MSISDNS` in the environment.
* **Unexpected sender (`oa`)** – Set `DIGO_ORIGINATOR` to the desired short code or alphanumeric sender ID.
* **Message overrides not applied** – Provide recipient entries as objects with a `message` property to override the default message.

## Glossary

* **MSISDN** – Mobile Station International Subscriber Directory Number (phone number) used for SMS delivery.
* **TLV** – Tag-Length-Value object containing provider-specific metadata fields (PE, template, telemarketer IDs).
