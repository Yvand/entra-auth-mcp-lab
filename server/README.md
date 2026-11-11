# Entra MCP Identity Lab - Server

[Repository overview](../README.md) | [Cowork plugin](../clients/cowork-plugin/README.md) | [Declarative agent](../clients/declarative-agent/README.md)

A small TypeScript [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that validates Microsoft Entra **delegated access tokens** before running tools. It uses Express and stateless Streamable HTTP; clients send a bearer token on every `POST /mcp`.

| Tool | Purpose |
| --- | --- |
| `whoami` | Return an allow-listed set of the signed-in user's identity claims |
| `echo` | Return the message prefixed with that user's subject |

## Recommended: deploy to Azure

**[Follow the Azure deployment walkthrough](docs/azure-deployment.md).** It creates the HTTPS server and Entra registrations with `azd up`. `CREATE_ENTRA_APP_REGISTRATIONS` defaults to `true`, so you do not need to register the API manually.

After deployment, choose the [Cowork plugin](../clients/cowork-plugin/README.md) or [Copilot Chat declarative agent](../clients/declarative-agent/README.md). Reuse the generated **Copilot Web client** (`Entra MCP Identity Lab - Copilot Client - <environment>` by default), identified by `ENTRA_COPILOT_CLIENT_APP_ID`; manually create its secret and client-specific portal auth configs using [shared OAuth setup](../clients/docs/oauth-setup.md). No second Entra client registration is needed.

## Alternative setup paths

- **[Azure with existing registrations](docs/azure-existing-registrations.md):** explicitly set `CREATE_ENTRA_APP_REGISTRATIONS=false` and supply the tenant and API audience.
- **[Local development](docs/local-development.md):** run with Node.js or a local container, without azd.
- **[Manual API registration](docs/entra-app-registrations.md#manual-portal-setup):** for those alternative paths, not a prerequisite for the recommended Azure deployment.

## Reference and development

Run server npm, Docker, and azd commands from **`server/`**.

| Topic | Guide |
| --- | --- |
| IDs, scopes, registration permissions, client types | [Entra app registrations](docs/entra-app-registrations.md) |
| Offline tests and authenticated live checks | [Testing](docs/testing.md) |
| Configuration, endpoints, updates, troubleshooting, cleanup | [Operations](docs/operations.md) |
| Azure, Entra, and client naming conventions | [Project and deployment names](docs/operations.md#project-and-deployment-names) |

The API validates tokens; it does not sign users in, issue tokens, or handle OAuth callbacks. It needs no client secret, database, or MCP session state. App-only tokens cannot replace the required delegated scope.

### Code map

| Path | Responsibility |
| --- | --- |
| `src/config.ts` | Runtime configuration and tenant-derived issuer/JWKS URLs |
| `src/auth.ts` | Token verification, delegated-scope enforcement, safe identity mapping |
| `src/mcp-server.ts` | Request-scoped `whoami` and `echo` tools |
| `src/app.ts`, `src/index.ts` | HTTP endpoints, transport, startup |
| `test/` | Offline authentication, HTTP/MCP, and mocked cleanup-hook tests |
| `.env.example`, `Dockerfile` | Local configuration template and container build |
| `azure.yaml`, `infra/` | Azure deployment, automatic registrations, and ownership-checked cleanup |
