// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LibAutomation {
    bytes32 internal constant STORAGE_SLOT = keccak256("symmetry.enterprises.storage.automation");
    bytes32 internal constant SERVICE_KEY = keccak256("automation");
    bytes32 internal constant PROCESS_MANAGER_ROLE = keccak256("PROCESS_MANAGER_ROLE");
    bytes32 internal constant PROCESS_APPROVER_ROLE = keccak256("PROCESS_APPROVER_ROLE");
    bytes32 internal constant PROCESS_ORACLE_ROLE = keccak256("PROCESS_ORACLE_ROLE");

    error InvalidAddress();
    error InvalidText();
    error InvalidArrayLengths();
    error InvalidDigest();
    error TemplateNotFound(uint256 enterpriseId, uint256 templateId);
    error TemplateInactive(uint256 enterpriseId, uint256 templateId);
    error InstanceNotFound(uint256 enterpriseId, uint256 instanceId);
    error CheckpointNotFound(uint256 enterpriseId, uint256 templateId, uint256 checkpointIndex);
    error InvalidState();
    error OracleNotRequired(uint256 enterpriseId, uint256 instanceId, uint256 checkpointIndex);
    error EvidenceRequired(uint256 enterpriseId, uint256 instanceId, uint256 checkpointIndex);

    enum ProcessStatus {
        None,
        Draft,
        Active,
        WaitingOracle,
        Executable,
        Executed,
        Failed,
        Escalated,
        Cancelled
    }

    enum CheckpointStatus {
        Pending,
        WaitingOracle,
        Completed
    }

    struct ProcessTemplate {
        uint256 id;
        string name;
        string configURI;
        bytes32 configDigest;
        bool active;
        uint64 createdAt;
        uint64 updatedAt;
        uint256 checkpointCount;
        address createdBy;
    }

    struct CheckpointDefinition {
        bytes32 checkpointKey;
        bytes32 requiredRole;
        bool evidenceRequired;
        bool oracleRequired;
    }

    struct ProcessInstance {
        uint256 id;
        uint256 templateId;
        string externalRef;
        bytes32 subjectType;
        bytes32 subjectId;
        string configURI;
        ProcessStatus status;
        uint64 startedAt;
        uint64 completedAt;
        uint256 currentCheckpointIndex;
        bytes32 executionManifestDigest;
        address startedBy;
        address lastActor;
    }

    struct CheckpointRecord {
        uint256 checkpointIndex;
        bytes32 checkpointKey;
        CheckpointStatus status;
        address completedBy;
        uint64 completedAt;
        bytes32 evidenceDigest;
        bytes32 oracleDigest;
    }

    struct Layout {
        mapping(uint256 => uint256) enterpriseTemplateCount;
        mapping(uint256 => uint256[]) enterpriseTemplateIds;
        mapping(uint256 => mapping(uint256 => ProcessTemplate)) templates;
        mapping(uint256 => mapping(uint256 => mapping(uint256 => CheckpointDefinition)))
            templateCheckpoints;
        mapping(uint256 => uint256) enterpriseInstanceCount;
        mapping(uint256 => uint256[]) enterpriseInstanceIds;
        mapping(uint256 => mapping(uint256 => ProcessInstance)) instances;
        mapping(uint256 => mapping(uint256 => mapping(uint256 => CheckpointRecord)))
            instanceCheckpointRecords;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }

    function defaultRole(bytes32 role) internal pure returns (bytes32) {
        return role == bytes32(0) ? PROCESS_APPROVER_ROLE : role;
    }
}
