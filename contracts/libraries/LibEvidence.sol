// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LibEvidence {
    bytes32 internal constant STORAGE_SLOT = keccak256("symmetry.enterprises.storage.evidence");

    error EvidenceNotFound(uint256 evidenceId);
    error EmptyDigest();
    error EmptyURI();
    error EmptyManifestURI();
    error EmptyManifestDigest();

    struct EvidenceRecord {
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

    struct Layout {
        uint256 nextEvidenceId;
        mapping(uint256 => EvidenceRecord) records;
        mapping(uint256 => uint256[]) evidenceByEnterprise;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }
}
