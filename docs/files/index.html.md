# index.html

## Role in the System
Defines the markup, styling, and asset references for the Journey Builder configuration iframe. Provides the form fields bound to the custom activity data model and loads the compiled JavaScript bundle.

## Public Interface
| Element / Section | Description |
| --- | --- |
| `<link href="assets/styles/salesforce-lightning-design-system.css">` | Imports Salesforce Lightning Design System for consistent styling. |
| `.activity-wrapper` container | Main card layout wrapping the form elements. |
| Form fields (`#campaignName`, `#tiny`, `#PE_ID`, `#TEMPLATE_ID`, `#TELEMARKETER_ID`, `#message`) | Input controls whose IDs map directly to `FIELD_DEFINITIONS` in `src/index.js`. |
| `<script src="main.js">` | Loads the Postmonger integration logic bundled by webpack. |

## Key Parameters and Return Values
Not applicable; the document exposes DOM elements consumed by `main.js`.

## External Dependencies
* Salesforce Lightning Design System assets hosted locally under `/assets`.
* Google Fonts (`Source Sans Pro`).
* `main.js` bundle for behaviour.

## Data Flow
* **Inputs:** User-entered field values captured via the DOM.
* **Outputs:** Values read by `src/index.js` and saved into `inArguments`.
* **Data Extensions:** Input fields can be mapped to Data Extension attributes via Journey Builder configuration.

## Error Handling and Edge Cases
* Validation classes (`slds-has-error`) applied by `src/index.js` render error states.
* Ensure element IDs remain stable; any changes require updates to `FIELD_DEFINITIONS` and schema definitions.

## Usage Example
To add an additional optional field:
1. Duplicate one of the `<div class="form-field">` blocks with a new `id` and label.
2. Update `FIELD_DEFINITIONS` in `src/index.js` and the schema in `config-json.js` to include the new field.

## Related Files
* `src/index.js` – Attaches event handlers and validation to the DOM elements.
* `main.js` – Bundled script referenced at the bottom of the document.
* `images/` – Contains assets referenced by the hero banner and manifest icons.

## Troubleshooting
| Issue | Resolution |
| --- | --- |
| Styles missing | Confirm `/assets/styles/salesforce-lightning-design-system.css` is accessible and that static serving is configured in `app.js`. |
| Script not executing | Ensure webpack has produced `main.js` and that the `<script>` path is correct relative to the server root. |
| Layout appears broken in Journey Builder | Validate the iframe width constraints and consider using responsive CSS to handle smaller viewports. |

## Glossary
* **Inspector** – The Journey Builder side panel (iframe) where the configuration UI is rendered.
* **Lightning Design System** – Salesforce’s CSS framework used for consistent UI styling.
