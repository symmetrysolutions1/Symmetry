# VotoID Projection Model

`VotoID` consumes root-level governance events emitted by each enterprise diamond and projects them into read models that operators, auditors and client dashboards can query without replaying the chain each time.

## Projection Groups

### `votoid_board_projection`

Rebuilds the active board for an enterprise root.

- source events:
  - `BoardInitialized`
  - `ChairpersonUpdated`
  - `SecretaryUpdated`
  - `BoardMemberAdded`
  - `BoardMemberRemoved`
- key:
  - `chainKey + rootAddress + enterpriseId`
- state:
  - chairperson
  - secretary
  - quorum percentage
  - current board member roster
  - current board size

### `votoid_session_projection`

Tracks each active or closed board session.

- source events:
  - `SessionOpened`
  - `SessionJoined`
  - `SessionLeft`
  - `SessionClosed`
- key:
  - `chainKey + rootAddress + enterpriseId + sessionId`
- state:
  - session name
  - lifecycle status
  - deliberation duration
  - voting duration
  - joined active members
  - proposal count

### `votoid_proposal_projection`

Tracks the lifecycle of each proposal from creation to verification.

- source events:
  - `ProposalCreated`
  - `ProposalDeliberationStarted`
  - `ProposalVotingStarted`
  - `ProposalClosed`
  - `ProposalExecutorAssigned`
  - `ProposalExecuted`
  - `ProposalVerified`
- key:
  - `chainKey + rootAddress + enterpriseId + proposalId`
- state:
  - title and description reference
  - session id
  - evidence manifest URI
  - deliberation deadline
  - voting deadline
  - executor
  - final lifecycle status

### `votoid_vote_tally_projection`

Builds analytics and integrity views for each proposal tally.

- source events:
  - `VoteCast`
  - `ProposalClosed`
- key:
  - `chainKey + rootAddress + enterpriseId + proposalId`
- state:
  - eligible voter count
  - yes votes
  - no votes
  - turnout ratio
  - approval decision

## Shared Envelope

Each event should first be normalized with `indexers/chain-listener/build-event-envelope.mjs`, then routed to the corresponding projection by `eventName`.

Required envelope fields:

- `chainKey`
- `rootAddress`
- `eventName`
- `blockNumber`
- `txHash`
- `decodedPayload`
- `ingestedAt`

## Audit and Evidence Binding

The `ProposalCreated`, `ProposalClosed`, `ProposalExecuted` and `ProposalVerified` projections should be cross-linked with:

- `EvidenceAnchored`
- `EvidenceManifestUpdated`
- `AuditRecordCreated`

That lets the off-chain model answer:

- which manifest backed the proposal
- which evidence anchored the result package
- which audit record verified the final execution
