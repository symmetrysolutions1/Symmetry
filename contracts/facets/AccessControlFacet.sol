// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IAccessControlFacet } from "../interfaces/IAccessControlFacet.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";

contract AccessControlFacet is IAccessControlFacet {
    function grantGlobalRole(bytes32 role, address account) external {
        LibAccessControl.enforceProtocolAdmin(msg.sender);
        LibAccessControl.setGlobalRole(role, account, true);
        emit GlobalRoleGranted(role, account, msg.sender);
    }

    function revokeGlobalRole(bytes32 role, address account) external {
        LibAccessControl.enforceProtocolAdmin(msg.sender);
        LibAccessControl.setGlobalRole(role, account, false);
        emit GlobalRoleRevoked(role, account, msg.sender);
    }

    function hasGlobalRole(bytes32 role, address account) external view returns (bool) {
        return LibAccessControl.hasGlobalRole(role, account);
    }

    function grantEnterpriseRole(uint256 enterpriseId, bytes32 role, address account) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
        );
        LibAccessControl.setEnterpriseRole(enterpriseId, role, account, true);
        emit EnterpriseRoleGranted(enterpriseId, role, account, msg.sender);
    }

    function revokeEnterpriseRole(uint256 enterpriseId, bytes32 role, address account) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
        );
        LibAccessControl.setEnterpriseRole(enterpriseId, role, account, false);
        emit EnterpriseRoleRevoked(enterpriseId, role, account, msg.sender);
    }

    function hasEnterpriseRole(uint256 enterpriseId, bytes32 role, address account)
        external
        view
        returns (bool)
    {
        return LibAccessControl.hasEnterpriseRole(enterpriseId, role, account);
    }

    function assignEnterpriseDelegate(
        uint256 enterpriseId,
        bytes32 role,
        address account,
        uint64 expiresAt
    ) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
        );
        LibAccessControl.setDelegate(enterpriseId, role, account, true, expiresAt);
        emit EnterpriseDelegateAssigned(enterpriseId, role, account, expiresAt, msg.sender);
    }

    function revokeEnterpriseDelegate(uint256 enterpriseId, bytes32 role, address account)
        external
    {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
        );
        LibAccessControl.setDelegate(enterpriseId, role, account, false, 0);
        emit EnterpriseDelegateRevoked(enterpriseId, role, account, msg.sender);
    }

    function isEnterpriseDelegate(uint256 enterpriseId, bytes32 role, address account)
        external
        view
        returns (bool)
    {
        return LibAccessControl.isActiveDelegate(enterpriseId, role, account);
    }
}
