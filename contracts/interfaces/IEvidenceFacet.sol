// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEvidenceFacet {
    event EvidenceAnchored(
        uint256 indexed enterpriseId,
        uint256 indexed evidenceId,
        bytes32 indexed evidenceType,
        bytes32 digest,
        string uri,
        string manifestURI,
        bytes32 manifestDigest,
        address submittedBy
    );
    event EvidenceStatusUpdated(
        uint256 indexed enterpriseId,
        uint256 indexed evidenceId,
        bool active,
        address indexed updatedBy
    );
    event EvidenceManifestUpdated(
        uint256 indexed enterpriseId,
        uint256 indexed evidenceId,
        string manifestURI,
        bytes32 manifestDigest,
        address indexed updatedBy
    );

    struct EvidenceView {
        uint256 evidenceId;
        uint256 enterpriseId;
        bytes32 digest;
        string uri;
        string manifestURI;
        bytes32 manifestDigest;
        bytes32 evidenceType;
        bytes32 serviceKey;
        bytes32 subjectType;
        bytes32 subjectId;
        address submittedBy;
        uint64 submittedAt;
        bool active;
    }

    struct EvidenceAnchorParams {
        uint256 enterpriseId;
        bytes32 evidenceType;
        bytes32 digest;
        string uri;
        string manifestURI;
        bytes32 manifestDigest;
        bytes32 serviceKey;
        bytes32 subjectType;
        bytes32 subjectId;
    }

    function anchorEvidence(
        uint256 enterpriseId,
        bytes32 evidenceType,
        bytes32 digest,
        string calldata uri
    ) external returns (uint256 evidenceId);
    function anchorEvidenceWithManifest(EvidenceAnchorParams calldata params)
        external
        returns (uint256 evidenceId);

    function setEvidenceStatus(uint256 enterpriseId, uint256 evidenceId, bool active) external;
    function updateEvidenceManifest(
        uint256 enterpriseId,
        uint256 evidenceId,
        string calldata manifestURI,
        bytes32 manifestDigest
    ) external;
    function getEvidence(uint256 evidenceId) external view returns (EvidenceView memory evidence);
    function listEnterpriseEvidence(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory evidenceIds);
}
