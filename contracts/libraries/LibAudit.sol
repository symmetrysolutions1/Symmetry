// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LibAudit {
    bytes32 internal constant STORAGE_SLOT = keccak256("symmetry.enterprises.storage.audit");

    error AuditRecordNotFound(uint256 auditId);

    struct AuditRecord {
        uint256 auditId;
        uint256 enterpriseId;
        bytes32 category;
        bytes32 serviceKey;
        bytes32 actionKey;
        bytes32 subjectType;
        uint256 subjectId;
        bytes32 evidenceDigest;
        bytes32 manifestDigest;
        string noteURI;
        address actor;
        uint64 createdAt;
    }

    struct Layout {
        uint256 nextAuditId;
        mapping(uint256 => AuditRecord) records;
        mapping(uint256 => uint256[]) auditByEnterprise;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }
}
