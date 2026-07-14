// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IServiceEntitlementFacet } from "../interfaces/IServiceEntitlementFacet.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibEnterpriseRegistry } from "../libraries/LibEnterpriseRegistry.sol";
import { LibServiceEntitlement } from "../libraries/LibServiceEntitlement.sol";

contract ServiceEntitlementFacet is IServiceEntitlementFacet {
    function configureEnterpriseService(
        uint256 enterpriseId,
        uint8 serviceId,
        bool enabled,
        string calldata configURI
    ) external {
        LibEnterpriseRegistry.Enterprise storage enterprise =
            LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        LibAccessControl.enforceProtocolAdmin(msg.sender);
        if (enabled && bytes(configURI).length == 0) {
            revert LibServiceEntitlement.InvalidConfigURI();
        }

        uint32 serviceMask = LibServiceEntitlement.toMask(serviceId);
        if (enabled) {
            enterprise.enabledServices |= serviceMask;
        } else {
            enterprise.enabledServices &= ~serviceMask;
        }

        LibServiceEntitlement.data().enterpriseServices[enterpriseId][serviceId] =
            LibServiceEntitlement.ServiceConfig({
                enabled: enabled, configURI: configURI, activatedAt: uint64(block.timestamp)
            });

        emit EnterpriseServiceConfigured(enterpriseId, serviceId, enabled, configURI, msg.sender);
    }

    function getEnterpriseService(uint256 enterpriseId, uint8 serviceId)
        external
        view
        returns (ServiceConfigView memory config)
    {
        LibServiceEntitlement.ServiceConfig storage stored =
            LibServiceEntitlement.data().enterpriseServices[enterpriseId][serviceId];
        config = ServiceConfigView({
            enabled: stored.enabled, configURI: stored.configURI, activatedAt: stored.activatedAt
        });
    }
}
