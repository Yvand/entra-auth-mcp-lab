# Configure the Cowork plugin (recommended)

[Repository overview](../../README.md) | [MCP server](../../server/README.md)

**Goal:** download a template, connect it to your Entra-protected MCP server, and install it in **Microsoft 365 Copilot Cowork**. Its single skill calls both `whoami` and `echo`. This is not a Copilot Chat declarative agent or a GitHub Copilot CLI plugin.

**The release ZIP is a configuration template, not an install-ready app.** You must replace its endpoint and OAuth registration reference, then create a new ZIP. No server or credentials are included.

## Prerequisites

- A Microsoft 365 work tenant with **Copilot Cowork** available and permission to install custom plugins (or an administrator who can upload them).
- An externally reachable HTTPS [server deployment](../../server/docs/azure-deployment.md), its tenant ID, and its full delegated API scope.
- Permission to create/reuse a secret on the generated shared Copilot Web client and register its OAuth credentials in the [Teams developer portal](https://dev.teams.microsoft.com/tools). Without an automatically generated client, use the [manual Web-client alternative](docs/manual-web-client.md) first.
- A text editor and ZIP tools: `unzip`/`zip` in Bash or `Expand-Archive`/`Compress-Archive` in PowerShell.

**No repository clone, Node.js, or npm is needed to edit and repackage a download.** Tenant policy, licensing, availability, and upload restrictions are covered in [installation prerequisites](docs/install-and-test.md#prerequisites).

## 1. Download the release template

**Goal:** start with the packaged plugin rather than building from source.

Open **[GitHub Releases](https://github.com/Yvand/entra-oauth-mcp-server/releases)**, select a Cowork plugin release, and download **`entra-mcp-cowork-plugin-template-<version>.zip`** from its assets. Do not download the automatically generated "Source code" archives.

The commands below use `1.2.3` as an example; substitute your downloaded version.

## 2. Collect your server connection values

**Goal:** identify the server and permission this plugin will use.

Record the **HTTPS MCP endpoint**, **tenant ID**, **full requested scope**, and **shared Web-client ID** (`ENTRA_COPILOT_CLIENT_APP_ID`) from [server deployment step 4](../../server/docs/azure-deployment.md#4-collect-the-client-connection-values). With an independently managed API, use the actual scope shown in **Expose an API** and your existing or [manually created Web client](docs/manual-web-client.md).

## 3. Complete the OAuth prerequisites

**Goal:** allow Microsoft 365 to sign users into your API and store credentials outside the package.

Follow **[Set up the Cowork OAuth client](docs/oauth-setup.md)**. Reuse the generated **shared Web client** (named `simple-mcp-server-client-copilot` by default), create/reuse its secret manually, and create Cowork's auth config in the **Teams developer portal**. Bicep has already configured its callback and API permission/consent; do not create a second Entra app. This also works without installing the declarative agent.

Return here with the resulting **OAuth client registration ID** (auth config ID). This is not the API ID or `ENTRA_COPILOT_CLIENT_APP_ID`: only the portal's auth config ID goes in the manifest.

## 4. Extract and customize the template

**Goal:** set your endpoint and OAuth registration ID, and review the supplied publisher details.

From the folder containing the downloaded ZIP, extract it. Bash:

```bash
unzip entra-mcp-cowork-plugin-template-1.2.3.zip -d configured-plugin
cd configured-plugin
```

PowerShell:

```powershell
Expand-Archive ./entra-mcp-cowork-plugin-template-1.2.3.zip ./configured-plugin
Set-Location ./configured-plugin
```

Open **`manifest.json`** in a text editor. Apply the **[manifest field checklist](docs/manifest-configuration.md#1-replace-the-connection-and-developer-fields)** and save valid JSON. It also explains choosing your app GUID and retaining it for updates. Leave the icons and skill files in place; never add credentials.

## 5. Create a configured ZIP

**Goal:** produce the archive Microsoft 365 installs, with the manifest at ZIP root.

Stay in `configured-plugin/`. Use a **new destination ZIP** to avoid retaining old entries. Bash:

```bash
zip ../entra-mcp-cowork-plugin-configured-1.2.3.zip manifest.json color.png outline.png skills/entra-mcp-demo/SKILL.md
```

PowerShell:

```powershell
Compress-Archive -Path manifest.json,color.png,outline.png,skills -DestinationPath ../entra-mcp-cowork-plugin-configured-1.2.3.zip
```

Open the resulting ZIP and check the [required layout](docs/manifest-configuration.md#3-check-the-package-layout): `manifest.json`, both icons, and the skill path, without an enclosing `configured-plugin/` folder. Standard ZIP tools do not validate schema or placeholders; review the field checklist before uploading.

## 6. Install and try both tools

**Goal:** confirm the plugin can authenticate and run both server tools.

Follow **[Install and test](docs/install-and-test.md)** with your configured ZIP. It covers tenant upload/personal installation, enabling the plugin, sign-in, and this test prompt:

```text
Run the Entra MCP demo and echo "hello from my plugin".
```

Success means both tools ran, the identity is the consenting account, and the echo contains your message. Upload success alone is not an authenticated end-to-end check.

## Alternatives and maintainer tasks

| Goal | Guide |
| --- | --- |
| Build/validate a package from a checkout | [Source packaging](docs/from-source.md) |
| Prepare a Web client without automatic Azure registration | [Manual Web-client setup](docs/manual-web-client.md) |
| Test a local server with Cowork | [HTTPS tunnel requirements](docs/oauth-setup.md#server-connection-values) |
| Diagnose installation or sign-in | [Troubleshooting](docs/install-and-test.md#troubleshooting) |
| Publish a new template release | [Maintainer release guide](docs/releases.md) |
