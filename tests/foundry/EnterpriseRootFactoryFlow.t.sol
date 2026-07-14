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
import { IEnterpriseRegistryFacet } from "../../contracts/interfaces/IEnterpriseRegistryFacet.sol";
import { ICorporateIdentityFacet } from "../../contracts/interfaces/ICorporateIdentityFacet.sol";
import { IEvidenceFacet } from "../../contracts/interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../../contracts/interfaces/IAuditFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { LibAccessControl } from "../../contracts/libraries/LibAccessControl.sol";
import { LibEnterpriseRegistry } from "../../contracts/libraries/LibEnterpriseRegistry.sol";

contract EnterpriseRootFactoryFlowTest is Test {
    address internal symmetryOps = address(0xA11CE);
    address internal enterpriseAdmin = address(0xB0B);
    address internal enterpriseMultisig = address(0xCAFE);
    address internal enterpriseOperator = address(0xD00D);

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

    function testDeployEnterpriseRootEndToEnd() external {
        vm.prank(symmetryOps);
        (address root, uint256 enterpriseId, bytes32 companyKey) = factory.deployEnterpriseRoot(
            IEnterpriseRootFactory.DeployEnterpriseRootParams({
                legalName: "Factory Test Company SAS",
                jurisdictionCode: "CO",
                enterpriseAdmin: enterpriseAdmin,
                enterpriseMultisig: enterpriseMultisig,
                enterpriseMetadataURI: "ipfs://factory-enterprise-metadata",
                enabledServices: 0,
                finalProtocolAdmin: symmetryOps,
                finalUpgradeAdmin: enterpriseMultisig
            })
        );

        vm.prank(enterpriseAdmin);
        ICorporateIdentityFacet(root)
            .createCorporateIdentity(
                enterpriseId,
                "Factory Test Company",
                "did:web:symmetry:factory-test-company",
                "ipfs://factory-credentials",
                keccak256("factory-corp-identity")
            );

        vm.prank(symmetryOps);
        IServiceEntitlementFacet(root)
            .configureEnterpriseService(enterpriseId, 0, true, "ipfs://votoid-service-installer");

        vm.prank(enterpriseAdmin);
        ICorporateIdentityFacet(root).bindEnterpriseWallet(enterpriseId, enterpriseOperator);

        vm.prank(enterpriseAdmin);
        ICorporateIdentityFacet(root)
            .authorizeSigner(enterpriseId, enterpriseOperator, keccak256("BOARD_SECRETARY"));

        uint256 evidenceId;
        vm.prank(enterpriseAdmin);
        evidenceId = IEvidenceFacet(root)
            .anchorEvidenceWithManifest(
                IEvidenceFacet.EvidenceAnchorParams({
                    enterpriseId: enterpriseId,
                    evidenceType: keccak256("BOARD_POLICY"),
                    digest: keccak256("factory-policy-digest"),
                    uri: "s3://factory-test-company/policies/board-policy.pdf",
                    manifestURI: "ipfs://factory-policy-manifest",
                    manifestDigest: keccak256("factory-policy-manifest"),
                    serviceKey: keccak256("votoid"),
                    subjectType: keccak256("policy"),
                    subjectId: keccak256("board-policy")
                })
            );

        uint256 auditId;
        vm.prank(enterpriseAdmin);
        auditId = IAuditFacet(root)
            .createAuditRecordWithContext(
                IAuditFacet.AuditRecordParams({
                    enterpriseId: enterpriseId,
                    category: keccak256("SERVICE_INSTALL"),
                    serviceKey: keccak256("votoid"),
                    actionKey: keccak256("ENABLE_SERVICE"),
                    subjectType: keccak256("service"),
                    subjectId: 0,
                    evidenceDigest: keccak256("factory-policy-digest"),
                    manifestDigest: keccak256("factory-policy-manifest"),
                    noteURI: "ipfs://audit-service-install"
                })
            );

        assertEq(factory.getRootByCompanyKey(companyKey), root);
        assertTrue(factory.isRegisteredRoot(root));
        assertEq(factory.totalRoots(), 1);

        {
            IEnterpriseRegistryFacet.EnterpriseView memory enterprise =
                IEnterpriseRegistryFacet(root).getEnterprise(enterpriseId);
            assertEq(enterprise.id, 1);
            assertEq(enterprise.multisig, enterpriseMultisig);
        }

        {
            IServiceEntitlementFacet.ServiceConfigView memory serviceConfig =
                IServiceEntitlementFacet(root).getEnterpriseService(enterpriseId, 0);
            assertTrue(serviceConfig.enabled);
        }

        {
            IEvidenceFacet.EvidenceView memory evidenceView =
                IEvidenceFacet(root).getEvidence(evidenceId);
            assertEq(evidenceView.serviceKey, keccak256("votoid"));
        }

        {
            IAuditFacet.AuditRecordView memory auditView = IAuditFacet(root).getAuditRecord(auditId);
            assertEq(auditView.serviceKey, keccak256("votoid"));
        }

        assertEq(
            ICorporateIdentityFacet(root).getWalletEnterprise(enterpriseOperator), enterpriseId
        );
    }

    function testUnauthorizedAccountCannotDeployEnterpriseRoot() external {
        vm.expectRevert(
            abi.encodeWithSelector(
                EnterpriseRootFactory.NotFactoryProvisioner.selector, address(this)
            )
        );
        factory.deployEnterpriseRoot(_deploymentParams("Unauthorized Company SAS"));
    }

    function testOwnerCanAuthorizeProvisioner() external {
        vm.prank(symmetryOps);
        factory.setProvisioner(address(this), true);

        (address root,,) = factory.deployEnterpriseRoot(_deploymentParams("Authorized Company SAS"));
        assertTrue(factory.isRegisteredRoot(root));
    }

    function testFactoryOwnershipUsesTwoStepHandoff() external {
        address nextOwner = address(0xBEEF);
        vm.prank(symmetryOps);
        factory.transferOwnership(nextOwner);

        vm.expectRevert(
            abi.encodeWithSelector(
                EnterpriseRootFactory.NotPendingFactoryOwner.selector, address(this)
            )
        );
        factory.acceptOwnership();

        vm.prank(nextOwner);
        factory.acceptOwnership();
        assertEq(factory.owner(), nextOwner);
    }

    function testEnterpriseAdminCannotSelfEnableService() external {
        vm.prank(symmetryOps);
        (address root, uint256 enterpriseId,) =
            factory.deployEnterpriseRoot(_deploymentParams("Entitlement Boundary Company SAS"));

        vm.expectRevert(
            abi.encodeWithSelector(
                LibAccessControl.AccessDenied.selector,
                LibAccessControl.PROTOCOL_ADMIN_ROLE,
                enterpriseAdmin,
                0
            )
        );
        vm.prank(enterpriseAdmin);
        IServiceEntitlementFacet(root)
            .configureEnterpriseService(enterpriseId, 2, true, "ipfs://unauthorized-eudr-config");
    }

    function testInvalidServiceMaskRejected() external {
        IEnterpriseRootFactory.DeployEnterpriseRootParams memory params =
            _deploymentParams("Invalid Service Mask Company SAS");
        params.enabledServices = 8;

        vm.expectRevert(
            abi.encodeWithSelector(LibEnterpriseRegistry.InvalidServiceMask.selector, uint32(8))
        );
        vm.prank(symmetryOps);
        factory.deployEnterpriseRoot(params);
    }

    function _deploymentParams(string memory legalName)
        private
        view
        returns (IEnterpriseRootFactory.DeployEnterpriseRootParams memory params)
    {
        params = IEnterpriseRootFactory.DeployEnterpriseRootParams({
            legalName: legalName,
            jurisdictionCode: "CO",
            enterpriseAdmin: enterpriseAdmin,
            enterpriseMultisig: enterpriseMultisig,
            enterpriseMetadataURI: "ipfs://enterprise-metadata",
            enabledServices: 0,
            finalProtocolAdmin: symmetryOps,
            finalUpgradeAdmin: enterpriseMultisig
        });
    }
}
