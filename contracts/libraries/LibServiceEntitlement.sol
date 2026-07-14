// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LibEnterpriseRegistry } from "./LibEnterpriseRegistry.sol";

library LibServiceEntitlement {
    bytes32 internal constant STORAGE_SLOT =
        keccak256("symmetry.enterprises.storage.service.entitlement");

    uint8 internal constant SERVICE_VOTO_ID = 0;
    uint8 internal constant SERVICE_AUTOMATION = 1;
    uint8 internal constant SERVICE_EUDR = 2;

    error InvalidServiceId(uint8 serviceId);
    error EnterpriseInactive(uint256 enterpriseId);
    error ServiceNotEnabled(uint256 enterpriseId, uint8 serviceId);
    error InvalidConfigURI();

    struct ServiceConfig {
        bool enabled;
        string configURI;
        uint64 activatedAt;
    }

    struct Layout {
        mapping(uint256 => mapping(uint8 => ServiceConfig)) enterpriseServices;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }

    function toMask(uint8 serviceId) internal pure returns (uint32) {
        if (serviceId > SERVICE_EUDR) revert InvalidServiceId(serviceId);
        return uint32(1) << serviceId;
    }

    function enforceOperational(uint256 enterpriseId, uint8 serviceId) internal view {
        LibEnterpriseRegistry.Enterprise storage enterprise =
            LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        if (!enterprise.active) revert EnterpriseInactive(enterpriseId);
        if ((enterprise.enabledServices & toMask(serviceId)) == 0) {
            revert ServiceNotEnabled(enterpriseId, serviceId);
        }
    }
}
