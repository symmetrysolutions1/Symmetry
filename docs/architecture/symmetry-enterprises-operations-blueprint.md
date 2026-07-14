# Symmetry Enterprises

> Legacy operating blueprint. Use `root-per-company-architecture.md` and the current runbooks for deployment decisions. Historical tenant terminology below does not imply shared on-chain tenancy.

## Operations Blueprint

### Objective

This document defines how a real enterprise operates inside Symmetry Enterprises across all service combinations:

1. `VotoID`
2. `Smart Process Automation`
3. `EUDR Certification Infrastructure`

The design assumes a shared protocol core with:

- `EnterpriseRegistryFacet`
- `AccessControlFacet`
- `CorporateIdentityFacet`

These three modules are the minimum operational foundation because every later service depends on:

- enterprise tenancy
- scoped permissions
- wallet and signer identity

---

## 1. Enterprise Onboarding

### 1.1 Enterprise Registration Flow

Operational sequence:

1. Symmetry operations approves commercial onboarding off-chain.
2. KYB and legal review package is created off-chain.
3. A protocol admin registers the enterprise on-chain in `EnterpriseRegistryFacet`.
4. The enterprise is assigned:
   - `enterpriseId`
   - legal name
   - jurisdiction code
   - enterprise admin wallet
   - enterprise multisig
   - enabled service bitmask
   - metadata URI
5. Core enterprise roles are granted through `AccessControlFacet`.
6. The corporate identity record is created in `CorporateIdentityFacet`.
7. Enterprise wallets, delegated signers, and internal operators are linked.

### 1.2 Organizational Identity

Each company should have one canonical organizational identity domain:

- one `enterpriseId`
- one legal identity record
- one governance/admin plane
- one evidence namespace
- one service entitlement map

That identity can later connect:

- board governance
- internal workflows
- exporter and producer roles
- compliance officers
- external auditors

### 1.3 Wallet Model

Recommended wallet layers:

- `Enterprise Multisig`
  For high-privilege actions, upgrades, certificate revocations, role recovery, board setup changes.

- `Enterprise Admin Wallet`
  For day-to-day administration and role assignment.

- `Department Operator Wallets`
  Used by compliance teams, operations teams, legal teams, board secretaries.

- `Delegated Signers`
  Time-bound operational signers for specific service actions.

### 1.4 Roles and Permissions

Recommended operational roles:

- `ENTERPRISE_ADMIN_ROLE`
- `IDENTITY_ADMIN_ROLE`
- `ENTERPRISE_OPERATOR_ROLE`
- `ENTERPRISE_AUDITOR_ROLE`
- future service roles:
  - `BOARD_ADMIN_ROLE`
  - `BOARD_MEMBER_ROLE`
  - `PROCESS_MANAGER_ROLE`
  - `PROCESS_APPROVER_ROLE`
  - `EXPORTER_ROLE`
  - `PRODUCER_ROLE`
  - `EUDR_VERIFIER_ROLE`

### 1.5 Credentials and Internal Audit

Each enterprise should maintain:

- identity credential bundle
- signatory registry
- service subscription record
- operational audit timeline
- evidence package roots

Internal audit should be able to reconstruct:

- who was allowed to act
- when authority was granted
- what service was enabled
- what action was executed
- what evidence backed that action

---

## 2. Service 1: VotoID

### 2.1 Operational Flow

1. Enterprise admin enables `VotoID`.
2. Board configuration is defined.
3. Board members and chair are registered.
4. Proposal is created with voting rules.
5. Snapshot of eligible voters is fixed.
6. Members sign and cast votes.
7. Quorum is computed.
8. Proposal is finalized.
9. If executable, execution record is anchored.
10. Audit and evidence views are updated off-chain.

### 2.2 On-Chain Responsibilities

- board registry
- proposal creation
- voter eligibility snapshot root
- signed vote recording
- quorum validation
- result finalization
- execution marker

### 2.3 Off-Chain Responsibilities

- agenda drafting
- document attachment
- notifications
- meeting minutes
- vote UX and signature orchestration
- board analytics

### 2.4 Contracts Involved

- `EnterpriseRegistryFacet`
- `AccessControlFacet`
- `CorporateIdentityFacet`
- future `VotoIDFacet`
- future `EvidenceFacet`
- future `AuditFacet`

### 2.5 VotoID Data Stored

On-chain:

- enterprise id
- proposal id
- voter snapshot hash
- vote receipts
- quorum thresholds
- proposal status
- execution status

Off-chain:

- proposal documents
- attachments
- meeting agenda
- legal references
- signed PDF minutes

### 2.6 Key Events

- `BoardConfigured`
- `BoardMemberAdded`
- `VoteCreated`
- `VoteCast`
- `QuorumReached`
- `VoteClosed`
- `VoteExecuted`

### 2.7 Verification Model

To verify a vote:

1. confirm `enterpriseId`
2. confirm proposal metadata hash
3. confirm voter snapshot root
4. confirm signer eligibility
5. confirm individual vote receipts
6. confirm tally and quorum rule
7. confirm final execution event

### 2.8 Edge Cases

- duplicate vote attempts
- voter removed after snapshot
- proposal cancellation before deadline
- quorum not reached
- delegated voting expiry
- smart wallet signatures via `ERC-1271`

### 2.9 Risks and Attacks

- replay of off-chain signatures
- board admin tampering before snapshot freeze
- quorum misconfiguration
- unauthorized execution
- selective off-chain notification abuse

### 2.10 VotoID Testing

- snapshot immutability tests
- proposal lifecycle tests
- quorum threshold tests
- EIP-712 signature tests
- smart wallet signature tests
- replay protection tests
- admin privilege boundary tests

---

## 3. Service 2: Smart Process Automation

### 3.1 Operational Purpose

This service automates enterprise workflows with verifiable checkpoints.

Examples:

- procurement approvals
- supplier onboarding
- policy acknowledgements
- payment releases
- export pre-clearance
- document approval chains

### 3.2 Operational Flow

1. Enterprise enables automation service.
2. A process template is created.
3. Required roles and checkpoints are defined.
4. Trigger source is registered:
   - manual
   - API
   - ERP event
   - oracle event
5. Process instance starts.
6. Participants approve or fulfill stages.
7. Evidence is attached at each stage.
8. Final action executes if all conditions are true.
9. Audit projection records the complete path.

### 3.3 On-Chain Responsibilities

- template hash registration
- workflow state transitions
- critical checkpoint approvals
- deterministic conditions
- execution flags
- oracle attestation references

### 3.4 Off-Chain Responsibilities

- ERP ingestion
- document processing
- validation engines
- timers and reminders
- retry orchestration
- external system callbacks

### 3.5 Contracts Involved

- `EnterpriseRegistryFacet`
- `AccessControlFacet`
- `CorporateIdentityFacet`
- future `AutomationFacet`
- future `OracleFacet`
- future `EvidenceFacet`
- future `AuditFacet`

### 3.6 State Model

Suggested workflow states:

- `DRAFT`
- `ACTIVE`
- `WAITING_APPROVAL`
- `WAITING_ORACLE`
- `EXECUTABLE`
- `EXECUTED`
- `FAILED`
- `ESCALATED`
- `CANCELLED`

### 3.7 Key Events

- `ProcessTemplateRegistered`
- `ProcessInstantiated`
- `ProcessCheckpointCompleted`
- `ProcessEscalated`
- `ProcessAutomated`
- `ProcessFailed`

### 3.8 Signatures and Triggers

Supported execution inputs:

- direct operator tx
- relayed meta-tx
- smart wallet signatures
- oracle attestations
- ERP-driven off-chain commands

### 3.9 Monitoring

Must monitor:

- stuck workflows
- repeated failures
- missing approvals
- oracle latency
- callback failures
- unauthorized attempts

### 3.10 Rollback and Recovery

Rollback should not mean state deletion. It should mean:

- compensating workflow
- marked failure state
- superseding action
- audit-preserved correction

Recovery tools:

- re-drive failed off-chain jobs
- manual override by enterprise multisig for approved cases
- re-emit downstream events from replay tools

### 3.11 Testing

- workflow transition tests
- permission boundary tests
- oracle dependency tests
- ERP integration mocks
- failure recovery tests
- event consistency tests
- compensating-action tests

---

## 4. Service 3: EUDR Certification

### 4.1 Operational Flow

1. Exporter enterprise is onboarded.
2. Producer and supply actors are registered.
3. Geo parcels and origin metadata are linked.
4. Lots and batches are created.
5. Custody transitions are recorded.
6. Evidence is uploaded and hashed.
7. Compliance engine evaluates dossier.
8. Risk score is computed.
9. Verifier reviews exceptions.
10. Certificate is issued or rejected.
11. Digital passport and QR verification artifact are generated.

### 4.2 On-Chain Responsibilities

- actor registration anchors
- batch and lineage identifiers
- custody chain records
- evidence roots
- verifier attestations
- certificate issuance state
- revocation state

### 4.3 Off-Chain Responsibilities

- satellite and GIS validation
- document normalization
- due diligence workflow
- risk scoring
- passport generation
- QR payload generation
- regulatory report packaging

### 4.4 Contracts Involved

- `EnterpriseRegistryFacet`
- `AccessControlFacet`
- `CorporateIdentityFacet`
- future `TraceabilityFacet`
- future `ComplianceFacet`
- future `CertificationFacet`
- future `CustodyFacet`
- future `EvidenceFacet`
- future `OracleFacet`
- future `AuditFacet`

### 4.5 Metadata and Evidence

Anchored items:

- source declarations
- parcel hashes
- geojson hashes
- due diligence statements
- transport documents
- exporter attestations
- verifier report hashes

### 4.6 Key Events

- `SourceRegistered`
- `BatchCreated`
- `CustodyTransferred`
- `ComplianceValidated`
- `CertificateIssued`
- `CertificateRevoked`

### 4.7 Regulatory Scenarios

Must support:

- full approval
- conditional approval with outstanding issues
- rejection due to missing evidence
- rejection due to risk threshold
- revocation after new evidence
- certificate supersession after corrected dossier

### 4.8 Inconsistencies to Detect

- lot lineage mismatch
- duplicate batch identity
- parcel mismatch vs shipment
- stale verifier data
- custody gap
- unverifiable document references

### 4.9 Critical Testing

- custody chain continuity
- evidence-to-batch linkage
- certificate revocation
- verifier signature validity
- risk threshold enforcement
- duplicate submission handling

---

## 5. Combined Services

### 5.1 Service 1 + 2

Use case:

- board approves an action
- approved resolution triggers a workflow

Shared modules:

- enterprise identity
- signer management
- audit trail
- approvals and execution logs

Risk:

- board result incorrectly mapped to workflow trigger

### 5.2 Service 1 + 3

Use case:

- board approves high-value export decisions or compliance acceptance

Shared modules:

- board evidence
- compliance audit records
- enterprise signers

Risk:

- governance action executed on stale compliance dossier

### 5.3 Service 2 + 3

Use case:

- EUDR validation pipeline becomes an automated workflow

Shared modules:

- evidence engine
- oracle attestations
- process checkpoints
- audit records

Risk:

- automated certificate issuance before all compliance conditions are final

### 5.4 Service 1 + 2 + 3

Use case:

- board approves export policy
- process automation runs compliance pipeline
- EUDR certificate is issued under the same tenant identity

This is the strongest enterprise configuration because it reuses:

- one enterprise identity
- one signer registry
- one permission plane
- one evidence namespace
- one audit history

Cross-service risks:

- privilege inheritance mistakes
- evidence reused in wrong domain
- stale permissions affecting multiple services
- event correlation errors

---

## 6. Testing and Audit Matrix

### 6.1 Core Modules

Audit:

- `EnterpriseRegistryFacet`
- `AccessControlFacet`
- `CorporateIdentityFacet`

Test:

- tenant isolation
- admin rotation
- signer binding
- delegate expiry
- role escalation prevention

### 6.2 VotoID

Audit:

- proposal lifecycle
- voter snapshot
- signature validation
- tally and execution path

Formal verification candidate:

- quorum and execution invariants

### 6.3 Automation

Audit:

- state machine integrity
- checkpoint authorization
- oracle dependency handling
- failure recovery

Formal verification candidate:

- irreversible state transitions

### 6.4 EUDR

Audit:

- custody continuity
- certificate validity transitions
- verifier authority
- evidence linkage integrity

Formal verification candidate:

- certificate status invariants
- custody chain constraints

### 6.5 Combined Services

Audit:

- cross-service event consistency
- shared-role contamination
- evidence namespace correctness
- service entitlement gating

---

## 7. Events and Traceability

### 7.1 Event Map

Core:

- `EnterpriseOnboarded`
- `EnterpriseServiceConfigurationUpdated`
- `EnterpriseAdminUpdated`
- `CorporateIdentityCreated`
- `EnterpriseWalletBound`
- `AuthorizedSignerAdded`

Governance:

- `VoteCreated`
- `VoteCast`
- `VoteExecuted`

Automation:

- `ProcessInstantiated`
- `ProcessCheckpointCompleted`
- `ProcessAutomated`

Compliance:

- `ComplianceValidated`
- `CertificateIssued`
- `CustodyTransferred`

### 7.2 Event Sourcing

Events are the historical source for:

- dashboards
- audit packages
- enterprise timelines
- regulator reports
- service analytics

### 7.3 Observability

Must include:

- chain listener lag
- relayer status
- failed signature validations
- failed oracle submissions
- failed certificate issuance attempts

### 7.4 Historical Reconstruction

Any enterprise should be reconstructible from:

1. onboarding event
2. role and signer events
3. service enablement events
4. service-specific action events
5. evidence and audit links

---

## 8. Operational Roadmap

### 8.1 What to Launch First

Launch order recommendation:

1. enterprise onboarding core
2. VotoID
3. automation engine
4. EUDR infrastructure

Reason:

- onboarding core is required by all services
- VotoID is the fastest enterprise-facing demonstration
- automation then becomes reusable backbone
- EUDR depends on both evidence and operational maturity

### 8.2 Minimum Infra for Real Operations

Minimum production-ready stack:

- Diamond protocol core
- identity and access facets
- evidence and audit primitives
- relayer
- indexer
- PostgreSQL
- Redis
- IPFS
- GraphQL gateway
- signer policy and multisig controls

### 8.3 What to Build Next

After the three core modules already created in this phase, the next most strategic components are:

1. `EvidenceFacet`
   Because all services need immutable documentary anchoring.

2. `AuditFacet`
   Because enterprise clients need audit reconstruction from day one.

3. `ServiceEntitlement or ServiceCatalogFacet`
   To formalize which tenants have `VotoID`, `Automation`, `EUDR`, or combinations.

4. `VotoIDFacet`
   Best first business service to prove end-to-end value.

5. `AutomationFacet`
   Reusable engine for enterprise workflows.

6. `TraceabilityFacet`, `ComplianceFacet`, `CertificationFacet`
   Once the evidence and audit layers are stable.

### 8.4 Operational Readiness Goal

Symmetry is ready to onboard real enterprises when it has:

- enterprise identity and permissions
- multisig-safe administration
- signer and delegate registry
- evidence anchoring
- audit logs
- at least one complete service flow in production

Without those pieces, onboarding is still technical scaffolding rather than enterprise-ready infrastructure.
