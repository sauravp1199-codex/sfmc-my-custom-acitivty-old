# `index.html`

## Role in the System
Provides the user interface for configuring the Custom Activity inside the Journey Builder inspector. Defines the form layout, styles, and inline scripts that enhance user experience.

## Structure Overview

* Includes Salesforce Lightning Design System (SLDS) stylesheets and Google Fonts.
* Defines form inputs for all execute-time fields: `transactionID`, `campaignName`, `tiny`, `PE_ID`, `TEMPLATE_ID`, `TELEMARKETER_ID`, `message`.
* Embeds inline `<script>` to auto-generate transaction IDs, manage error banner state, and expose helper functions for tests.
* Loads the compiled `main.js` bundle at the end to wire Postmonger interactions.

## Key Elements and Behaviors

| Element / Script | Description |
| --- | --- |
| `.hero-banner` image | Visual banner at top of inspector for branding. |
| `.activity-wrapper` | Container card that holds the activity form using custom theming variables. |
| Form fields | Styled inputs/selects aligned with SLDS conventions. Required fields display helper text or error styling. |
| Error banner (`#form-error-banner`) | Hidden by default; shown when client-side validation fails in the inline script. |
| Inline IIFE | Defines `ensureTransactionId`, `hideError`, `showError`, binds blur/input listeners, and exposes `window.__activityForm`. |
| `<script src="main.js">` | Loads the bundled JavaScript generated from `src/index.js`. |

## External Dependencies

* SLDS assets served from `/assets/styles/...` by `app.js`.
* Journey Builder runtime loads this HTML inside an iframe hosted by the Express server.

## Data Flow

1. Users populate form inputs; inline script ensures a transaction ID is seeded and errors are hidden when fields change.
2. When the bundler script runs, `src/index.js` reads these inputs and packages them into Journey Builder `inArguments`.
3. Helper functions allow automated tests to inspect or manipulate form state via `window.__activityForm`.

## Error Handling and Edge Cases

* If the user clears `transactionID`, blur event reseeds a new value to maintain uniqueness.
* Inline script shows an error message when specific validations fail (e.g., missing `TEMPLATE_ID`).
* Helper gracefully handles document readiness states to avoid accessing DOM before load.

## Usage Example

The inline script exposes helpers for QA automation:

```js
// From browser console or automated test
window.__activityForm.ensureTransactionId();
window.__activityForm.hideError();
```

## Related Files

* `src/index.js` contains the business logic that reacts to user input and communicates with Journey Builder.
* `app.js` serves this file to browsers via `/index.html` and `/` routes.

## Troubleshooting

* **Styles not loading** – Confirm SLDS assets are copied to `/assets` and accessible via Express static middleware.
* **Error banner always visible** – Check inline script execution; ensure `main.js` loads without console errors.
* **Form not saving** – Inspect console for messages from `src/index.js` to verify event handlers executed.

## Glossary

* **Inspector UI** – Journey Builder panel where the Custom Activity form is rendered.
* **SLDS** – Salesforce Lightning Design System, providing consistent styling for Salesforce applications.
