// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAuditFacet {
    event AuditRecordCreated(
        uint256 indexed enterpriseId,
        uint256 indexed auditId,
        bytes32 indexed category,
        bytes32 serviceKey,
        bytes32 actionKey,
        bytes32 subjectType,
        uint256 subjectId,
        bytes32 evidenceDigest,
        bytes32 manifestDigest,
        string noteURI,
        address actor
    );

    struct AuditRecordParams {
        uint256 enterpriseId;
        bytes32 category;
        bytes32 serviceKey;
        bytes32 actionKey;
        bytes32 subjectType;
        uint256 subjectId;
        bytes32 evidenceDigest;
        bytes32 manifestDigest;
        string noteURI;
    }

    struct AuditRecordView {
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

    function createAuditRecord(
        uint256 enterpriseId,
        bytes32 category,
        bytes32 subjectType,
        uint256 subjectId,
        bytes32 evidenceDigest,
        string calldata noteURI
    ) external returns (uint256 auditId);
    function createAuditRecordWithContext(AuditRecordParams calldata params)
        external
        returns (uint256 auditId);

    function getAuditRecord(uint256 auditId)
        external
        view
        returns (AuditRecordView memory auditRecord);
    function listEnterpriseAuditRecords(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory auditIds);
}
