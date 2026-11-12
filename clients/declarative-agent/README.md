# Configure the declarative agent (recommended)

[Repository overview](../../README.md) | [MCP server](../../server/README.md) | [Cowork alternative](../cowork-plugin/README.md)

**Goal:** download a template, connect it to your Entra-protected MCP server, and install it as a **Microsoft 365 Copilot Chat declarative agent**. It calls `whoami` and `echo`. This is not a Cowork plugin or a GitHub Copilot agent.

The installed app/agent's short name is **Entra Auth MCP Lab - Chat**, with full app name **Entra Auth MCP Lab - Chat**. ATK appends its environment suffix, normally `-dev`; see the shared [naming conventions](../../server/docs/operations.md#project-and-deployment-names).

![Entra Auth MCP Lab Chat logo: a violet identity speech bubble and its white outline variant.](docs/images/branding-preview.png)

Color icon (left) and enlarged outline artwork (right).

**The release ZIP is a configuration template, not an install-ready app.** It contains the app manifest, agent definition, MCP plugin definition, and icons. It includes no server, credentials, or ATK executable.

## Prerequisites

- An eligible Microsoft 365 work tenant with Copilot access and permission to upload custom agents, or an administrator who can upload/assign them. See [installation prerequisites](docs/install-and-test.md#prerequisites).
- An externally reachable HTTPS [MCP server](../../server/docs/azure-deployment.md), its tenant ID, full API scope, and Web-client ID.
- Permission to create/reuse that Web client's secret and create its auth config in the [Teams developer portal](https://dev.teams.microsoft.com/tools).
- A text editor and ZIP tools: `unzip`/`zip` in Bash or `Expand-Archive`/`Compress-Archive` in PowerShell.

**No clone, Node.js, npm, or Agents Toolkit is needed to configure a download.** Developers who want the ATK project should use the separate [source workflow](docs/from-source.md).

## Choose the app identity workflow

| Path | How the app identity is registered | When to use it |
| --- | --- | --- |
| **Recommended download + admin upload** (below) | Generate a GUID and set `manifest.json`: `id`. Uploading the configured ZIP creates the tenant's app/agent catalog entry using that ID; no pre-existing app entry under Teams Developer Portal > Apps or `atk provision` is required. | Install a ready-made package without a developer project or Toolkit. |
| **[ATK source workflow](docs/from-source.md)** | `atk provision` runs `teamsApp/create` to create an app entry in Teams Developer Portal and saves its ID as `TEAMS_APP_ID` for the manifest. Toolkit creates the entry; you do not need to create it manually first. | Develop, update, and personally test the agent with Toolkit. |

Creating a Developer Portal app entry alone does not install or publish the agent. The paths can be combined: a package developed with Toolkit can later be uploaded by an administrator using the same manifest ID. **Retain the ID for updates**, rather than generating a new one each time.

This app identity is not an Entra app registration or an OAuth auth config. Both paths still require the manual OAuth setup below, including the auth config in the developer portal's **Tools > OAuth client registration**.

## 1. Download the release template

**Goal:** use the packaged agent rather than build from source.

Open [GitHub Releases](https://github.com/Yvand/entra-auth-mcp-lab/releases), choose a **declarative-agent** release, and download **`entra-auth-mcp-lab-declarative-agent-template-<version>.zip`**. Do not select the Cowork asset or GitHub's automatic source archives.

The commands below use `1.2.3` as an example; substitute your downloaded version.

## 2. Collect the server values

**Goal:** identify the server and delegated permission this agent will use.

Record the **HTTPS MCP endpoint**, **tenant ID**, **full requested API scope**, and **Web-client ID** from [Azure deployment step 4](../../server/docs/azure-deployment.md#4-collect-the-client-connection-values).

Reuse **`ENTRA_COPILOT_CLIENT_APP_ID`** (`Entra Auth MCP Lab - Copilot Client - <environment>` by default), even if you have not installed Cowork. It is an Entra Web-client ID, not an agent app GUID or auth config ID. With independently managed registrations, use your existing suitable client or the [manual alternative](../docs/manual-web-client.md).

## 3. Complete manual OAuth setup

**Goal:** let Microsoft 365 sign users into the API without packaging credentials.

Follow [shared OAuth setup](../docs/oauth-setup.md), using the **declarative-agent** organization restriction. Create an agent-specific auth config with the reused Entra client and an existing valid secret where suitable. Return with its **OAuth client registration ID (auth config ID)**.

Do not create another Entra client by default. A [dedicated client](../docs/manual-web-client.md#when-to-use-a-dedicated-client) is an alternative when you need independent policy, credentials, or lifecycle.

## 4. Extract and customize

**Goal:** set your app identity, endpoint, and auth reference, then review publisher details.

From the folder containing the download, Bash:

```bash
unzip entra-auth-mcp-lab-declarative-agent-template-1.2.3.zip -d configured-agent
cd configured-agent
```

PowerShell:

```powershell
Expand-Archive ./entra-auth-mcp-lab-declarative-agent-template-1.2.3.zip ./configured-agent
Set-Location ./configured-agent
```

Apply the [manifest checklist](docs/manifest-configuration.md#1-configure-the-downloaded-files). Set your own app GUID in `manifest.json`, the endpoint and auth config ID in `ai-plugin.json`, and review developer/privacy/terms fields. Keep the agent definition and icons in place. The download has no unresolved ATK variables.

## 5. Create a configured ZIP

**Goal:** place all five files at ZIP root, without a containing folder.

Stay in `configured-agent/` and use a **new destination ZIP**. Bash:

```bash
zip ../entra-auth-mcp-lab-declarative-agent-configured-1.2.3.zip manifest.json declarativeAgent.json ai-plugin.json color.png outline.png
```

PowerShell:

```powershell
Compress-Archive -Path manifest.json,declarativeAgent.json,ai-plugin.json,color.png,outline.png -DestinationPath ../entra-auth-mcp-lab-declarative-agent-configured-1.2.3.zip
```

Inspect the [five-file layout](docs/manifest-configuration.md#2-check-the-zip-layout). Standard ZIP tools do not validate schemas or placeholders; complete the checklist before uploading.

## 6. Install and exercise both tools

**Goal:** verify real delegated MCP calls, not just a successful upload.

Follow [Install and test](docs/install-and-test.md). Open the agent in Microsoft 365 Copilot and ask:

```text
Run the Entra Auth MCP Lab and echo "hello from my agent".
```

Success means both tools ran, the identity is the consenting account, and the echo contains your message. Upload success and `/healthz` do not establish this.

## Alternatives and maintainer tasks

| Goal | Guide |
| --- | --- |
| Develop/provision with Agents Toolkit | [ATK source workflow](docs/from-source.md) |
| Understand IDs and manifest fields | [Manifest configuration](docs/manifest-configuration.md) |
| Prepare an independently managed Web client | [Manual Web-client setup](../docs/manual-web-client.md) |
| Diagnose installation or OAuth | [Installation troubleshooting](docs/install-and-test.md#troubleshooting) |
| Publish a template release | [Maintainer release guide](docs/releases.md) |
