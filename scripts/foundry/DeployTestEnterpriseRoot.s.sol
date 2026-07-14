// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "../../lib/forge-std/src/Script.sol";
import { IEnterpriseRootFactory } from "../../contracts/interfaces/IEnterpriseRootFactory.sol";
import { IAccessControlFacet } from "../../contracts/interfaces/IAccessControlFacet.sol";
import { ICorporateIdentityFacet } from "../../contracts/interfaces/ICorporateIdentityFacet.sol";
import { IEnterpriseRegistryFacet } from "../../contracts/interfaces/IEnterpriseRegistryFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { LibAccessControl } from "../../contracts/libraries/LibAccessControl.sol";

contract DeployTestEnterpriseRoot is Script {
    event TestEnterpriseRootBootstrapped(
        address indexed root,
        uint256 indexed enterpriseId,
        bytes32 indexed companyKey,
        address enterpriseAdmin,
        address enterpriseMultisig,
        uint32 enabledServices
    );

    uint32 internal constant ALL_SERVICES = 7;

    function run() external returns (address root, uint256 enterpriseId, bytes32 companyKey) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_DEPLOYER");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        address deployer = vm.addr(deployerPrivateKey);
        address finalProtocolAdmin = vm.envAddress("SYMMETRY_PROTOCOL_ADMIN_WALLET");
        address finalUpgradeAdmin = vm.envAddress("SYMMETRY_UPGRADE_ADMIN_OWNER");
        address finalEnterpriseMultisig = vm.envAddress("TEST_ENTERPRISE_OWNER");

        require(finalProtocolAdmin != deployer, "protocol admin must differ from deployer");

        vm.startBroadcast(deployerPrivateKey);

        (root, enterpriseId, companyKey) = IEnterpriseRootFactory(factoryAddress)
            .deployEnterpriseRoot(
                IEnterpriseRootFactory.DeployEnterpriseRootParams({
                    legalName: "Symmetry Test Enterprise SAS",
                    jurisdictionCode: "CO",
                    enterpriseAdmin: deployer,
                    enterpriseMultisig: finalEnterpriseMultisig,
                    enterpriseMetadataURI: "ipfs://test-enterprise-root-metadata",
                    enabledServices: 0,
                    finalProtocolAdmin: deployer,
                    finalUpgradeAdmin: finalUpgradeAdmin
                })
            );

        ICorporateIdentityFacet(root)
            .createCorporateIdentity(
                enterpriseId,
                "Symmetry Test Enterprise SAS",
                "did:symmetry:enterprise:eip155:84532:symmetry-test-enterprise",
                "ipfs://test-enterprise-credentials",
                keccak256(abi.encode(block.chainid, root, companyKey))
            );
        ICorporateIdentityFacet(root).bindEnterpriseWallet(enterpriseId, finalProtocolAdmin);
        ICorporateIdentityFacet(root).bindEnterpriseWallet(enterpriseId, finalEnterpriseMultisig);

        IServiceEntitlementFacet(root)
            .configureEnterpriseService(enterpriseId, 0, true, "ipfs://symmetry-test-votoid-config");
        IServiceEntitlementFacet(root)
            .configureEnterpriseService(
                enterpriseId, 1, true, "ipfs://symmetry-test-automation-config"
            );
        IServiceEntitlementFacet(root)
            .configureEnterpriseService(enterpriseId, 2, true, "ipfs://symmetry-test-eudr-config");

        IEnterpriseRegistryFacet(root).setEnterpriseAdmin(enterpriseId, finalProtocolAdmin);
        IAccessControlFacet(root)
            .grantGlobalRole(LibAccessControl.PROTOCOL_ADMIN_ROLE, finalProtocolAdmin);
        IAccessControlFacet(root).revokeGlobalRole(LibAccessControl.PROTOCOL_ADMIN_ROLE, deployer);

        vm.stopBroadcast();

        _verifyBootstrap(root, enterpriseId, deployer, finalProtocolAdmin, finalEnterpriseMultisig);
        emit TestEnterpriseRootBootstrapped(
            root,
            enterpriseId,
            companyKey,
            finalProtocolAdmin,
            finalEnterpriseMultisig,
            ALL_SERVICES
        );
    }

    function _verifyBootstrap(
        address root,
        uint256 enterpriseId,
        address deployer,
        address finalProtocolAdmin,
        address finalEnterpriseMultisig
    ) internal view {
        IEnterpriseRegistryFacet.EnterpriseView memory enterprise =
            IEnterpriseRegistryFacet(root).getEnterprise(enterpriseId);
        require(enterprise.admin == finalProtocolAdmin, "enterprise admin handoff failed");
        require(
            enterprise.multisig == finalEnterpriseMultisig, "enterprise multisig handoff failed"
        );
        require(enterprise.enabledServices == ALL_SERVICES, "service mask mismatch");
        require(
            ICorporateIdentityFacet(root).getCorporateIdentity(enterpriseId).active,
            "corporate identity inactive"
        );

        for (uint8 serviceId = 0; serviceId < 3; serviceId++) {
            require(
                IServiceEntitlementFacet(root).getEnterpriseService(enterpriseId, serviceId)
                .enabled,
                "service entitlement missing"
            );
        }

        require(
            IAccessControlFacet(root)
                .hasGlobalRole(LibAccessControl.PROTOCOL_ADMIN_ROLE, finalProtocolAdmin),
            "final protocol admin missing"
        );
        require(
            !IAccessControlFacet(root)
                .hasGlobalRole(LibAccessControl.PROTOCOL_ADMIN_ROLE, deployer),
            "deployer retained protocol admin"
        );
    }
}
