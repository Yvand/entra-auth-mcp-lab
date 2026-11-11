# Deploy to Azure (recommended)

[Server overview](../README.md) | [Existing registrations instead](azure-existing-registrations.md)

**Goal:** deploy an HTTPS MCP server to Azure Container Apps and let Azure Developer CLI (`azd`) create its API and shared Copilot Web-client registrations. This is the default: `CREATE_ENTRA_APP_REGISTRATIONS=true`.

You do **not** need to create the API registration first. Already have registrations to reuse? Follow the [separate existing-registration guide](azure-existing-registrations.md).

## Prerequisites

- [Git](https://git-scm.com/downloads), [azd](https://aka.ms/azd-install), and [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli).
- An Azure subscription and permission to provision resources and create role assignments. Contributor alone cannot create role assignments.
- Permission in the subscription's Entra tenant to create app registrations/service principals and grant tenant-wide delegated consent. [Entra directory privileges](entra-app-registrations.md#permissions-and-client-choices) are separate from Azure subscription roles.
- Bash on Linux/macOS, or PowerShell 7+ (`pwsh`) on Windows, for the cleanup hook.

The image builds remotely in Azure Container Registry: local Node.js, npm, and Docker are not required for this path. Azure resources incur charges, including registry/logging charges while the server is idle; see [deployed resources](operations.md#azure-deployment-reference).

## 1. Get the server files

**Goal:** run deployment commands from the directory containing `azure.yaml`.

```bash
git clone https://github.com/Yvand/entra-mcp-identity-lab.git
cd entra-mcp-identity-lab/server
```

Already cloned? Open a terminal in its `server/` directory. Run all remaining commands there.

## 2. Select your tenant and Azure environment

**Goal:** ensure Azure resources and registrations are created in the intended subscription and tenant.

Replace the placeholders; these commands work in Bash and PowerShell:

```bash
azd auth login --tenant-id "<tenant-id>"
az login --tenant "<tenant-id>"
azd env new dev
azd env set AZURE_SUBSCRIPTION_ID "<subscription-id>"
azd env set AZURE_LOCATION "<azure-region>"
```

The two tools have separate sign-ins. Use the tenant associated with your subscription. For an existing environment, use `azd env select dev` instead of creating it; check the selection with `azd env list`.

Fresh deployments use the [project naming conventions](operations.md#project-and-deployment-names): for example, `rg-entra-mcp-identity-lab-dev`, `Entra MCP Identity Lab - API - dev`, and `Entra MCP Identity Lab - Copilot Client - dev`. Explicit display-name overrides are preserved exactly. This naming scheme does not migrate objects created under earlier project names; use a fresh environment for a new deployment.

If reusing an environment that explicitly sets `CREATE_ENTRA_APP_REGISTRATIONS=false`, it keeps that setting. Do not switch a deployed environment's identity setup just to follow this guide; use the [existing-registration path](azure-existing-registrations.md).

## 3. Deploy the server and registrations

**Goal:** create the API registration, its shared Copilot Web client, and the running HTTPS server in one workflow.

```bash
azd up
```

By default, provisioning exposes `mcp.invoke`, configures the generated Web client's Teams callback and delegated consent, and separately preauthorizes Azure CLI for live checks. It derives the server's tenant and audience automatically; do not fill in `.env` or create another API/client pair. Client-secret creation and developer-portal registration remain manual.

Wait for both provisioning and application deployment to finish. A provision-only placeholder image is not the MCP server. [Optional settings](operations.md#automatic-registration-settings), including disabling Azure CLI preauthorization, belong outside this default walkthrough.

## 4. Collect the client connection values

**Goal:** give either client the server address and permission it must request.

```bash
azd env get-value MCP_ENDPOINT
azd env get-value ENTRA_TENANT_ID
azd env get-value ENTRA_API_APP_ID
azd env get-value ENTRA_COPILOT_CLIENT_APP_ID
```

Record the HTTPS endpoint (including `/mcp`), tenant ID, API app ID, and Copilot Web-client ID. The full requested scope is **`api://<ENTRA_API_APP_ID>/mcp.invoke`** for this default setup.

`ENTRA_COPILOT_CLIENT_APP_ID` identifies the generated **shared Copilot Web client**, not the API, Microsoft 365 app GUID, or later developer-portal auth config. Use it for both demos when creating/reusing the client's secret and filling in the portal's **Client ID** field. See the [ID/scope reference](entra-app-registrations.md#understand-the-values).

azd saves deployment values in the selected `.azure/<environment>/` state, including the effective creation flag used by cleanup. It does not export them into your terminal.

## 5. Verify the deployment

**Goal:** confirm the deployed server accepts a real delegated API token, not just health requests.

Follow [live verification](testing.md#live-verification-local-or-azure), using its Azure value-selection commands. Success means `whoami` returns your identity and `echo` returns your message. Offline tests and `/healthz` alone do not verify deployed authentication.

## 6. Connect a Copilot client

**Goal:** configure a client that signs users into this API.

Choose **[the Cowork plugin](../../clients/cowork-plugin/README.md)** or **[the Copilot Chat declarative agent](../../clients/declarative-agent/README.md)** with the values from step 4. Both reuse the generated Web client and follow [manual OAuth setup](../../clients/docs/oauth-setup.md). Keep their Microsoft 365 app identities and portal auth configs distinct; do not create a second Entra client by default.

For later changes, use [update instructions](operations.md#update-an-azure-deployment). When finished, follow [Azure teardown](operations.md#azure-teardown): generated registrations are permanently purged **before** teardown confirmation unless you set the documented opt-out.
