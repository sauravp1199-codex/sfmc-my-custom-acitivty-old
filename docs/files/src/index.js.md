# `src/index.js`

## Role in the System
Client-side script loaded inside the Journey Builder Custom Activity inspector. It handles Postmonger messaging, binds form controls to Journey data, performs inline validation, and supports a local development harness.

## Public API

While not exported as a module, the file defines key functions and event handlers executed in the browser:

| Function | Description |
| --- | --- |
| `main()` | DOMContentLoaded handler that wires UI events, initializes Postmonger listeners, and signals readiness to Journey Builder. |
| `onInitActivity(payload)` | Receives the current activity definition, stores it locally, and pre-populates form fields from existing inArguments. |
| `prePopulateInput(id, value)` | Helper to set field values when editing an existing activity instance. |
| `onDoneButtonClick()` | Validates inputs, updates `activity.arguments.execute.inArguments`, and notifies Journey Builder via `updateActivity`. |
| `onCancelButtonClick()` | Cancels edits by clearing dirty state and requesting the inspector to close. |
| `onFormEntry(event)` | Marks the activity as dirty when the user types in form fields. |
| `setupExampleTestHarness()` | Creates a mock Postmonger session for local development, exposing helper methods via `window.jb`. |
| Inline IIFE in HTML (`window.__activityForm`) | Provides helpers (`ensureTransactionId`, `showError`, `hideError`) to manage UI state; documented in `index.html`. |

## Key Parameters and Return Types

* Postmonger callbacks receive `payload` objects representing the activity definition supplied by Journey Builder.
* Form handlers read/write to DOM inputs (`transactionID`, `campaignName`, `tiny`, `PE_ID`, `TEMPLATE_ID`, `TELEMARKETER_ID`, `message`).
* `onDoneButtonClick` constructs `inArguments` with either `{ urlString, payload }` (legacy) or SMS fields depending on UI values. Errors surface as UI validation states rather than return values.

## External Dependencies

* `postmonger` library for cross-frame communication.
* Relies on DOM structure defined in `index.html` (element IDs, error banners, etc.).

## Data Flow

1. When the inspector loads, `main()` binds events and triggers `connection.trigger('ready')`.
2. Journey Builder responds with `initActivity`, invoking `onInitActivity(payload)`.
3. The script stores `activity` globally, populates form fields, and waits for user interaction.
4. On Save/Next, Journey Builder fires `clickedNext`, triggering `onDoneButtonClick()`.
5. The handler validates inputs, sets `activity.metaData.isConfigured`, and sends `updateActivity` with updated `inArguments`.
6. Optional `setupExampleTestHarness()` simulates Journey Builder interactions in development mode.

## Error Handling and Edge Cases

* Minimal client-side validation: ensures URL field (legacy) is populated before saving; highlights errors in the DOM.
* JSON parsing errors for payload field show inline error state.
* Development harness logs interactions to the console for debugging.

## Usage Example

Local development harness snippet:

```js
if (location.hostname === 'localhost') {
  setupExampleTestHarness();
  // from browser console: jb.ready();
  // modifies activity via UI or jb.save();
}
```

## Related Files

* `index.html` defines the inspector UI elements referenced by DOM IDs.
* `app.js` serves `main.js` (bundled output) to Journey Builder.
* Validated server expectations reside in `lib/activity-validation.js` and `config-json.js`.

## Troubleshooting

* **Activity does not load in inspector** – Check browser console for Postmonger errors and confirm `main.js` is served correctly.
* **Form values not persisting** – Ensure `onDoneButtonClick` executes (listen for console logs) and that Journey Builder accepts the updated payload.
* **Local harness not responding** – Access `window.jb` in the developer console and call `jb.ready()` to simulate Journey Builder events.

## Glossary

* **Inspector** – The configuration drawer within Journey Builder where Custom Activities are edited.
* **Postmonger** – Messaging library used by SFMC to communicate between the canvas and iframe-hosted activities.
