# Migrate an existing checkout

[Server overview](../README.md)

**Goal:** keep your existing configuration and azd environment after the server moved from the repository root into `server/`. New checkouts can skip this guide.

## 1. Preserve local configuration

Stop local server processes and back up your configuration privately. Move the root `.env` (and any `.env.local`) into `server/`, preserving its values. Inspect destinations first; do not overwrite existing configuration.

## 2. Preserve the azd environment

For an existing deployment, move only the intended `.azure/<environment>/` state directory to `server/.azure/<environment>/`. Preserve the selected-environment configuration in `.azure/config.json` if present.

Do not create a replacement environment or rename the old one: Entra ownership tags depend on the subscription and environment.

## 3. Check before provisioning

From `server/`, run `azd env list` and select the same environment. Verify the subscription, resource group, and registration IDs before provisioning or teardown.

Automatic registration creation now defaults to `true`. If this environment uses independently managed registrations and has no explicit creation flag, set `azd env set CREATE_ENTRA_APP_REGISTRATIONS false` before provisioning. An existing explicit `false` remains effective.

Do not delete remote resources or commit local state as part of this move. For local development, reinstall dependencies from `server/` rather than moving an old `node_modules` directory.
