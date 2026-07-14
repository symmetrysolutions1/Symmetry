// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { IUpgradeGovernanceFacet } from "../interfaces/IUpgradeGovernanceFacet.sol";
import { LibDiamond } from "../libraries/LibDiamond.sol";
import { LibUpgradeGovernance } from "../libraries/LibUpgradeGovernance.sol";

contract DiamondCutFacet is IDiamondCut, IUpgradeGovernanceFacet {
    function diamondCut(FacetCut[] calldata diamondCut_, address init, bytes calldata initCalldata)
        external
    {
        LibDiamond.enforceIsContractOwner();

        LibUpgradeGovernance.Layout storage governance = LibUpgradeGovernance.data();
        if (governance.upgradeAdmin != address(0)) {
            bytes32 expectedHash =
                LibUpgradeGovernance.cutHash(abi.encode(diamondCut_), init, initCalldata);
            LibUpgradeGovernance.consumeApproval(expectedHash);
        }

        LibDiamond.diamondCut(diamondCut_, init, initCalldata);
    }

    function approveDiamondCut(bytes32 cutHash, uint64 expiresAt) external {
        LibUpgradeGovernance.enforceUpgradeAdmin(msg.sender);
        LibUpgradeGovernance.approve(cutHash, expiresAt);
        emit DiamondCutApproved(cutHash, expiresAt, msg.sender);
    }

    function cancelDiamondCutApproval() external {
        LibUpgradeGovernance.Layout storage governance = LibUpgradeGovernance.data();
        if (msg.sender != governance.upgradeAdmin && msg.sender != LibDiamond.contractOwner()) {
            revert LibUpgradeGovernance.NotUpgradeAdmin(msg.sender);
        }
        bytes32 cancelledHash = LibUpgradeGovernance.cancelApproval();
        emit DiamondCutApprovalCancelled(cancelledHash, msg.sender);
    }

    function getDiamondCutHash(
        bytes calldata encodedCut,
        address init,
        bytes calldata initCalldata
    ) external view returns (bytes32) {
        return LibUpgradeGovernance.cutHash(encodedCut, init, initCalldata);
    }

    function getUpgradeGovernance()
        external
        view
        returns (UpgradeGovernanceView memory governance)
    {
        LibUpgradeGovernance.Layout storage ds = LibUpgradeGovernance.data();
        governance = UpgradeGovernanceView({
            upgradeAdmin: ds.upgradeAdmin,
            pendingUpgradeAdmin: ds.pendingUpgradeAdmin,
            nonce: ds.nonce,
            approvedCutHash: ds.approvedCutHash,
            approvalExpiresAt: ds.approvalExpiresAt
        });
    }

    function proposeUpgradeAdmin(address newAdmin) external {
        LibUpgradeGovernance.enforceUpgradeAdmin(msg.sender);
        if (newAdmin == address(0) || newAdmin == msg.sender) {
            revert LibUpgradeGovernance.InvalidUpgradeAdmin();
        }
        LibUpgradeGovernance.data().pendingUpgradeAdmin = newAdmin;
        emit UpgradeAdminProposed(msg.sender, newAdmin);
    }

    function acceptUpgradeAdmin() external {
        LibDiamond.enforceIsContractOwner();
        LibUpgradeGovernance.Layout storage ds = LibUpgradeGovernance.data();
        address newAdmin = ds.pendingUpgradeAdmin;
        if (newAdmin == address(0)) revert LibUpgradeGovernance.InvalidUpgradeAdmin();
        address previousAdmin = ds.upgradeAdmin;
        ds.upgradeAdmin = newAdmin;
        ds.pendingUpgradeAdmin = address(0);
        LibUpgradeGovernance.cancelApproval();
        emit UpgradeAdminTransferred(previousAdmin, newAdmin);
    }
}
