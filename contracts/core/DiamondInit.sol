// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibUpgradeGovernance } from "../libraries/LibUpgradeGovernance.sol";

contract DiamondInit {
    struct InitArgs {
        address protocolAdmin;
        address upgradeAdmin;
    }

    function init(InitArgs calldata args) external {
        LibAccessControl.setGlobalRole(
            LibAccessControl.PROTOCOL_ADMIN_ROLE, args.protocolAdmin, true
        );
        LibAccessControl.setGlobalRole(LibAccessControl.UPGRADE_ADMIN_ROLE, args.upgradeAdmin, true);
        LibUpgradeGovernance.initialize(args.upgradeAdmin);
    }
}
