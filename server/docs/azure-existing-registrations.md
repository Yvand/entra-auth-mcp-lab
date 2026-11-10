# Deploy to Azure with existing registrations

[Server overview](../README.md) | [Recommended automatic setup](azure-deployment.md)

**Goal:** deploy the same HTTPS server while keeping Entra registrations independently managed. This alternative requires `CREATE_ENTRA_APP_REGISTRATIONS=false`; the default is `true`.

## Prerequisites

You need Git, azd, Azure CLI, and Azure provisioning/role-assignment permissions as described in the [Azure prerequisites](azure-deployment.md#prerequisites).

Also prepare an API registration issuing v2 access tokens and exposing the delegated scope, plus a calling client permitted to request it. Reuse an existing setup, or follow [portal registration](entra-app-registrations.md#manual-portal-setup) or the separate [registration scripts](entra-app-registration-scripts.md). You need registration/consent permissions only for the directory changes you perform.

## 1. Select the deployment environment

**Goal:** target the intended subscription without changing registration ownership.

Get the files and authenticate using [Azure steps 1 and 2](azure-deployment.md#1-get-the-server-files), then return here **before** running `azd up`. Run the following commands from `server/`, with the intended environment selected.

## 2. Configure the existing API

**Goal:** make the server validate tokens for your API without creating new registrations.

```bash
azd env set CREATE_ENTRA_APP_REGISTRATIONS false
azd env set ENTRA_TENANT_ID "<directory-tenant-id>"
azd env set ENTRA_AUDIENCE "<api-application-client-id>"
azd env set MCP_REQUIRED_SCOPE mcp.invoke
```

Replace the IDs and use your actual short scope name. `ENTRA_AUDIENCE` is the bare API app ID for v2 tokens, not the calling-client ID or full requested scope. The placeholder GUID defaults are not usable. Editing local `.env` does not configure Azure.

Optionally retain your independently managed calling-client ID for your own tests:

```bash
azd env set MCP_CLIENT_ID "<calling-client-application-id>"
```

`MCP_CLIENT_ID` is bookkeeping only, not a server input. Do not store it in `ENTRA_CLIENT_APP_ID`: deployment emits empty generated API/client/ownership outputs in this mode. This does not delete your existing registrations.

## 3. Deploy and collect the endpoint

**Goal:** run the server with the tenant, audience, and scope you supplied.

```bash
azd up
azd env get-value MCP_ENDPOINT
```

Keep the HTTPS endpoint, your tenant ID, and the **full scope from Expose an API** for client setup. Do not derive a scope from a comma-separated audience list or assume a custom Application ID URI starts with `api://<api-app-id>`.

## 4. Verify and connect a client

**Goal:** confirm delegated authentication works before configuring the plugin.

Follow [live verification](testing.md#live-verification-local-or-azure). Azure CLI must be [separately preauthorized](entra-app-registrations.md#optional-azure-cli-authorization-for-smoke-tests), or use your real client's token flow.

Then follow the [Cowork plugin guide](../../clients/cowork-plugin/README.md), which documents its dedicated Web client. Use [operations](operations.md#update-an-azure-deployment) for updates and [Azure teardown](operations.md#azure-teardown) to remove Azure resources. In this `false` mode the hook does not delete Entra registrations; manage them [separately](operations.md#independently-managed-registrations).
