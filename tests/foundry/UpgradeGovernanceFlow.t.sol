// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "../../lib/forge-std/src/Test.sol";
import { SymmetryDiamond } from "../../contracts/core/SymmetryDiamond.sol";
import { DiamondCutFacet } from "../../contracts/core/DiamondCutFacet.sol";
import { DiamondInit } from "../../contracts/core/DiamondInit.sol";
import { OwnershipFacet } from "../../contracts/core/OwnershipFacet.sol";
import { IDiamondCut } from "../../contracts/interfaces/IDiamondCut.sol";
import { IERC173 } from "../../contracts/interfaces/IERC173.sol";
import { IUpgradeGovernanceFacet } from "../../contracts/interfaces/IUpgradeGovernanceFacet.sol";
import { LibUpgradeGovernance } from "../../contracts/libraries/LibUpgradeGovernance.sol";

contract UpgradeGovernanceFlowTest is Test {
    address internal enterpriseOwner = address(0xCAFE);
    address internal upgradeAdmin = address(0xA11CE);
    address internal root;

    function setUp() external {
        DiamondCutFacet diamondCutFacet = new DiamondCutFacet();
        root = address(new SymmetryDiamond(enterpriseOwner, address(diamondCutFacet)));

        IDiamondCut.FacetCut[] memory initialCut = new IDiamondCut.FacetCut[](0);
        DiamondInit initializer = new DiamondInit();
        DiamondInit.InitArgs memory args =
            DiamondInit.InitArgs({ protocolAdmin: address(0xB0B), upgradeAdmin: upgradeAdmin });

        vm.prank(enterpriseOwner);
        IDiamondCut(root)
            .diamondCut(initialCut, address(initializer), abi.encodeCall(DiamondInit.init, (args)));
    }

    function testUpgradeRequiresApprovalAndEnterpriseExecution() external {
        OwnershipFacet ownershipFacet = new OwnershipFacet();
        IDiamondCut.FacetCut[] memory cut = _ownershipCut(address(ownershipFacet));
        bytes32 cutHash =
            IUpgradeGovernanceFacet(root).getDiamondCutHash(abi.encode(cut), address(0), "");

        vm.expectRevert(
            abi.encodeWithSelector(LibUpgradeGovernance.UpgradeApprovalRequired.selector, cutHash)
        );
        vm.prank(enterpriseOwner);
        IDiamondCut(root).diamondCut(cut, address(0), "");

        vm.prank(upgradeAdmin);
        IUpgradeGovernanceFacet(root).approveDiamondCut(cutHash, uint64(block.timestamp + 1 days));

        vm.prank(enterpriseOwner);
        IDiamondCut(root).diamondCut(cut, address(0), "");

        assertEq(IERC173(root).owner(), enterpriseOwner);
        IUpgradeGovernanceFacet.UpgradeGovernanceView memory governance =
            IUpgradeGovernanceFacet(root).getUpgradeGovernance();
        assertEq(governance.nonce, 1);
        assertEq(governance.approvedCutHash, bytes32(0));
    }

    function testOnlyUpgradeAdminCanApprove() external {
        vm.expectRevert(
            abi.encodeWithSelector(LibUpgradeGovernance.NotUpgradeAdmin.selector, address(0xBAD))
        );
        vm.prank(address(0xBAD));
        IUpgradeGovernanceFacet(root)
            .approveDiamondCut(keccak256("cut"), uint64(block.timestamp + 1 days));
    }

    function testUpgradeAdminRotationRequiresBothAuthorities() external {
        address nextUpgradeAdmin = address(0xBEEF);

        vm.prank(upgradeAdmin);
        IUpgradeGovernanceFacet(root).proposeUpgradeAdmin(nextUpgradeAdmin);

        vm.expectRevert();
        vm.prank(address(0xBAD));
        IUpgradeGovernanceFacet(root).acceptUpgradeAdmin();

        vm.prank(enterpriseOwner);
        IUpgradeGovernanceFacet(root).acceptUpgradeAdmin();

        IUpgradeGovernanceFacet.UpgradeGovernanceView memory governance =
            IUpgradeGovernanceFacet(root).getUpgradeGovernance();
        assertEq(governance.upgradeAdmin, nextUpgradeAdmin);
    }

    function _ownershipCut(address facet) private pure returns (IDiamondCut.FacetCut[] memory cut) {
        bytes4[] memory selectors = new bytes4[](2);
        selectors[0] = IERC173.owner.selector;
        selectors[1] = IERC173.transferOwnership.selector;

        cut = new IDiamondCut.FacetCut[](1);
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: facet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });
    }
}
