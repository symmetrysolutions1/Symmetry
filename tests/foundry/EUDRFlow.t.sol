// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "../../lib/forge-std/src/Test.sol";
import { EnterpriseRootFactory } from "../../contracts/factory/EnterpriseRootFactory.sol";
import { IEnterpriseRootFactory } from "../../contracts/interfaces/IEnterpriseRootFactory.sol";
import { DiamondCutFacet } from "../../contracts/core/DiamondCutFacet.sol";
import { DiamondLoupeFacet } from "../../contracts/core/DiamondLoupeFacet.sol";
import { OwnershipFacet } from "../../contracts/core/OwnershipFacet.sol";
import { DiamondInit } from "../../contracts/core/DiamondInit.sol";
import { AccessControlFacet } from "../../contracts/facets/AccessControlFacet.sol";
import { EnterpriseRegistryFacet } from "../../contracts/facets/EnterpriseRegistryFacet.sol";
import { CorporateIdentityFacet } from "../../contracts/facets/CorporateIdentityFacet.sol";
import { EvidenceFacet } from "../../contracts/facets/EvidenceFacet.sol";
import { AuditFacet } from "../../contracts/facets/AuditFacet.sol";
import { ServiceEntitlementFacet } from "../../contracts/facets/ServiceEntitlementFacet.sol";
import { VotoIDFacet } from "../../contracts/facets/VotoIDFacet.sol";
import { AutomationFacet } from "../../contracts/facets/AutomationFacet.sol";
import { EUDRFacet } from "../../contracts/facets/EUDRFacet.sol";
import { IAccessControlFacet } from "../../contracts/interfaces/IAccessControlFacet.sol";
import { IEUDRFacet } from "../../contracts/interfaces/IEUDRFacet.sol";
import { IEvidenceFacet } from "../../contracts/interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../../contracts/interfaces/IAuditFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { LibEUDR } from "../../contracts/libraries/LibEUDR.sol";

contract EUDRFlowTest is Test {
    address internal symmetryOps = address(0xA11CE);
    address internal enterpriseAdmin = address(0xB0B);
    address internal enterpriseMultisig = address(0xCAFE);
    address internal exporter = address(0xC001);
    address internal logistics = address(0xC002);
    address internal verifier = address(0xC003);

    EnterpriseRootFactory internal factory;

    function setUp() external {
        vm.startPrank(symmetryOps);
        factory = new EnterpriseRootFactory(
            EnterpriseRootFactory.SharedFacetSet({
                diamondCutFacet: address(new DiamondCutFacet()),
                diamondLoupeFacet: address(new DiamondLoupeFacet()),
                ownershipFacet: address(new OwnershipFacet()),
                accessControlFacet: address(new AccessControlFacet()),
                enterpriseRegistryFacet: address(new EnterpriseRegistryFacet()),
                corporateIdentityFacet: address(new CorporateIdentityFacet()),
                evidenceFacet: address(new EvidenceFacet()),
                auditFacet: address(new AuditFacet()),
                serviceEntitlementFacet: address(new ServiceEntitlementFacet()),
                votoIDFacet: address(new VotoIDFacet()),
                automationFacet: address(new AutomationFacet()),
                eudrFacet: address(new EUDRFacet()),
                diamondInit: address(new DiamondInit())
            }),
            symmetryOps,
            symmetryOps
        );
        vm.stopPrank();
    }

    function testEUDREndToEnd() external {
        vm.prank(symmetryOps);
        (address root, uint256 enterpriseId,) = factory.deployEnterpriseRoot(
            IEnterpriseRootFactory.DeployEnterpriseRootParams({
                legalName: "Symmetry EUDR Enterprise SAS",
                jurisdictionCode: "CO",
                enterpriseAdmin: enterpriseAdmin,
                enterpriseMultisig: enterpriseMultisig,
                enterpriseMetadataURI: "ipfs://symmetry-eudr-enterprise-root",
                enabledServices: 0,
                finalProtocolAdmin: symmetryOps,
                finalUpgradeAdmin: enterpriseMultisig
            })
        );

        vm.prank(symmetryOps);
        IServiceEntitlementFacet(root)
            .configureEnterpriseService(enterpriseId, 2, true, "ipfs://eudr-service-config");

        vm.startPrank(enterpriseAdmin);
        IAccessControlFacet(root).grantEnterpriseRole(enterpriseId, LibEUDR.EXPORTER_ROLE, exporter);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibEUDR.EXPORTER_ROLE, logistics);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibEUDR.EUDR_VERIFIER_ROLE, verifier);
        vm.stopPrank();

        vm.prank(exporter);
        IEUDRFacet(root)
            .registerSupplyActor(
                enterpriseId,
                exporter,
                LibEUDR.EXPORTER_ROLE,
                "Symmetry Export Desk",
                "ipfs://symmetry-exporter-profile"
            );

        vm.prank(exporter);
        IEUDRFacet(root)
            .registerSupplyActor(
                enterpriseId,
                logistics,
                LibEUDR.PRODUCER_ROLE,
                "Symmetry Logistics Hub",
                "ipfs://symmetry-logistics-profile"
            );

        vm.prank(exporter);
        uint256 parcelId = IEUDRFacet(root)
            .registerParcel(
                enterpriseId,
                "CO-VALLE-001-PARCEL",
                keccak256("parcel-geojson"),
                "ipfs://parcel-geojson"
            );

        vm.prank(exporter);
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

        vm.prank(exporter);
        IEUDRFacet(root)
            .transferCustody(
                enterpriseId, batchId, logistics, keccak256("custody-transfer-manifest")
            );

        vm.prank(verifier);
        IEUDRFacet(root)
            .validateDossier(enterpriseId, batchId, 12, true, keccak256("validation-manifest"));

        vm.prank(verifier);
        uint256 certificateId = IEUDRFacet(root)
            .issueCertificate(
                enterpriseId,
                batchId,
                "ipfs://eudr-certificate",
                "ipfs://eudr-passport",
                keccak256("certificate-manifest")
            );

        vm.prank(enterpriseAdmin);
        uint256 evidenceId = IEvidenceFacet(root)
            .anchorEvidenceWithManifest(
                IEvidenceFacet.EvidenceAnchorParams({
                    enterpriseId: enterpriseId,
                    evidenceType: keccak256("EUDR_DOSSIER_PACKAGE"),
                    digest: keccak256("eudr-dossier-package"),
                    uri: "s3://symmetry-enterprise-root/eudr/dossier-package.zip",
                    manifestURI: "ipfs://eudr-dossier-package-manifest",
                    manifestDigest: keccak256("eudr-dossier-package-manifest"),
                    serviceKey: keccak256("eudr"),
                    subjectType: keccak256("batch"),
                    subjectId: keccak256("BATCH-CO-2026-0001")
                })
            );

        vm.prank(enterpriseAdmin);
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

        IEUDRFacet.BatchView memory batchView = IEUDRFacet(root).getBatch(enterpriseId, batchId);
        IEUDRFacet.CertificateView memory certificateView =
            IEUDRFacet(root).getCertificate(enterpriseId, certificateId);
        IEUDRFacet.SupplyActorView memory exporterView =
            IEUDRFacet(root).getSupplyActor(enterpriseId, exporter);
        IServiceEntitlementFacet.ServiceConfigView memory serviceConfig =
            IServiceEntitlementFacet(root).getEnterpriseService(enterpriseId, 2);
        IEvidenceFacet.EvidenceView memory evidenceView =
            IEvidenceFacet(root).getEvidence(evidenceId);
        IAuditFacet.AuditRecordView memory auditView = IAuditFacet(root).getAuditRecord(auditId);

        assertTrue(serviceConfig.enabled);
        assertEq(exporterView.roleKey, LibEUDR.EXPORTER_ROLE);
        assertEq(batchView.status, 4);
        assertEq(batchView.currentCustodian, logistics);
        assertEq(batchView.riskScore, 12);
        assertEq(batchView.certificateId, certificateId);
        assertEq(certificateView.status, 1);
        assertEq(evidenceView.serviceKey, keccak256("eudr"));
        assertEq(auditView.serviceKey, keccak256("eudr"));
    }
}
