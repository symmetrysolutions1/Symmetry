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
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { IVotoIDFacet } from "../../contracts/interfaces/IVotoIDFacet.sol";
import { IAutomationFacet } from "../../contracts/interfaces/IAutomationFacet.sol";
import { IAccessControlFacet } from "../../contracts/interfaces/IAccessControlFacet.sol";
import { IEUDRFacet } from "../../contracts/interfaces/IEUDRFacet.sol";
import { IEnterpriseRegistryFacet } from "../../contracts/interfaces/IEnterpriseRegistryFacet.sol";
import { LibAutomation } from "../../contracts/libraries/LibAutomation.sol";
import { LibEUDR } from "../../contracts/libraries/LibEUDR.sol";
import { LibServiceEntitlement } from "../../contracts/libraries/LibServiceEntitlement.sol";

contract SymmetryEnterpriseServicesFlowTest is Test {
    address internal symmetryOps = address(0xA11CE);
    address internal symmetryAdmin = address(0xB0B);
    address internal symmetryMultisig = address(0xCAFE);
    address internal chairperson = address(0xC001);
    address internal secretary = address(0xC002);
    address internal boardMember = address(0xC003);
    address internal processManager = address(0xC004);
    address internal exporter = address(0xC005);
    address internal verifier = address(0xC006);

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

    function testDeploySymmetryEnterpriseRootWithAllServicesActive() external {
        vm.prank(symmetryOps);
        (address root, uint256 enterpriseId,) = factory.deployEnterpriseRoot(
            IEnterpriseRootFactory.DeployEnterpriseRootParams({
                legalName: "Symmetry Enterprises SAS",
                jurisdictionCode: "CO",
                enterpriseAdmin: symmetryAdmin,
                enterpriseMultisig: symmetryMultisig,
                enterpriseMetadataURI: "ipfs://symmetry-enterprise-root-profile",
                enabledServices: 7,
                finalProtocolAdmin: symmetryOps,
                finalUpgradeAdmin: symmetryMultisig
            })
        );

        vm.startPrank(symmetryOps);
        IServiceEntitlementFacet(root)
            .configureEnterpriseService(
                enterpriseId, 0, true, "ipfs://symmetry-votoid-service-config"
            );
        IServiceEntitlementFacet(root)
            .configureEnterpriseService(
                enterpriseId, 1, true, "ipfs://symmetry-automation-service-config"
            );
        IServiceEntitlementFacet(root)
            .configureEnterpriseService(
                enterpriseId, 2, true, "ipfs://symmetry-eudr-service-config"
            );
        vm.stopPrank();

        vm.startPrank(symmetryAdmin);
        IVotoIDFacet(root).initializeBoard(enterpriseId, chairperson, secretary, 50);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibAutomation.PROCESS_MANAGER_ROLE, processManager);
        IAccessControlFacet(root).grantEnterpriseRole(enterpriseId, LibEUDR.EXPORTER_ROLE, exporter);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibEUDR.EUDR_VERIFIER_ROLE, verifier);
        vm.stopPrank();

        vm.prank(chairperson);
        IVotoIDFacet(root).addBoardMember(enterpriseId, boardMember);

        vm.prank(processManager);
        uint256 templateId = IAutomationFacet(root)
            .registerProcessTemplate(
                enterpriseId,
                IAutomationFacet.ProcessTemplateRegistration({
                    name: "Symmetry Root Approval Flow",
                    configURI: "ipfs://symmetry-automation-template",
                    configDigest: keccak256("symmetry-automation-template"),
                    checkpointKeys: _checkpointKeys(),
                    checkpointRoles: _checkpointRoles(),
                    evidenceRequired: _evidenceRequired(),
                    oracleRequired: _oracleRequired()
                })
            );

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
        uint256 parcelId = IEUDRFacet(root)
            .registerParcel(
                enterpriseId,
                "CO-VALLE-0001",
                keccak256("parcel-geojson"),
                "ipfs://symmetry-parcel-metadata"
            );

        vm.prank(exporter);
        uint256 batchId = IEUDRFacet(root)
            .createBatch(
                enterpriseId,
                "BATCH-2026-0001",
                parcelId,
                1200,
                "kg",
                "ipfs://symmetry-batch-dossier",
                keccak256("symmetry-batch-dossier")
            );

        vm.prank(verifier);
        IEUDRFacet(root)
            .validateDossier(
                enterpriseId, batchId, 18, true, keccak256("symmetry-validation-manifest")
            );

        vm.prank(verifier);
        uint256 certificateId = IEUDRFacet(root)
            .issueCertificate(
                enterpriseId,
                batchId,
                "ipfs://symmetry-certificate",
                "ipfs://symmetry-passport",
                keccak256("symmetry-certificate-manifest")
            );

        IServiceEntitlementFacet.ServiceConfigView memory votoId =
            IServiceEntitlementFacet(root).getEnterpriseService(enterpriseId, 0);
        IServiceEntitlementFacet.ServiceConfigView memory automation =
            IServiceEntitlementFacet(root).getEnterpriseService(enterpriseId, 1);
        IServiceEntitlementFacet.ServiceConfigView memory eudr =
            IServiceEntitlementFacet(root).getEnterpriseService(enterpriseId, 2);
        IVotoIDFacet.BoardView memory board = IVotoIDFacet(root).getBoard(enterpriseId);
        IAutomationFacet.ProcessTemplateView memory templateView =
            IAutomationFacet(root).getProcessTemplate(enterpriseId, templateId);
        IEUDRFacet.BatchView memory batchView = IEUDRFacet(root).getBatch(enterpriseId, batchId);
        IEUDRFacet.CertificateView memory certificateView =
            IEUDRFacet(root).getCertificate(enterpriseId, certificateId);

        assertTrue(votoId.enabled);
        assertTrue(automation.enabled);
        assertTrue(eudr.enabled);
        assertEq(board.boardMemberCount, 3);
        assertEq(board.chairperson, chairperson);
        assertEq(board.secretary, secretary);
        assertEq(templateView.checkpointCount, 2);
        assertTrue(templateView.active);
        assertEq(batchView.status, 4);
        assertEq(certificateView.status, 1);
    }

    function testDisabledServicesRejectOperations() external {
        (address root, uint256 enterpriseId) = _deployRoot("Disabled Services Company SAS", 0);

        vm.expectRevert(
            abi.encodeWithSelector(
                LibServiceEntitlement.ServiceNotEnabled.selector,
                enterpriseId,
                LibServiceEntitlement.SERVICE_VOTO_ID
            )
        );
        vm.prank(symmetryAdmin);
        IVotoIDFacet(root).initializeBoard(enterpriseId, chairperson, secretary, 50);

        vm.expectRevert(
            abi.encodeWithSelector(
                LibServiceEntitlement.ServiceNotEnabled.selector,
                enterpriseId,
                LibServiceEntitlement.SERVICE_AUTOMATION
            )
        );
        vm.prank(symmetryAdmin);
        IAutomationFacet(root)
            .registerProcessTemplate(
                enterpriseId,
                IAutomationFacet.ProcessTemplateRegistration({
                    name: "Blocked Flow",
                    configURI: "ipfs://blocked-flow",
                    configDigest: keccak256("blocked-flow"),
                    checkpointKeys: _checkpointKeys(),
                    checkpointRoles: _checkpointRoles(),
                    evidenceRequired: _evidenceRequired(),
                    oracleRequired: _oracleRequired()
                })
            );

        vm.expectRevert(
            abi.encodeWithSelector(
                LibServiceEntitlement.ServiceNotEnabled.selector,
                enterpriseId,
                LibServiceEntitlement.SERVICE_EUDR
            )
        );
        vm.prank(symmetryAdmin);
        IEUDRFacet(root)
            .registerSupplyActor(
                enterpriseId,
                symmetryAdmin,
                LibEUDR.EXPORTER_ROLE,
                "Blocked Exporter",
                "ipfs://blocked-exporter"
            );
    }

    function testInactiveEnterpriseRejectsServiceOperations() external {
        (address root, uint256 enterpriseId) = _deployRoot("Inactive Company SAS", 7);

        vm.prank(symmetryAdmin);
        IEnterpriseRegistryFacet(root).setEnterpriseStatus(enterpriseId, false);

        vm.expectRevert(
            abi.encodeWithSelector(LibServiceEntitlement.EnterpriseInactive.selector, enterpriseId)
        );
        vm.prank(symmetryAdmin);
        IVotoIDFacet(root).initializeBoard(enterpriseId, chairperson, secretary, 50);
    }

    function _deployRoot(string memory legalName, uint32 enabledServices)
        internal
        returns (address root, uint256 enterpriseId)
    {
        vm.prank(symmetryOps);
        (root, enterpriseId,) = factory.deployEnterpriseRoot(
            IEnterpriseRootFactory.DeployEnterpriseRootParams({
                legalName: legalName,
                jurisdictionCode: "CO",
                enterpriseAdmin: symmetryAdmin,
                enterpriseMultisig: symmetryMultisig,
                enterpriseMetadataURI: "ipfs://service-gate-test",
                enabledServices: enabledServices,
                finalProtocolAdmin: symmetryOps,
                finalUpgradeAdmin: symmetryMultisig
            })
        );
    }

    function _checkpointKeys() internal pure returns (bytes32[] memory keys) {
        keys = new bytes32[](2);
        keys[0] = keccak256("MANAGER_APPROVAL");
        keys[1] = keccak256("ORACLE_CONFIRMATION");
    }

    function _checkpointRoles() internal pure returns (bytes32[] memory roles) {
        roles = new bytes32[](2);
        roles[0] = LibAutomation.PROCESS_MANAGER_ROLE;
        roles[1] = LibAutomation.PROCESS_MANAGER_ROLE;
    }

    function _evidenceRequired() internal pure returns (bool[] memory values) {
        values = new bool[](2);
        values[0] = true;
        values[1] = false;
    }

    function _oracleRequired() internal pure returns (bool[] memory values) {
        values = new bool[](2);
        values[0] = false;
        values[1] = true;
    }
}
