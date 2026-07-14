// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IUpgradeGovernanceFacet {
    event DiamondCutApproved(bytes32 indexed cutHash, uint64 expiresAt, address indexed approvedBy);
    event DiamondCutApprovalCancelled(bytes32 indexed cutHash, address indexed cancelledBy);
    event UpgradeAdminProposed(address indexed currentAdmin, address indexed pendingAdmin);
    event UpgradeAdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    struct UpgradeGovernanceView {
        address upgradeAdmin;
        address pendingUpgradeAdmin;
        uint256 nonce;
        bytes32 approvedCutHash;
        uint64 approvalExpiresAt;
    }

    function approveDiamondCut(bytes32 cutHash, uint64 expiresAt) external;
    function cancelDiamondCutApproval() external;
    function getDiamondCutHash(
        bytes calldata encodedCut,
        address init,
        bytes calldata initCalldata
    ) external view returns (bytes32);
    function getUpgradeGovernance() external view returns (UpgradeGovernanceView memory governance);
    function proposeUpgradeAdmin(address newAdmin) external;
    function acceptUpgradeAdmin() external;
}
