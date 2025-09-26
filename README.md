# Salesforce Marketing Cloud Journey Builder - Custom Activity Example
This repository aims to instruct beginners on how to create custom activities in Marketing Cloud. The walkthrough guide can be found here: [https://balwillsfdc.github.io/sfmc-my-custom-acitivty/](https://balwillsfdc.github.io/sfmc-my-custom-acitivty/) The requirements for building your own custom JB activity are as follows: 
- Javascript / Node.js knowledge
- Marketing Cloud Journey Builder Expertise
- Marketing Cloud Account
- Heroku Account

## Deploy to Heroku
[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?https://github.com/balwillSFDC/sfmc-my-custom-acitivty)

# Notes
- For additional examples/documentation on Salesforce Marketing Cloud Custom Activities check the [github](https://github.com/salesforce-marketingcloud/sfmc-example-jb-custom-activity) and [documentation](https://developer.salesforce.com/docs/marketing/marketing-cloud/guide/creating-activities.html)
## Postman Collection
A Postman collection covering every HTTP endpoint exposed by `app.js` is available at `postman/sfmc-custom-activity.postman_collection.json`. Import it into Postman and update the `baseUrl` variable to match your deployment host before sending requests.

## SMS Activity Hardening Notes

### Setup

1. Install dependencies and start the local server:

   ```bash
   npm install
   npm start
   ```

2. Point your Marketing Cloud custom activity package to the public URL that proxies to this server (for local development use a tunnelling tool such as `ngrok`).

### Required environment variables

| Variable | Description |
| --- | --- |
| `PUBLIC_BASE_URL` | Overrides the auto-detected host when generating `config.json` links. Recommended for production deployments behind load balancers. |
| `DIGO_API_URL` | (Optional) SMS provider endpoint. Defaults to `https://engage-api.digo.link/notify`. |
| `DIGO_X_AUTHORIZATION` | Value for the `X-Authorization` header required by the SMS provider. |
| `DIGO_BEARER_TOKEN` | Bearer token passed in the `Authorization` header. |
| `DIGO_HTTP_TIMEOUT_MS` | (Optional) Timeout in milliseconds for the outbound SMS request. Defaults to `15000`. |
| `DIGO_RETRY_ATTEMPTS` | (Optional) How many times to retry provider calls on retryable failures. Defaults to `3`. |
| `DIGO_RETRY_BACKOFF_MS` | (Optional) Base delay in milliseconds used for exponential backoff. Defaults to `500`. |
| `DIGO_DEFAULT_MSISDNS` | Comma-separated list of fallback MSISDNs used when `dataSet` is not provided by Journey Builder. |
| `DIGO_ORIGINATOR` | (Optional) Originator string for the SMS payload. Defaults to `TACMPN`. |
| `DIGO_STUB_MODE` | When set to `true`, skips the outbound call and echoes the payload for integration testing. |

### Validating the execute payload

The Journey Builder canvas must submit an `execute` payload containing the following structure in `inArguments[0]`:

```json
{
  "transactionID": "txn-123",           // optional, generated automatically if omitted
  "campaignName": "September SMS Push",
  "tiny": "1",                          // string, must be "0" or "1"
  "PE_ID": "PE123456",
  "TEMPLATE_ID": "TMP-001",
  "TELEMARKETER_ID": "TMK-2024",
  "message": "Hello from Journey Builder!",
  "dataSet": [                           // optional override for target MSISDNs
    { "msisdn": "911234567890", "message": "Hello from Journey Builder!" }
  ]
}
```

### Sample execute request

```http
POST /executeV2 HTTP/1.1
Host: your-domain.example.com
Content-Type: application/json
X-Correlation-Id: 4ff5a4e0-8433-4dc3-9c8b-a310816a0132

{
  "keyValue": "{{Context.ContactKey}}",
  "inArguments": [
    {
      "transactionID": "txn-20230926-001",
      "campaignName": "Journey Kickoff",
      "tiny": "1",
      "PE_ID": "PE12345",
      "TEMPLATE_ID": "TEMPLATE-001",
      "TELEMARKETER_ID": "TMK001",
      "message": "Thank you for joining our program!"
    }
  ]
}
```

Successful response example:

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Correlation-Id: 4ff5a4e0-8433-4dc3-9c8b-a310816a0132

{
  "status": "ok",
  "transactionID": "txn-20230926-001",
  "providerStatus": 202,
  "providerResponse": {
    "message": "Accepted",
    "ticketId": "abc123"
  }
}
```

To reproduce the validation behaviour locally you can send the sample payload via `curl`:

```bash
curl -X POST "http://localhost:3001/executeV2" \
  -H "Content-Type: application/json" \
  -d '{
    "keyValue": "contact-key",
    "inArguments": [
      {
        "transactionID": "txn-local-001",
        "campaignName": "Local Test",
        "tiny": "1",
        "PE_ID": "PE123",
        "TEMPLATE_ID": "TMP-123",
        "TELEMARKETER_ID": "TMK-123",
        "message": "Integration test"
      }
    ]
  }'
```

When `DIGO_STUB_MODE=true` the response body includes the echoed payload so you can validate downstream integrations without reaching the SMS provider.

### Known edge cases

- Requests without MSISDNs in `dataSet` and without `DIGO_DEFAULT_MSISDNS` configured will be rejected with a validation error because the downstream provider requires at least one recipient.
- Provider errors that return HTTP status codes below `500` (for example `400` or `401`) are treated as permanent failures; retries stop immediately and Journey Builder receives the provider status.
- Journey Builder may call `/save`, `/publish`, `/validate`, or `/stop` with empty bodies when the canvas is initialising. These requests are allowed and logged, but validation occurs automatically once `inArguments` are present.
