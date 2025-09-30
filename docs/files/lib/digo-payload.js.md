# `lib/digo-payload.js`

## Role in the System
Transforms validated Journey Builder arguments into the payload expected by the Comsense Execute API, resolving contact details and optional rich message metadata.

## Public API

| Export | Description |
| --- | --- |
| `buildDigoPayload(args, requestBody)` | Constructs the final object sent to the Comsense Execute API using normalized activity arguments and the outer Journey context. |

## Key Parameters and Return Types

* `args` – Object returned by `validateExecuteRequest`, containing `campaignName`, `messageBody`, `recipientTo`, `mediaUrl`, `buttonLabel`, and `rawArguments`.
* `requestBody` – Raw `/execute` request body from SFMC. Used to pull identifiers such as `definitionInstanceId` and `journeyId`.
* Returns a payload object shaped for the Comsense Execute API, including top-level identifiers and an `inArguments` array mirroring the provider's contract.

## External Dependencies

* `normalizeString` and `ValidationError` from `lib/activity-validation.js` for consistent data handling.

## Data Flow

1. `buildDigoPayload` receives normalized activity arguments along with the raw request body.
2. Required strings are normalized and validated to ensure no empty campaign, message, or recipient values remain.
3. Provider identifiers (definition instance, journey, activity, key value) are resolved from either the raw request or the inArguments.
4. The function returns the provider-ready payload consumed by `lib/digo-client.js`.

## Error Handling and Edge Cases

* Throws `ValidationError` when campaign, message, or recipient values resolve to empty strings.
* Sanitizes optional values (media URL, button label) before adding them to the outbound payload.

## Usage Example

```js
const { buildDigoPayload } = require('./lib/digo-payload');

const payload = buildDigoPayload(
  {
    campaignName: 'Adidas India – Welcome Offer',
    messageBody: 'Hey there! Enjoy 60% off with code WELCOME60.',
    recipientTo: '+12025550123',
    mediaUrl: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b',
    buttonLabel: 'Shop Now',
    rawArguments: {}
  },
  {
    definitionInstanceId: 'def-001',
    journeyId: 'journey-001',
    activityId: 'abcd1234',
    keyValue: 'contact-key-001'
  }
);
```

Resulting payload snippet:

```json
{
  "definitionInstanceId": "def-001",
  "activityId": "abcd1234",
  "journeyId": "journey-001",
  "keyValue": "contact-key-001",
  "inArguments": [
    { "campaignName": "Adidas India – Welcome Offer" },
    { "messageBody": "Hey there! Enjoy 60% off with code WELCOME60." },
    { "recipientTo": "+12025550123" },
    { "mediaUrl": "https://images.unsplash.com/photo-1549880338-65ddcdfd017b" },
    { "buttonLabel": "Shop Now" }
  ]
}
```

## Related Files

* Consumes validated input from `lib/activity-validation.js`.
* Output is sent via `sendPayloadWithRetry` in `lib/digo-client.js`.
* Called by `/execute` in `app.js`.

## Troubleshooting

* **Validation errors about recipients** – Ensure the Journey activity maps the **Recipient (To)** field to a valid MSISDN token.
* **Missing campaign or message** – Confirm the inspector UI passes literal text or tokens for the Campaign Name and Message Body inputs.
* **Empty optional values stripped** – Blank media URLs and button labels are omitted from the outbound payload by design.

## Glossary

* **MSISDN** – Mobile Station International Subscriber Directory Number (phone number) used for SMS delivery.
