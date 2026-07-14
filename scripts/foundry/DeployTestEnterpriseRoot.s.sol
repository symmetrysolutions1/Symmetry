// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "../../lib/forge-std/src/Script.sol";
import { EnterpriseRootFactory } from "../../contracts/factory/EnterpriseRootFactory.sol";
import { IEnterpriseRootFactory } from "../../contracts/interfaces/IEnterpriseRootFactory.sol";

contract DeployTestEnterpriseRoot is Script {
    function run() external returns (address root, uint256 enterpriseId, bytes32 companyKey) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_DEPLOYER");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        vm.startBroadcast(deployerPrivateKey);

        (root, enterpriseId, companyKey) = IEnterpriseRootFactory(factoryAddress)
            .deployEnterpriseRoot(
                IEnterpriseRootFactory.DeployEnterpriseRootParams({
                    legalName: "Symmetry Test Enterprise SAS",
                    jurisdictionCode: "CO",
                    enterpriseAdmin: vm.envAddress("SYMMETRY_PROTOCOL_ADMIN_WALLET"),
                    enterpriseMultisig: vm.envAddress("TEST_ENTERPRISE_OWNER"),
                    enterpriseMetadataURI: "ipfs://test-enterprise-root-metadata",
                    enabledServices: 0,
                    finalProtocolAdmin: vm.envAddress("SYMMETRY_PROTOCOL_ADMIN_WALLET"),
                    finalUpgradeAdmin: vm.envAddress("SYMMETRY_UPGRADE_ADMIN_OWNER")
                })
            );

        vm.stopBroadcast();
    }
}
