# Entra MCP server and Copilot Cowork plugin

A learning demo with an Entra-protected MCP server and a **Microsoft 365 Copilot Cowork plugin**. The plugin calls `whoami` to identify the signed-in user and `echo` to return their message.

## Recommended: deploy the server, then configure the plugin

1. **[Deploy the server to Azure](server/docs/azure-deployment.md).** Azure Developer CLI (`azd`) deploys the HTTPS endpoint and creates the Entra app registrations automatically. You need an Azure subscription and permission to create registrations and grant consent.
2. **[Download and configure the Cowork plugin](clients/cowork-plugin/README.md).** Download the ZIP from [GitHub Releases](https://github.com/Yvand/entra-oauth-mcp-server/releases), configure its dedicated OAuth client, edit the template, and repackage it with standard ZIP tools.

**The release ZIP is a configuration template, not an install-ready app.** It contains no deployed server or OAuth credentials. The client guide covers the Entra and developer-portal prerequisites before installation.

## Other approaches and reference

| Goal | Guide |
| --- | --- |
| Deploy with existing Entra registrations | [Alternative Azure setup](server/docs/azure-existing-registrations.md) |
| Run or develop the server locally | [Local development](server/docs/local-development.md) |
| Build the plugin from source | [Source packaging](clients/cowork-plugin/docs/from-source.md) |
| Understand the server, configuration, or tests | [Server overview](server/README.md) |
| Publish a plugin template release | [Maintainer release guide](clients/cowork-plugin/docs/releases.md) |
| Use a checkout from before the server directory move | [Existing-checkout migration](server/docs/existing-checkouts.md) |

The server and plugin have independent setup and versioning. Run server commands from `server/` and plugin source commands from `clients/cowork-plugin/`; each guide states its starting directory.
