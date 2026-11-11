# Entra MCP Identity Lab

A learning demo with an Entra-protected MCP server and two **Microsoft 365 Copilot** clients: a **Cowork plugin** and an **ATK declarative agent for Copilot Chat**. Both call `whoami` to identify the signed-in user and `echo` to return their message.

## Recommended: deploy the server, then choose a client

1. **[Deploy the server to Azure](server/docs/azure-deployment.md).** Azure Developer CLI (`azd`) deploys the HTTPS endpoint and creates the API and shared Copilot Web-client registrations. You need an Azure subscription and permission to create registrations and grant consent.
2. **Choose a client below.** Download its ZIP from [GitHub Releases](https://github.com/Yvand/entra-mcp-identity-lab/releases), complete manual [OAuth setup](clients/docs/oauth-setup.md), then edit and repackage with standard ZIP tools. Neither client requires the other.

| Experience | Recommended client guide |
| --- | --- |
| Copilot Cowork | [Download and configure the plugin](clients/cowork-plugin/README.md) |
| Microsoft 365 Copilot Chat | [Download and configure the declarative agent](clients/declarative-agent/README.md) |

**Release ZIPs are configuration templates, not install-ready apps.** They include no server or OAuth credentials. Download users need no clone, Node.js, npm, or ATK; developers can use the separate source workflows.

Both clients reuse `ENTRA_COPILOT_CLIENT_APP_ID` (`Entra MCP Identity Lab - Copilot Client - <environment>` by default), with client-specific auth configs.

Azure resources, Entra applications and enterprise applications, and both clients share the [project naming conventions](server/docs/operations.md#project-and-deployment-names). Length-constrained names use documented short forms.

## Other approaches and reference

### Server

| Goal | Guide |
| --- | --- |
| Deploy with existing Entra registrations | [Alternative Azure setup](server/docs/azure-existing-registrations.md) |
| Run or develop the server locally | [Local development](server/docs/local-development.md) |
| Understand the server, configuration, or tests | [Server overview](server/README.md) |

### Clients

#### Cowork plugin

| Goal | Guide |
| --- | --- |
| Build the Cowork plugin from source | [Cowork source packaging](clients/cowork-plugin/docs/from-source.md) |
| Publish a Cowork template release | [Cowork release guide](clients/cowork-plugin/docs/releases.md) |

#### Copilot Chat declarative agent

| Goal | Guide |
| --- | --- |
| Develop the declarative agent with ATK | [Agent source workflow](clients/declarative-agent/docs/from-source.md) |
| Publish an agent template release | [Agent release guide](clients/declarative-agent/docs/releases.md) |

The server and both clients have independent setup and versioning. Run server commands from `server/`, and each client's source commands from its own directory; each guide states its starting directory.
