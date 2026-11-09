// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "../../lib/forge-std/src/Test.sol";
import {NatureEvidenceRegistry} from "../../contracts/nature/NatureEvidenceRegistry.sol";

contract NatureEvidenceRegistryFlowTest is Test {
    NatureEvidenceRegistry internal registry;
    address internal creRelayer = address(0xC0E);

    function setUp() public {
        registry = new NatureEvidenceRegistry();
        registry.setRelayer(creRelayer, true);
    }

    function testNatureEvidenceVerticalSlice() public {
        bytes32 workspaceId = keccak256("workspace-nature");
        bytes32 territoryId = keccak256("territory-amazonas");
        bytes32 observationId = keccak256("observation-2026-09-07");
        bytes32 passportId = keccak256("passport-2026-09-07");
        bytes32 ensNode = keccak256("territory.amazon.eth");

        vm.prank(creRelayer);
        registry.linkEnsNamespace(workspaceId, ensNode, address(0xE115));

        vm.prank(creRelayer);
        registry.registerTerritory(
            workspaceId,
            territoryId,
            keccak256("geojson-digest"),
            ensNode,
            "territory-amazonas.nature.eth"
        );

        vm.prank(creRelayer);
        registry.recordObservation(territoryId, observationId, keccak256("copernicus-evidence"), -742, 6180, 1_725_667_200);

        vm.prank(creRelayer);
        registry.createAlert(territoryId, observationId, keccak256("alert-1"), keccak256("NDVI_DROP"));

        vm.prank(creRelayer);
        registry.anchorPassport(
            workspaceId,
            passportId,
            territoryId,
            observationId,
            keccak256("passport-manifest"),
            ensNode
        );

        (
            bytes32 storedWorkspaceId,
            bytes32 ignoredTerritoryId,
            bytes32 ignoredObservationId,
            bytes32 ignoredManifestDigest,
            bytes32 storedEnsNode,
            uint64 ignoredAnchoredAt,
            bool anchored
        ) = registry.passports(passportId);
        assertTrue(anchored);
        assertEq(storedWorkspaceId, workspaceId);
        assertEq(storedEnsNode, ensNode);
    }

    function testOnlyRelayerCanWrite() public {
        vm.expectRevert(NatureEvidenceRegistry.NotAuthorized.selector);
        vm.prank(address(0xBAD));
        registry.registerTerritory(bytes32(uint256(1)), bytes32(uint256(2)), bytes32(uint256(3)), bytes32(uint256(4)), "x.eth");
    }
}
