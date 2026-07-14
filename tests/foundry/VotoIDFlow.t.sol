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
import { VotoIDFacet } from "../../contracts/facets/VotoIDFacet.sol";
import { IEnterpriseRegistryFacet } from "../../contracts/interfaces/IEnterpriseRegistryFacet.sol";
import { IVotoIDFacet } from "../../contracts/interfaces/IVotoIDFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { IAccessControlFacet } from "../../contracts/interfaces/IAccessControlFacet.sol";
import { ICorporateIdentityFacet } from "../../contracts/interfaces/ICorporateIdentityFacet.sol";
import { IDiamondLoupe } from "../../contracts/interfaces/IDiamondLoupe.sol";
import { IERC173 } from "../../contracts/interfaces/IERC173.sol";
import { IEvidenceFacet } from "../../contracts/interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../../contracts/interfaces/IAuditFacet.sol";

contract VotoIDFlowTest is Test {
    SymmetryDiamond internal diamond;

    address internal protocolAdmin = address(0xA11CE);
    address internal enterpriseAdmin = address(0xB0B);
    address internal enterpriseMultisig = address(0xCAFE);
    address internal chairperson = address(0xC001);
    address internal secretary = address(0xC002);
    address internal memberOne = address(0xC003);
    address internal memberTwo = address(0xC004);
    address internal executor = address(0xC005);

    function setUp() external {
        vm.startPrank(protocolAdmin);

        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        diamond = new SymmetryDiamond(protocolAdmin, address(diamondCutFacet));

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](9);
        cut[0] = _facetCut(address(new DiamondLoupeFacet()), _loupeSelectors());
        cut[1] = _facetCut(address(new OwnershipFacet()), _ownershipSelectors());
        cut[2] = _facetCut(address(new AccessControlFacet()), _accessSelectors());
        cut[3] = _facetCut(address(new EnterpriseRegistryFacet()), _enterpriseSelectors());
        cut[4] = _facetCut(address(new CorporateIdentityFacet()), _identitySelectors());
        cut[5] = _facetCut(address(new EvidenceFacet()), _evidenceSelectors());
        cut[6] = _facetCut(address(new AuditFacet()), _auditSelectors());
        cut[7] = _facetCut(address(new ServiceEntitlementFacet()), _serviceSelectors());
        cut[8] = _facetCut(address(new VotoIDFacet()), _votoIDSelectors());

        DiamondInit init = new DiamondInit();
        DiamondInit.InitArgs memory args =
            DiamondInit.InitArgs({ protocolAdmin: protocolAdmin, upgradeAdmin: protocolAdmin });

        IDiamondCut(address(diamond))
            .diamondCut(cut, address(init), abi.encodeCall(DiamondInit.init, (args)));
        vm.stopPrank();
    }

    function testVotoIDEndToEnd() external {
        IEnterpriseRegistryFacet registry = IEnterpriseRegistryFacet(address(diamond));
        IVotoIDFacet votoID = IVotoIDFacet(address(diamond));
        IServiceEntitlementFacet services = IServiceEntitlementFacet(address(diamond));
        IEvidenceFacet evidence = IEvidenceFacet(address(diamond));
        IAuditFacet audit = IAuditFacet(address(diamond));

        vm.prank(protocolAdmin);
        uint256 enterpriseId = registry.onboardEnterprise(
            "Symmetry Governance Enterprise SAS",
            "CO",
            enterpriseAdmin,
            enterpriseMultisig,
            "ipfs://enterprise-root-votoid",
            0
        );

        vm.prank(protocolAdmin);
        services.configureEnterpriseService(enterpriseId, 0, true, "ipfs://votoid-installer-config");

        vm.prank(enterpriseAdmin);
        votoID.initializeBoard(enterpriseId, chairperson, secretary, 50);

        vm.prank(chairperson);
        votoID.addBoardMember(enterpriseId, memberOne);

        vm.prank(chairperson);
        votoID.addBoardMember(enterpriseId, memberTwo);

        vm.prank(chairperson);
        uint256 sessionId =
            votoID.openSession(enterpriseId, "Zonamerica Cali Strategic Board", 1 days, 1 hours);

        vm.prank(chairperson);
        votoID.joinSession(enterpriseId);
        vm.prank(secretary);
        votoID.joinSession(enterpriseId);
        vm.prank(memberOne);
        votoID.joinSession(enterpriseId);
        vm.prank(memberTwo);
        votoID.joinSession(enterpriseId);

        vm.prank(secretary);
        uint256 proposalId = votoID.createProposal(
            enterpriseId,
            "Approve expansion phase 1",
            "Strategic board approval for expansion phase 1 in Zonamerica Cali.",
            "ipfs://votoid-proposal-manifest",
            keccak256("votoid-proposal-manifest")
        );

        vm.prank(secretary);
        votoID.startDeliberation(enterpriseId, proposalId);

        vm.warp(block.timestamp + 1 days + 1);

        vm.prank(secretary);
        votoID.startVoting(enterpriseId, proposalId);

        vm.prank(chairperson);
        votoID.castVote(enterpriseId, proposalId, true);
        vm.prank(secretary);
        votoID.castVote(enterpriseId, proposalId, true);
        vm.prank(memberOne);
        votoID.castVote(enterpriseId, proposalId, true);
        vm.prank(memberTwo);
        votoID.castVote(enterpriseId, proposalId, false);

        vm.warp(block.timestamp + 1 hours + 1);

        vm.prank(secretary);
        votoID.closeProposal(enterpriseId, proposalId);

        vm.prank(secretary);
        votoID.assignProposalExecutor(enterpriseId, proposalId, executor);

        vm.prank(secretary);
        votoID.closeSession(enterpriseId);

        vm.prank(executor);
        votoID.executeProposal(enterpriseId, proposalId);

        vm.prank(secretary);
        votoID.verifyProposal(enterpriseId, proposalId);

        vm.prank(enterpriseAdmin);
        uint256 evidenceId = evidence.anchorEvidenceWithManifest(
            IEvidenceFacet.EvidenceAnchorParams({
                enterpriseId: enterpriseId,
                evidenceType: keccak256("VOTOID_SESSION_RESULTS"),
                digest: keccak256("votoid-session-results"),
                uri: "s3://symmetry-enterprise-root/votoid/session-results.json",
                manifestURI: "ipfs://votoid-results-manifest",
                manifestDigest: keccak256("votoid-results-manifest"),
                serviceKey: keccak256("votoid"),
                subjectType: keccak256("proposal"),
                subjectId: keccak256("approve-expansion-phase-1")
            })
        );

        vm.prank(enterpriseAdmin);
        uint256 auditId = audit.createAuditRecordWithContext(
            IAuditFacet.AuditRecordParams({
                enterpriseId: enterpriseId,
                category: keccak256("VOTOID_EXECUTION"),
                serviceKey: keccak256("votoid"),
                actionKey: keccak256("VERIFY_PROPOSAL"),
                subjectType: keccak256("proposal"),
                subjectId: proposalId,
                evidenceDigest: keccak256("votoid-session-results"),
                manifestDigest: keccak256("votoid-results-manifest"),
                noteURI: "ipfs://audit-votoid-verify"
            })
        );

        IVotoIDFacet.BoardView memory board = votoID.getBoard(enterpriseId);
        IVotoIDFacet.SessionView memory session = votoID.getSession(enterpriseId, sessionId);
        IVotoIDFacet.ProposalView memory proposal = votoID.getProposal(enterpriseId, proposalId);
        IEvidenceFacet.EvidenceView memory evidenceView = evidence.getEvidence(evidenceId);
        IAuditFacet.AuditRecordView memory auditView = audit.getAuditRecord(auditId);
        IServiceEntitlementFacet.ServiceConfigView memory serviceConfig =
            services.getEnterpriseService(enterpriseId, 0);

        assertTrue(board.initialized);
        assertEq(board.boardMemberCount, 4);
        assertEq(session.activeMemberCount, 4);
        assertEq(proposal.eligibleVoterCount, 4);
        assertEq(proposal.yesVotes, 3);
        assertEq(proposal.noVotes, 1);
        assertEq(proposal.status, 7);
        assertEq(proposal.executor, executor);
        assertEq(evidenceView.serviceKey, keccak256("votoid"));
        assertEq(auditView.serviceKey, keccak256("votoid"));
        assertTrue(serviceConfig.enabled);
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

    function _votoIDSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](25);
        selectors[0] = IVotoIDFacet.initializeBoard.selector;
        selectors[1] = IVotoIDFacet.setChairperson.selector;
        selectors[2] = IVotoIDFacet.setSecretary.selector;
        selectors[3] = IVotoIDFacet.addBoardMember.selector;
        selectors[4] = IVotoIDFacet.removeBoardMember.selector;
        selectors[5] = IVotoIDFacet.openSession.selector;
        selectors[6] = IVotoIDFacet.joinSession.selector;
        selectors[7] = IVotoIDFacet.leaveSession.selector;
        selectors[8] = IVotoIDFacet.closeSession.selector;
        selectors[9] = IVotoIDFacet.createProposal.selector;
        selectors[10] = IVotoIDFacet.startDeliberation.selector;
        selectors[11] = IVotoIDFacet.startVoting.selector;
        selectors[12] = IVotoIDFacet.castVote.selector;
        selectors[13] = IVotoIDFacet.closeProposal.selector;
        selectors[14] = IVotoIDFacet.assignProposalExecutor.selector;
        selectors[15] = IVotoIDFacet.executeProposal.selector;
        selectors[16] = IVotoIDFacet.verifyProposal.selector;
        selectors[17] = IVotoIDFacet.getBoard.selector;
        selectors[18] = IVotoIDFacet.getSession.selector;
        selectors[19] = IVotoIDFacet.getProposal.selector;
        selectors[20] = IVotoIDFacet.isBoardMember.selector;
        selectors[21] = IVotoIDFacet.isSessionActiveMember.selector;
        selectors[22] = IVotoIDFacet.isProposalEligibleVoter.selector;
        selectors[23] = IVotoIDFacet.listBoardMembers.selector;
        selectors[24] = IVotoIDFacet.listSessionProposalIds.selector;
    }
}
