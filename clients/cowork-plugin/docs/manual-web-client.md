# Create a Cowork Web client manually (alternative)

[Recommended plugin setup](../README.md) | [Shared OAuth setup](oauth-setup.md)

**Goal:** prepare a Web client when no generated/suitable client exists. For the recommended Azure path, reuse `ENTRA_COPILOT_CLIENT_APP_ID`; do not create another registration.

## Prerequisites

Use the [shared manual Web-client guide](../../docs/manual-web-client.md#prerequisites) for permission and API prerequisites.

## 1. Register the Web application

Follow [register the Web application](../../docs/manual-web-client.md#1-register-the-web-application). Both demos use the same Teams callback and can reuse this client.

## 2. Grant delegated API access

Follow [grant delegated API access](../../docs/manual-web-client.md#2-grant-delegated-api-access). Consent for the API scope is required.

## 3. Complete the shared OAuth procedure

Return to [Cowork OAuth setup](oauth-setup.md#2-create-the-client-secret), using your independently managed Web-client ID.
