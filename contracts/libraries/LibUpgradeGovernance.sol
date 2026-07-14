// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LibUpgradeGovernance {
    bytes32 internal constant STORAGE_SLOT =
        keccak256("symmetry.enterprises.storage.upgrade.governance");
    uint64 internal constant MAX_APPROVAL_WINDOW = 30 days;

    error UpgradeApprovalRequired(bytes32 expectedHash);
    error UpgradeApprovalExpired(uint64 expiresAt);
    error NotUpgradeAdmin(address caller);
    error InvalidUpgradeAdmin();
    error InvalidApproval();

    struct Layout {
        address upgradeAdmin;
        address pendingUpgradeAdmin;
        uint256 nonce;
        bytes32 approvedCutHash;
        uint64 approvalExpiresAt;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }

    function initialize(address upgradeAdmin_) internal {
        if (upgradeAdmin_ == address(0)) revert InvalidUpgradeAdmin();
        Layout storage ds = data();
        if (ds.upgradeAdmin != address(0)) revert InvalidUpgradeAdmin();
        ds.upgradeAdmin = upgradeAdmin_;
    }

    function enforceUpgradeAdmin(address account) internal view {
        if (account != data().upgradeAdmin) revert NotUpgradeAdmin(account);
    }

    function cutHash(bytes memory encodedCut, address init, bytes memory initCalldata)
        internal
        view
        returns (bytes32)
    {
        return keccak256(
            abi.encode(
                block.chainid,
                address(this),
                data().nonce,
                keccak256(encodedCut),
                init,
                keccak256(initCalldata)
            )
        );
    }

    function approve(bytes32 cutHash_, uint64 expiresAt) internal {
        if (
            cutHash_ == bytes32(0) || expiresAt <= block.timestamp
                || expiresAt > block.timestamp + MAX_APPROVAL_WINDOW
        ) revert InvalidApproval();

        Layout storage ds = data();
        ds.approvedCutHash = cutHash_;
        ds.approvalExpiresAt = expiresAt;
    }

    function cancelApproval() internal returns (bytes32 cancelledHash) {
        Layout storage ds = data();
        cancelledHash = ds.approvedCutHash;
        ds.approvedCutHash = bytes32(0);
        ds.approvalExpiresAt = 0;
    }

    function consumeApproval(bytes32 expectedHash) internal {
        Layout storage ds = data();
        if (ds.approvedCutHash != expectedHash) revert UpgradeApprovalRequired(expectedHash);
        if (ds.approvalExpiresAt < block.timestamp) {
            revert UpgradeApprovalExpired(ds.approvalExpiresAt);
        }

        ds.approvedCutHash = bytes32(0);
        ds.approvalExpiresAt = 0;
        ds.nonce++;
    }
}
