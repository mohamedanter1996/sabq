# MonsterASP Deployment

This repo deploys the API and Angular app to MonsterASP with GitHub Actions and Web Deploy.

## Sites

- Frontend: `https://sabiqgame.com`
- API: `https://sabiqgameapi.runasp.net`

The Angular production config calls:

- API base URL: `https://sabiqgameapi.runasp.net/api`
- SignalR hub URL: `https://sabiqgameapi.runasp.net/hubs/sabq`

## GitHub secrets

Add these secrets in GitHub under `Settings` -> `Secrets and variables` -> `Actions`.

Backend workflow:

- `MONSTERASP_BACKEND_SITE_NAME`
- `MONSTERASP_BACKEND_USERNAME`
- `MONSTERASP_BACKEND_PASSWORD`
- `SABQ_API_APPSETTINGS_PRODUCTION_JSON`

Frontend workflow:

- `MONSTERASP_FRONTEND_SITE_NAME`
- `MONSTERASP_FRONTEND_USERNAME`
- `MONSTERASP_FRONTEND_PASSWORD`

Use the exact Web Deploy values from the MonsterASP control panel for site name, username, and password.

`MONSTERASP_BACKEND_SITE_NAME` and `MONSTERASP_FRONTEND_SITE_NAME` must be the MonsterASP website IDs, for example:

```text
site55499
site55521
```

Do not use the public frontend/API URLs such as `https://sabiqgame.com`, `https://sabiqgame.runasp.net`, or `https://sabiqgameapi.runasp.net` as the site name.

The workflows build the WebDeploy server URL automatically from the site name:

```text
https://siteXXXXX.siteasp.net:8172
```

## Production API settings

Keep live secrets out of git. Put production backend configuration in the `SABQ_API_APPSETTINGS_PRODUCTION_JSON` GitHub secret.

Recommended shape:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "SERVER_CONNECTION_STRING_FROM_MONSTERASP"
  },
  "App": {
    "BaseUrl": "https://sabiqgame.com"
  }
}
```

Add any other production-only settings here if the server needs them.

## Manual run

After the secrets are added:

1. Open the repository on GitHub.
2. Go to `Actions`.
3. Run `Deploy Backend to MonsterASP`.
4. Run `Deploy Frontend to MonsterASP`.

The workflows also run automatically on pushes to `main` or `codex/local-test-db` when matching files change.

## Live database

The API runs EF Core migrations on startup through `Database.MigrateAsync()`, then syncs the JSON question bank through the seeder. Do not commit the live database connection string to the repository.
