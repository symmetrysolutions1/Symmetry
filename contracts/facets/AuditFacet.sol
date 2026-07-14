// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IAuditFacet } from "../interfaces/IAuditFacet.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibAudit } from "../libraries/LibAudit.sol";
import { LibEnterpriseRegistry } from "../libraries/LibEnterpriseRegistry.sol";

contract AuditFacet is IAuditFacet {
    function createAuditRecord(
        uint256 enterpriseId,
        bytes32 category,
        bytes32 subjectType,
        uint256 subjectId,
        bytes32 evidenceDigest,
        string calldata noteURI
    ) external returns (uint256 auditId) {
        auditId = _createAuditRecord(
            AuditRecordParams({
                enterpriseId: enterpriseId,
                category: category,
                serviceKey: bytes32(0),
                actionKey: bytes32(0),
                subjectType: subjectType,
                subjectId: subjectId,
                evidenceDigest: evidenceDigest,
                manifestDigest: bytes32(0),
                noteURI: noteURI
            })
        );
    }

    function createAuditRecordWithContext(AuditRecordParams calldata params)
        external
        returns (uint256 auditId)
    {
        auditId = _createAuditRecord(params);
    }

    function getAuditRecord(uint256 auditId)
        external
        view
        returns (AuditRecordView memory auditRecord)
    {
        LibAudit.AuditRecord storage record = LibAudit.data().records[auditId];
        if (record.auditId == 0) revert LibAudit.AuditRecordNotFound(auditId);

        auditRecord = AuditRecordView({
            auditId: record.auditId,
            enterpriseId: record.enterpriseId,
            category: record.category,
            serviceKey: record.serviceKey,
            actionKey: record.actionKey,
            subjectType: record.subjectType,
            subjectId: record.subjectId,
            evidenceDigest: record.evidenceDigest,
            manifestDigest: record.manifestDigest,
            noteURI: record.noteURI,
            actor: record.actor,
            createdAt: record.createdAt
        });
    }

    function listEnterpriseAuditRecords(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory auditIds)
    {
        auditIds = LibAudit.data().auditByEnterprise[enterpriseId];
    }

    function _createAuditRecord(IAuditFacet.AuditRecordParams memory params)
        internal
        returns (uint256 auditId)
    {
        LibEnterpriseRegistry.requireEnterprise(params.enterpriseId);
        if (
            !LibAccessControl.hasEnterpriseRole(
                    params.enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
                )
                && !LibAccessControl.hasEnterpriseRole(
                    params.enterpriseId, LibAccessControl.ENTERPRISE_AUDITOR_ROLE, msg.sender
                )
                && !LibAccessControl.hasEnterpriseRole(
                    params.enterpriseId, LibAccessControl.ENTERPRISE_OPERATOR_ROLE, msg.sender
                )
        ) {
            LibAccessControl.enforceEnterpriseRole(
                params.enterpriseId, LibAccessControl.ENTERPRISE_AUDITOR_ROLE, msg.sender
            );
        }

        LibAudit.Layout storage ds = LibAudit.data();
        auditId = ++ds.nextAuditId;
        ds.records[auditId] = LibAudit.AuditRecord({
            auditId: auditId,
            enterpriseId: params.enterpriseId,
            category: params.category,
            serviceKey: params.serviceKey,
            actionKey: params.actionKey,
            subjectType: params.subjectType,
            subjectId: params.subjectId,
            evidenceDigest: params.evidenceDigest,
            manifestDigest: params.manifestDigest,
            noteURI: params.noteURI,
            actor: msg.sender,
            createdAt: uint64(block.timestamp)
        });
        ds.auditByEnterprise[params.enterpriseId].push(auditId);

        emit AuditRecordCreated(
            params.enterpriseId,
            auditId,
            params.category,
            params.serviceKey,
            params.actionKey,
            params.subjectType,
            params.subjectId,
            params.evidenceDigest,
            params.manifestDigest,
            params.noteURI,
            msg.sender
        );
    }
}
