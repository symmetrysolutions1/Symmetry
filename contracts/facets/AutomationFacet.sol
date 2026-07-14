// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IAutomationFacet } from "../interfaces/IAutomationFacet.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibEnterpriseRegistry } from "../libraries/LibEnterpriseRegistry.sol";
import { LibServiceEntitlement } from "../libraries/LibServiceEntitlement.sol";
import { LibAutomation } from "../libraries/LibAutomation.sol";

contract AutomationFacet is IAutomationFacet {
    modifier onlyOperationalAutomation(uint256 enterpriseId) {
        LibServiceEntitlement.enforceOperational(
            enterpriseId, LibServiceEntitlement.SERVICE_AUTOMATION
        );
        _;
    }

    function registerProcessTemplate(
        uint256 enterpriseId,
        ProcessTemplateRegistration calldata registration
    ) external onlyOperationalAutomation(enterpriseId) returns (uint256 templateId) {
        _requireManagerOrAdmin(enterpriseId);
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        if (bytes(registration.name).length == 0 || bytes(registration.configURI).length == 0) {
            revert LibAutomation.InvalidText();
        }
        if (registration.configDigest == bytes32(0)) revert LibAutomation.InvalidDigest();
        if (
            registration.checkpointKeys.length == 0
                || registration.checkpointKeys.length != registration.checkpointRoles.length
                || registration.checkpointKeys.length != registration.evidenceRequired.length
                || registration.checkpointKeys.length != registration.oracleRequired.length
        ) revert LibAutomation.InvalidArrayLengths();

        LibAutomation.Layout storage ds = LibAutomation.data();
        templateId = ++ds.enterpriseTemplateCount[enterpriseId];

        ds.templates[enterpriseId][templateId] = LibAutomation.ProcessTemplate({
            id: templateId,
            name: registration.name,
            configURI: registration.configURI,
            configDigest: registration.configDigest,
            active: true,
            createdAt: uint64(block.timestamp),
            updatedAt: uint64(block.timestamp),
            checkpointCount: registration.checkpointKeys.length,
            createdBy: msg.sender
        });
        ds.enterpriseTemplateIds[enterpriseId].push(templateId);

        for (uint256 i; i < registration.checkpointKeys.length; i++) {
            if (registration.checkpointKeys[i] == bytes32(0)) revert LibAutomation.InvalidDigest();
            ds.templateCheckpoints[enterpriseId][templateId][i] = LibAutomation.CheckpointDefinition({
                checkpointKey: registration.checkpointKeys[i],
                requiredRole: LibAutomation.defaultRole(registration.checkpointRoles[i]),
                evidenceRequired: registration.evidenceRequired[i],
                oracleRequired: registration.oracleRequired[i]
            });
        }

        emit ProcessTemplateRegistered(
            enterpriseId,
            templateId,
            registration.name,
            registration.checkpointKeys.length,
            registration.configURI
        );
    }

    function setProcessTemplateStatus(uint256 enterpriseId, uint256 templateId, bool active)
        external
        onlyOperationalAutomation(enterpriseId)
    {
        _requireManagerOrAdmin(enterpriseId);
        LibAutomation.ProcessTemplate storage template =
            _requireTemplate(LibAutomation.data(), enterpriseId, templateId);
        template.active = active;
        template.updatedAt = uint64(block.timestamp);
        emit ProcessTemplateStatusUpdated(enterpriseId, templateId, active, msg.sender);
    }

    function instantiateProcess(
        uint256 enterpriseId,
        uint256 templateId,
        string calldata externalRef,
        bytes32 subjectType,
        bytes32 subjectId,
        string calldata configURI
    ) external onlyOperationalAutomation(enterpriseId) returns (uint256 instanceId) {
        _requireManagerOrAdmin(enterpriseId);
        if (bytes(externalRef).length == 0 || bytes(configURI).length == 0) {
            revert LibAutomation.InvalidText();
        }

        LibAutomation.Layout storage ds = LibAutomation.data();
        LibAutomation.ProcessTemplate storage template =
            _requireTemplate(ds, enterpriseId, templateId);
        if (!template.active) revert LibAutomation.TemplateInactive(enterpriseId, templateId);

        instanceId = ++ds.enterpriseInstanceCount[enterpriseId];
        ds.instances[enterpriseId][instanceId] = LibAutomation.ProcessInstance({
            id: instanceId,
            templateId: templateId,
            externalRef: externalRef,
            subjectType: subjectType,
            subjectId: subjectId,
            configURI: configURI,
            status: LibAutomation.ProcessStatus.Active,
            startedAt: uint64(block.timestamp),
            completedAt: 0,
            currentCheckpointIndex: 0,
            executionManifestDigest: bytes32(0),
            startedBy: msg.sender,
            lastActor: msg.sender
        });
        ds.enterpriseInstanceIds[enterpriseId].push(instanceId);

        emit ProcessInstantiated(
            enterpriseId, instanceId, templateId, externalRef, subjectType, subjectId
        );
    }

    function completeCheckpoint(uint256 enterpriseId, uint256 instanceId, bytes32 evidenceDigest)
        external
        onlyOperationalAutomation(enterpriseId)
    {
        LibAutomation.Layout storage ds = LibAutomation.data();
        LibAutomation.ProcessInstance storage instance =
            _requireInstance(ds, enterpriseId, instanceId);
        if (instance.status != LibAutomation.ProcessStatus.Active) {
            revert LibAutomation.InvalidState();
        }

        uint256 checkpointIndex = instance.currentCheckpointIndex;
        LibAutomation.CheckpointDefinition storage definition =
            _requireCheckpoint(ds, enterpriseId, instance.templateId, checkpointIndex);
        _requireCheckpointRole(enterpriseId, definition.requiredRole, msg.sender);

        if (definition.evidenceRequired && evidenceDigest == bytes32(0)) {
            revert LibAutomation.EvidenceRequired(enterpriseId, instanceId, checkpointIndex);
        }

        LibAutomation.CheckpointRecord storage record =
            ds.instanceCheckpointRecords[enterpriseId][instanceId][checkpointIndex];
        record.checkpointIndex = checkpointIndex;
        record.checkpointKey = definition.checkpointKey;
        record.completedBy = msg.sender;
        record.completedAt = uint64(block.timestamp);
        record.evidenceDigest = evidenceDigest;
        record.status = definition.oracleRequired
            ? LibAutomation.CheckpointStatus.WaitingOracle
            : LibAutomation.CheckpointStatus.Completed;

        instance.lastActor = msg.sender;

        emit ProcessCheckpointCompleted(
            enterpriseId,
            instanceId,
            checkpointIndex,
            definition.checkpointKey,
            msg.sender,
            evidenceDigest
        );

        if (definition.oracleRequired) {
            instance.status = LibAutomation.ProcessStatus.WaitingOracle;
            return;
        }

        _advanceInstance(ds, enterpriseId, instanceId);
    }

    function submitOracleAttestation(
        uint256 enterpriseId,
        uint256 instanceId,
        bytes32 oracleDigest
    ) external onlyOperationalAutomation(enterpriseId) {
        if (oracleDigest == bytes32(0)) revert LibAutomation.InvalidDigest();

        LibAutomation.Layout storage ds = LibAutomation.data();
        LibAutomation.ProcessInstance storage instance =
            _requireInstance(ds, enterpriseId, instanceId);
        if (instance.status != LibAutomation.ProcessStatus.WaitingOracle) {
            revert LibAutomation.InvalidState();
        }

        uint256 checkpointIndex = instance.currentCheckpointIndex;
        LibAutomation.CheckpointDefinition storage definition =
            _requireCheckpoint(ds, enterpriseId, instance.templateId, checkpointIndex);
        if (!definition.oracleRequired) {
            revert LibAutomation.OracleNotRequired(enterpriseId, instanceId, checkpointIndex);
        }
        _requireCheckpointRole(enterpriseId, LibAutomation.PROCESS_ORACLE_ROLE, msg.sender);

        LibAutomation.CheckpointRecord storage record =
            ds.instanceCheckpointRecords[enterpriseId][instanceId][checkpointIndex];
        record.oracleDigest = oracleDigest;
        record.status = LibAutomation.CheckpointStatus.Completed;

        instance.lastActor = msg.sender;

        emit ProcessOracleAttested(
            enterpriseId,
            instanceId,
            checkpointIndex,
            definition.checkpointKey,
            oracleDigest,
            msg.sender
        );

        _advanceInstance(ds, enterpriseId, instanceId);
    }

    function escalateProcess(uint256 enterpriseId, uint256 instanceId, string calldata reasonURI)
        external
        onlyOperationalAutomation(enterpriseId)
    {
        _requireManagerOrAdmin(enterpriseId);
        if (bytes(reasonURI).length == 0) revert LibAutomation.InvalidText();
        LibAutomation.ProcessInstance storage instance =
            _requireInstance(LibAutomation.data(), enterpriseId, instanceId);
        if (
            instance.status != LibAutomation.ProcessStatus.Active
                && instance.status != LibAutomation.ProcessStatus.WaitingOracle
                && instance.status != LibAutomation.ProcessStatus.Executable
        ) revert LibAutomation.InvalidState();

        instance.status = LibAutomation.ProcessStatus.Escalated;
        instance.lastActor = msg.sender;
        emit ProcessEscalated(
            enterpriseId, instanceId, instance.currentCheckpointIndex, reasonURI, msg.sender
        );
    }

    function finalizeProcess(
        uint256 enterpriseId,
        uint256 instanceId,
        bytes32 executionManifestDigest
    ) external onlyOperationalAutomation(enterpriseId) {
        _requireManagerOrAdmin(enterpriseId);
        if (executionManifestDigest == bytes32(0)) revert LibAutomation.InvalidDigest();
        LibAutomation.ProcessInstance storage instance =
            _requireInstance(LibAutomation.data(), enterpriseId, instanceId);
        if (instance.status != LibAutomation.ProcessStatus.Executable) {
            revert LibAutomation.InvalidState();
        }

        instance.status = LibAutomation.ProcessStatus.Executed;
        instance.completedAt = uint64(block.timestamp);
        instance.executionManifestDigest = executionManifestDigest;
        instance.lastActor = msg.sender;

        emit ProcessAutomated(enterpriseId, instanceId, executionManifestDigest, msg.sender);
    }

    function failProcess(uint256 enterpriseId, uint256 instanceId, string calldata reasonURI)
        external
        onlyOperationalAutomation(enterpriseId)
    {
        _requireManagerOrAdmin(enterpriseId);
        if (bytes(reasonURI).length == 0) revert LibAutomation.InvalidText();
        LibAutomation.ProcessInstance storage instance =
            _requireInstance(LibAutomation.data(), enterpriseId, instanceId);
        if (
            instance.status != LibAutomation.ProcessStatus.Active
                && instance.status != LibAutomation.ProcessStatus.WaitingOracle
                && instance.status != LibAutomation.ProcessStatus.Executable
                && instance.status != LibAutomation.ProcessStatus.Escalated
        ) revert LibAutomation.InvalidState();

        instance.status = LibAutomation.ProcessStatus.Failed;
        instance.completedAt = uint64(block.timestamp);
        instance.lastActor = msg.sender;

        emit ProcessFailed(
            enterpriseId, instanceId, instance.currentCheckpointIndex, reasonURI, msg.sender
        );
    }

    function cancelProcess(uint256 enterpriseId, uint256 instanceId, string calldata reasonURI)
        external
        onlyOperationalAutomation(enterpriseId)
    {
        _requireManagerOrAdmin(enterpriseId);
        if (bytes(reasonURI).length == 0) revert LibAutomation.InvalidText();
        LibAutomation.ProcessInstance storage instance =
            _requireInstance(LibAutomation.data(), enterpriseId, instanceId);
        if (
            instance.status != LibAutomation.ProcessStatus.Active
                && instance.status != LibAutomation.ProcessStatus.WaitingOracle
                && instance.status != LibAutomation.ProcessStatus.Executable
                && instance.status != LibAutomation.ProcessStatus.Escalated
        ) revert LibAutomation.InvalidState();

        instance.status = LibAutomation.ProcessStatus.Cancelled;
        instance.completedAt = uint64(block.timestamp);
        instance.lastActor = msg.sender;

        emit ProcessCancelled(
            enterpriseId, instanceId, instance.currentCheckpointIndex, reasonURI, msg.sender
        );
    }

    function getProcessTemplate(uint256 enterpriseId, uint256 templateId)
        external
        view
        returns (ProcessTemplateView memory templateView)
    {
        LibAutomation.ProcessTemplate storage template =
            _requireTemplate(LibAutomation.data(), enterpriseId, templateId);
        templateView = ProcessTemplateView({
            id: template.id,
            name: template.name,
            configURI: template.configURI,
            configDigest: template.configDigest,
            active: template.active,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            checkpointCount: template.checkpointCount,
            createdBy: template.createdBy
        });
    }

    function getCheckpointDefinition(
        uint256 enterpriseId,
        uint256 templateId,
        uint256 checkpointIndex
    ) external view returns (CheckpointDefinitionView memory checkpointView) {
        LibAutomation.CheckpointDefinition storage definition =
            _requireCheckpoint(LibAutomation.data(), enterpriseId, templateId, checkpointIndex);
        checkpointView = CheckpointDefinitionView({
            checkpointKey: definition.checkpointKey,
            requiredRole: definition.requiredRole,
            evidenceRequired: definition.evidenceRequired,
            oracleRequired: definition.oracleRequired
        });
    }

    function getProcessInstance(uint256 enterpriseId, uint256 instanceId)
        external
        view
        returns (ProcessInstanceView memory instanceView)
    {
        LibAutomation.ProcessInstance storage instance =
            _requireInstance(LibAutomation.data(), enterpriseId, instanceId);
        instanceView = ProcessInstanceView({
            id: instance.id,
            templateId: instance.templateId,
            externalRef: instance.externalRef,
            subjectType: instance.subjectType,
            subjectId: instance.subjectId,
            configURI: instance.configURI,
            status: uint8(instance.status),
            startedAt: instance.startedAt,
            completedAt: instance.completedAt,
            currentCheckpointIndex: instance.currentCheckpointIndex,
            executionManifestDigest: instance.executionManifestDigest,
            startedBy: instance.startedBy,
            lastActor: instance.lastActor
        });
    }

    function getCheckpointRecord(uint256 enterpriseId, uint256 instanceId, uint256 checkpointIndex)
        external
        view
        returns (CheckpointRecordView memory recordView)
    {
        LibAutomation.CheckpointRecord storage record = LibAutomation.data()
        .instanceCheckpointRecords[enterpriseId][instanceId][checkpointIndex];
        recordView = CheckpointRecordView({
            checkpointIndex: record.checkpointIndex,
            checkpointKey: record.checkpointKey,
            status: uint8(record.status),
            completedBy: record.completedBy,
            completedAt: record.completedAt,
            evidenceDigest: record.evidenceDigest,
            oracleDigest: record.oracleDigest
        });
    }

    function listEnterpriseTemplateIds(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory)
    {
        return LibAutomation.data().enterpriseTemplateIds[enterpriseId];
    }

    function listEnterpriseInstanceIds(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory)
    {
        return LibAutomation.data().enterpriseInstanceIds[enterpriseId];
    }

    function _advanceInstance(
        LibAutomation.Layout storage ds,
        uint256 enterpriseId,
        uint256 instanceId
    ) internal {
        LibAutomation.ProcessInstance storage instance = ds.instances[enterpriseId][instanceId];
        LibAutomation.ProcessTemplate storage template =
            ds.templates[enterpriseId][instance.templateId];
        uint256 nextCheckpoint = instance.currentCheckpointIndex + 1;

        if (nextCheckpoint >= template.checkpointCount) {
            instance.status = LibAutomation.ProcessStatus.Executable;
            instance.currentCheckpointIndex = template.checkpointCount;
        } else {
            instance.status = LibAutomation.ProcessStatus.Active;
            instance.currentCheckpointIndex = nextCheckpoint;
        }
    }

    function _requireManagerOrAdmin(uint256 enterpriseId) internal view {
        if (
            !LibAccessControl.hasEnterpriseRole(
                    enterpriseId, LibAutomation.PROCESS_MANAGER_ROLE, msg.sender
                )
                && !LibAccessControl.hasEnterpriseRole(
                    enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
                )
        ) {
            revert LibAccessControl.AccessDenied(
                LibAutomation.PROCESS_MANAGER_ROLE, msg.sender, enterpriseId
            );
        }
    }

    function _requireCheckpointRole(uint256 enterpriseId, bytes32 role, address account)
        internal
        view
    {
        bytes32 resolvedRole = LibAutomation.defaultRole(role);
        if (
            !LibAccessControl.hasEnterpriseRole(enterpriseId, resolvedRole, account)
                && !LibAccessControl.hasEnterpriseRole(
                    enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, account
                )
        ) revert LibAccessControl.AccessDenied(resolvedRole, account, enterpriseId);
    }

    function _requireTemplate(
        LibAutomation.Layout storage ds,
        uint256 enterpriseId,
        uint256 templateId
    ) internal view returns (LibAutomation.ProcessTemplate storage template) {
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        template = ds.templates[enterpriseId][templateId];
        if (template.id == 0) revert LibAutomation.TemplateNotFound(enterpriseId, templateId);
    }

    function _requireInstance(
        LibAutomation.Layout storage ds,
        uint256 enterpriseId,
        uint256 instanceId
    ) internal view returns (LibAutomation.ProcessInstance storage instance) {
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        instance = ds.instances[enterpriseId][instanceId];
        if (instance.id == 0) revert LibAutomation.InstanceNotFound(enterpriseId, instanceId);
    }

    function _requireCheckpoint(
        LibAutomation.Layout storage ds,
        uint256 enterpriseId,
        uint256 templateId,
        uint256 checkpointIndex
    ) internal view returns (LibAutomation.CheckpointDefinition storage definition) {
        LibAutomation.ProcessTemplate storage template =
            _requireTemplate(ds, enterpriseId, templateId);
        if (checkpointIndex >= template.checkpointCount) {
            revert LibAutomation.CheckpointNotFound(enterpriseId, templateId, checkpointIndex);
        }
        definition = ds.templateCheckpoints[enterpriseId][templateId][checkpointIndex];
        if (definition.checkpointKey == bytes32(0)) {
            revert LibAutomation.CheckpointNotFound(enterpriseId, templateId, checkpointIndex);
        }
    }
}
