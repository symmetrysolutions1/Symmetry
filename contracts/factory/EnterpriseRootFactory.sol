// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IEnterpriseRootFactory } from "../interfaces/IEnterpriseRootFactory.sol";
import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { IDiamondLoupe } from "../interfaces/IDiamondLoupe.sol";
import { IERC173 } from "../interfaces/IERC173.sol";
import { IAccessControlFacet } from "../interfaces/IAccessControlFacet.sol";
import { IEnterpriseRegistryFacet } from "../interfaces/IEnterpriseRegistryFacet.sol";
import { ICorporateIdentityFacet } from "../interfaces/ICorporateIdentityFacet.sol";
import { IEvidenceFacet } from "../interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../interfaces/IAuditFacet.sol";
import { IServiceEntitlementFacet } from "../interfaces/IServiceEntitlementFacet.sol";
import { IVotoIDFacet } from "../interfaces/IVotoIDFacet.sol";
import { IAutomationFacet } from "../interfaces/IAutomationFacet.sol";
import { IEUDRFacet } from "../interfaces/IEUDRFacet.sol";
import { SymmetryDiamond } from "../core/SymmetryDiamond.sol";
import { DiamondInit } from "../core/DiamondInit.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibEnterpriseRegistry } from "../libraries/LibEnterpriseRegistry.sol";

contract EnterpriseRootFactory is IEnterpriseRootFactory {
    error RootAlreadyExists(bytes32 companyKey);
    error InvalidAddress();
    error NotFactoryOwner(address caller);
    error NotFactoryProvisioner(address caller);
    error NotPendingFactoryOwner(address caller);

    struct SharedFacetSet {
        address diamondCutFacet;
        address diamondLoupeFacet;
        address ownershipFacet;
        address accessControlFacet;
        address enterpriseRegistryFacet;
        address corporateIdentityFacet;
        address evidenceFacet;
        address auditFacet;
        address serviceEntitlementFacet;
        address votoIDFacet;
        address automationFacet;
        address eudrFacet;
        address diamondInit;
    }

    SharedFacetSet public sharedFacets;
    address public owner;
    address public pendingOwner;
    mapping(address => bool) private provisioners;
    mapping(bytes32 => address) private rootByCompanyKey;
    mapping(address => bool) private registeredRoots;
    address[] private allRoots;

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotFactoryOwner(msg.sender);
        _;
    }

    modifier onlyProvisioner() {
        if (msg.sender != owner && !provisioners[msg.sender]) {
            revert NotFactoryProvisioner(msg.sender);
        }
        _;
    }

    constructor(
        SharedFacetSet memory sharedFacets_,
        address initialOwner,
        address initialProvisioner
    ) {
        _requireFacetSet(sharedFacets_);
        if (initialOwner == address(0) || initialProvisioner == address(0)) {
            revert InvalidAddress();
        }
        sharedFacets = sharedFacets_;
        owner = initialOwner;
        provisioners[initialProvisioner] = true;
        emit FactoryOwnershipTransferred(address(0), initialOwner);
        emit FactoryProvisionerUpdated(initialProvisioner, true);
    }

    function deployEnterpriseRoot(DeployEnterpriseRootParams calldata params)
        external
        onlyProvisioner
        returns (address root, uint256 localEnterpriseId, bytes32 companyKey)
    {
        if (params.enterpriseAdmin == address(0) || params.enterpriseMultisig == address(0)) revert InvalidAddress();
        if (params.finalProtocolAdmin == address(0) || params.finalUpgradeAdmin == address(0)) {
            revert InvalidAddress();
        }

        companyKey = LibEnterpriseRegistry.keyFor(params.legalName, params.jurisdictionCode);
        if (rootByCompanyKey[companyKey] != address(0)) revert RootAlreadyExists(companyKey);

        SymmetryDiamond diamond = new SymmetryDiamond(address(this), sharedFacets.diamondCutFacet);
        root = address(diamond);

        _installSharedFacets(root, params.finalUpgradeAdmin);

        localEnterpriseId = IEnterpriseRegistryFacet(root)
            .onboardEnterprise(
                params.legalName,
                params.jurisdictionCode,
                params.enterpriseAdmin,
                params.enterpriseMultisig,
                params.enterpriseMetadataURI,
                params.enabledServices
            );

        IERC173(root).transferOwnership(params.enterpriseMultisig);
        _handoffProtocolAdmin(root, params.finalProtocolAdmin);
        _recordDeployment(companyKey, root, params);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0) || newOwner == owner) revert InvalidAddress();
        pendingOwner = newOwner;
        emit FactoryOwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        if (msg.sender != pendingOwner) revert NotPendingFactoryOwner(msg.sender);
        address previousOwner = owner;
        owner = msg.sender;
        pendingOwner = address(0);
        emit FactoryOwnershipTransferred(previousOwner, msg.sender);
    }

    function setProvisioner(address provisioner, bool authorized) external onlyOwner {
        if (provisioner == address(0)) revert InvalidAddress();
        provisioners[provisioner] = authorized;
        emit FactoryProvisionerUpdated(provisioner, authorized);
    }

    function isProvisioner(address account) external view returns (bool) {
        return account == owner || provisioners[account];
    }

    function getRootByCompanyKey(bytes32 companyKey) external view returns (address root) {
        root = rootByCompanyKey[companyKey];
    }

    function isRegisteredRoot(address root) external view returns (bool) {
        return registeredRoots[root];
    }

    function totalRoots() external view returns (uint256) {
        return allRoots.length;
    }

    function _installSharedFacets(address root, address finalUpgradeAdmin) private {
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](11);
        cut[0] = _facetCut(sharedFacets.diamondLoupeFacet, _loupeSelectors());
        cut[1] = _facetCut(sharedFacets.ownershipFacet, _ownershipSelectors());
        cut[2] = _facetCut(sharedFacets.accessControlFacet, _accessSelectors());
        cut[3] = _facetCut(sharedFacets.enterpriseRegistryFacet, _enterpriseSelectors());
        cut[4] = _facetCut(sharedFacets.corporateIdentityFacet, _identitySelectors());
        cut[5] = _facetCut(sharedFacets.evidenceFacet, _evidenceSelectors());
        cut[6] = _facetCut(sharedFacets.auditFacet, _auditSelectors());
        cut[7] = _facetCut(sharedFacets.serviceEntitlementFacet, _serviceSelectors());
        cut[8] = _facetCut(sharedFacets.votoIDFacet, _votoIDSelectors());
        cut[9] = _facetCut(sharedFacets.automationFacet, _automationSelectors());
        cut[10] = _facetCut(sharedFacets.eudrFacet, _eudrSelectors());

        DiamondInit.InitArgs memory initArgs =
            DiamondInit.InitArgs({ protocolAdmin: address(this), upgradeAdmin: finalUpgradeAdmin });

        IDiamondCut(root)
            .diamondCut(cut, sharedFacets.diamondInit, abi.encodeCall(DiamondInit.init, (initArgs)));
    }

    function _handoffProtocolAdmin(address root, address finalProtocolAdmin) private {
        IAccessControlFacet(root)
            .grantGlobalRole(LibAccessControl.PROTOCOL_ADMIN_ROLE, finalProtocolAdmin);
        IAccessControlFacet(root)
            .revokeGlobalRole(LibAccessControl.PROTOCOL_ADMIN_ROLE, address(this));
    }

    function _recordDeployment(
        bytes32 companyKey,
        address root,
        DeployEnterpriseRootParams calldata params
    ) private {
        rootByCompanyKey[companyKey] = root;
        registeredRoots[root] = true;
        allRoots.push(root);

        emit EnterpriseRootDeployed(
            companyKey,
            root,
            params.enterpriseMultisig,
            params.enterpriseAdmin,
            params.legalName,
            params.jurisdictionCode,
            params.enabledServices
        );
    }

    function _requireFacetSet(SharedFacetSet memory set) private pure {
        if (
            set.diamondCutFacet == address(0) || set.diamondLoupeFacet == address(0)
                || set.ownershipFacet == address(0) || set.accessControlFacet == address(0)
                || set.enterpriseRegistryFacet == address(0)
                || set.corporateIdentityFacet == address(0) || set.evidenceFacet == address(0)
                || set.auditFacet == address(0) || set.serviceEntitlementFacet == address(0)
                || set.votoIDFacet == address(0) || set.automationFacet == address(0)
                || set.eudrFacet == address(0) || set.diamondInit == address(0)
        ) revert InvalidAddress();
    }

    function _facetCut(address facetAddress, bytes4[] memory selectors)
        private
        pure
        returns (IDiamondCut.FacetCut memory)
    {
        return IDiamondCut.FacetCut({
            facetAddress: facetAddress,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });
    }

    function _loupeSelectors() private pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](4);
        selectors[0] = IDiamondLoupe.facets.selector;
        selectors[1] = IDiamondLoupe.facetFunctionSelectors.selector;
        selectors[2] = IDiamondLoupe.facetAddresses.selector;
        selectors[3] = IDiamondLoupe.facetAddress.selector;
    }

    function _ownershipSelectors() private pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](2);
        selectors[0] = IERC173.owner.selector;
        selectors[1] = IERC173.transferOwnership.selector;
    }

    function _accessSelectors() private pure returns (bytes4[] memory selectors) {
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

    function _enterpriseSelectors() private pure returns (bytes4[] memory selectors) {
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

    function _identitySelectors() private pure returns (bytes4[] memory selectors) {
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

    function _evidenceSelectors() private pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](6);
        selectors[0] = IEvidenceFacet.anchorEvidence.selector;
        selectors[1] = IEvidenceFacet.anchorEvidenceWithManifest.selector;
        selectors[2] = IEvidenceFacet.setEvidenceStatus.selector;
        selectors[3] = IEvidenceFacet.updateEvidenceManifest.selector;
        selectors[4] = IEvidenceFacet.getEvidence.selector;
        selectors[5] = IEvidenceFacet.listEnterpriseEvidence.selector;
    }

    function _auditSelectors() private pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](4);
        selectors[0] = IAuditFacet.createAuditRecord.selector;
        selectors[1] = IAuditFacet.createAuditRecordWithContext.selector;
        selectors[2] = IAuditFacet.getAuditRecord.selector;
        selectors[3] = IAuditFacet.listEnterpriseAuditRecords.selector;
    }

    function _serviceSelectors() private pure returns (bytes4[] memory selectors) {
        selectors = new bytes4[](2);
        selectors[0] = IServiceEntitlementFacet.configureEnterpriseService.selector;
        selectors[1] = IServiceEntitlementFacet.getEnterpriseService.selector;
    }

    function _votoIDSelectors() private pure returns (bytes4[] memory selectors) {
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

    function _automationSelectors() private pure returns (bytes4[] memory selectors) {
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

    function _eudrSelectors() private pure returns (bytes4[] memory selectors) {
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
}
