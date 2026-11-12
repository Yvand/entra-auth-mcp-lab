# Set up the Cowork OAuth client

[Recommended download walkthrough](../README.md) | [Source packaging](from-source.md)

**Goal:** connect Cowork using the shared Copilot Web client. The [shared OAuth procedure](../../docs/oauth-setup.md) is the source of truth for both demo clients; secret creation and portal registration remain manual.

## Prerequisites

Collect the endpoint, tenant, full exposed API scope, and `ENTRA_COPILOT_CLIENT_APP_ID` from [server deployment](../../../server/docs/azure-deployment.md#4-collect-the-client-connection-values). You need permission to manage the Web client's secret and create its portal auth config.

## Server connection values

Follow [shared connection requirements](../../docs/oauth-setup.md#prerequisites-and-connection-values), including HTTPS tunnels for a local server and the explicit full-scope requirement.

## 1. Find the generated Cowork Web client

The Web client is now shared with the declarative-agent demo and named `Entra Auth MCP Lab - Copilot Client - <environment>` by default. Follow [find the shared Web client](../../docs/oauth-setup.md#1-find-the-shared-web-client), using its ID rather than its name.

## 2. Create the client secret

Follow [create or reuse a valid secret](../../docs/oauth-setup.md#2-create-or-reuse-a-valid-client-secret). Do not add it to the plugin or server.

## 3. Register the client in the developer portal

Follow [create the client-specific auth config](../../docs/oauth-setup.md#3-create-the-client-specific-auth-config), using its **Cowork** organization restriction. Keep this auth config separate from the declarative agent's by default.

## 4. Use the registration ID in the manifest

Put only the resulting **auth config ID** in `agentConnectors[0].toolSource.remoteMcpServer.authorization.referenceId` in `manifest.json`, keeping `authorization.type` as `OAuthPluginVault`.

It is not the Entra Web-client ID (`ENTRA_COPILOT_CLIENT_APP_ID`), API ID, or manifest app GUID. Return to [download step 4](../README.md#4-extract-and-customize-the-template) or [source step 3](from-source.md#3-customize-the-manifest).
