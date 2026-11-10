# Copilot instructions for `entra-oauth-mcp-server`

## Local setup and validation

Use the root README for navigation. The recommended paths are `server/docs/azure-deployment.md` (automatic Entra registrations) and `clients/cowork-plugin/README.md` (configure a downloaded release template with ZIP tools). Alternatives live in `server/docs/azure-existing-registrations.md`, `server/docs/local-development.md`, and `clients/cowork-plugin/docs/from-source.md`. Run the following development commands from `server/` (`cd server` from the repository root). See `server/docs/entra-app-registrations.md` for ID/scope and portal reference, and `server/docs/testing.md` for offline versus live tests.

- Install dependencies: `npm install`
- Create local env from the sample: `cp .env.example .env`
- Start in watch mode: `npm run dev`
- Build the production bundle: `npm run build`
- Run the full test suite: `npm test`
- Run a single test file: `npx vitest run test/auth.test.ts`
- Run a single test name: `npx vitest run test/auth.test.ts -t "authenticate"`
- Type-check the project: `npm run typecheck`

There is no dedicated lint script in `package.json`; prefer `npm run typecheck` and the Vitest suite for validation when making changes.

## High-level architecture

The `server/` directory is a small TypeScript HTTP server for an OAuth-protected Model Context Protocol endpoint. Paths in the following list are relative to `server/`.

- `src/config.ts`: loads required environment values (`ENTRA_TENANT_ID`, `ENTRA_AUDIENCE`) and the optional delegated scope (`MCP_REQUIRED_SCOPE`, default `mcp.invoke`), validates configuration, and derives the Entra issuer and JWKS URLs.
- `src/auth.ts`: validates bearer tokens against the tenant JWKS, checks issuer/audience/expiry, extracts the identity, and enforces the required delegated scope from the `scp` claim.
- `src/mcp-server.ts`: creates an MCP server instance for each authenticated request and registers the tools `whoami` and `echo`.
- `src/app.ts`: wires Express + the stateless `StreamableHTTPServerTransport`, enforces auth before body parsing, and exposes `/mcp`, `/healthz`, and the OAuth protected-resource metadata endpoint.
- `src/index.ts`: bootstraps the app and logs the expected issuer, audience, and scope.
- `test/*.test.ts`: verifies token validation, config handling, and authenticated HTTP/MCP request flows end-to-end.

The app is intentionally designed around a single, simple pattern: authenticate the request, then create a request-scoped MCP server bound to the caller's token identity.

## Repository-specific conventions

- Treat this as an Entra-protected MCP API, not a generic Express API. Every call to `/mcp` must carry a valid bearer token and the configured delegated scope.
- `ENTRA_AUDIENCE` may contain multiple comma-separated values. Keep it aligned with the actual `aud` claim in issued tokens; do not assume only the Application ID URI form is valid.
- `scp` is the delegated scope source. The code expects a space-delimited scope string and throws `insufficient_scope` when the required delegated permission is absent.
- The `whoami` tool intentionally exposes only a safe, minimal set of claims (`sub`, `oid`, `tid`, `azp`/`appid`, `preferred_username`/`upn`, `name`, `scp`, etc.) and deliberately drops other payload data.
- The app uses stateless MCP transport and rejects non-POST methods on `/mcp`; no session state should be introduced without updating both the auth flow and the tests.
- The `PUBLIC_BASE_URL` value is used in OAuth metadata and `WWW-Authenticate` challenge headers; set it correctly when behind a reverse proxy or non-local hostname.
- `CREATE_ENTRA_APP_REGISTRATIONS` defaults to `true` in Bicep and azd mapping. Persist its effective value for predown hooks; explicit `false` uses independently managed registrations. Do not treat toggling the flag as a registration migration.
- Follow the repo's testing style: create local JWT test keys with `jose` for auth validation tests instead of mocking external Entra behavior.

## Required configuration

Before running the server locally, ensure these values are present in `.env` or the process environment:

- `ENTRA_TENANT_ID`
- `ENTRA_AUDIENCE`

`MCP_REQUIRED_SCOPE` defaults to `mcp.invoke`; set it explicitly if your registration exposes another scope. The project also supports optional overrides for custom issuers/JWKS endpoints and the public base URL, as shown in `.env.example`.

Offline automated tests provide their own configuration and local signing keys; they do not require `.env`, real Entra registrations, or an existing local/Azure deployment. Hook tests mock Azure CLI and require Bash, with PowerShell cases included when `pwsh` is available.

## Copilot Cowork plugin

`clients/cowork-plugin/appPackage/` contains a unified app manifest v1.29, icons, one skill calling both `whoami` and `echo`, and an OAuthPluginVault MCP connector. It is a configuration template: never embed tokens or client secrets. Keep shared OAuth, manifest, and installation instructions in `clients/cowork-plugin/docs/`. Automatic Azure deployment creates the Cowork Web client (`simple-mcp-server-client-cowork` by default); reuse `ENTRA_COWORK_CLIENT_APP_ID` and keep secret creation/developer-portal registration manual. Preserve its stable Graph identity key and cleanup ownership. Local and Azure live checks use Azure CLI's own registration, authorized for the API scope; no additional client registration is needed.

Run `npm ci`, `npm test`, and `npm run package` from `clients/cowork-plugin/` for offline validation and template packaging. Use `npm run package -- --configured` only after replacing placeholders. `.github/workflows/release-plugin.yml` releases template ZIPs for strict `releases/cowork-plugin/vX.Y.Z` tags; versions are stamped in memory, not into the source manifest or server.
