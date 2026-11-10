# Azure deployment documentation

The maintained deployment instructions are in [docs/azure-deployment.md](../docs/azure-deployment.md).

That guide covers the recommended `azd` workflow with automatic API and shared Copilot Web-client registration creation (the default). Either the Cowork plugin or declarative agent can reuse the client. For `CREATE_ENTRA_APP_REGISTRATIONS=false`, use [existing registrations](../docs/azure-existing-registrations.md). See [testing](../docs/testing.md) for live verification and [operations and cleanup](../docs/operations.md#azure-teardown) for teardown and Entra ownership.
