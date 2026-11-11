# Maintain declarative-agent template releases

[Recommended download setup](../README.md) | [ATK source workflow](from-source.md)

This is a maintainer guide. Users configuring a download do not need to publish a release.

Coordinate new publication after the GitHub repository has been renamed to `Yvand/entra-mcp-identity-lab`. Older releases keep their original assets; this guide describes newly built project-prefixed ZIPs, not a rewrite of historical releases.

## 1. Validate the source template

**Goal:** publish reusable files, not a tenant's configured app.

From `clients/declarative-agent/`:

```bash
npm ci
npm test
npm run package
```

Inspect the [five-file archive](manifest-configuration.md#2-check-the-zip-layout), intentional connection placeholders, and schema validation. Do not commit tenant values, secrets, or generated state.

## 2. Tag the release commit

**Goal:** trigger this client's independent workflow.

After committing/pushing the intended source, run from the repository root:

```bash
git tag releases/declarative-agent/v1.2.3
git push origin releases/declarative-agent/v1.2.3
```

Choose an unused numeric version. [The workflow](../../../.github/workflows/release-agent.yml) validates the complete `releases/declarative-agent/vX.Y.Z` tag: no leading zeros, prereleases, or build suffixes. Cowork tags do not trigger it.

## 3. Review and publish the draft

**Goal:** make the intended template asset available to demo users.

Wait for the workflow to succeed and inspect its **draft** GitHub Release. Check `entra-mcp-identity-lab-declarative-agent-template-<version>.zip`, the version stamped in `manifest.json`, the five-file layout, and setup/release notes. Publish the draft when ready.

The audience is users configuring a demo without a clone or ATK development setup. The asset is an **app-package configuration template**, not a ZIP of the ATK project, a running server, or an install-ready tenant app. Developers use the source checkout.

The workflow stamps the app package version in memory. It does not rewrite source manifests, schema versions, package metadata, Cowork, or the server. It validates/packages offline and needs no Azure/Entra credentials or live MCP endpoint. Only the publish job has `contents: write`; an existing release fails rather than being replaced.

GitHub publication does not register OAuth, provision Azure, install a Microsoft 365 app, publish to a tenant catalog, or submit to the store. Users must complete the documented configuration and installation steps.
