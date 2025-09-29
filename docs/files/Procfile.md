# `Procfile`

## Role in the System
Defines the process types for Heroku-style deployments. Specifies how the Custom Activity server should be started in hosted environments that honor Procfile conventions.

## Contents

```
web: node app.js
```

## Behavior

* Declares a single `web` dyno that runs `node app.js`, starting the Express server defined in `app.js`.
* Used by Heroku and compatible platforms (e.g., Salesforce Platform Apps using buildpacks) to determine the startup command.

## Related Files

* `app.js` – Entry point invoked by the Procfile command.
* `app.json` – Describes the Heroku app metadata, often paired with the Procfile during deployments.

## Troubleshooting

* **Dyno crashes on boot** – Review deployment logs; confirm Node.js version compatibility and that `npm install` has produced all dependencies.
* **No web process detected** – Ensure the Procfile is in the repository root and named exactly `Procfile` without extension.

## Glossary

* **Dyno** – Container-like unit used by Heroku to run processes defined in a Procfile.
* **Procfile** – Text file declaring process types and commands for Heroku-style deployments.
