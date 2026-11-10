# Configure the plugin manifest

[Download walkthrough](../README.md) | [Source packaging](from-source.md)

**Goal:** turn the shipped template into a package for your endpoint and tenant setup. Use this same checklist for a downloaded `manifest.json` or `appPackage/manifest.json` in a source checkout.

**Prerequisites:** HTTPS MCP endpoint, [OAuth registration ID](oauth-setup.md), publisher details, and real privacy/terms URLs.

## 1. Replace the connection and developer fields

**Goal:** connect the package to your server and identify its publisher. Edit the existing fields; do not add OAuth credentials.

| Field | Value |
| --- | --- |
| `agentConnectors[0].toolSource.remoteMcpServer.mcpServerUrl` | Your HTTPS endpoint ending in `/mcp`, without credentials, query, or fragment |
| `agentConnectors[0].toolSource.remoteMcpServer.authorization.referenceId` | OAuth client registration ID from the developer portal, not an Entra application ID |
| `developer.name` | Your developer/publisher name |
| `developer.websiteUrl` | Your project website; the repository URL is the demo default |
| `developer.privacyUrl` | Your real privacy information URL, replacing `example.com` |
| `developer.termsOfUseUrl` | Your real terms URL, replacing `example.com` |

Save valid JSON. Keep `OAuthPluginVault`, manifest/schema version **1.29**, the connector ID, and skill folder/name unchanged. This template has one skill and one remote connector; Cowork discovers tools dynamically, so no static tool catalog is needed.

## 2. Choose a stable app identity

**Goal:** allow installed copies to be updated rather than treated as unrelated apps.

For your independent tenant app, generate a new GUID for `id` and retain it across updates. For example, use `uuidgen` in Bash (if available) or `[guid]::NewGuid().ToString()` in PowerShell. Do not generate a new ID each time you repackage.

Keep the release's `version` for the first installation, or choose your own numeric `X.Y.Z`. Increment it for updates to an installed app; the ZIP filename alone does not change the manifest version. Source packaging also supports `--version`.

The icons are original demo assets. This repository provides no production legal policies or store certification; configure appropriate publisher information before sharing the app.

## 3. Check the package layout

**Goal:** make the manifest and referenced files discoverable at their expected ZIP paths.

Include only:

```text
manifest.json
color.png
outline.png
skills/entra-mcp-demo/SKILL.md
```

`manifest.json` and the icons must be at ZIP root, not inside a containing directory. Preserve the nested skill path. Do not add tokens, secrets, `.env`, editor backups, or documentation.

Return to [download packaging](../README.md#5-create-a-configured-zip) or [source packaging](from-source.md#4-build-the-configured-package).
