// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IServiceEntitlementFacet {
    event EnterpriseServiceConfigured(
        uint256 indexed enterpriseId,
        uint8 indexed serviceId,
        bool enabled,
        string configURI,
        address indexed updatedBy
    );

    struct ServiceConfigView {
        bool enabled;
        string configURI;
        uint64 activatedAt;
    }

    function configureEnterpriseService(
        uint256 enterpriseId,
        uint8 serviceId,
        bool enabled,
        string calldata configURI
    ) external;

    function getEnterpriseService(uint256 enterpriseId, uint8 serviceId)
        external
        view
        returns (ServiceConfigView memory config);
}
