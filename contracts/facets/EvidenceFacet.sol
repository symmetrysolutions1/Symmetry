// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IEvidenceFacet } from "../interfaces/IEvidenceFacet.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibEnterpriseRegistry } from "../libraries/LibEnterpriseRegistry.sol";
import { LibEvidence } from "../libraries/LibEvidence.sol";

contract EvidenceFacet is IEvidenceFacet {
    function anchorEvidence(
        uint256 enterpriseId,
        bytes32 evidenceType,
        bytes32 digest,
        string calldata uri
    ) external returns (uint256 evidenceId) {
        evidenceId = _anchorEvidence(
            EvidenceAnchorParams({
                enterpriseId: enterpriseId,
                evidenceType: evidenceType,
                digest: digest,
                uri: uri,
                manifestURI: uri,
                manifestDigest: digest,
                serviceKey: bytes32(0),
                subjectType: bytes32(0),
                subjectId: bytes32(0)
            })
        );
    }

    function anchorEvidenceWithManifest(EvidenceAnchorParams calldata params)
        external
        returns (uint256 evidenceId)
    {
        evidenceId = _anchorEvidence(params);
    }

    function setEvidenceStatus(uint256 enterpriseId, uint256 evidenceId, bool active) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_AUDITOR_ROLE, msg.sender
        );
        LibEvidence.EvidenceRecord storage record = LibEvidence.data().records[evidenceId];
        if (record.evidenceId == 0) revert LibEvidence.EvidenceNotFound(evidenceId);
        record.active = active;
        emit EvidenceStatusUpdated(enterpriseId, evidenceId, active, msg.sender);
    }

    function updateEvidenceManifest(
        uint256 enterpriseId,
        uint256 evidenceId,
        string calldata manifestURI,
        bytes32 manifestDigest
    ) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_AUDITOR_ROLE, msg.sender
        );
        if (bytes(manifestURI).length == 0) revert LibEvidence.EmptyManifestURI();
        if (manifestDigest == bytes32(0)) revert LibEvidence.EmptyManifestDigest();

        LibEvidence.EvidenceRecord storage record = LibEvidence.data().records[evidenceId];
        if (record.evidenceId == 0) revert LibEvidence.EvidenceNotFound(evidenceId);

        record.manifestURI = manifestURI;
        record.manifestDigest = manifestDigest;

        emit EvidenceManifestUpdated(
            enterpriseId, evidenceId, manifestURI, manifestDigest, msg.sender
        );
    }

    function getEvidence(uint256 evidenceId) external view returns (EvidenceView memory evidence) {
        LibEvidence.EvidenceRecord storage record = LibEvidence.data().records[evidenceId];
        if (record.evidenceId == 0) revert LibEvidence.EvidenceNotFound(evidenceId);
        evidence = EvidenceView({
            evidenceId: record.evidenceId,
            enterpriseId: record.enterpriseId,
            digest: record.digest,
            uri: record.uri,
            manifestURI: record.manifestURI,
            manifestDigest: record.manifestDigest,
            evidenceType: record.evidenceType,
            serviceKey: record.serviceKey,
            subjectType: record.subjectType,
            subjectId: record.subjectId,
            submittedBy: record.submittedBy,
            submittedAt: record.submittedAt,
            active: record.active
        });
    }

    function listEnterpriseEvidence(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory evidenceIds)
    {
        evidenceIds = LibEvidence.data().evidenceByEnterprise[enterpriseId];
    }

    function _anchorEvidence(IEvidenceFacet.EvidenceAnchorParams memory params)
        internal
        returns (uint256 evidenceId)
    {
        LibEnterpriseRegistry.requireEnterprise(params.enterpriseId);
        LibAccessControl.enforceEnterpriseRole(
            params.enterpriseId, LibAccessControl.ENTERPRISE_OPERATOR_ROLE, msg.sender
        );
        if (params.digest == bytes32(0)) revert LibEvidence.EmptyDigest();
        if (bytes(params.uri).length == 0) revert LibEvidence.EmptyURI();
        if (bytes(params.manifestURI).length == 0) revert LibEvidence.EmptyManifestURI();
        if (params.manifestDigest == bytes32(0)) revert LibEvidence.EmptyManifestDigest();

        LibEvidence.Layout storage ds = LibEvidence.data();
        evidenceId = ++ds.nextEvidenceId;
        ds.records[evidenceId] = LibEvidence.EvidenceRecord({
            evidenceId: evidenceId,
            enterpriseId: params.enterpriseId,
            digest: params.digest,
            uri: params.uri,
            manifestURI: params.manifestURI,
            manifestDigest: params.manifestDigest,
            evidenceType: params.evidenceType,
            serviceKey: params.serviceKey,
            subjectType: params.subjectType,
            subjectId: params.subjectId,
            submittedBy: msg.sender,
            submittedAt: uint64(block.timestamp),
            active: true
        });
        ds.evidenceByEnterprise[params.enterpriseId].push(evidenceId);

        emit EvidenceAnchored(
            params.enterpriseId,
            evidenceId,
            params.evidenceType,
            params.digest,
            params.uri,
            params.manifestURI,
            params.manifestDigest,
            msg.sender
        );
    }
}
