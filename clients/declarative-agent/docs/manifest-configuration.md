# Configure the agent manifests

[Download walkthrough](../README.md) | [ATK source workflow](from-source.md)

**Goal:** keep app identity, agent instructions, and MCP authentication references distinct.

## 1. Configure the downloaded files

The release already contains plain JSON without ATK substitution syntax.

| File/field | What to set or review |
| --- | --- |
| `manifest.json`: `id` | Choose your own app GUID, distinct from Cowork and other installations; retain it for updates |
| `manifest.json`: `developer` | Review publisher name, website, privacy, and terms URLs; supplied repository links are demo defaults, not your organization's policies |
| `manifest.json`: `name`, `description` | Review user-visible demo identity |
| `ai-plugin.json`: `runtimes[0].spec.url` | Actual public HTTPS MCP endpoint ending in `/mcp` |
| `ai-plugin.json`: `runtimes[0].auth.reference_id` | Developer-portal **auth config ID**, not `ENTRA_COPILOT_CLIENT_APP_ID`, API ID, or app GUID |

Generate a GUID with `uuidgen` in Bash (if available) or `[guid]::NewGuid().ToString()` in PowerShell. This is the Microsoft 365 app identity, not a request to create another Entra app registration.

Keep `copilotAgents.declarativeAgents[0].file` pointing to `declarativeAgent.json`, and that file's action pointing to `ai-plugin.json`. Keep `auth.type` as `OAuthPluginVault`. No client secret, client credential, or token belongs in any of these files.

The plugin uses dynamic discovery: `functions: []` and `run_for_functions: ["*"]`. The server currently exposes `whoami` and `echo`. This is not an authorization allowlist: future server tools can become discoverable.

The agent instructions ask for `whoami`, then `echo`, with the same default message and length boundary as Cowork. Instructions and JSON validation cannot guarantee model execution; verify the actual calls.

## 2. Check the ZIP layout

All five files must be at the archive root:

```text
manifest.json
declarativeAgent.json
ai-plugin.json
color.png
outline.png
```

Keep the 192x192 color icon and 32x32 outline icon. Do not include an enclosing folder, `m365agents.yml`, `env/`, dependencies, or project metadata.

Before upload, check valid JSON, a new installation GUID, real endpoint/auth config, publisher fields, and no `REPLACE_` values or `${{...}}` expressions. The app package version is independent of the app/agent/plugin **schema versions**; leave schema versions unchanged.

## Source-project differences

In the ATK source, four variables are rendered into the same five-file package:

| ATK variable | Destination |
| --- | --- |
| `TEAMS_APP_ID` | App manifest `id`; Toolkit fills it when creating the app |
| `APP_NAME_SUFFIX` | App/agent display name, usually `-dev` for development |
| `MCP_ENDPOINT` | Plugin runtime URL |
| `MCP_AUTH_CONFIG_ID` | Plugin runtime OAuth auth-config reference |

`npm run package` renders a reusable release template offline. `npm run package -- --configured` reads `env/.env.dev` (or `--connection-file <path>`) and requires actual configured values. It does not import connection settings from your shell or execute environment-file contents.

Both builders use the same source manifests. The offline packager validates pinned [official schemas](../schema/README.md), references, auth/discovery configuration, endpoint, icons, placeholders, and allowed files. ATK additionally provides its own package validation. Neither proves live OAuth success.
