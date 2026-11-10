# Create a Cowork Web client manually (alternative)

[Recommended plugin setup](../README.md) | [Shared OAuth setup](oauth-setup.md)

**Goal:** prepare a Cowork Web client when you use a local server or externally managed registrations and do not have a generated one. **Skip this guide for the recommended automatic Azure deployment**: reuse its `ENTRA_CLIENT_APP_ID`.

## Prerequisites

- An API registration exposing the [full delegated scope](../../../server/docs/entra-app-registrations.md#understand-the-values), plus a reachable HTTPS MCP server.
- Permission in the API's tenant to register/configure an application and arrange delegated consent.

A desktop/CLI registration from the local setup examples is not the Web client described here. Reuse an existing suitable Web client if available; otherwise create one below.

## 1. Register the Web application

**Goal:** identify the application that Microsoft 365 uses to sign users into your API.

1. In the API's tenant, open [Entra admin center](https://entra.microsoft.com) > **App registrations > New registration**.
2. Name it, for example, `simple-mcp-server-client-cowork`, choose **Accounts in this organizational directory only**, and register it.
3. Record its **Application (client) ID**, separately from the API ID.
4. Open **Authentication > Add a platform > Web** and add this exact callback:

   ```text
   https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect
   ```

The callback receives the authorization response for Microsoft 365. Do not substitute the MCP URL or a desktop loopback URI. Keep **Allow public client flows** disabled.

## 2. Grant delegated API access

**Goal:** allow the Web client to request the API's scope on behalf of a user.

In **API permissions > Add a permission**, find your API under **My APIs** or search its app ID under **APIs my organization uses**. Choose **Delegated permissions** and add `mcp.invoke` (or your actual scope). Grant admin consent where required or ask an authorized administrator.

## 3. Complete the shared OAuth procedure

**Goal:** store the client's credentials and OAuth endpoints outside the plugin.

Return to **[Create the client secret](oauth-setup.md#2-create-the-client-secret)** and continue through developer-portal registration. Use your recorded Web-client ID wherever that guide refers to `ENTRA_CLIENT_APP_ID`; no generated output is available in the Azure `false` path.
