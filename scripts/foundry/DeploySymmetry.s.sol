// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "../../lib/forge-std/src/Script.sol";
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
import { AutomationFacet } from "../../contracts/facets/AutomationFacet.sol";
import { EUDRFacet } from "../../contracts/facets/EUDRFacet.sol";
import { IDiamondLoupe } from "../../contracts/interfaces/IDiamondLoupe.sol";
import { IERC173 } from "../../contracts/interfaces/IERC173.sol";
import { IAccessControlFacet } from "../../contracts/interfaces/IAccessControlFacet.sol";
import { IEnterpriseRegistryFacet } from "../../contracts/interfaces/IEnterpriseRegistryFacet.sol";
import { ICorporateIdentityFacet } from "../../contracts/interfaces/ICorporateIdentityFacet.sol";
import { IEvidenceFacet } from "../../contracts/interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../../contracts/interfaces/IAuditFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { IVotoIDFacet } from "../../contracts/interfaces/IVotoIDFacet.sol";
import { IAutomationFacet } from "../../contracts/interfaces/IAutomationFacet.sol";
import { IEUDRFacet } from "../../contracts/interfaces/IEUDRFacet.sol";

contract DeploySymmetry is Script {
    function run() external {
        uint256 deployerPrivateKey = _loadDeployerPrivateKey();
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        SymmetryDiamond diamond = new SymmetryDiamond(deployer, address(diamondCutFacet));
        DiamondInit init = new DiamondInit();
        IDiamondCut.FacetCut[] memory cut = _buildCuts();

        DiamondInit.InitArgs memory args =
            DiamondInit.InitArgs({ protocolAdmin: deployer, upgradeAdmin: deployer });

        IDiamondCut(address(diamond))
            .diamondCut(cut, address(init), abi.encodeCall(DiamondInit.init, (args)));

        vm.stopBroadcast();
    }

    function _buildCuts() internal returns (IDiamondCut.FacetCut[] memory cut) {
        cut = new IDiamondCut.FacetCut[](11);
        cut[0] = _facetCut(address(new DiamondLoupeFacet()), _loupeSelectors());
        cut[1] = _facetCut(address(new OwnershipFacet()), _ownershipSelectors());
        cut[2] = _facetCut(address(new AccessControlFacet()), _accessSelectors());
        cut[3] = _facetCut(address(new EnterpriseRegistryFacet()), _enterpriseSelectors());
        cut[4] = _facetCut(address(new CorporateIdentityFacet()), _identitySelectors());
        cut[5] = _facetCut(address(new EvidenceFacet()), _evidenceSelectors());
        cut[6] = _facetCut(address(new AuditFacet()), _auditSelectors());
        cut[7] = _facetCut(address(new ServiceEntitlementFacet()), _serviceSelectors());
        cut[8] = _facetCut(address(new VotoIDFacet()), _votoIDSelectors());
        cut[9] = _facetCut(address(new AutomationFacet()), _automationSelectors());
        cut[10] = _facetCut(address(new EUDRFacet()), _eudrSelectors());
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

    function _automationSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](15);
        selectors[0] = IAutomationFacet.registerProcessTemplate.selector;
        selectors[1] = IAutomationFacet.setProcessTemplateStatus.selector;
        selectors[2] = IAutomationFacet.instantiateProcess.selector;
        selectors[3] = IAutomationFacet.completeCheckpoint.selector;
        selectors[4] = IAutomationFacet.submitOracleAttestation.selector;
        selectors[5] = IAutomationFacet.escalateProcess.selector;
        selectors[6] = IAutomationFacet.finalizeProcess.selector;
        selectors[7] = IAutomationFacet.failProcess.selector;
        selectors[8] = IAutomationFacet.cancelProcess.selector;
        selectors[9] = IAutomationFacet.getProcessTemplate.selector;
        selectors[10] = IAutomationFacet.getCheckpointDefinition.selector;
        selectors[11] = IAutomationFacet.getProcessInstance.selector;
        selectors[12] = IAutomationFacet.getCheckpointRecord.selector;
        selectors[13] = IAutomationFacet.listEnterpriseTemplateIds.selector;
        selectors[14] = IAutomationFacet.listEnterpriseInstanceIds.selector;
    }

    function _eudrSelectors() internal pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](14);
        selectors[0] = IEUDRFacet.registerSupplyActor.selector;
        selectors[1] = IEUDRFacet.registerParcel.selector;
        selectors[2] = IEUDRFacet.createBatch.selector;
        selectors[3] = IEUDRFacet.transferCustody.selector;
        selectors[4] = IEUDRFacet.validateDossier.selector;
        selectors[5] = IEUDRFacet.issueCertificate.selector;
        selectors[6] = IEUDRFacet.revokeCertificate.selector;
        selectors[7] = IEUDRFacet.getSupplyActor.selector;
        selectors[8] = IEUDRFacet.getParcel.selector;
        selectors[9] = IEUDRFacet.getBatch.selector;
        selectors[10] = IEUDRFacet.getCertificate.selector;
        selectors[11] = IEUDRFacet.listEnterpriseParcels.selector;
        selectors[12] = IEUDRFacet.listEnterpriseBatches.selector;
        selectors[13] = IEUDRFacet.listEnterpriseCertificates.selector;
    }

    function _loadDeployerPrivateKey() internal returns (uint256) {
        try vm.envUint("PRIVATE_KEY_DEPLOYER") returns (uint256 privateKey) {
            return privateKey;
        } catch {
            return vm.envUint("PRIVATE_KEY");
        }
    }
}
