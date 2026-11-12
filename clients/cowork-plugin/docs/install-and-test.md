# Install and test the configured plugin

[Download walkthrough](../README.md) | [Source packaging](from-source.md)

**Goal:** install a configured ZIP and verify both tools with a real signed-in account. Upload success alone does not prove OAuth works.

## Prerequisites

- A configured ZIP with the [required layout](manifest-configuration.md#3-check-the-package-layout) and completed [OAuth setup](oauth-setup.md).
- An eligible Microsoft 365 work tenant with **Copilot Cowork** available. Licensing, rollout availability, custom-app policy, and administrator approval can affect installation; this package does not enable Cowork.
- Permission to upload a custom app, or an administrator who can do it for you.

See Microsoft's [Cowork plugin guide](https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugin-development#step-7-test) for current installation behavior. Custom plugins are not supported on Cowork mobile. Purview Information Barriers can block plugin/skill uploads.

## 1. Upload the configured package

**Goal:** make your plugin available in the intended tenant.

For administrator upload, open **Microsoft 365 admin center > Manage apps > Upload custom app**, then the ellipsis (**...**) > **Add agent** and select your configured ZIP. Follow the [current tenant-upload instructions](https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugin-development#step-8-publish-to-your-tenant) if the UI changes.

After approval/availability, find **Entra Auth MCP Lab - Cowork** under **Cowork > Sources & Skills > Plugins > Discover** (or your chosen display name).

### Alternative: personal testing with Agents Toolkit CLI

If you already use Microsoft 365 Agents Toolkit CLI (`atk`), run:

```bash
atk auth login
atk install --file-path "<path-to-your-configured.zip>" --scope Personal
```

Use an absolute path or a path relative to your current terminal directory. Save the returned `TitleId`/`AppId` for updates or removal. CLI installation is a separate optional prerequisite; see Microsoft's [CLI setup](https://learn.microsoft.com/en-us/copilot/cowork/cowork-plugin-development#step-7-test). Standard ZIP packaging does not require this CLI or npm.

## 2. Enable the plugin and sign in

**Goal:** establish delegated authorization for the account that will call the tools.

Enable the plugin in Cowork, then complete connector sign-in and consent when prompted. If admin approval is required, resolve it before testing. Do not paste raw tokens into prompts.

## 3. Verify both tools

**Goal:** check that real tool calls use the consenting identity.

Ask Cowork to run the Entra Auth MCP Lab and echo a short message. The skill calls `whoami` with `{}`, then `echo` with your message. Confirm that both calls ran, the identity matches your account, and the returned echo is `<subject>: <your message>`.

Without an explicit message the skill uses `Hello from Microsoft 365 Copilot`. Messages must contain 1-4000 characters; over-length input is reported, not truncated.

Disconnect/sign out and confirm the host asks for authentication again. Offline tests, a successful upload, or `/healthz` are not substitutes for this check. Identity output can contain personal data; do not publish it.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| Package cannot upload | Cowork availability, custom-app policy, manifest version, ZIP root layout, icons, and unreplaced metadata |
| Connector is missing | Plugin enabled in Cowork, reachable HTTPS endpoint, tenant approval; not Copilot Chat or mobile |
| Sign-in/consent fails | Portal Client ID matches the shared Web client (`ENTRA_COPILOT_CLIENT_APP_ID` for automatic deployment), Web callback, secret expiry, API delegated permission, full scope, and required consent |
| Runtime 404 | Endpoint/base-URL matching and **Any Teams app** usage restriction in the OAuth registration |
| 401 | API access token for this tenant/audience, not a Graph or ID token; see [server troubleshooting](../../../server/docs/operations.md#troubleshooting) |
| 403 | Token's `scp` includes the server's required delegated scope |
| Tokens stop refreshing | `offline_access`, token/refresh endpoints, and secret rotation in the token store |
| First call times out | Azure scale-to-zero cold start; warm the server and retry after startup |
