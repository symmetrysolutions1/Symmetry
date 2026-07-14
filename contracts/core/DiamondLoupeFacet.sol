// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IDiamondLoupe } from "../interfaces/IDiamondLoupe.sol";
import { LibDiamond } from "../libraries/LibDiamond.sol";

contract DiamondLoupeFacet is IDiamondLoupe {
    function facets() external view returns (Facet[] memory facets_) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 length = ds.facetAddresses.length;
        facets_ = new Facet[](length);

        for (uint256 index; index < length; index++) {
            address facetAddress_ = ds.facetAddresses[index];
            facets_[index] = Facet({
                facetAddress: facetAddress_, functionSelectors: ds.facetToSelectors[facetAddress_]
            });
        }
    }

    function facetFunctionSelectors(address facet)
        external
        view
        returns (bytes4[] memory selectors_)
    {
        selectors_ = LibDiamond.diamondStorage().facetToSelectors[facet];
    }

    function facetAddresses() external view returns (address[] memory facetAddresses_) {
        facetAddresses_ = LibDiamond.diamondStorage().facetAddresses;
    }

    function facetAddress(bytes4 selector) external view returns (address facetAddress_) {
        facetAddress_ = LibDiamond.diamondStorage().selectorToFacet[selector];
    }
}
