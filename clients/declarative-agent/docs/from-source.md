# Develop the agent with Agents Toolkit

[Recommended download setup](../README.md) | [Shared OAuth setup](../../docs/oauth-setup.md)

**Goal:** use the checked-in ATK project to build, update, and personally test the same declarative agent. This is the developer alternative, not a prerequisite for configuring a release ZIP.

## Prerequisites

- Git and Node.js 24+ for offline packaging/tests.
- VS Code with [Microsoft 365 Agents Toolkit](https://aka.ms/M365AgentsToolkit) 6.12.0+ for the MCP authoring workflow, or the [ATK CLI](https://learn.microsoft.com/en-us/microsoftteams/platform/toolkit/microsoft-365-agents-toolkit-cli).
- For provisioning/installing, an eligible Microsoft 365 account with Copilot access and custom-app upload enabled.
- An existing HTTPS MCP server and a manually created [agent auth config](../../docs/oauth-setup.md#3-create-the-client-specific-auth-config). ATK does not create Entra apps, secrets, or auth configs in this project.

## 1. Validate the public template offline

**Goal:** check the project without tenant credentials or a running server.

From a checkout, run all source commands in `clients/declarative-agent/`:

```bash
npm ci
npm test
npm run package
```

The output is `build/entra-mcp-declarative-agent-template-1.0.0.zip`: a **configuration template**, not a configured app. It has no unresolved ATK variables. The [release workflow](../../../.github/workflows/release-agent.yml) uses this same packager.

## 2. Configure the ATK environment

**Goal:** supply non-secret connection values.

Open **`clients/declarative-agent/` as the VS Code workspace**, so Toolkit finds `m365agents.yml`. Copy the sample:

```bash
cp env/.env.dev.example env/.env.dev
```

PowerShell:

```powershell
Copy-Item env/.env.dev.example env/.env.dev
```

Edit `env/.env.dev`:

| Value | Setting |
| --- | --- |
| `MCP_ENDPOINT` | Actual public HTTPS URL ending in `/mcp` |
| `MCP_AUTH_CONFIG_ID` | Manually created agent-specific developer-portal auth config ID |
| `TEAMS_APP_ID` | Leave empty for Toolkit's first app creation; preserve its generated value for updates |
| `APP_NAME_SUFFIX` | `-dev`, or your preferred short suffix |
| `TEAMSFX_ENV` | Keep `dev` for this environment |

Review publisher/privacy/terms details in `appPackage/manifest.json` as described in the [manifest checklist](manifest-configuration.md#1-configure-the-downloaded-files).

Environment state and generated packages are ignored. Do not add a Web-client secret or token to any project file. The Entra Web-client ID is used only when manually setting up OAuth; `MCP_AUTH_CONFIG_ID` references that configuration.

## 3. Provision and install for personal testing

**Goal:** register/update the Microsoft 365 app, not deploy another server.

Sign into your eligible Microsoft 365 account in Toolkit, select the `dev` environment, and run **Provision**. From the CLI:

```bash
atk auth login
atk provision --env dev
atk install --file-path build/appPackage.dev.zip --scope Personal
```

This source workflow uses an app entry in **[Teams Developer Portal > Apps](https://dev.teams.microsoft.com/apps)**. On first provision, `teamsApp/create` creates the entry automatically and saves its ID as `TEAMS_APP_ID`, which becomes `manifest.json`: `id`. You do not need to create the entry manually first or use `ENTRA_COPILOT_CLIENT_APP_ID` as its ID.

The lifecycle then renders/packages the files, validates the package, updates the app, and extends it to Microsoft 365. Creating the Developer Portal entry alone does not install or publish the agent; the separate `atk install` step personally sideloads the package. Keep the generated app ID and returned installation identifiers.

By contrast, the [recommended download + admin-upload path](../README.md#choose-the-app-identity-workflow) needs no pre-existing Developer Portal app entry: you generate a GUID in the manifest, and uploading the configured ZIP creates the tenant's app/agent catalog entry using that ID. A Toolkit-built package can also be uploaded by an administrator without changing its manifest ID. Admin upload does not imply creation of a developer-owned entry under Developer Portal > Apps.

This is not `azd provision`: it creates no Azure hosting or additional Entra registrations. The project intentionally has no tenant-wide/store publish lifecycle and no OAuth-registration actions. Use [installation guidance](install-and-test.md) for tenant policy and admin-upload alternatives.

## 4. Build a configured package offline

**Goal:** inspect a configured archive without re-provisioning.

After Toolkit has populated `TEAMS_APP_ID`, run:

```bash
npm run package -- --configured
```

For another non-secret connection file:

```bash
npm run package -- --configured --connection-file /path/to/connection.env
```

The output is `build/entra-mcp-declarative-agent-configured-1.0.0.zip`. Missing variables, template IDs, unresolved expressions, and connection placeholders fail packaging. The offline build and Toolkit use the same manifest files.

Alternatively, run Toolkit's native packaging without provisioning:

```bash
atk package --env dev --output-package-file build/atk-configured.zip --output-folder build/atk-configured
```

This requires a populated environment/app ID. Do not put an arbitrary unregistered ID in a Toolkit environment and assume provision will create that app.

## 5. Test, update, and remove

Follow the [live tool checks](install-and-test.md#2-open-the-agent-and-test-both-tools). Offline/schema validation and package upload are not authenticated acceptance tests.

Keep the same `TEAMS_APP_ID` for updates, increase the app package version when required, then provision and personally install the new package. If the endpoint/auth config changes, update the environment and repackage; rotating a secret requires updating the portal, not the package.

Remove the personal agent using Microsoft 365's app/agent management. Remove its auth config separately in the developer portal if no longer used. Do not delete the shared Entra client while Cowork or another deployment still uses it; see [shared cleanup](../../docs/oauth-setup.md#rotation-and-cleanup).
