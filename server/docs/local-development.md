# Run locally (alternative)

[Project overview](../README.md) | [App registrations](entra-app-registrations.md) | [Testing](testing.md) | [Operations and cleanup](operations.md)

**Goal:** run and develop the server on your machine, without azd. For an HTTPS endpoint ready for either Copilot demo, prefer the [recommended Azure deployment](azure-deployment.md).

## Prerequisites

- A repository checkout, Node.js **24+**, and npm.
- An Entra tenant and API registration; step 1 covers registration if needed.
- Azure CLI for live checks, authorized for the API scope as described in step 1.
- Docker only for the optional container procedure. Offline tests have [separate requirements](testing.md#offline-automated-tests) and need no real registrations.

## 1. Create or reuse the API registration

**Goal:** identify the API your local server protects and the permission the client requests.

Reuse an existing API registration or follow [manual portal setup](entra-app-registrations.md#manual-portal-setup).

Record the [tenant, API ID, and full scope](entra-app-registrations.md#understand-the-values). Complete [Azure CLI authorization](entra-app-registrations.md#optional-azure-cli-authorization-for-smoke-tests) for live checks; it uses Azure CLI's existing registration, so no additional client registration is needed.

For Cowork or the declarative agent with a local HTTPS tunnel, use the [manual Web-client alternative](../../clients/docs/manual-web-client.md), then [shared OAuth setup](../../clients/docs/oauth-setup.md).

## 2. Configure the server

**Goal:** configure token validation for your API. From `server/` (`cd server` from the repository root):

```bash
npm install
cp .env.example .env
```

On PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Edit the resulting file:

```dotenv
ENTRA_TENANT_ID=<directory-tenant-id>
ENTRA_AUDIENCE=<api-application-client-id>
MCP_REQUIRED_SCOPE=mcp.invoke
PORT=3000
HOST=127.0.0.1
PUBLIC_BASE_URL=http://127.0.0.1:3000
```

Replace the placeholders with real values; the zero GUIDs in the sample are not usable registration settings. `ENTRA_AUDIENCE` is the **API ID**, not the caller's client ID and not the `api://` URI.

Use the short scope you exposed. The full scope belongs in your test terminal for token acquisition, not `.env`.

`dotenv` loads `.env` when the server starts. Existing process environment variables take precedence, so check for stale exported values if behavior differs from the file. `.env` is git-ignored; do not commit it or put access tokens in it.

Leave issuer/JWKS overrides unset normally; see the [configuration reference](operations.md#server-configuration) for advanced settings.

## 3. Start the server

**Goal:** keep the server running while you exercise it from a second terminal. For watch mode:

```bash
npm run dev
```

Or compile and run the production bundle:

```bash
npm run build
npm start
```

The default listener is `http://127.0.0.1:3000`. Keep this terminal running while you continue to step 4.

Keep `HOST=127.0.0.1` for loopback-only development. Binding to `0.0.0.0` exposes the listener on all interfaces; configure network access and TLS appropriately before making it reachable remotely.

## 4. Verify and stop

**Goal:** check real authentication and cleanly end the local run.

Use the [live verification steps](testing.md#live-verification-local-or-azure) from a second terminal. Automated tests are a [separate offline procedure](testing.md#offline-automated-tests).

Stop foreground watch/production startup with **Ctrl+C**. Entra registrations remain until you deliberately [remove them](operations.md#independently-managed-registrations).

## Alternative: local container

**Goal:** run the same server in Docker instead of Node.js directly. Complete steps 1 and 2, then use these commands from `server/` instead of step 3:

```bash
docker build -t entra-auth-mcp-lab:local .
docker run --rm --name entra-auth-mcp-lab-local \
  -p 127.0.0.1:3000:3000 --env-file .env -e HOST=0.0.0.0 \
  entra-auth-mcp-lab:local
```

Run the same Docker command on PowerShell as one line (Bash backslashes are not PowerShell continuations). The explicit `HOST` override is necessary because the copied `.env` uses loopback, which would otherwise bind only inside the container. The host port remains loopback-only. The image runs as a non-root user.

Verify using step 4. To stop, use `docker stop entra-auth-mcp-lab-local`; `--rm` removes the stopped container, not its image or Entra registrations.
