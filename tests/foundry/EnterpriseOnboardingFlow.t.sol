// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "../../lib/forge-std/src/Test.sol";
import { IDiamondCut } from "../../contracts/interfaces/IDiamondCut.sol";
import { SymmetryDiamond } from "../../contracts/core/SymmetryDiamond.sol";
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
import { IEnterpriseRegistryFacet } from "../../contracts/interfaces/IEnterpriseRegistryFacet.sol";
import { ICorporateIdentityFacet } from "../../contracts/interfaces/ICorporateIdentityFacet.sol";
import { IEvidenceFacet } from "../../contracts/interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../../contracts/interfaces/IAuditFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { IAccessControlFacet } from "../../contracts/interfaces/IAccessControlFacet.sol";
import { IDiamondLoupe } from "../../contracts/interfaces/IDiamondLoupe.sol";
import { IERC173 } from "../../contracts/interfaces/IERC173.sol";

contract EnterpriseOnboardingFlowTest is Test {
    SymmetryDiamond internal diamond;

    address internal protocolAdmin = address(0xA11CE);
    address internal enterpriseAdmin = address(0xB0B);
    address internal enterpriseMultisig = address(0xCAFE);
    address internal enterpriseOperator = address(0xD00D);

    function setUp() external {
        vm.startPrank(protocolAdmin);

        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        diamond = new SymmetryDiamond(protocolAdmin, address(diamondCutFacet));

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](8);
        cut[0] = _facetCut(address(new DiamondLoupeFacet()), _loupeSelectors());
        cut[1] = _facetCut(address(new OwnershipFacet()), _ownershipSelectors());
        cut[2] = _facetCut(address(new AccessControlFacet()), _accessSelectors());
        cut[3] = _facetCut(address(new EnterpriseRegistryFacet()), _enterpriseSelectors());
        cut[4] = _facetCut(address(new CorporateIdentityFacet()), _identitySelectors());
        cut[5] = _facetCut(address(new EvidenceFacet()), _evidenceSelectors());
        cut[6] = _facetCut(address(new AuditFacet()), _auditSelectors());
        cut[7] = _facetCut(address(new ServiceEntitlementFacet()), _serviceSelectors());

        DiamondInit init = new DiamondInit();
        DiamondInit.InitArgs memory args =
            DiamondInit.InitArgs({ protocolAdmin: protocolAdmin, upgradeAdmin: protocolAdmin });

        IDiamondCut(address(diamond))
            .diamondCut(cut, address(init), abi.encodeCall(DiamondInit.init, (args)));
        vm.stopPrank();
    }

    function testEnterpriseOnboardingEndToEnd() external {
        IEnterpriseRegistryFacet registry = IEnterpriseRegistryFacet(address(diamond));
        ICorporateIdentityFacet identity = ICorporateIdentityFacet(address(diamond));
        IEvidenceFacet evidence = IEvidenceFacet(address(diamond));
        IAuditFacet audit = IAuditFacet(address(diamond));
        IServiceEntitlementFacet services = IServiceEntitlementFacet(address(diamond));
        IAccessControlFacet access = IAccessControlFacet(address(diamond));

        vm.prank(protocolAdmin);
        uint256 enterpriseId = registry.onboardEnterprise(
            "Symmetry Test Exporters SAS",
            "CO",
            enterpriseAdmin,
            enterpriseMultisig,
            "ipfs://enterprise-metadata",
            0
        );

        vm.prank(enterpriseAdmin);
        identity.createCorporateIdentity(
            enterpriseId,
            "Symmetry Test Exporters",
            "did:web:symmetry:test-exporters",
            "ipfs://credentials-bundle",
            keccak256("corp-identity")
        );

        vm.prank(enterpriseAdmin);
        access.grantEnterpriseRole(
            enterpriseId, keccak256("ENTERPRISE_AUDITOR_ROLE"), enterpriseOperator
        );

        vm.prank(enterpriseAdmin);
        access.grantEnterpriseRole(
            enterpriseId, keccak256("ENTERPRISE_OPERATOR_ROLE"), enterpriseOperator
        );

        vm.prank(enterpriseAdmin);
        identity.bindEnterpriseWallet(enterpriseId, enterpriseOperator);

        vm.prank(enterpriseAdmin);
        identity.authorizeSigner(enterpriseId, enterpriseOperator, keccak256("SIGNER_ONBOARDING"));

        vm.prank(protocolAdmin);
        services.configureEnterpriseService(enterpriseId, 0, true, "ipfs://votoid-config");

        vm.prank(enterpriseOperator);
        uint256 evidenceId = evidence.anchorEvidenceWithManifest(
            IEvidenceFacet.EvidenceAnchorParams({
                enterpriseId: enterpriseId,
                evidenceType: keccak256("KYB_PACKAGE"),
                digest: keccak256("kyb-digest"),
                uri: "s3://symmetry-enterprise-root/evidence/kyb-package.zip",
                manifestURI: "ipfs://manifest-kyb-package",
                manifestDigest: keccak256("kyb-manifest"),
                serviceKey: keccak256("shared"),
                subjectType: keccak256("enterprise"),
                subjectId: keccak256("onboarding-kyb")
            })
        );

        vm.prank(enterpriseOperator);
        evidence.updateEvidenceManifest(
            enterpriseId, evidenceId, "ar://manifest-kyb-package-v2", keccak256("kyb-manifest-v2")
        );

        vm.prank(enterpriseOperator);
        uint256 auditId = audit.createAuditRecord(
            enterpriseId,
            keccak256("ONBOARDING"),
            keccak256("ENTERPRISE"),
            enterpriseId,
            keccak256("kyb-digest"),
            "ipfs://audit-note"
        );

        IEnterpriseRegistryFacet.EnterpriseView memory enterprise =
            registry.getEnterprise(enterpriseId);
        ICorporateIdentityFacet.CorporateIdentityView memory corporateIdentity =
            identity.getCorporateIdentity(enterpriseId);
        IEvidenceFacet.EvidenceView memory evidenceView = evidence.getEvidence(evidenceId);
        IAuditFacet.AuditRecordView memory auditView = audit.getAuditRecord(auditId);
        IServiceEntitlementFacet.ServiceConfigView memory votoIdConfig =
            services.getEnterpriseService(enterpriseId, 0);

        assertEq(enterprise.id, 1);
        assertEq(enterprise.admin, enterpriseAdmin);
        assertEq(corporateIdentity.enterpriseId, enterpriseId);
        assertEq(evidenceView.enterpriseId, enterpriseId);
        assertEq(evidenceView.manifestDigest, keccak256("kyb-manifest-v2"));
        assertEq(evidenceView.subjectType, keccak256("enterprise"));
        assertEq(auditView.enterpriseId, enterpriseId);
        assertTrue(votoIdConfig.enabled);
        assertEq(identity.getWalletEnterprise(enterpriseOperator), enterpriseId);
    }

    function _facetCut(address facetAddress, bytes4[] memory selectors)
        internal
        pure
        returns (IDiamondCut.FacetCut memory)
    {
        return IDiamondCut.FacetCut({
            facetAddress: facetAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });
    }

    function _loupeSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](4);
        selectors[0] = IDiamondLoupe.facets.selector;
        selectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        selectors[2] = IDiamondLoupe.facetAddresses.selector;
        selectors[3] = IDiamondLoupe.facetAddress.selector;
    }

    function _ownershipSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](2);
        selectors[0] = IERC173.owner.selector;
        selectors[1] = IERC173.transferOwnership.selector;
    }

    function _accessSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](9);
        selectors[0] = IAccessControlFacet.grantGlobalRole.selector;
        selectors[1] = IAccessControlFacet.revokeGlobalRole.selector;
        selectors[2] = IAccessControlFacet.hasGlobalRole.selector;
        selectors[3] = IAccessControlFacet.grantEnterpriseRole.selector;
        selectors[4] = IAccessControlFacet.revokeEnterpriseRole.selector;
        selectors[5] = IAccessControlFacet.hasEnterpriseRole.selector;
        selectors[6] = IAccessControlFacet.assignEnterpriseDelegate.selector;
        selectors[7] = IAccessControlFacet.revokeEnterpriseDelegate.selector;
        selectors[8] = IAccessControlFacet.isEnterpriseDelegate.selector;
    }

    function _enterpriseSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](8);
        selectors[0] = IEnterpriseRegistryFacet.onboardEnterprise.selector;
        selectors[1] = IEnterpriseRegistryFacet.setEnterpriseServices.selector;
        selectors[2] = IEnterpriseRegistryFacet.setEnterpriseAdmin.selector;
        selectors[3] = IEnterpriseRegistryFacet.setEnterpriseMultisig.selector;
        selectors[4] = IEnterpriseRegistryFacet.setEnterpriseStatus.selector;
        selectors[5] = IEnterpriseRegistryFacet.setEnterpriseMetadata.selector;
        selectors[6] = IEnterpriseRegistryFacet.getEnterprise.selector;
        selectors[7] = IEnterpriseRegistryFacet.getEnterpriseIdByLegalEntityKey.selector;
    }

    function _identitySelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](11);
        selectors[0] = ICorporateIdentityFacet.createCorporateIdentity.selector;
        selectors[1] = ICorporateIdentityFacet.setCorporateIdentityStatus.selector;
        selectors[2] = ICorporateIdentityFacet.setCorporateIdentityCredentials.selector;
        selectors[3] = ICorporateIdentityFacet.bindEnterpriseWallet.selector;
        selectors[4] = ICorporateIdentityFacet.unbindEnterpriseWallet.selector;
        selectors[5] = ICorporateIdentityFacet.authorizeSigner.selector;
        selectors[6] = ICorporateIdentityFacet.revokeSigner.selector;
        selectors[7] = ICorporateIdentityFacet.getCorporateIdentity.selector;
        selectors[8] = ICorporateIdentityFacet.getWalletEnterprise.selector;
        selectors[9] = ICorporateIdentityFacet.isEnterpriseWallet.selector;
        selectors[10] = ICorporateIdentityFacet.getAuthorizedSigner.selector;
    }

    function _evidenceSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](6);
        selectors[0] = IEvidenceFacet.anchorEvidence.selector;
        selectors[1] = IEvidenceFacet.anchorEvidenceWithManifest.selector;
        selectors[2] = IEvidenceFacet.setEvidenceStatus.selector;
        selectors[3] = IEvidenceFacet.updateEvidenceManifest.selector;
        selectors[4] = IEvidenceFacet.getEvidence.selector;
        selectors[5] = IEvidenceFacet.listEnterpriseEvidence.selector;
    }

    function _auditSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](4);
        selectors[0] = IAuditFacet.createAuditRecord.selector;
        selectors[1] = IAuditFacet.createAuditRecordWithContext.selector;
        selectors[2] = IAuditFacet.getAuditRecord.selector;
        selectors[3] = IAuditFacet.listEnterpriseAuditRecords.selector;
    }

    function _serviceSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](2);
        selectors[0] = IServiceEntitlementFacet.configureEnterpriseService.selector;
        selectors[1] = IServiceEntitlementFacet.getEnterpriseService.selector;
    }
}
