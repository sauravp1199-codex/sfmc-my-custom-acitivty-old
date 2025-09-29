# `app.json`

## Role in the System
Provides metadata for deploying the Custom Activity to Heroku via the "Deploy to Heroku" workflow. Defines descriptive information, repository link, keywords, and buildpacks.

## Key Fields

| Field | Description |
| --- | --- |
| `name` | Display name shown in the Heroku dashboard. |
| `description` | Human-readable summary of the application purpose. |
| `repository` | GitHub repository URL referenced during deploys. |
| `keywords` | Tags that categorize the app (Node, Express, Salesforce, etc.). |
| `buildpacks` | Array declaring buildpacks; currently a single `heroku/nodejs` entry. |

## Usage

* Enables one-click deployment from GitHub or Heroku dashboards.
* Works in tandem with the root `Procfile` and `package.json` to provision the runtime and start the server.

## Related Files

* `Procfile` – Defines the command executed by the provisioned dyno.
* `package.json` – Supplies Node dependencies installed during the buildpack process.

## Troubleshooting

* **Deploy button missing** – Ensure `app.json` resides at the repository root and is valid JSON.
* **Incorrect buildpack** – Update the `buildpacks` array to reference required languages or custom buildpacks.

## Glossary

* **Buildpack** – Script bundle used by Heroku to prepare the runtime environment for an application.
* **Deploy to Heroku** – GitHub button/workflow that provisions and configures a Heroku app based on `app.json`.
