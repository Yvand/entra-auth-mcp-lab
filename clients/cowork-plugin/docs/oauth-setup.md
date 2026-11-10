# Set up the Cowork OAuth client

[Recommended download walkthrough](../README.md) | [Source packaging](from-source.md)

**Goal:** let Microsoft 365 obtain delegated access tokens using the Cowork Web client created by your server deployment. Create its secret and developer-portal registration manually, whether you use a release ZIP or a source build.

## Prerequisites

- A deployed HTTPS server and the connection values below.
- The generated Cowork client ID (`ENTRA_COWORK_CLIENT_APP_ID`) and permission in its tenant to manage that app/create a secret.
- Access to **Tools > OAuth client registration** in the [Teams developer portal](https://dev.teams.microsoft.com/tools).

The [recommended Azure deployment](../../../server/docs/azure-deployment.md) creates both the API and this Web client, including its API permission/consent. Do not register another app. Without a generated client, reuse a suitable existing Web client or follow the separate [manual Web-client procedure](manual-web-client.md) before step 2.

## Server connection values

Collect the endpoint, tenant ID, full scope, and Cowork client ID from [Azure deployment step 4](../../../server/docs/azure-deployment.md#4-collect-the-client-connection-values). For a custom API, use the full scope from **Expose an API**, not an audience list.

The endpoint must end in `/mcp` and be reachable from Microsoft 365 over HTTPS with TLS 1.2+; localhost alone is not reachable. For an alternative [local server](../../../server/docs/local-development.md), expose it through a public HTTPS tunnel and set `PUBLIC_BASE_URL` to that external base URL. See Microsoft's [local MCP tunnel guidance](https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugin-development#test-a-connector-against-a-local-mcp-server).

Configure the endpoints and full scope explicitly below: this server's metadata has a [scope-format limitation](../../../server/docs/operations.md#oauth-client-integration).

## 1. Find the generated Cowork Web client

**Goal:** locate the app Microsoft 365 will use, without creating a duplicate.

In the API's tenant, open [Entra admin center](https://entra.microsoft.com) > **App registrations > All applications**, and find the app by the recorded **`ENTRA_COWORK_CLIENT_APP_ID`**. Its default display name is `simple-mcp-server-client-cowork`.

Confirm its **Application (client) ID** matches that value and its Web callback/API permission are already configured by Bicep. It is not the API registration.

The Web callback receives Microsoft's authorization response, not an MCP request. Do not replace it with the API endpoint or a localhost URL.

## 2. Create the client secret

**Goal:** let the Microsoft token store exchange authorization codes for this Web client.

On that **Cowork client app**, open **Certificates & secrets > Client secrets > New client secret** and choose an expiry appropriate to your tenant. Use its **Value**, not its Secret ID, in step 3's secure credential field. Bicep does not create, output, or manage this secret. If reusing a setup, use its existing valid secret or rotate it rather than creating one on every re-provision.

The secret belongs to this Web client, never the API registration. Do not put it in `.env`, the manifest, skill, ZIP, or release configuration. Track its expiry and update the token-store registration when rotating it.

## 3. Register the client in the developer portal

**Goal:** store the OAuth configuration and credentials in the Microsoft Enterprise token store, outside the package.

Open [Teams developer portal](https://dev.teams.microsoft.com/tools) and select **Tools > OAuth client registration > New OAuth client registration** (or **Register client**). Fill in:

| Field | Value |
| --- | --- |
| Registration name | A recognizable name for this setup |
| Base URL | Your actual HTTPS MCP endpoint, matching the manifest connector URL; follow the portal's URL-matching requirements |
| Client ID | The Cowork Web-client ID (`ENTRA_COWORK_CLIENT_APP_ID` for automatic deployment), not the API ID |
| Client secret | That Web client's secret **Value** |
| Authorization endpoint | `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/authorize` |
| Token endpoint | `https://login.microsoftonline.com/<tenant-id>/oauth2/v2.0/token` |
| Refresh endpoint | The same token endpoint |
| Scope | Your full API scope followed by `offline_access`, e.g. `api://<api-app-id>/mcp.invoke offline_access` |
| Enable PKCE | Leave enabled |
| Restrict usage by app | **Any Teams app**; binding to an existing Teams app ID can cause MCP runtime 404s |
| Restrict usage by org | **Any Microsoft 365 organization**, as directed by the Cowork connector guide; this does not change the API's single-tenant validation |

Use your real tenant ID and actual exposed scope. `offline_access` allows token refresh; a Graph scope, ID token, or app-only permission cannot replace the delegated API scope.

Select **Save** and record the resulting **OAuth client registration ID**, also called the **auth config ID**.

## 4. Use the registration ID in the manifest

**Goal:** reference the stored configuration without packaging any credentials.

Put only the **auth config ID** in `agentConnectors[0].toolSource.remoteMcpServer.authorization.referenceId`, keeping `authorization.type` as `OAuthPluginVault`. It is not the Web-client ID, API ID, or manifest app GUID.

Return to [download step 4](../README.md#4-extract-and-customize-the-template) or [source step 3](from-source.md#3-customize-the-manifest).

For platform changes, consult Microsoft's [OAuth setup](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/plugin-authentication-oauth) and [Cowork authentication guidance](https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugin-development#supported-auth-types). Entra does not support dynamic client registration here; do not omit authentication configuration.
