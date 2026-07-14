// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAutomationFacet {
    event ProcessTemplateRegistered(
        uint256 indexed enterpriseId,
        uint256 indexed templateId,
        string name,
        uint256 checkpointCount,
        string configURI
    );
    event ProcessTemplateStatusUpdated(
        uint256 indexed enterpriseId,
        uint256 indexed templateId,
        bool active,
        address indexed updatedBy
    );
    event ProcessInstantiated(
        uint256 indexed enterpriseId,
        uint256 indexed instanceId,
        uint256 indexed templateId,
        string externalRef,
        bytes32 subjectType,
        bytes32 subjectId
    );
    event ProcessCheckpointCompleted(
        uint256 indexed enterpriseId,
        uint256 indexed instanceId,
        uint256 indexed checkpointIndex,
        bytes32 checkpointKey,
        address completedBy,
        bytes32 evidenceDigest
    );
    event ProcessOracleAttested(
        uint256 indexed enterpriseId,
        uint256 indexed instanceId,
        uint256 indexed checkpointIndex,
        bytes32 checkpointKey,
        bytes32 oracleDigest,
        address attestedBy
    );
    event ProcessEscalated(
        uint256 indexed enterpriseId,
        uint256 indexed instanceId,
        uint256 indexed checkpointIndex,
        string reasonURI,
        address actor
    );
    event ProcessAutomated(
        uint256 indexed enterpriseId,
        uint256 indexed instanceId,
        bytes32 executionManifestDigest,
        address indexed actor
    );
    event ProcessFailed(
        uint256 indexed enterpriseId,
        uint256 indexed instanceId,
        uint256 indexed checkpointIndex,
        string reasonURI,
        address actor
    );
    event ProcessCancelled(
        uint256 indexed enterpriseId,
        uint256 indexed instanceId,
        uint256 indexed checkpointIndex,
        string reasonURI,
        address actor
    );

    struct ProcessTemplateView {
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

    struct CheckpointDefinitionView {
        bytes32 checkpointKey;
        bytes32 requiredRole;
        bool evidenceRequired;
        bool oracleRequired;
    }

    struct ProcessInstanceView {
        uint256 id;
        uint256 templateId;
        string externalRef;
        bytes32 subjectType;
        bytes32 subjectId;
        string configURI;
        uint8 status;
        uint64 startedAt;
        uint64 completedAt;
        uint256 currentCheckpointIndex;
        bytes32 executionManifestDigest;
        address startedBy;
        address lastActor;
    }

    struct CheckpointRecordView {
        uint256 checkpointIndex;
        bytes32 checkpointKey;
        uint8 status;
        address completedBy;
        uint64 completedAt;
        bytes32 evidenceDigest;
        bytes32 oracleDigest;
    }

    struct ProcessTemplateRegistration {
        string name;
        string configURI;
        bytes32 configDigest;
        bytes32[] checkpointKeys;
        bytes32[] checkpointRoles;
        bool[] evidenceRequired;
        bool[] oracleRequired;
    }

    function registerProcessTemplate(
        uint256 enterpriseId,
        ProcessTemplateRegistration calldata registration
    ) external returns (uint256 templateId);

    function setProcessTemplateStatus(uint256 enterpriseId, uint256 templateId, bool active)
        external;

    function instantiateProcess(
        uint256 enterpriseId,
        uint256 templateId,
        string calldata externalRef,
        bytes32 subjectType,
        bytes32 subjectId,
        string calldata configURI
    ) external returns (uint256 instanceId);

    function completeCheckpoint(uint256 enterpriseId, uint256 instanceId, bytes32 evidenceDigest)
        external;

    function submitOracleAttestation(
        uint256 enterpriseId,
        uint256 instanceId,
        bytes32 oracleDigest
    ) external;

    function escalateProcess(uint256 enterpriseId, uint256 instanceId, string calldata reasonURI)
        external;

    function finalizeProcess(
        uint256 enterpriseId,
        uint256 instanceId,
        bytes32 executionManifestDigest
    ) external;

    function failProcess(uint256 enterpriseId, uint256 instanceId, string calldata reasonURI)
        external;

    function cancelProcess(uint256 enterpriseId, uint256 instanceId, string calldata reasonURI)
        external;

    function getProcessTemplate(uint256 enterpriseId, uint256 templateId)
        external
        view
        returns (ProcessTemplateView memory);

    function getCheckpointDefinition(
        uint256 enterpriseId,
        uint256 templateId,
        uint256 checkpointIndex
    ) external view returns (CheckpointDefinitionView memory);

    function getProcessInstance(uint256 enterpriseId, uint256 instanceId)
        external
        view
        returns (ProcessInstanceView memory);

    function getCheckpointRecord(uint256 enterpriseId, uint256 instanceId, uint256 checkpointIndex)
        external
        view
        returns (CheckpointRecordView memory);

    function listEnterpriseTemplateIds(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory);

    function listEnterpriseInstanceIds(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory);
}
