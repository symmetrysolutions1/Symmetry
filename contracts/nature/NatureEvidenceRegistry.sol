// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title NatureEvidenceRegistry
/// @notice Small, purpose-built registry for the Nature Intelligence ETHOnline slice.
/// @dev Raw imagery and sensitive payloads stay off-chain. Only integrity metadata,
///      state transitions and ENS namespace links are written on-chain.
contract NatureEvidenceRegistry {
    error NotAuthorized();
    error EmptyId();
    error AlreadyRegistered();
    error UnknownTerritory();
    error UnknownObservation();
    error UnknownPassport();

    struct Territory {
        bytes32 workspaceId;
        bytes32 geometryDigest;
        bytes32 ensNode;
        string ensName;
        bool registered;
    }

    struct Observation {
        bytes32 territoryId;
        bytes32 evidenceDigest;
        int256 ndviBps;
        uint16 treeCoverBps;
        uint64 capturedAt;
        bool recorded;
    }

    struct Passport {
        bytes32 workspaceId;
        bytes32 territoryId;
        bytes32 observationId;
        bytes32 manifestDigest;
        bytes32 ensNode;
        uint64 anchoredAt;
        bool anchored;
    }

    address public owner;
    mapping(address => bool) public relayers;
    mapping(bytes32 => Territory) public territories;
    mapping(bytes32 => Observation) public observations;
    mapping(bytes32 => Passport) public passports;

    event RelayerUpdated(address indexed relayer, bool enabled);
    event EnsNamespaceLinked(bytes32 indexed workspaceId, bytes32 indexed ensNode, address indexed resolver);
    event TerritoryRegistered(
        bytes32 indexed workspaceId,
        bytes32 indexed territoryId,
        bytes32 geometryDigest,
        bytes32 ensNode,
        string ensName
    );
    event ObservationRecorded(
        bytes32 indexed territoryId,
        bytes32 indexed observationId,
        bytes32 evidenceDigest,
        int256 ndviBps,
        uint16 treeCoverBps,
        uint64 capturedAt
    );
    event AlertCreated(bytes32 indexed territoryId, bytes32 indexed observationId, bytes32 indexed alertId, bytes32 reason);
    event EvidencePassportAnchored(
        bytes32 indexed workspaceId,
        bytes32 indexed passportId,
        bytes32 indexed territoryId,
        bytes32 observationId,
        bytes32 manifestDigest,
        bytes32 ensNode,
        uint64 anchoredAt
    );

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotAuthorized();
        _;
    }

    modifier onlyAuthorized() {
        if (msg.sender != owner && !relayers[msg.sender]) revert NotAuthorized();
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function setRelayer(address relayer, bool enabled) external onlyOwner {
        relayers[relayer] = enabled;
        emit RelayerUpdated(relayer, enabled);
    }

    function linkEnsNamespace(bytes32 workspaceId, bytes32 ensNode, address resolver) external onlyAuthorized {
        if (workspaceId == bytes32(0) || ensNode == bytes32(0)) revert EmptyId();
        emit EnsNamespaceLinked(workspaceId, ensNode, resolver);
    }

    function registerTerritory(
        bytes32 workspaceId,
        bytes32 territoryId,
        bytes32 geometryDigest,
        bytes32 ensNode,
        string calldata ensName
    ) external onlyAuthorized {
        if (workspaceId == bytes32(0) || territoryId == bytes32(0)) revert EmptyId();
        if (territories[territoryId].registered) revert AlreadyRegistered();
        territories[territoryId] = Territory(workspaceId, geometryDigest, ensNode, ensName, true);
        emit TerritoryRegistered(workspaceId, territoryId, geometryDigest, ensNode, ensName);
    }

    function recordObservation(
        bytes32 territoryId,
        bytes32 observationId,
        bytes32 evidenceDigest,
        int256 ndviBps,
        uint16 treeCoverBps,
        uint64 capturedAt
    ) external onlyAuthorized {
        if (observationId == bytes32(0)) revert EmptyId();
        if (!territories[territoryId].registered) revert UnknownTerritory();
        if (observations[observationId].recorded) revert AlreadyRegistered();
        observations[observationId] = Observation(territoryId, evidenceDigest, ndviBps, treeCoverBps, capturedAt, true);
        emit ObservationRecorded(territoryId, observationId, evidenceDigest, ndviBps, treeCoverBps, capturedAt);
    }

    function createAlert(bytes32 territoryId, bytes32 observationId, bytes32 alertId, bytes32 reason)
        external
        onlyAuthorized
    {
        if (alertId == bytes32(0)) revert EmptyId();
        if (!territories[territoryId].registered) revert UnknownTerritory();
        if (!observations[observationId].recorded) revert UnknownObservation();
        emit AlertCreated(territoryId, observationId, alertId, reason);
    }

    function anchorPassport(
        bytes32 workspaceId,
        bytes32 passportId,
        bytes32 territoryId,
        bytes32 observationId,
        bytes32 manifestDigest,
        bytes32 ensNode
    ) external onlyAuthorized {
        if (workspaceId == bytes32(0) || passportId == bytes32(0)) revert EmptyId();
        if (!territories[territoryId].registered) revert UnknownTerritory();
        if (!observations[observationId].recorded) revert UnknownObservation();
        if (passports[passportId].anchored) revert AlreadyRegistered();
        uint64 anchoredAt = uint64(block.timestamp);
        passports[passportId] = Passport(workspaceId, territoryId, observationId, manifestDigest, ensNode, anchoredAt, true);
        emit EvidencePassportAnchored(workspaceId, passportId, territoryId, observationId, manifestDigest, ensNode, anchoredAt);
    }
}
