// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { IDiamondCut } from "../interfaces/IDiamondCut.sol";
import { IUpgradeGovernanceFacet } from "../interfaces/IUpgradeGovernanceFacet.sol";

contract SymmetryDiamond {
    constructor(address owner_, address diamondCutFacet) payable {
        LibDiamond.setContractOwner(owner_);

        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory selectors = new bytes4[](7);
        selectors[0] = IDiamondCut.diamondCut.selector;
        selectors[1] = IUpgradeGovernanceFacet.approveDiamondCut.selector;
        selectors[2] = IUpgradeGovernanceFacet.cancelDiamondCutApproval.selector;
        selectors[3] = IUpgradeGovernanceFacet.getDiamondCutHash.selector;
        selectors[4] = IUpgradeGovernanceFacet.getUpgradeGovernance.selector;
        selectors[5] = IUpgradeGovernanceFacet.proposeUpgradeAdmin.selector;
        selectors[6] = IUpgradeGovernanceFacet.acceptUpgradeAdmin.selector;

        cut[0] = IDiamondCut.FacetCut({
            facetAddress: diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: selectors
        });

        LibDiamond.diamondCut(cut, address(0), "");
    }

    fallback() external payable {
        address facet = LibDiamond.diamondStorage().selectorToFacet[msg.sig];
        require(facet != address(0), "SymmetryDiamond: function not found");

        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    receive() external payable { }
}
