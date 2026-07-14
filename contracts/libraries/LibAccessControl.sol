// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LibAccessControl {
    bytes32 internal constant STORAGE_SLOT =
        keccak256("symmetry.enterprises.storage.access.control");

    bytes32 internal constant PROTOCOL_ADMIN_ROLE = keccak256("PROTOCOL_ADMIN_ROLE");
    bytes32 internal constant UPGRADE_ADMIN_ROLE = keccak256("UPGRADE_ADMIN_ROLE");
    bytes32 internal constant ENTERPRISE_ADMIN_ROLE = keccak256("ENTERPRISE_ADMIN_ROLE");
    bytes32 internal constant ENTERPRISE_OPERATOR_ROLE = keccak256("ENTERPRISE_OPERATOR_ROLE");
    bytes32 internal constant ENTERPRISE_AUDITOR_ROLE = keccak256("ENTERPRISE_AUDITOR_ROLE");
    bytes32 internal constant IDENTITY_ADMIN_ROLE = keccak256("IDENTITY_ADMIN_ROLE");

    error AccessDenied(bytes32 role, address account, uint256 enterpriseId);
    error InvalidAddress();
    error InvalidEnterpriseId();
    error InvalidExpiry();

    struct DelegateGrant {
        uint64 expiresAt;
        bool active;
    }

    struct Layout {
        mapping(bytes32 => mapping(address => bool)) globalRoles;
        mapping(uint256 => mapping(bytes32 => mapping(address => bool))) enterpriseRoles;
        mapping(uint256 => mapping(bytes32 => mapping(address => DelegateGrant))) delegates;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }

    function enforceProtocolAdmin(address account) internal view {
        if (!hasGlobalRole(PROTOCOL_ADMIN_ROLE, account)) {
            revert AccessDenied(PROTOCOL_ADMIN_ROLE, account, 0);
        }
    }

    function enforceEnterpriseRole(uint256 enterpriseId, bytes32 role, address account)
        internal
        view
    {
        if (
            !hasEnterpriseRole(enterpriseId, role, account)
                && !isActiveDelegate(enterpriseId, role, account)
        ) {
            revert AccessDenied(role, account, enterpriseId);
        }
    }

    function setGlobalRole(bytes32 role, address account, bool enabled) internal {
        if (account == address(0)) revert InvalidAddress();
        data().globalRoles[role][account] = enabled;
    }

    function hasGlobalRole(bytes32 role, address account) internal view returns (bool) {
        return data().globalRoles[role][account];
    }

    function setEnterpriseRole(uint256 enterpriseId, bytes32 role, address account, bool enabled)
        internal
    {
        if (enterpriseId == 0) revert InvalidEnterpriseId();
        if (account == address(0)) revert InvalidAddress();
        data().enterpriseRoles[enterpriseId][role][account] = enabled;
    }

    function hasEnterpriseRole(uint256 enterpriseId, bytes32 role, address account)
        internal
        view
        returns (bool)
    {
        return data().enterpriseRoles[enterpriseId][role][account];
    }

    function setDelegate(
        uint256 enterpriseId,
        bytes32 role,
        address account,
        bool enabled,
        uint64 expiresAt
    ) internal {
        if (enterpriseId == 0) revert InvalidEnterpriseId();
        if (account == address(0)) revert InvalidAddress();
        if (enabled && expiresAt != 0 && expiresAt <= block.timestamp) revert InvalidExpiry();

        data().delegates[enterpriseId][role][account] =
            DelegateGrant({ expiresAt: expiresAt, active: enabled });
    }

    function getDelegate(uint256 enterpriseId, bytes32 role, address account)
        internal
        view
        returns (DelegateGrant memory)
    {
        return data().delegates[enterpriseId][role][account];
    }

    function isActiveDelegate(uint256 enterpriseId, bytes32 role, address account)
        internal
        view
        returns (bool)
    {
        DelegateGrant memory grant = data().delegates[enterpriseId][role][account];
        if (!grant.active) return false;
        if (grant.expiresAt != 0 && grant.expiresAt < block.timestamp) return false;
        return true;
    }
}
