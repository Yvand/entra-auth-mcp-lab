# Set up OAuth for either Copilot client

[Repository overview](../../README.md) | [Cowork plugin](../cowork-plugin/README.md) | [Declarative agent](../declarative-agent/README.md)

**Goal:** let Microsoft 365 obtain delegated API tokens using a shared Entra Web client. Secret creation and developer-portal registration are manual for both release downloads and source/ATK workflows.

## Prerequisites and connection values

- An externally reachable HTTPS MCP endpoint ending in `/mcp`, its tenant ID, and the **full exposed API scope**.
- The Web-client application ID and permission to manage its secrets.
- Access to **Tools > OAuth client registration** in the [Teams developer portal](https://dev.teams.microsoft.com/tools).

The [recommended Azure deployment](../../server/docs/azure-deployment.md#4-collect-the-client-connection-values) creates the API and Web client. Record `MCP_ENDPOINT`, `ENTRA_TENANT_ID`, `ENTRA_API_APP_ID`, and **`ENTRA_COPILOT_CLIENT_APP_ID`**. The default scope is `api://<ENTRA_API_APP_ID>/mcp.invoke`. With a custom API, use its actual scope from **Expose an API**.

Configure tenant-specific endpoints and the full scope explicitly: this server's [metadata scope-format limitation](../../server/docs/operations.md#oauth-client-integration) means discovery alone is not sufficient. Entra does not support dynamic client registration here.

For a [local server](../../server/docs/local-development.md), use a public HTTPS tunnel with TLS 1.2+ and set `PUBLIC_BASE_URL` to that external base URL. Microsoft 365 cannot reach localhost directly. See Microsoft's [MCP development guidance](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/build-mcp-plugins).

## 1. Find the shared Web client

**Goal:** use the right registration without creating a duplicate.

Open [Entra admin center](https://entra.microsoft.com) in the API's tenant, then **App registrations > All applications**. Find the application by **`ENTRA_COPILOT_CLIENT_APP_ID`**, not by display name alone. Its default display name is `Entra Auth MCP Lab - Copilot Client - <environment>`.

For the guide's `dev` environment, this is `Entra Auth MCP Lab - Copilot Client - dev`, with the same name under **Enterprise applications**. Custom display-name overrides are exact and may differ; see the [naming conventions](../../server/docs/operations.md#project-and-deployment-names).

The generated client already has delegated API permission/consent and a **Web** callback:

```text
https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect
```

This callback receives the authorization response, not an MCP request. Do not replace it with the API endpoint. Public client flows stay disabled.

Without a generated client, reuse a suitable existing Web client or follow the [manual alternative](manual-web-client.md).

### Why reuse the client?

Both demos use the same tenant, API scope, callback, and delegated authorization-code flow. Reuse avoids another app, consent grant, and cleanup lifecycle. Their Microsoft 365 app GUIDs and OAuth auth configs are separate, but the access token's client ID is shared.

For independent credential rotation, policy, sign-in identity, or teardown, use a [dedicated Web client](manual-web-client.md#when-to-use-a-dedicated-client). Do not change the API registration or server audience.

## 2. Create or reuse a valid client secret

**Goal:** let the Microsoft token store exchange authorization codes.

On the **Web client**, open **Certificates & secrets > Client secrets > New client secret** and choose an expiry appropriate to your tenant. Use its **Value**, not its Secret ID, in the portal's secure credential field below. Bicep does not create, output, or manage this secret.

Use a recognizable description such as `entra-auth-mcp-lab-copilot-dev`, replacing `dev` with your deployment label. This is only the credential's label, not a value to put into a manifest.

Reuse an existing valid secret where suitable; do not generate another on every provision. Track expiry and update the token-store registration when rotating it. The API registration needs no secret.

Never put the secret in server configuration, an ATK environment file, a manifest, a skill, a ZIP, or release configuration. Only the portal receives it.

## 3. Create the client-specific auth config

**Goal:** store OAuth settings and credentials outside the package.

In the [Teams developer portal](https://dev.teams.microsoft.com/tools), select **Tools > OAuth client registration > New OAuth client registration** (or **Register client**). Create a separate auth config for each demo client by default, using the same Entra Web client. This avoids changing the other client's host-specific settings.

| Field | Value |
| --- | --- |
| Registration name | `entra-auth-mcp-lab-cowork-oauth-dev` for Cowork or `entra-auth-mcp-lab-chat-oauth-dev` for Chat; replace `dev` with your deployment label |
| Base URL | The actual HTTPS MCP endpoint, matching the package's MCP URL; follow the portal's URL-matching requirements |
| Client ID | `ENTRA_COPILOT_CLIENT_APP_ID`, or your independently managed Web-client ID; not the API ID |
| Client secret | That Web client's secret **Value** |
| Authorization endpoint | `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize` |
| Token endpoint | `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token` |
| Refresh endpoint | The same token endpoint |
| Scope | Full API scope plus `offline_access`, e.g. `api://<api-app-id>/mcp.invoke offline_access` |
| Enable PKCE | Leave enabled |
| Restrict usage by app | **Any Teams app**; binding to an existing app ID can cause MCP runtime 404s |
| Restrict usage by org | **Declarative agent:** My organization only for this single-tenant demo. **Cowork:** Any Microsoft 365 organization, following its host guidance |

Use your real tenant ID and actual exposed scope. The Cowork organization setting does not make the API multitenant: server token validation remains single-tenant. A Graph scope, ID token, or app-only permission cannot replace the delegated API scope. `offline_access` enables refresh.

Save and record the **OAuth client registration ID**, also called the **auth config ID**. An auth config is not another Entra app registration.

## 4. Reference the auth config in your client

**Goal:** package a reference, never credentials.

| Client | Manifest field |
| --- | --- |
| [Cowork](../cowork-plugin/docs/oauth-setup.md#4-use-the-registration-id-in-the-manifest) | `manifest.json`: `agentConnectors[0].toolSource.remoteMcpServer.authorization.referenceId` |
| [Declarative agent](../declarative-agent/docs/manifest-configuration.md) | `ai-plugin.json`: `runtimes[0].auth.reference_id`; ATK source uses `MCP_AUTH_CONFIG_ID` |

Keep the auth type `OAuthPluginVault`. The auth config ID is not the API ID, Web-client ID, or Microsoft 365 app GUID.

## Rotation and cleanup

Update each affected auth config when rotating a shared secret. Removing an installed agent/plugin or deleting one auth config does not require deleting the shared Entra client.

The server's [azd cleanup](../../server/docs/operations.md#azure-teardown) can permanently purge its generated API and shared Web client before teardown confirmation, affecting **both** demos. It does not remove auth configs or installed Microsoft 365 apps. Independently managed clients are not automatically purged.

For platform changes, consult Microsoft's [OAuth guidance](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-authentication-oauth) and [Cowork authentication guidance](https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugin-development#supported-auth-types).
