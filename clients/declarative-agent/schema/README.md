# Pinned package schemas

The offline packager validates all three rendered manifests with official
draft-04 schemas. Schema updates are reviewed source changes, not release-time
network requests.

The local `.gitattributes` preserves schema bytes without line-ending conversion
so checksums remain identical in fresh checkouts.

| File | Source | SHA-256 |
| --- | --- | --- |
| `MicrosoftTeams.v1.30.schema.json` | [App manifest v1.30](https://developer.microsoft.com/json-schemas/teams/v1.30/MicrosoftTeams.schema.json) | `dfc85799e94527a16a622988620c82de1f58e790f97001e5e6bbe37fcf6846df` |
| `declarative-agent.v1.9.schema.json` | [Declarative agent v1.9](https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.9/schema.json) | `102abde77894ed0d30c5e097a1b17181a16527865fdcd2f824e2578799abd3a5` |
| `plugin.v2.4.schema.json` | [Plugin v2.4](https://developer.microsoft.com/json-schemas/copilot/plugin/v2.4/schema.json) | `ea3016aa4917e1b714454a6a7be9444f8aa7a1923cba0a42343a6fd234a0eb00` |

These are schema versions, not the agent app's release version. Toolkit and
Microsoft 365 host compatibility still need their own package/live checks.
