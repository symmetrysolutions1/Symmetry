// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "../../lib/forge-std/src/Script.sol";
import { EnterpriseRootFactory } from "../../contracts/factory/EnterpriseRootFactory.sol";
import { DiamondCutFacet } from "../../contracts/core/DiamondCutFacet.sol";
import { DiamondLoupeFacet } from "../../contracts/core/DiamondLoupeFacet.sol";
import { OwnershipFacet } from "../../contracts/core/OwnershipFacet.sol";
import { DiamondInit } from "../../contracts/core/DiamondInit.sol";
import { AccessControlFacet } from "../../contracts/facets/AccessControlFacet.sol";
import { EnterpriseRegistryFacet } from "../../contracts/facets/EnterpriseRegistryFacet.sol";
import { CorporateIdentityFacet } from "../../contracts/facets/CorporateIdentityFacet.sol";
import { EvidenceFacet } from "../../contracts/facets/EvidenceFacet.sol";
import { AuditFacet } from "../../contracts/facets/AuditFacet.sol";
import { ServiceEntitlementFacet } from "../../contracts/facets/ServiceEntitlementFacet.sol";
import { VotoIDFacet } from "../../contracts/facets/VotoIDFacet.sol";
import { AutomationFacet } from "../../contracts/facets/AutomationFacet.sol";
import { EUDRFacet } from "../../contracts/facets/EUDRFacet.sol";

contract DeployEnterpriseRootFactory is Script {
    function run() external returns (EnterpriseRootFactory factory) {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_DEPLOYER");
        vm.startBroadcast(deployerPrivateKey);

        factory = new EnterpriseRootFactory(
            EnterpriseRootFactory.SharedFacetSet({
                diamondCutFacet: address(new DiamondCutFacet()),
                diamondLoupeFacet: address(new DiamondLoupeFacet()),
                ownershipFacet: address(new OwnershipFacet()),
                accessControlFacet: address(new AccessControlFacet()),
                enterpriseRegistryFacet: address(new EnterpriseRegistryFacet()),
                corporateIdentityFacet: address(new CorporateIdentityFacet()),
                evidenceFacet: address(new EvidenceFacet()),
                auditFacet: address(new AuditFacet()),
                serviceEntitlementFacet: address(new ServiceEntitlementFacet()),
                votoIDFacet: address(new VotoIDFacet()),
                automationFacet: address(new AutomationFacet()),
                eudrFacet: address(new EUDRFacet()),
                diamondInit: address(new DiamondInit())
            }),
            vm.envAddress("SYMMETRY_PROTOCOL_ADMIN_WALLET"),
            vm.addr(deployerPrivateKey)
        );

        vm.stopBroadcast();
    }
}
