# Maintain plugin template releases

[Recommended download setup](../README.md) | [Source packaging](from-source.md)

This guide is for maintainers. Users configuring an existing release do not need to publish anything.

## Prerequisites

A tested, committed source template, permission to push tags, and GitHub Actions permission to create repository releases. Do not customize the public template with a tenant endpoint or credentials.

## 1. Validate the template

**Goal:** ensure the release packages the intended reusable files.

Follow [source validation](from-source.md#1-validate-the-shipped-template), then run `npm run package` from `clients/cowork-plugin/`. Inspect the template ZIP before committing the desired changes.

## 2. Tag the release commit

**Goal:** trigger the existing release workflow for a canonical numeric version. From the repository root, after committing and pushing the desired files:

```bash
git tag releases/cowork-plugin/v1.2.3
git push origin releases/cowork-plugin/v1.2.3
```

Substitute an unused version. [The workflow](../../../.github/workflows/release-plugin.yml) accepts only `releases/cowork-plugin/vX.Y.Z`: no leading zeros, prereleases, or build suffixes.

## 3. Verify the published asset

**Goal:** confirm visitors can download the expected template.

Wait for the workflow to succeed and inspect the GitHub Release asset `entra-mcp-cowork-plugin-template-<version>.zip`. Check its [four-file layout](manifest-configuration.md#3-check-the-package-layout), manifest version, and intentional placeholders.

The workflow runs tests/validation and stamps the release version into the packaged manifest **in memory**. It does not edit the source manifest, plugin package metadata, or server version. The built-in GitHub token has `contents: write` only in the publish job; no Azure/Entra secrets or deployment-specific variables are needed. An existing release makes publication fail rather than replacing assets.

The result remains a **configuration template**. It does not deploy Azure resources, register OAuth clients, install tenant apps, or submit to the Microsoft 365 store.
