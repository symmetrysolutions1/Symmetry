// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IAccessControlFacet {
    event GlobalRoleGranted(
        bytes32 indexed role, address indexed account, address indexed grantedBy
    );
    event GlobalRoleRevoked(
        bytes32 indexed role, address indexed account, address indexed revokedBy
    );
    event EnterpriseRoleGranted(
        uint256 indexed enterpriseId,
        bytes32 indexed role,
        address indexed account,
        address grantedBy
    );
    event EnterpriseRoleRevoked(
        uint256 indexed enterpriseId,
        bytes32 indexed role,
        address indexed account,
        address revokedBy
    );
    event EnterpriseDelegateAssigned(
        uint256 indexed enterpriseId,
        bytes32 indexed role,
        address indexed account,
        uint64 expiresAt,
        address assignedBy
    );
    event EnterpriseDelegateRevoked(
        uint256 indexed enterpriseId,
        bytes32 indexed role,
        address indexed account,
        address revokedBy
    );

    function grantGlobalRole(bytes32 role, address account) external;
    function revokeGlobalRole(bytes32 role, address account) external;
    function hasGlobalRole(bytes32 role, address account) external view returns (bool);
    function grantEnterpriseRole(uint256 enterpriseId, bytes32 role, address account) external;
    function revokeEnterpriseRole(uint256 enterpriseId, bytes32 role, address account) external;
    function hasEnterpriseRole(uint256 enterpriseId, bytes32 role, address account)
        external
        view
        returns (bool);
    function assignEnterpriseDelegate(
        uint256 enterpriseId,
        bytes32 role,
        address account,
        uint64 expiresAt
    ) external;
    function revokeEnterpriseDelegate(uint256 enterpriseId, bytes32 role, address account) external;
    function isEnterpriseDelegate(uint256 enterpriseId, bytes32 role, address account)
        external
        view
        returns (bool);
}
