# Create a Copilot Web client manually (alternative)

[Shared OAuth setup](oauth-setup.md) | [Cowork](../cowork-plugin/README.md) | [Declarative agent](../declarative-agent/README.md)

**Goal:** prepare a Web client for local development or independently managed registrations. Skip this procedure for the recommended automatic Azure deployment: reuse `ENTRA_COPILOT_CLIENT_APP_ID`.

## Prerequisites

An API exposing the [full delegated scope](../../server/docs/entra-app-registrations.md#understand-the-values), a reachable HTTPS MCP server, and permission to register applications and arrange delegated consent in the API's tenant.

## 1. Register the Web application

**Goal:** identify the application Microsoft 365 will use to sign users into your API.

1. In [Entra admin center](https://entra.microsoft.com), open **App registrations > New registration**.
2. Name it, for example, `Entra Auth MCP Lab - Copilot Client - dev` and select **Accounts in this organizational directory only**. Replace `dev` with your deployment label; see the [shared naming conventions](../../server/docs/operations.md#project-and-deployment-names).
3. Record its **Application (client) ID** separately from the API ID.
4. Open **Authentication > Add a platform > Web** and add:

   ```text
   https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect
   ```

Keep **Allow public client flows** disabled. The callback is not the MCP URL.

## 2. Grant delegated API access

**Goal:** let the client request the API scope on behalf of a user.

In **API permissions > Add a permission**, find your API under **My APIs**, or search its app ID under **APIs my organization uses**. Add the **Delegated** permission `mcp.invoke` (or your actual scope). Grant admin consent where required or ask an authorized administrator.

## 3. Complete OAuth setup

Return to [secret creation](oauth-setup.md#2-create-or-reuse-a-valid-client-secret), then create the client-specific portal auth config. Use your recorded Web-client ID wherever the automatic path refers to `ENTRA_COPILOT_CLIENT_APP_ID`; no generated client output is available in Azure's `false` mode.

## When to use a dedicated client

Reuse is the default for this small demo because the API, scope, and callback match. Create a separate Web client with the same steps only when you need independent credentials, policy, sign-in attribution, or lifecycle. Give it a distinct name, for example `Entra Auth MCP Lab - Chat Client - dev`, and use its ID/secret in the agent's own auth config.

Do not create a second API, change `ENTRA_AUDIENCE`, or toggle the deployment's registration mode to isolate a client. This manually managed registration is not owned by the azd environment and is not deleted by its cleanup hook. Remove it [separately](../../server/docs/operations.md#independently-managed-registrations) when no client uses it.
