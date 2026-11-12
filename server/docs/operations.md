# Operations and cleanup

[Server overview](../README.md) | [Recommended Azure setup](azure-deployment.md) | [Existing registrations](azure-existing-registrations.md) | [Testing](testing.md)

This is reference material for an already configured server. New users should start with the [Azure walkthrough](azure-deployment.md).

## Project and deployment names

The public name is **Entra Auth MCP Lab**; the repository, azd project, MCP server identity, and server npm package use **`entra-auth-mcp-lab`**. These conventions apply to fresh deployments, not migration of previously created objects.

`<environment>` is your azd environment (the guides use `dev`). `<token>` is the existing 13-character hash of subscription, environment, and location; `<owner>` is the subscription/environment hash used for Graph identity and ownership. Hashes distinguish deployments but do not replace application-ID and ownership checks.

| Asset or object | Default name |
| --- | --- |
| Azure resource group | `rg-entra-auth-mcp-lab-<environment>` |
| Container App | `ca-entra-auth-mcp-<token>` |
| Container Apps environment | `cae-entra-auth-mcp-lab-<token>` |
| Container Apps platform-managed infrastructure group (when created) | `ME_cae-entra-auth-mcp-lab-<token>` |
| Container Registry | `crentraauthmcplab<token>` |
| Log Analytics workspace | `log-entra-auth-mcp-lab-<token>` |
| User-assigned managed identity | `id-entra-auth-mcp-lab-<token>` |
| Entra API application and enterprise application | `Entra Auth MCP Lab - API - <environment>` |
| Shared Entra Copilot application and enterprise application | `Entra Auth MCP Lab - Copilot Client - <environment>` |
| Graph API / client `uniqueName` | `entra-auth-mcp-lab-api-<owner>` / `entra-auth-mcp-lab-copilot-client-<owner>` |
| Graph ownership tag | `azd-entra-auth-mcp-lab-<owner>` |
| Cowork short / full app name | `Entra Auth MCP Lab - Cowork` / `Entra Auth MCP Lab - Cowork` |
| Chat short / full app name | `Entra Auth MCP Lab - Chat` / `Entra Auth MCP Lab - Chat` |
| Cowork connector ID / display name | `entra-auth-mcp-lab` / `Entra Auth MCP Lab - Server` |
| Cowork skill folder / name | `skills/entra-auth-mcp-lab` / `entra-auth-mcp-lab` |
| Declarative agent ID | `entraAuthMcpLabAgent` |
| Declarative action ID / plugin namespace | `entraAuthMcpLab` / `EntraAuthMcpLab` |
| Plugin human-readable name | `Entra Auth MCP Lab` |
| Client npm packages | `entra-auth-mcp-lab-cowork-plugin` / `entra-auth-mcp-lab-declarative-agent` |
| Client archives | `entra-auth-mcp-lab-<cowork-plugin or declarative-agent>-<template or configured>-<version>.zip` |
| Suggested manual Cowork / Chat auth-config names | `entra-auth-mcp-lab-cowork-oauth-<environment>` / `entra-auth-mcp-lab-chat-oauth-<environment>` |
| Suggested shared-client secret description | `entra-auth-mcp-lab-copilot-<environment>` |
| Local Docker image / container | `entra-auth-mcp-lab:local` / `entra-auth-mcp-lab-local` |

Azure resources also carry `project: entra-auth-mcp-lab` alongside `azd-env-name`; the Container App retains `azd-service-name: mcp`. ARM module deployment names include the project slug. The `mcp` service/container role, generated output keys, `mcp.invoke` scope, and `api://<api-app-id>` URI convention are unchanged.

The Container App uses `entra-auth-mcp` rather than the full project slug: `ca-entra-auth-mcp-<token>` is 31 characters, while `ca-entra-auth-mcp-lab-<token>` would exceed its 32-character limit at 35. The type prefix and full 13-character uniqueness hash are retained. Other project-prefixed Azure resources use the full slug; ACR names omit hyphens because only alphanumerics are allowed.

Microsoft 365 short names fit the 30-character limit: Cowork's name is 27 characters and Chat's is 25 before its suffix. ATK app creation, the short/full Chat app name, and the Chat agent use the same name with `APP_NAME_SUFFIX` appended (normally `-dev`, at most 5 characters including punctuation). Longer suffixes are rejected, not truncated. The plugin human-readable name uses the full 18-character brand, within the 20-character host guidance.

Applications and their service principals (shown under **Enterprise applications**) share the same effective display name. Empty/unset display-name overrides select the environment-aware defaults; explicit nonempty overrides are used exactly, without appending a suffix. Graph upsert keys and ownership tags do not depend on these display-name overrides. Continue identifying objects by their generated IDs, not names alone.

Auth configs and credential descriptions above are manual naming suggestions, not additional deployed registrations. Both clients share one Entra Web client but keep distinct Microsoft 365 app GUIDs and OAuth auth configs. A credential description is not its secret value; never commit or package credentials. The new Graph namespace does not adopt or clean up objects from earlier project namespaces.

## Azure deployment reference

The [azd service definition](../azure.yaml) uses ACR remote builds (`docker.remoteBuild: true`). Local Docker is not required for this build path; a local-build fallback needs Docker/Podman. Node.js/npm are needed only for local development/tests.

| Resource | Configuration |
| --- | --- |
| Resource group | `rg-entra-auth-mcp-lab-<environment>` |
| Container App | External HTTPS ingress; 0.5 vCPU/1 GiB; min 0/max 3 replicas |
| Container Apps environment | Consumption hosting |
| Container Registry | Basic; admin credentials disabled |
| Log Analytics workspace | PerGB2018; 30-day retention; 1 GB/day ingestion cap |
| User-assigned managed identity | Registry-scoped `AcrPull` for the Container App |

No database, Key Vault, or Application Insights is deployed. Scale-to-zero reduces idle compute usage but does not remove registry/logging charges. Cold starts are expected.

`azd up` provisions infrastructure, then builds/deploys the application. The Container App initially uses a public placeholder image; its health probes can fail until application deployment finishes. A provision-only placeholder is not a running MCP server.

The deployment sets `HOST=0.0.0.0`, `PORT=3000`, and derives `PUBLIC_BASE_URL` from the HTTPS ingress FQDN. For a custom domain, set `PUBLIC_BASE_URL` before re-provisioning; domain/TLS configuration is a separate platform task.

### Automatic registration settings

`CREATE_ENTRA_APP_REGISTRATIONS` defaults to `true` in both Bicep and the azd parameter mapping. The module creates single-tenant API/shared Copilot Web-client applications and service principals, grants the Web client tenant-wide delegated consent, and preauthorizes it. API tokens use v2 and the default identifier URI is `api://<api-app-id>`. Tenant/audience inputs are ignored in this mode.

Optional overrides are set with `azd env set <name> <value>` before provisioning:

| Setting | Default/purpose |
| --- | --- |
| `MCP_REQUIRED_SCOPE` | `mcp.invoke`; short scope exposed and enforced by the API |
| `ENTRA_API_DISPLAY_NAME` | `Entra Auth MCP Lab - API - <environment>` |
| `ENTRA_CLIENT_DISPLAY_NAME` | `Entra Auth MCP Lab - Copilot Client - <environment>`; custom display names remain supported |
| `ENTRA_CLIENT_REDIRECT_URI` | `https://teams.microsoft.com/api/platform/v1.0/oAuthRedirect`; the shared Copilot Web callback, not a localhost/API URL |
| `ENTRA_AUTHORIZE_AZURE_CLI_CLIENT` | `true`; set `false` to disable Azure CLI preauthorization |
| `ENTRA_AZURE_CLI_APP_ID` | `04b07795-8ddb-461a-bbee-02f9e1bf7b46`; Azure CLI's well-known app ID |

Leave `ENTRA_API_DISPLAY_NAME` and `ENTRA_CLIENT_DISPLAY_NAME` unset or empty for the defaults above. A nonempty override is an exact display name for both the application and its service principal; it does not receive an environment suffix.

The generated client has a **Web** platform with public client flows disabled. It uses authorization code flow with PKCE enabled in the developer portal. Bicep does not create or manage its secret: follow [shared OAuth setup](../../clients/docs/oauth-setup.md) to create/reuse one and create client-specific portal auth configs.

Graph `uniqueName` and ownership tags depend on subscription and azd environment; repeated provisions target the same objects. Display names alone do not identify ownership. Do not rename an environment and assume its existing registrations move with it.

### Deployment values

Run `azd env get-value <name>` from `server/` for individual values. `azd env get-values` lists state, but does not export shell variables; do not execute its output as a script.

| Value | Meaning |
| --- | --- |
| `CREATE_ENTRA_APP_REGISTRATIONS` | Effective creation mode, persisted after provisioning for the cleanup hooks |
| `ENTRA_TENANT_ID`, `ENTRA_AUDIENCE` | Effective server tenant and audience; manual inputs in `false` mode |
| `MCP_REQUIRED_SCOPE` | Effective short scope, persisted after provisioning |
| `ENTRA_API_APP_ID`, `ENTRA_COPILOT_CLIENT_APP_ID` | Generated API/shared Copilot Web-client IDs; empty in `false` mode |
| `ENTRA_APP_OWNERSHIP_TAG` | Generated cleanup ownership marker; empty in `false` mode |
| `SERVICE_MCP_URI` | Public base URL, without `/mcp` |
| `MCP_ENDPOINT` | Full client endpoint including `/mcp` |
| `MCP_PROTECTED_RESOURCE_METADATA` | Full metadata URL |

## Update an Azure deployment

**Goal:** apply changes to an existing deployment. Select the intended azd environment and run commands from `server/`.

For source/image changes:

```bash
azd deploy
```

For infrastructure-backed settings, change the relevant value and re-provision; for example:

```bash
azd env set PUBLIC_BASE_URL "https://<your-custom-domain>"
azd provision
azd deploy
```

Changing an azd value alone does not update the Container App. Re-provisioning preserves its existing image; deploy refreshes the image. `azd up` can also run both phases.

`CREATE_ENTRA_APP_REGISTRATIONS` defaults to `true`. Use an explicit `false` for independently managed registrations.

Changing this flag does not transfer ownership or delete registrations; switching to `false` also disables automatic Entra cleanup. Plan identity/ownership changes separately rather than toggling it to troubleshoot.

## Server configuration

[.env.example](../.env.example) is the local template; [src/config.ts](../src/config.ts) defines runtime behavior. Run server and `azd` commands from `server/`. For Azure, set mapped values with `azd env set` and **re-provision**; `server/.env` does not configure the Container App.

| Variable | Required/default | Meaning |
| --- | --- | --- |
| `ENTRA_TENANT_ID` | Required | Token-issuing directory ID |
| `ENTRA_AUDIENCE` | Required | Exact expected `aud` value(s), comma-separated; bare API application ID for Entra v2 |
| `MCP_REQUIRED_SCOPE` | `mcp.invoke` | Short delegated scope required in `scp` |
| `ENTRA_ISSUER` | Tenant's `https://login.microsoftonline.com/<tenant>/v2.0` | Optional exact issuer override |
| `ENTRA_JWKS_URI` | Tenant's `https://login.microsoftonline.com/<tenant>/discovery/v2.0/keys` | Optional signing-key endpoint override |
| `PORT` | `3000` | Integer listener port, 1-65535 |
| `HOST` | `127.0.0.1` | Listener address; container deployment sets `0.0.0.0` |
| `PUBLIC_BASE_URL` | `http://<HOST>:<PORT>` | Public resource/metadata/challenge base URL, without `/mcp`; trailing slashes are removed |

`ENTRA_COPILOT_CLIENT_APP_ID` is an **azd-generated output**, not a runtime server setting. `REQUESTED_SCOPE` in the guides is a test convention, not a setting read by the server. For automatic registration creation, the deployment module derives tenant/audience and uses `MCP_REQUIRED_SCOPE` when exposing the API scope.

## HTTP endpoints

| Method/path | Authentication | Behavior |
| --- | --- | --- |
| `POST /mcp` | Delegated bearer token and required scope | Stateless Streamable HTTP MCP request |
| `GET /mcp`, `DELETE /mcp` | Not checked | 405 with `Allow: POST`; no SSE stream/session teardown |
| `GET /healthz` | Public | Liveness JSON; does not prove Entra authentication works |
| `GET /.well-known/oauth-protected-resource` | Public | Resource metadata and tenant authority |

Authenticate before sending MCP JSON. Missing/invalid tokens return 401 and a discovery challenge; a valid token lacking the scope returns 403. The app authenticates before body parsing. Accepted MCP requests use `Content-Type: application/json` and `Accept: application/json, text/event-stream`.

## OAuth client integration

Configure either demo with the shared Web-client ID, Entra tenant authority, registered callback URI, **full exposed scope**, and MCP endpoint using [shared OAuth setup](../../clients/docs/oauth-setup.md). The clients use distinct Microsoft 365 app GUIDs and auth configs; Cowork references its auth config in `manifest.json`, while the declarative agent references it in `ai-plugin.json`. The API does not handle callbacks or issue tokens.

Protected-resource metadata advertises the public base URL and tenant authority. **Current limitation:** `scopes_supported` is constructed as `<first configured audience>/<required scope>` in [src/app.ts](../src/app.ts). With the normal bare-GUID audience this is not the full `api://<api-app-id>/mcp.invoke` scope. It also does not represent all audience values or a custom Application ID URI.

Use the scope from **Expose an API** explicitly; do not promise discovery-only compatibility with every MCP client. The repository does not implement dynamic client registration or a browser CORS configuration. A client expecting those features needs separate integration work. Do not change the server's audience to a scope URI merely to change metadata.

## Security notes

- Tokens are verified on each MCP request; there is no persistent MCP session carrying authentication forward.
- Signature verification uses the tenant JWKS and RS256 with issuer/audience/time checks. The delegated permission comes from `scp`, not an application `roles` claim.
- `whoami` exposes only allow-listed claims, not raw tokens, groups, or arbitrary payload fields. Names/usernames/IDs may still be personal data.
- Keep issuer/JWKS overrides under trusted configuration control. Never expand audiences to include unrelated APIs to bypass authentication failures.
- Use HTTPS for externally reachable deployments; Azure ingress terminates TLS. Configure `PUBLIC_BASE_URL` correctly when using a reverse proxy/custom domain.
- Never put tokens or secrets in source, shell history, screenshots, or third-party token decoders. The API validator needs no secret; the shared Copilot Web client's secret belongs in the token store, not server or ATK configuration. Follow tenant policy for consent and least-privilege deployment access.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Startup reports missing configuration | Real tenant/audience values in `.env` or process environment; exported variables take precedence over `.env` |
| 401 `invalid_request` | `Authorization: Bearer <access-token>` header on every POST |
| 401 `invalid_token` | Token expiry, API v2 setting, tenant issuer, bare API-ID audience, trusted signing key; not a Graph/ID token |
| 403 `insufficient_scope` | `scp` contains the short configured scope; request the API's full exposed scope and arrange consent |
| Azure CLI cannot obtain a token | Correct tenant, exposed scope, Azure CLI preauthorization/tenant policy; your PKCE client's grant is not Azure CLI's grant |
| Redirect mismatch | Actual client callback is registered on the correct platform; this server has no callback route |
| Metadata has wrong public URL | `PUBLIC_BASE_URL` is the externally reachable base URL, not the MCP path |
| Client cannot use metadata's advertised scope | Current scope-format limitation above; configure the full exposed scope explicitly |
| Local container unreachable | Bind to `0.0.0.0` inside the container and publish the port; the local `.env` may override the image default |
| Azure changes have no effect | Correct selected azd environment; `azd provision` for parameter/config changes, `azd deploy` for image changes |
| First Azure request is slow | Scale-to-zero cold start; retry after startup. Minimum replicas can be changed in Bicep if continuous compute is acceptable |
| Newly provisioned revision is unhealthy | Placeholder image until real application deployment completes; inspect build/deploy failures |
| Entra setup/cleanup denied | Directory privileges and `az` tenant sign-in are separate from subscription RBAC and `azd` authentication |

Inspect Azure logs in the Container App's **Log stream** and Log Analytics. Confirm the revision/image, ingress, probes, and non-secret environment settings in the portal. If a registration script fails partway, inventory its printed IDs before retrying; it does not roll back.

## Cleanup

> **Permanent purge is irreversible.** Entra objects are tenant-wide, not contained in the Azure resource group. Never delete shared registrations or target apps by display name alone. Check tenant, application IDs, object IDs, and ownership first.

### Local teardown

Stop a foreground Node.js/watch process with **Ctrl+C**. For the named container from the local guide, run `docker stop entra-auth-mcp-lab-local`; its `--rm` option removes the container. Optionally remove the exact image with `docker image rm entra-auth-mcp-lab:local`.

Stopping the server does not delete registrations. Retain them if reused, or follow [independent registration cleanup](#independently-managed-registrations). Remove only the local `.env` file when you no longer need that configuration; do not assume removal revokes tokens or deletes Entra objects.

### Azure teardown

Select and inspect the intended environment before deleting:

```bash
azd env list
azd env select dev
azd env get-values
```

Confirm `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP`, `CREATE_ENTRA_APP_REGISTRATIONS`, and generated app IDs/ownership tag, or the externally managed client ID. Save the exact IDs needed for verification/recovery before removing local environment state.

To **retain generated registrations**, set the opt-out before teardown:

```bash
azd env set ENTRA_PURGE_ON_DOWN false
```

Otherwise, in `true` mode automatic cleanup defaults to enabled. Sign Azure CLI into the correct Entra tenant so the hook can access Graph, then run:

```bash
az login --tenant "<registration-tenant-id>"
azd down
```

**The Entra hook runs before teardown confirmation.** Generated registrations may already be permanently purged even if you cancel the confirmation or Azure deletion fails. Set `ENTRA_PURGE_ON_DOWN=false` before invoking `azd down` if you need to retain them.

The generated Web client is shared by Cowork and the declarative agent: deleting it prevents future sign-in/token refresh for **both** and may interrupt existing use. The hook removes neither client-specific developer-portal auth configs nor installed Microsoft 365 apps; manage those separately.

Review `azd` confirmation prompts; do not bypass them without verifying the deletion scope. `azd down` removes the Azure resources, including the registry and its images. It is not enough to stop the Container App if you want to remove all deployed resources.

#### Generated registrations: predown cleanup

The Graph Bicep extension does not delete registrations on Azure teardown. This repository's [predown hooks](../infra/hooks/) supply that cleanup **before** `azd down` removes deployment outputs from the environment:

- Run only if `CREATE_ENTRA_APP_REGISTRATIONS` is exactly `true` and `ENTRA_PURGE_ON_DOWN` is not `false`.
- Use generated API/client IDs and `ENTRA_APP_OWNERSHIP_TAG`; refuse missing/mismatched ownership.
- Delete and permanently purge the owned service principal before its application, for both registrations.
- Refuse cleanup if ownership cannot be verified; cancellation or failure of subsequent Azure teardown does not undo a purge.

Provisioning persists the effective creation mode, so the default `true` path satisfies this gate without a separate `azd env set`. An unset flag before a successful provision still causes the hooks to skip cleanup.

Azure CLI and sufficient Entra privileges are required. Hook warnings do **not** fail `azd down`; read the final API/client summary. Successful Azure deletion does not prove every Entra object was purged. Older untagged registrations are intentionally not cleaned up.

If purge fails after soft deletion, the hooks can find owned objects in **Deleted items** on a subsequent `azd down` invocation, provided the required IDs and ownership tag are still available. You can also resolve failures manually using the exact IDs and the [steps below](#independently-managed-registrations). Keep recovery information before teardown, because deployment outputs may be removed. Never remove ownership checks or change creation flags to force deletion of unrelated objects.

With `CREATE_ENTRA_APP_REGISTRATIONS=false`, the hook skips Entra cleanup entirely. Independently managed API/client registrations remain even if their IDs were saved in azd state.

### Independently managed registrations

This applies to local registrations, the Azure `false` path, and deliberate manual recovery. Coordinate with other users/deployments before deleting a shared registration.

**Portal:** In the correct tenant, inspect each **App registration** by application ID and each corresponding **Enterprise application** (service principal). Delete only the intended objects. Check the respective **Deleted applications** views where available; permanent deletion of retained soft-deleted objects may require Microsoft Graph and suitable directory privileges.

**CLI:** Sign in with `az login --tenant "<registration-tenant-id>"`. For the API and any independently managed Copilot client, look up both IDs first. The following Bash example processes **one registration at a time** and stops on failure:

```bash
set -euo pipefail
APP_ID="<application-client-id-to-remove>"

# Inspect identity and record both object IDs before deleting anything.
az ad app show --id "$APP_ID" --query '{appId:appId,id:id,displayName:displayName}' -o json
az ad sp show --id "$APP_ID" --query '{appId:appId,id:id,displayName:displayName}' -o json

# Destructive: run only after confirming the exact objects above.
az ad sp delete --id "$APP_ID"
az ad app delete --id "$APP_ID"
```

If lookup reports an absent service principal, inspect whether it is already soft-deleted or was never created, and omit only its active-delete step. Do not suppress other lookup/permission failures.

Deleting an application is soft deletion, not proof of permanent removal. To inspect retained objects, query Graph using the application ID (substitute the literal ID below for each registration):

```bash
az rest --method GET \
  --uri "https://graph.microsoft.com/v1.0/directory/deletedItems/microsoft.graph.application?%24filter=appId%20eq%20%27<application-client-id>%27&%24select=id,appId,displayName"
az rest --method GET \
  --uri "https://graph.microsoft.com/v1.0/directory/deletedItems/microsoft.graph.servicePrincipal?%24filter=appId%20eq%20%27<application-client-id>%27&%24select=id,appId,displayName"
```

If permanent deletion is intended, confirm the returned **object IDs** against the recorded IDs, then purge the service principal before the application:

```bash
az rest --method DELETE --uri "https://graph.microsoft.com/v1.0/directory/deletedItems/<service-principal-object-id>"
az rest --method DELETE --uri "https://graph.microsoft.com/v1.0/directory/deletedItems/<application-object-id>"
```

For PowerShell, run each Azure CLI command on one line or use PowerShell backtick continuations, not Bash backslashes. Check `$LASTEXITCODE` after each command and stop if it is nonzero.

Repeat deliberately for each independently managed registration you intend to remove. Do not purge the Microsoft Azure CLI first-party application: optional preauthorization did not make you its owner.

### Verify cleanup and remove local state

In Azure, verify the selected deployment's resource group/resources are absent. In Entra, verify the intended registrations and service principals are absent from active views and, if purge was requested, from Deleted items. A "not found" result is different from a permission/network error; do not treat every CLI failure as successful deletion.

After verification and any recovery, optionally remove only the specific local `.azure/<environment>/` state directory and `.env` you no longer need. Do not remove all environments or the repository. Removing local state alone never deletes remote resources and can lose IDs needed for recovery.
