# Automation Projection Model

`Automation` turns process templates and live workflow instances into replayable enterprise state for dashboards, ops consoles and audit reconstruction.

## Projection Groups

### `automation_template_projection`

Rebuilds template catalog state for each enterprise root.

- source events:
  - `ProcessTemplateRegistered`
  - `ProcessTemplateStatusUpdated`
- key:
  - `chainKey + rootAddress + enterpriseId + templateId`
- state:
  - template name
  - config URI and digest
  - active flag
  - checkpoint count

### `automation_instance_projection`

Tracks the lifecycle of each instantiated process.

- source events:
  - `ProcessInstantiated`
  - `ProcessCheckpointCompleted`
  - `ProcessOracleAttested`
  - `ProcessAutomated`
  - `ProcessFailed`
  - `ProcessEscalated`
  - `ProcessCancelled`
- key:
  - `chainKey + rootAddress + enterpriseId + instanceId`
- state:
  - template id
  - external reference
  - subject type and subject id
  - current checkpoint index
  - current workflow status
  - last acting operator

### `automation_checkpoint_projection`

Builds per-checkpoint history and completion integrity.

- source events:
  - `ProcessCheckpointCompleted`
  - `ProcessOracleAttested`
- key:
  - `chainKey + rootAddress + enterpriseId + instanceId + checkpointIndex`
- state:
  - checkpoint key
  - evidence digest
  - oracle digest
  - completed by
  - completion time

## Audit and Evidence Binding

Automation projections should be cross-linked with:

- `EvidenceAnchored`
- `EvidenceManifestUpdated`
- `AuditRecordCreated`

That allows the platform to answer:

- what process package supported the execution
- which checkpoint consumed which evidence
- which audit record finalized or escalated the workflow
