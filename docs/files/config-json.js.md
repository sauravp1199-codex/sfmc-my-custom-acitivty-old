# config-json.js

## Role in the System
Exports a function that builds the `config.json` manifest consumed by Journey Builder when rendering and executing the custom activity. It defines metadata, schema, lifecycle endpoints, and execution settings.

## Public Interface
| Function | Description |
| --- | --- |
| `configJSON(req)` | Generates a configuration object tailored to the incoming request context (enables host-specific URLs if needed). |

## Key Parameters and Return Values
| Function | Parameters | Returns | Notes |
| --- | --- | --- | --- |
| `configJSON(req)` | `req` (`express.Request`) | `object` | Returns a JSON-serialisable object adhering to the Custom Activity schema, including metadata, arguments, and configuration endpoints. |

## External Dependencies
* None beyond Node.js runtime; the module exports a pure function.

## Data Flow
* **Inputs:** Optionally uses `req` to infer hostname or request headers if you customise the function.
* **Outputs:** JSON describing the activity (icon paths, supported languages, execute endpoint, schema definitions, and lifecycle URLs).
* **Data Extensions:** Defines schema metadata for fields such as `campaignName`, `tiny`, `PE_ID`, etc., which can be mapped to Data Extension attributes during configuration.

## Error Handling and Edge Cases
* No explicit error handling; ensure the returned object includes valid HTTPS URLs accessible to SFMC.
* Update the `url` values when deploying to different environments to avoid Journey Builder load failures.

## Usage Example
Serve `config.json` via Express:
```javascript
const express = require('express');
const configJSON = require('./config-json');

app.get('/config.json', (req, res) => {
  res.status(200).json(configJSON(req));
});
```

## Related Files
* `app.js` – Invokes `configJSON` to fulfil `/config.json` requests.
* `index.html` / `main.js` – UI assets referenced by the manifest’s `icon` paths.
* `src/index.js` – Uses the same field IDs defined under `schema.arguments.execute.inArguments`.

## Troubleshooting
| Issue | Resolution |
| --- | --- |
| Journey Builder cannot load the activity | Verify the manifest URLs (execute, save, publish, validate, stop) point to accessible HTTPS endpoints. |
| Icons not displaying | Confirm the `images` directory is deployed and paths (`images/icon.svg`) are correct relative to the server root. |
| Schema mismatches | Ensure the property IDs in `schema.arguments.execute.inArguments` match the UI field IDs and execution payload processing in `app.js`. |

## Glossary
* **Manifest** – The configuration contract that informs Journey Builder how to render and call the activity.
* **Schema** – Describes the data types and visibility of fields exposed to the Journey configuration UI.
