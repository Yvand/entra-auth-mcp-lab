# Build the plugin from source (alternative)

[Recommended release-download setup](../README.md) | [Release maintenance](releases.md)

**Goal:** validate or customize the repository template using its npm packager. Most visitors should [download the release ZIP](../README.md) instead.

## Prerequisites

- A repository checkout, Node.js **24+**, and npm.
- For a configured package: the same [server and OAuth prerequisites](oauth-setup.md) as the download path, including the generated shared Copilot client or a suitable manually managed Web client.

Run commands from **`clients/cowork-plugin/`** (`cd clients/cowork-plugin` from the repository root).

## 1. Validate the shipped template

**Goal:** check the unchanged template and packaging implementation before customizing it.

```bash
npm ci
npm test
```

Tests assert shipped placeholders; they are not validation commands for a customized manifest.

## 2. Complete shared OAuth setup

**Goal:** obtain the developer-portal registration ID required by the connector.

Follow [OAuth setup](oauth-setup.md) if not already done: reuse the generated Web client, create its secret, and register it in the developer portal. Return with your endpoint and auth config ID.

## 3. Customize the manifest

**Goal:** replace connection placeholders and optionally customize the developer defaults without changing the skill and connector structure.

Edit **`appPackage/manifest.json`** using the shared [manifest checklist](manifest-configuration.md), including a stable tenant-app GUID and appropriate version.

## 4. Build the configured package

**Goal:** validate the edited files and produce the ZIP for installation.

```bash
npm run package -- --configured
```

This creates `build/entra-auth-mcp-lab-cowork-plugin-configured-<manifest-version>.zip`. To change only the packaged version, without rewriting the source manifest:

```bash
npm run package -- --configured --version 1.0.1
```

The packager checks the [pinned official schema](../schema/README.md), skill/connector shape, icon dimensions, and [four-file allow-list](manifest-configuration.md#3-check-the-package-layout). Configured mode also rejects `REPLACE_` markers and reserved-domain MCP endpoints (`example.com`, `example.net`, `example.org`, their subdomains, and `.invalid` hosts). It does not contact Microsoft 365, Entra, or the server and does not prove authentication works.

To validate an edited download with this tool, put its four files in a checkout's `appPackage/`, preserving the skill subfolder, then run configured packaging. Use a disposable checkout if you need to preserve the original template.

## 5. Install and verify

**Goal:** exercise real authentication and both tool calls.

Follow [Install and test](install-and-test.md) with the configured archive's path.

## Build an unconfigured template instead

**Goal:** prepare a reusable configuration template, not an install-ready app. Start from the unchanged checked-in template:

```bash
npm run package
npm run package -- --tag releases/cowork-plugin/v1.2.3
```

These produce `build/entra-auth-mcp-lab-cowork-plugin-template-<version>.zip`. For GitHub publication, follow the separate [maintainer release guide](releases.md).
