// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IEUDRFacet } from "../interfaces/IEUDRFacet.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibEnterpriseRegistry } from "../libraries/LibEnterpriseRegistry.sol";
import { LibServiceEntitlement } from "../libraries/LibServiceEntitlement.sol";
import { LibEUDR } from "../libraries/LibEUDR.sol";

contract EUDRFacet is IEUDRFacet {
    modifier onlyOperationalEUDR(uint256 enterpriseId) {
        LibServiceEntitlement.enforceOperational(enterpriseId, LibServiceEntitlement.SERVICE_EUDR);
        _;
    }

    function registerSupplyActor(
        uint256 enterpriseId,
        address actor,
        bytes32 roleKey,
        string calldata legalName,
        string calldata metadataURI
    ) external onlyOperationalEUDR(enterpriseId) returns (uint256 actorId) {
        _requireExporterOrAdmin(enterpriseId);
        if (actor == address(0)) revert LibEUDR.InvalidAddress();
        if (bytes(legalName).length == 0 || bytes(metadataURI).length == 0) {
            revert LibEUDR.InvalidText();
        }
        if (roleKey == bytes32(0)) revert LibEUDR.InvalidDigest();

        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        LibEUDR.Layout storage ds = LibEUDR.data();
        if (ds.actorsByAddress[enterpriseId][actor].id != 0) {
            revert LibEUDR.ActorAlreadyRegistered(enterpriseId, actor);
        }

        actorId = ++ds.enterpriseActorCount[enterpriseId];
        ds.actorsByAddress[enterpriseId][actor] = LibEUDR.SupplyActor({
            id: actorId,
            account: actor,
            roleKey: roleKey,
            legalName: legalName,
            metadataURI: metadataURI,
            registeredAt: uint64(block.timestamp),
            active: true
        });
        ds.actorAccounts[enterpriseId].push(actor);

        emit SupplyActorRegistered(enterpriseId, actorId, actor, roleKey, legalName);
    }

    function registerParcel(
        uint256 enterpriseId,
        string calldata parcelRef,
        bytes32 geoDigest,
        string calldata metadataURI
    ) external onlyOperationalEUDR(enterpriseId) returns (uint256 parcelId) {
        _requireExporterOrAdmin(enterpriseId);
        if (bytes(parcelRef).length == 0 || bytes(metadataURI).length == 0) {
            revert LibEUDR.InvalidText();
        }
        if (geoDigest == bytes32(0)) revert LibEUDR.InvalidDigest();

        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        LibEUDR.Layout storage ds = LibEUDR.data();
        parcelId = ++ds.enterpriseParcelCount[enterpriseId];
        ds.parcels[enterpriseId][parcelId] = LibEUDR.Parcel({
            id: parcelId,
            parcelRef: parcelRef,
            geoDigest: geoDigest,
            metadataURI: metadataURI,
            registeredAt: uint64(block.timestamp),
            registeredBy: msg.sender
        });
        ds.parcelIds[enterpriseId].push(parcelId);

        emit ParcelRegistered(enterpriseId, parcelId, parcelRef, geoDigest, msg.sender);
    }

    function createBatch(
        uint256 enterpriseId,
        string calldata batchRef,
        uint256 parcelId,
        uint256 quantity,
        string calldata unit,
        string calldata dossierManifestURI,
        bytes32 dossierManifestDigest
    ) external onlyOperationalEUDR(enterpriseId) returns (uint256 batchId) {
        _requireExporterOrAdmin(enterpriseId);
        if (
            bytes(batchRef).length == 0 || bytes(unit).length == 0
                || bytes(dossierManifestURI).length == 0
        ) revert LibEUDR.InvalidText();
        if (quantity == 0) revert LibEUDR.InvalidQuantity();
        if (dossierManifestDigest == bytes32(0)) revert LibEUDR.InvalidDigest();

        LibEUDR.Layout storage ds = LibEUDR.data();
        _requireParcel(ds, enterpriseId, parcelId);
        _requireActor(ds, enterpriseId, msg.sender);

        batchId = ++ds.enterpriseBatchCount[enterpriseId];
        ds.batches[enterpriseId][batchId] = LibEUDR.Batch({
            id: batchId,
            batchRef: batchRef,
            parcelId: parcelId,
            quantity: quantity,
            unit: unit,
            dossierManifestURI: dossierManifestURI,
            dossierManifestDigest: dossierManifestDigest,
            currentCustodian: msg.sender,
            riskScore: 0,
            status: LibEUDR.BatchStatus.Created,
            createdAt: uint64(block.timestamp),
            validatedAt: 0,
            certificateId: 0
        });
        ds.batchIds[enterpriseId].push(batchId);

        emit BatchCreated(enterpriseId, batchId, parcelId, batchRef, msg.sender);
    }

    function transferCustody(
        uint256 enterpriseId,
        uint256 batchId,
        address toActor,
        bytes32 manifestDigest
    ) external onlyOperationalEUDR(enterpriseId) {
        if (toActor == address(0)) revert LibEUDR.InvalidAddress();
        if (manifestDigest == bytes32(0)) revert LibEUDR.InvalidDigest();

        LibEUDR.Layout storage ds = LibEUDR.data();
        LibEUDR.Batch storage batch = _requireBatch(ds, enterpriseId, batchId);
        _requireActor(ds, enterpriseId, toActor);
        if (
            msg.sender != batch.currentCustodian
                && !LibAccessControl.hasEnterpriseRole(
                    enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
                )
        ) revert LibEUDR.UnauthorizedCustody(enterpriseId, batchId, msg.sender);

        address fromActor = batch.currentCustodian;
        batch.currentCustodian = toActor;
        batch.status = LibEUDR.BatchStatus.InTransit;

        emit CustodyTransferred(enterpriseId, batchId, fromActor, toActor, manifestDigest);
    }

    function validateDossier(
        uint256 enterpriseId,
        uint256 batchId,
        uint16 riskScore,
        bool approved,
        bytes32 validationManifestDigest
    ) external onlyOperationalEUDR(enterpriseId) {
        _requireVerifierOrAdmin(enterpriseId);
        if (validationManifestDigest == bytes32(0)) revert LibEUDR.InvalidDigest();

        LibEUDR.Batch storage batch = _requireBatch(LibEUDR.data(), enterpriseId, batchId);
        if (
            batch.status != LibEUDR.BatchStatus.Created
                && batch.status != LibEUDR.BatchStatus.InTransit
        ) revert LibEUDR.InvalidState();

        batch.riskScore = riskScore;
        batch.validatedAt = uint64(block.timestamp);
        batch.status = approved ? LibEUDR.BatchStatus.Validated : LibEUDR.BatchStatus.Rejected;

        emit DossierValidated(
            enterpriseId, batchId, riskScore, approved, validationManifestDigest, msg.sender
        );
    }

    function issueCertificate(
        uint256 enterpriseId,
        uint256 batchId,
        string calldata certificateURI,
        string calldata passportURI,
        bytes32 manifestDigest
    ) external onlyOperationalEUDR(enterpriseId) returns (uint256 certificateId) {
        _requireVerifierOrAdmin(enterpriseId);
        if (bytes(certificateURI).length == 0 || bytes(passportURI).length == 0) {
            revert LibEUDR.InvalidText();
        }
        if (manifestDigest == bytes32(0)) revert LibEUDR.InvalidDigest();

        LibEUDR.Layout storage ds = LibEUDR.data();
        LibEUDR.Batch storage batch = _requireBatch(ds, enterpriseId, batchId);
        if (batch.status != LibEUDR.BatchStatus.Validated) revert LibEUDR.InvalidState();

        certificateId = ++ds.enterpriseCertificateCount[enterpriseId];
        ds.certificates[enterpriseId][certificateId] = LibEUDR.Certificate({
            id: certificateId,
            batchId: batchId,
            certificateURI: certificateURI,
            passportURI: passportURI,
            manifestDigest: manifestDigest,
            status: LibEUDR.CertificateStatus.Issued,
            issuedAt: uint64(block.timestamp),
            revokedAt: 0,
            issuedBy: msg.sender
        });
        ds.certificateIds[enterpriseId].push(certificateId);

        batch.certificateId = certificateId;
        batch.status = LibEUDR.BatchStatus.Certified;

        emit CertificateIssued(enterpriseId, certificateId, batchId, certificateURI, passportURI);
    }

    function revokeCertificate(
        uint256 enterpriseId,
        uint256 certificateId,
        string calldata reasonURI
    ) external onlyOperationalEUDR(enterpriseId) {
        _requireVerifierOrAdmin(enterpriseId);
        if (bytes(reasonURI).length == 0) revert LibEUDR.InvalidText();

        LibEUDR.Layout storage ds = LibEUDR.data();
        LibEUDR.Certificate storage certificate =
            _requireCertificate(ds, enterpriseId, certificateId);
        if (certificate.status != LibEUDR.CertificateStatus.Issued) revert LibEUDR.InvalidState();

        certificate.status = LibEUDR.CertificateStatus.Revoked;
        certificate.revokedAt = uint64(block.timestamp);
        ds.batches[enterpriseId][certificate.batchId].status = LibEUDR.BatchStatus.Rejected;

        emit CertificateRevoked(
            enterpriseId, certificateId, certificate.batchId, reasonURI, msg.sender
        );
    }

    function getSupplyActor(uint256 enterpriseId, address actor)
        external
        view
        returns (SupplyActorView memory actorView)
    {
        LibEUDR.SupplyActor storage stored = _requireActor(LibEUDR.data(), enterpriseId, actor);
        actorView = SupplyActorView({
            id: stored.id,
            account: stored.account,
            roleKey: stored.roleKey,
            legalName: stored.legalName,
            metadataURI: stored.metadataURI,
            registeredAt: stored.registeredAt,
            active: stored.active
        });
    }

    function getParcel(uint256 enterpriseId, uint256 parcelId)
        external
        view
        returns (ParcelView memory parcelView)
    {
        LibEUDR.Parcel storage stored = _requireParcel(LibEUDR.data(), enterpriseId, parcelId);
        parcelView = ParcelView({
            id: stored.id,
            parcelRef: stored.parcelRef,
            geoDigest: stored.geoDigest,
            metadataURI: stored.metadataURI,
            registeredAt: stored.registeredAt,
            registeredBy: stored.registeredBy
        });
    }

    function getBatch(uint256 enterpriseId, uint256 batchId)
        external
        view
        returns (BatchView memory batchView)
    {
        LibEUDR.Batch storage stored = _requireBatch(LibEUDR.data(), enterpriseId, batchId);
        batchView = BatchView({
            id: stored.id,
            batchRef: stored.batchRef,
            parcelId: stored.parcelId,
            quantity: stored.quantity,
            unit: stored.unit,
            dossierManifestURI: stored.dossierManifestURI,
            dossierManifestDigest: stored.dossierManifestDigest,
            currentCustodian: stored.currentCustodian,
            riskScore: stored.riskScore,
            status: uint8(stored.status),
            createdAt: stored.createdAt,
            validatedAt: stored.validatedAt,
            certificateId: stored.certificateId
        });
    }

    function getCertificate(uint256 enterpriseId, uint256 certificateId)
        external
        view
        returns (CertificateView memory certificateView)
    {
        LibEUDR.Certificate storage stored =
            _requireCertificate(LibEUDR.data(), enterpriseId, certificateId);
        certificateView = CertificateView({
            id: stored.id,
            batchId: stored.batchId,
            certificateURI: stored.certificateURI,
            passportURI: stored.passportURI,
            manifestDigest: stored.manifestDigest,
            status: uint8(stored.status),
            issuedAt: stored.issuedAt,
            revokedAt: stored.revokedAt,
            issuedBy: stored.issuedBy
        });
    }

    function listEnterpriseParcels(uint256 enterpriseId) external view returns (uint256[] memory) {
        return LibEUDR.data().parcelIds[enterpriseId];
    }

    function listEnterpriseBatches(uint256 enterpriseId) external view returns (uint256[] memory) {
        return LibEUDR.data().batchIds[enterpriseId];
    }

    function listEnterpriseCertificates(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory)
    {
        return LibEUDR.data().certificateIds[enterpriseId];
    }

    function _requireExporterOrAdmin(uint256 enterpriseId) internal view {
        if (
            !LibAccessControl.hasEnterpriseRole(enterpriseId, LibEUDR.EXPORTER_ROLE, msg.sender)
                && !LibAccessControl.hasEnterpriseRole(
                    enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
                )
        ) revert LibAccessControl.AccessDenied(LibEUDR.EXPORTER_ROLE, msg.sender, enterpriseId);
    }

    function _requireVerifierOrAdmin(uint256 enterpriseId) internal view {
        if (
            !LibAccessControl.hasEnterpriseRole(
                    enterpriseId, LibEUDR.EUDR_VERIFIER_ROLE, msg.sender
                )
                && !LibAccessControl.hasEnterpriseRole(
                        enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
                    )
        ) {
            revert LibAccessControl.AccessDenied(
                LibEUDR.EUDR_VERIFIER_ROLE, msg.sender, enterpriseId
            );
        }
    }

    function _requireActor(LibEUDR.Layout storage ds, uint256 enterpriseId, address actor)
        internal
        view
        returns (LibEUDR.SupplyActor storage stored)
    {
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        stored = ds.actorsByAddress[enterpriseId][actor];
        if (stored.id == 0 || !stored.active) revert LibEUDR.ActorNotFound(enterpriseId, actor);
    }

    function _requireParcel(LibEUDR.Layout storage ds, uint256 enterpriseId, uint256 parcelId)
        internal
        view
        returns (LibEUDR.Parcel storage stored)
    {
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        stored = ds.parcels[enterpriseId][parcelId];
        if (stored.id == 0) revert LibEUDR.ParcelNotFound(enterpriseId, parcelId);
    }

    function _requireBatch(LibEUDR.Layout storage ds, uint256 enterpriseId, uint256 batchId)
        internal
        view
        returns (LibEUDR.Batch storage stored)
    {
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        stored = ds.batches[enterpriseId][batchId];
        if (stored.id == 0) revert LibEUDR.BatchNotFound(enterpriseId, batchId);
    }

    function _requireCertificate(
        LibEUDR.Layout storage ds,
        uint256 enterpriseId,
        uint256 certificateId
    ) internal view returns (LibEUDR.Certificate storage stored) {
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        stored = ds.certificates[enterpriseId][certificateId];
        if (stored.id == 0) revert LibEUDR.CertificateNotFound(enterpriseId, certificateId);
    }
}
