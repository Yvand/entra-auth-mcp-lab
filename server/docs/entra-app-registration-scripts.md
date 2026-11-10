# Create Entra registrations with scripts

[Registration reference and portal alternative](entra-app-registrations.md) | [Local development](local-development.md) | [Azure with existing registrations](azure-existing-registrations.md)

**Goal:** create an API and public desktop/CLI client for an independently implemented local client, also usable with the existing-registration Azure path. These scripts are a **local-development alternative**, not the Cowork Web-client setup. Skip them for the [recommended Azure deployment](azure-deployment.md), which creates the API and a Cowork Web client instead.

## Prerequisites

- Azure CLI and an Entra tenant with [registration and consent privileges](entra-app-registrations.md#permissions-and-client-choices).
- Bash with `uuidgen`, or PowerShell 7+.
- Your actual desktop/CLI client's callback URI; the example is not a callback implemented by this server. For Cowork without a generated Web client, use the [manual Web-client alternative](../../clients/cowork-plugin/docs/manual-web-client.md) instead.

## 1. Sign in and choose a script

**Goal:** create the registrations in the intended directory. Run `az login --tenant "<tenant-id>"`, then choose **one** of the equivalent scripts below. Either can run from any working directory.

## 2. Create the API and calling client

**Goal:** expose a delegated API scope and grant the public client permission to request it. Edit display names, redirect URI, and scope before running.

These are creation scripts, **not idempotent upserts**. Rerunning creates another pair with new IDs. If a command fails, stop, inspect the objects already created, and either complete setup deliberately or [clean up that exact pair](operations.md#independently-managed-registrations). Do not assume a failed script rolled back its changes.

### Bash

Requires Bash and `uuidgen`. Run in a dedicated Bash process; `set -e` stops it on command failure.

```bash
set -euo pipefail

apiDisplayName="simple-mcp-server-api"
clientDisplayName="simple-mcp-server-client"
redirectUri="http://localhost:3000/callback"
scopeName="mcp.invoke"
tenantId=$(az account show --query tenantId -o tsv)

apiAppId=$(az ad app create --display-name "$apiDisplayName" --sign-in-audience AzureADMyOrg --query appId -o tsv)
printf 'Created API app: %s\n' "$apiAppId"
apiObjectId=$(az ad app show --id "$apiAppId" --query id -o tsv)
az ad sp create --id "$apiAppId" >/dev/null
scopeId=$(uuidgen)
identifierUri="api://$apiAppId"

apiPatch=$(cat <<JSON
{
  "identifierUris": ["$identifierUri"],
  "api": {
    "requestedAccessTokenVersion": 2,
    "oauth2PermissionScopes": [{
      "id": "$scopeId", "value": "$scopeName", "type": "User", "isEnabled": true,
      "adminConsentDisplayName": "Invoke MCP tools",
      "adminConsentDescription": "Invoke MCP tools on behalf of the signed-in user.",
      "userConsentDisplayName": "Invoke MCP tools",
      "userConsentDescription": "Invoke MCP tools on your behalf."
    }]
  }
}
JSON
)
az rest --method PATCH --uri "https://graph.microsoft.com/v1.0/applications/$apiObjectId" --body "$apiPatch"

clientAppId=$(az ad app create --display-name "$clientDisplayName" \
  --sign-in-audience AzureADMyOrg --public-client-redirect-uris "$redirectUri" \
  --is-fallback-public-client true --query appId -o tsv)
printf 'Created client app: %s\n' "$clientAppId"
az ad sp create --id "$clientAppId" >/dev/null
az ad app permission add --id "$clientAppId" --api "$apiAppId" --api-permissions "$scopeId=Scope"
az ad app permission admin-consent --id "$clientAppId"

printf '%s\n' "ENTRA_TENANT_ID=$tenantId" "ENTRA_AUDIENCE=$apiAppId" \
  "MCP_REQUIRED_SCOPE=$scopeName" "MCP_CLIENT_ID=$clientAppId" \
  "REQUESTED_SCOPE=$identifierUri/$scopeName"
```

### PowerShell

Use PowerShell 7+. The wrapper checks native Azure CLI exit codes: `$ErrorActionPreference` alone does not make all native command failures terminating. A temporary JSON file avoids native JSON-argument quoting differences.

```powershell
$ErrorActionPreference = "Stop"
function Invoke-Az {
    $output = & az @args
    if ($LASTEXITCODE -ne 0) { throw "Azure CLI failed: az $($args -join ' ')" }
    return $output
}

$apiDisplayName = "simple-mcp-server-api"
$clientDisplayName = "simple-mcp-server-client"
$redirectUri = "http://localhost:3000/callback"
$scopeName = "mcp.invoke"
$tenantId = Invoke-Az account show --query tenantId -o tsv

$apiAppId = Invoke-Az ad app create --display-name $apiDisplayName --sign-in-audience AzureADMyOrg --query appId -o tsv
Write-Host "Created API app: $apiAppId"
$apiObjectId = Invoke-Az ad app show --id $apiAppId --query id -o tsv
Invoke-Az ad sp create --id $apiAppId | Out-Null
$scopeId = [guid]::NewGuid().ToString()
$identifierUri = "api://$apiAppId"
$apiPatch = @{
    identifierUris = @($identifierUri)
    api = @{
        requestedAccessTokenVersion = 2
        oauth2PermissionScopes = @(@{
            id = $scopeId; value = $scopeName; type = "User"; isEnabled = $true
            adminConsentDisplayName = "Invoke MCP tools"
            adminConsentDescription = "Invoke MCP tools on behalf of the signed-in user."
            userConsentDisplayName = "Invoke MCP tools"
            userConsentDescription = "Invoke MCP tools on your behalf."
        })
    }
} | ConvertTo-Json -Depth 10
$patchFile = [IO.Path]::GetTempFileName()
try {
    [IO.File]::WriteAllText($patchFile, $apiPatch)
    Invoke-Az rest --method PATCH --uri "https://graph.microsoft.com/v1.0/applications/$apiObjectId" --body "@$patchFile"
} finally {
    Remove-Item -LiteralPath $patchFile
}

$clientAppId = Invoke-Az ad app create --display-name $clientDisplayName `
    --sign-in-audience AzureADMyOrg --public-client-redirect-uris $redirectUri `
    --is-fallback-public-client true --query appId -o tsv
Write-Host "Created client app: $clientAppId"
Invoke-Az ad sp create --id $clientAppId | Out-Null
Invoke-Az ad app permission add --id $clientAppId --api $apiAppId --api-permissions "$scopeId=Scope"
Invoke-Az ad app permission admin-consent --id $clientAppId

Write-Host "ENTRA_TENANT_ID=$tenantId"
Write-Host "ENTRA_AUDIENCE=$apiAppId"
Write-Host "MCP_REQUIRED_SCOPE=$scopeName"
Write-Host "MCP_CLIENT_ID=$clientAppId"
Write-Host "REQUESTED_SCOPE=$identifierUri/$scopeName"
```

Allow time for directory changes to propagate before consent or token acquisition; investigate failures rather than creating duplicate apps. The printed values are non-secret configuration, but access tokens must not be saved or shared.

## 3. Use the printed values

**Goal:** configure the server and client without mixing their IDs. See the [value mapping](entra-app-registrations.md#understand-the-values).

For local use, return to [local configuration](local-development.md#2-configure-the-server). For Azure, return to [existing-API configuration](azure-existing-registrations.md#2-configure-the-existing-api). Keep the client ID and full requested scope in your client configuration.

For CLI smoke tests, complete the separate [Azure CLI authorization](entra-app-registrations.md#optional-azure-cli-authorization-for-smoke-tests).
