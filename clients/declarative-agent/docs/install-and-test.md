# Install and test the declarative agent

[Download walkthrough](../README.md) | [ATK source workflow](from-source.md)

**Goal:** install a configured app package into Microsoft 365 Copilot Chat and verify both tools using the consenting account.

## Prerequisites

- A configured [five-file ZIP](manifest-configuration.md#2-check-the-zip-layout) and completed [manual OAuth setup](../../docs/oauth-setup.md).
- An eligible Microsoft 365 work tenant with Copilot access and permission to use agents with actions. Licensing, rollout, and tenant policy can affect availability; this package does not enable them.
- Custom-app upload permission, or an administrator who can upload and assign the agent.

See Microsoft's [Copilot extensibility requirements](https://learn.microsoft.com/en-us/microsoft-365/copilot/extensibility/prerequisites) and [agent deployment guidance](https://learn.microsoft.com/en-us/microsoft-365/copilot/agent-essentials/agent-lifecycle/agent-assign-deploy) for current host requirements.

## 1. Install the configured package

**Goal:** make the agent available to the intended account.

For the download-only path, ask your administrator to upload the **configured ZIP** through the Microsoft 365 admin center's custom-agent upload flow under **Agents > All agents**, then assign/allow it for the intended test users. Follow the [current deployment guidance](https://learn.microsoft.com/en-us/microsoft-365/copilot/agent-essentials/agent-lifecycle/agent-assign-deploy) if navigation changes.

### Alternative: personal testing with ATK CLI

If you already use ATK CLI:

```bash
atk auth login
atk install --file-path "<path-to-your-configured.zip>" --scope Personal
```

Use the correct Microsoft 365 tenant/account and retain returned installation identifiers for later management. The CLI is an optional installation tool, not a prerequisite for configuring the downloaded ZIP.

## 2. Open the agent and test both tools

**Goal:** confirm actual MCP calls use delegated authentication.

Open [Microsoft 365 Copilot](https://m365.cloud.microsoft/chat), find **Entra MCP Agent** (or your chosen name, with `-dev` for the default ATK environment) under **Agents**, and open it. This is not Cowork's Sources & Skills interface.

Ask:

```text
Run the Entra MCP demo and echo "hello from my agent".
```

Complete sign-in/consent when prompted. Confirm `whoami` and `echo` both ran, the identity is your consenting account, and the echo is `<subject>: hello from my agent`.

Without a supplied message, the instructions use `Hello from Microsoft 365 Copilot`. Messages must contain 1-4000 characters; empty or over-length messages should be reported, not truncated.

Disconnect/sign out of the agent's connection (see **Chat settings > Agents** where available) and confirm a new call prompts for authentication. If Cowork is already configured, check it still works: the agent should use its own auth config without changing Cowork's.

The two apps have different Microsoft 365 app GUIDs, but reuse the same Entra Web-client ID by default, so `whoami.clientId` is the same. A successful upload, offline tests, and `/healthz` alone do not prove this flow. Do not publish identity output or tokens.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Package cannot upload | Tenant/Copilot eligibility, custom-app policy, five-file ZIP root, valid JSON/schema versions, own app GUID, icons, and replaced placeholders |
| Agent not listed | Installation/assignment completed for the signed-in account; propagation and tenant policy |
| No tools available | Agent action points to `ai-plugin.json`, runtime is `RemoteMCPServer`, endpoint is reachable HTTPS `/mcp`, dynamic discovery is intact |
| Sign-in/consent fails | Auth config uses the right Web-client ID/secret, callback, tenant endpoints, full delegated API scope, consent, and intended organization restriction |
| Runtime 404 | Auth config base URL matches the MCP endpoint and app restriction is **Any Teams app** |
| 401 | Correct API access token tenant/audience, not a Graph or ID token; see [server troubleshooting](../../../server/docs/operations.md#troubleshooting) |
| 403 | Access token's `scp` includes the server's required short delegated scope |
| Token refresh fails | `offline_access`, refresh/token endpoint, secret expiry and portal rotation |
| First call times out | Azure scale-to-zero cold start; warm the server and retry |
| Toolkit uses old values | Correct `dev` environment and workspace; rebuild after changes; never place an Entra client ID in `MCP_AUTH_CONFIG_ID` |
