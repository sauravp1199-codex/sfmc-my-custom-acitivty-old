# src/index.js

## Role in the System
Client-side controller for the Journey Builder custom activity. It renders the configuration form inside the iframe, synchronises form state with Journey Builder via Postmonger events, validates inputs, and prepares the payload saved into `inArguments`.

## Public Interface
| Function | Description |
| --- | --- |
| `main()` | Bootstraps event listeners after DOM load, wires the Postmonger session, and optionally starts the local test harness. |
| `onInitActivity(payload)` | Receives the activity definition from Journey Builder, hydrates the form, and sets the configuration status. |
| `onDoneButtonClick()` | Validates fields, assembles `inArguments`, marks the activity as configured, and triggers `updateActivity`. |
| `onCancelButtonClick()` | Signals Journey Builder to close the inspector without saving changes. |
| `onFormEntry(event)` | Marks the activity dirty whenever a field is edited. |
| `setupExampleTestHarness()` | Creates a mock Postmonger session to emulate Journey Builder interactions locally. |
| Helper utilities | `setFieldValue`, `getFieldValue`, `showFieldError`, `clearFieldError`, and `getFieldContainer` manage DOM interactions and validation state. |

## Key Parameters and Return Values
| Function | Parameters | Returns | Notes |
| --- | --- | --- | --- |
| `onInitActivity(payload)` | `payload` (`object`): Full activity definition from Journey Builder. | `void` | Extracts `arguments.execute.inArguments` to prefill fields. |
| `onDoneButtonClick()` | _None_ | `void` | Builds `fieldPayload` object keyed by `FIELD_DEFINITIONS`. Triggers `updateActivity`. |
| `onFormEntry(event)` | `event.target` (`HTMLInputElement \| HTMLSelectElement`) | `void` | Uses `connection.trigger('setActivityDirtyState', true)` when value is non-empty. |
| `setFieldValue(id, value)` | `id` (`string`), `value` (`string \| number \| null`) | `void` | Handles both `<input>` and `<select>` elements. |
| `getFieldValue(field)` | `field` (`HTMLElement`) | `string` | Trims string values and normalises selects. |
| `setupExampleTestHarness()` | _None_ | `void` | Exposes `window.jb` with `ready()` and `save()` helpers for development. |

## External Dependencies
* [`postmonger`](https://github.com/salesforce-marketingcloud/postmonger) – facilitates communication with Journey Builder.
* Browser DOM APIs – used for event binding, querying, and validation visuals.

## Data Flow
* **Inputs:** Activity payload from Journey Builder (includes `inArguments` values) and user input from HTML fields.
* **Outputs:** Updated `activity.arguments.execute.inArguments` array posted back to Journey Builder via `updateActivity`.
* **Data Extensions:** None referenced directly. Fields can be bound to Data Extension attributes during configuration.

## Error Handling and Edge Cases
* Missing DOM elements trigger console warnings and skip event binding.
* Validation prevents saving when required fields are empty by showing inline errors and halting `updateActivity`.
* Defensive checks ensure `inArguments` arrays exist before merging to avoid runtime errors.

## Usage Example
Populate the form programmatically during testing:
```javascript
// In the browser console while running npm run dev
setFieldValue('campaignName', 'Preview Campaign');
setFieldValue('message', 'Test SMS copy');
onDoneButtonClick(); // Triggers updateActivity with the populated payload
```

## Related Files
* `index.html` – Declares the markup and element IDs consumed by the script.
* `main.js` – Webpack-bundled version served in production.
* `config-json.js` – Ensures the field identifiers align with Journey Builder schema.

## Troubleshooting
| Issue | Resolution |
| --- | --- |
| Form values do not persist when reopening | Confirm the Journey Builder payload includes the same IDs defined in `FIELD_DEFINITIONS`. |
| `window.jb` is undefined during local testing | Ensure `isDev` resolves to `true` (application served from `localhost` or `127.0.0.1`). |
| `updateActivity` not firing | Check that `connection.trigger('ready')` executed and that Journey Builder responded with `initActivity`. |

## Glossary
* **Activity Payload** – JSON object Journey Builder shares with the activity, containing metadata and arguments.
* **Dirty State** – Journey Builder flag that indicates unsaved configuration changes.
* **In Arguments** – Runtime parameters passed to the execution webhook.
