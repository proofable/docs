# Verifier JSON Schemas

Request shapes for the public verifier catalog. Guides for people integrating Proofable live under **[Verification](../verification/verifiers)**.

## Source of truth

| Artifact | Role |
| -------- | ---- |
| **`schemas/*.json`** | One JSON Schema per public verifier |
| **`VERIFIERS.json`** | Catalog index; each `inputSchemaPath` is `verifiers/schemas/<id>.json` |

These files mirror the live verifier registry in the Proofable service and update when a verifier ships there. To propose a new public check, see [Propose a verifier](../verification/propose-a-verifier).
