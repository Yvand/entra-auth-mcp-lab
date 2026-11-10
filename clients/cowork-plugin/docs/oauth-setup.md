# Set up the Cowork OAuth client

[Recommended download walkthrough](../README.md) | [Source packaging](from-source.md)

**Goal:** let Microsoft 365 obtain delegated access tokens for your MCP API. Complete this once for your setup, whether you use a release ZIP or a source build.

## Prerequisites

- A deployed HTTPS server and the connection values below.
- Permission in its Entra tenant to register a Web client, create a secret, and arrange delegated API consent.
- Access to **Tools > OAuth client registration** in the [Teams developer portal](https://dev.teams.microsoft.com/tools).

The API registration must already exist. The server's generated desktop/CLI client is not suitable for this Web-client walkthrough; leave it unchanged.

## Server connection values

Collect the endpoint, tenant ID, and full scope from [Azure deployment step 4](../../../server/docs/azure-deployment.md#4-collect-the-client-connection-values). For a custom API, use the full scope from **Expose an API**, not an audience list.

The endpoint must end in `/mcp` and be reachable from Microsoft 365 over HTTPS with TLS 1.2+; localhost alone is not reachable. For an alternative [local server](../../../server/docs/local-development.md), expose it through a public HTTPS tunnel and set `PUBLIC_BASE_URL` to that external base URL. See Microsoft's [local MCP tunnel guidance](https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugin-development#test-a-connector-against-a-local-mcp-server).

Configure the endpoints and full scope explicitly below: this server's metadata has a [scope-format limitation](../../../server/docs/operations.md#oauth-client-integration).

## 1. Register a dedicated Entra Web client

**Goal:** create the OAuth application that Microsoft 365 uses to sign users into the API.

1. In the API's tenant, open the [Entra admin center](https://entra.microsoft.com), then **App registrations > New registration**.
2. Name it, for example, `entra-mcp-cowork-client`. Choose **Accounts in this organizational directory only** and register it.
3. Record its **Application (client) ID**. This is the Web-client ID, not the API ID.
4. Open **Authentication > Add a platform > Web** and register this exact callback:

   ```text
   https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect
   ```

The callback receives the authorization response for Microsoft 365. Do not substitute the MCP endpoint or the desktop client's loopback URI.

## 2. Add API permission and a client secret

**Goal:** authorize the client to request the API's delegated scope and let the token store exchange authorization codes.

1. In **API permissions > Add a permission**, find your MCP API under **My APIs** or search its app ID under **APIs my organization uses**. Select **Delegated permissions** and add `mcp.invoke` (or your actual scope).
2. Grant admin consent where tenant policy requires it, or ask an authorized administrator to do so.
3. In **Certificates & secrets > Client secrets**, create a secret. Use its **Value**, not its Secret ID, in step 3's secure credential field.

The secret belongs to this Web client, never the API registration. Do not put it in `.env`, the manifest, skill, ZIP, or release configuration. Track its expiry and update the token-store registration when rotating it.

## 3. Register the client in the developer portal

**Goal:** store the OAuth configuration and credentials in the Microsoft Enterprise token store, outside the package.

Open [Teams developer portal](https://dev.teams.microsoft.com/tools) and select **Tools > OAuth client registration > New OAuth client registration** (or **Register client**). Fill in:

| Field | Value |
| --- | --- |
| Registration name | A recognizable name for this setup |
| Base URL | Your actual HTTPS MCP endpoint, matching the manifest connector URL; follow the portal's URL-matching requirements |
| Client ID | The dedicated Entra Web-client Application (client) ID |
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
