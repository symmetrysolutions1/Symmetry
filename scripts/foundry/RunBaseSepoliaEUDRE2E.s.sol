// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "../../lib/forge-std/src/Script.sol";
import { IEnterpriseRootFactory } from "../../contracts/interfaces/IEnterpriseRootFactory.sol";
import { ICorporateIdentityFacet } from "../../contracts/interfaces/ICorporateIdentityFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { IAccessControlFacet } from "../../contracts/interfaces/IAccessControlFacet.sol";
import { IEUDRFacet } from "../../contracts/interfaces/IEUDRFacet.sol";
import { IEvidenceFacet } from "../../contracts/interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../../contracts/interfaces/IAuditFacet.sol";
import { LibEUDR } from "../../contracts/libraries/LibEUDR.sol";

contract RunBaseSepoliaEUDRE2E is Script {
    event EUDRE2ECompleted(
        address indexed root,
        uint256 indexed enterpriseId,
        bytes32 indexed companyKey,
        uint256 parcelId,
        uint256 batchId,
        uint256 certificateId,
        uint256 evidenceId,
        uint256 auditId
    );

    uint256 internal constant EXPORTER_PK = 0xE00111;
    uint256 internal constant LOGISTICS_PK = 0xE00212;
    uint256 internal constant VERIFIER_PK = 0xE00313;
    uint256 internal constant ACTOR_FUNDING = 0.001 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_DEPLOYER");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        address deployer = vm.addr(deployerPrivateKey);
        address exporter = vm.addr(EXPORTER_PK);
        address logistics = vm.addr(LOGISTICS_PK);
        address verifier = vm.addr(VERIFIER_PK);

        string memory legalName = "Symmetry EUDR Live Base Sepolia";

        vm.startBroadcast(deployerPrivateKey);
        _fundActor(exporter);
        _fundActor(logistics);
        _fundActor(verifier);

        (address root, uint256 enterpriseId, bytes32 companyKey) = IEnterpriseRootFactory(
                factoryAddress
            )
            .deployEnterpriseRoot(
                IEnterpriseRootFactory.DeployEnterpriseRootParams({
                    legalName: legalName,
                    jurisdictionCode: "CO",
                    enterpriseAdmin: deployer,
                    enterpriseMultisig: deployer,
                    enterpriseMetadataURI: "ipfs://symmetry-eudr-live-root",
                    enabledServices: 4,
                    finalProtocolAdmin: deployer,
                    finalUpgradeAdmin: deployer
                })
            );

        ICorporateIdentityFacet(root)
            .createCorporateIdentity(
                enterpriseId,
                legalName,
                "did:symmetry:enterprise:base-sepolia-eudr-live",
                "ipfs://symmetry-eudr-live-credentials",
                keccak256(bytes(legalName))
            );

        IServiceEntitlementFacet(root)
            .configureEnterpriseService(enterpriseId, 2, true, "ipfs://symmetry-eudr-live-config");

        IAccessControlFacet(root).grantEnterpriseRole(enterpriseId, LibEUDR.EXPORTER_ROLE, exporter);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibEUDR.EXPORTER_ROLE, logistics);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibEUDR.EUDR_VERIFIER_ROLE, verifier);
        vm.stopBroadcast();

        vm.startBroadcast(EXPORTER_PK);
        IEUDRFacet(root)
            .registerSupplyActor(
                enterpriseId,
                exporter,
                LibEUDR.EXPORTER_ROLE,
                "Symmetry Export Desk",
                "ipfs://symmetry-exporter-profile"
            );

        IEUDRFacet(root)
            .registerSupplyActor(
                enterpriseId,
                logistics,
                LibEUDR.PRODUCER_ROLE,
                "Symmetry Logistics Hub",
                "ipfs://symmetry-logistics-profile"
            );

        uint256 parcelId = IEUDRFacet(root)
            .registerParcel(
                enterpriseId,
                "CO-VALLE-001-PARCEL",
                keccak256("parcel-geojson"),
                "ipfs://parcel-geojson"
            );

        uint256 batchId = IEUDRFacet(root)
            .createBatch(
                enterpriseId,
                "BATCH-CO-2026-0001",
                parcelId,
                5000,
                "kg",
                "ipfs://batch-dossier-manifest",
                keccak256("batch-dossier-manifest")
            );

        IEUDRFacet(root)
            .transferCustody(
                enterpriseId, batchId, logistics, keccak256("custody-transfer-manifest")
            );
        vm.stopBroadcast();

        vm.startBroadcast(VERIFIER_PK);
        IEUDRFacet(root)
            .validateDossier(enterpriseId, batchId, 12, true, keccak256("validation-manifest"));

        uint256 certificateId = IEUDRFacet(root)
            .issueCertificate(
                enterpriseId,
                batchId,
                "ipfs://eudr-certificate",
                "ipfs://eudr-passport",
                keccak256("certificate-manifest")
            );
        vm.stopBroadcast();

        vm.startBroadcast(deployerPrivateKey);
        uint256 evidenceId = IEvidenceFacet(root)
            .anchorEvidenceWithManifest(
                IEvidenceFacet.EvidenceAnchorParams({
                    enterpriseId: enterpriseId,
                    evidenceType: keccak256("EUDR_DOSSIER_PACKAGE"),
                    digest: keccak256("eudr-dossier-package"),
                    uri: "ipfs://symmetry-eudr-live-dossier-package",
                    manifestURI: "ipfs://eudr-dossier-package-manifest",
                    manifestDigest: keccak256("eudr-dossier-package-manifest"),
                    serviceKey: keccak256("eudr"),
                    subjectType: keccak256("batch"),
                    subjectId: keccak256("BATCH-CO-2026-0001")
                })
            );

        uint256 auditId = IAuditFacet(root)
            .createAuditRecordWithContext(
                IAuditFacet.AuditRecordParams({
                    enterpriseId: enterpriseId,
                    category: keccak256("EUDR_CERTIFICATION"),
                    serviceKey: keccak256("eudr"),
                    actionKey: keccak256("ISSUE_CERTIFICATE"),
                    subjectType: keccak256("certificate"),
                    subjectId: certificateId,
                    evidenceDigest: keccak256("eudr-dossier-package"),
                    manifestDigest: keccak256("certificate-manifest"),
                    noteURI: "ipfs://audit-eudr-certificate"
                })
            );
        vm.stopBroadcast();

        IEUDRFacet.BatchView memory batchView = IEUDRFacet(root).getBatch(enterpriseId, batchId);
        IEUDRFacet.CertificateView memory certificateView =
            IEUDRFacet(root).getCertificate(enterpriseId, certificateId);
        require(batchView.status == 4, "batch not certified");
        require(certificateView.status == 1, "certificate not issued");

        emit EUDRE2ECompleted(
            root, enterpriseId, companyKey, parcelId, batchId, certificateId, evidenceId, auditId
        );
    }

    function _fundActor(address actor) internal {
        (bool success,) = actor.call{ value: ACTOR_FUNDING }("");
        require(success, "actor funding failed");
    }
}
