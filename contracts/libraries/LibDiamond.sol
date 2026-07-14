// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IDiamondCut } from "../interfaces/IDiamondCut.sol";

library LibDiamond {
    bytes32 internal constant STORAGE_SLOT = keccak256("diamond.standard.symmetry.storage");

    error NotContractOwner(address caller);
    error InvalidFacetAddress(address facetAddress);
    error SelectorAlreadyExists(bytes4 selector);
    error SelectorDoesNotExist(bytes4 selector);
    error ImmutableFunction(bytes4 selector);
    error InitializationFailed();

    struct DiamondStorage {
        mapping(bytes4 => address) selectorToFacet;
        mapping(address => bytes4[]) facetToSelectors;
        address[] facetAddresses;
        mapping(address => bool) knownFacet;
        address contractOwner;
    }

    function diamondStorage() internal pure returns (DiamondStorage storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }

    function setContractOwner(address newOwner) internal {
        diamondStorage().contractOwner = newOwner;
    }

    function contractOwner() internal view returns (address) {
        return diamondStorage().contractOwner;
    }

    function enforceIsContractOwner() internal view {
        if (msg.sender != diamondStorage().contractOwner) {
            revert NotContractOwner(msg.sender);
        }
    }

    function diamondCut(IDiamondCut.FacetCut[] memory cut, address init, bytes memory initCalldata)
        internal
    {
        for (uint256 facetIndex; facetIndex < cut.length; facetIndex++) {
            IDiamondCut.FacetCut memory facetCut = cut[facetIndex];
            if (
                facetCut.action == IDiamondCut.FacetCutAction.Add
                    || facetCut.action == IDiamondCut.FacetCutAction.Replace
            ) {
                if (facetCut.facetAddress.code.length == 0) {
                    revert InvalidFacetAddress(facetCut.facetAddress);
                }
            }

            if (facetCut.action == IDiamondCut.FacetCutAction.Add) {
                _addFunctions(facetCut.facetAddress, facetCut.functionSelectors);
            } else if (facetCut.action == IDiamondCut.FacetCutAction.Replace) {
                _replaceFunctions(facetCut.facetAddress, facetCut.functionSelectors);
            } else {
                _removeFunctions(facetCut.functionSelectors);
            }
        }

        emit IDiamondCut.DiamondCut(cut, init, initCalldata);
        _initializeDiamondCut(init, initCalldata);
    }

    function _addFunctions(address facetAddress, bytes4[] memory selectors) private {
        DiamondStorage storage ds = diamondStorage();
        _ensureFacetTracked(ds, facetAddress);

        for (uint256 index; index < selectors.length; index++) {
            bytes4 selector = selectors[index];
            if (ds.selectorToFacet[selector] != address(0)) revert SelectorAlreadyExists(selector);
            ds.selectorToFacet[selector] = facetAddress;
            ds.facetToSelectors[facetAddress].push(selector);
        }
    }

    function _replaceFunctions(address facetAddress, bytes4[] memory selectors) private {
        DiamondStorage storage ds = diamondStorage();
        _ensureFacetTracked(ds, facetAddress);

        for (uint256 index; index < selectors.length; index++) {
            bytes4 selector = selectors[index];
            address oldFacet = ds.selectorToFacet[selector];
            if (oldFacet == address(0)) revert SelectorDoesNotExist(selector);
            if (oldFacet == address(this)) revert ImmutableFunction(selector);
            _removeSelectorFromFacet(oldFacet, selector);
            ds.selectorToFacet[selector] = facetAddress;
            ds.facetToSelectors[facetAddress].push(selector);
        }
    }

    function _removeFunctions(bytes4[] memory selectors) private {
        DiamondStorage storage ds = diamondStorage();
        for (uint256 index; index < selectors.length; index++) {
            bytes4 selector = selectors[index];
            address oldFacet = ds.selectorToFacet[selector];
            if (oldFacet == address(0)) revert SelectorDoesNotExist(selector);
            if (oldFacet == address(this)) revert ImmutableFunction(selector);
            delete ds.selectorToFacet[selector];
            _removeSelectorFromFacet(oldFacet, selector);
        }
    }

    function _removeSelectorFromFacet(address facetAddress, bytes4 selector) private {
        DiamondStorage storage ds = diamondStorage();
        bytes4[] storage selectors = ds.facetToSelectors[facetAddress];
        uint256 length = selectors.length;

        for (uint256 index; index < length; index++) {
            if (selectors[index] == selector) {
                selectors[index] = selectors[length - 1];
                selectors.pop();
                break;
            }
        }

        if (selectors.length == 0) {
            ds.knownFacet[facetAddress] = false;
            uint256 facetsLength = ds.facetAddresses.length;
            for (uint256 index; index < facetsLength; index++) {
                if (ds.facetAddresses[index] == facetAddress) {
                    ds.facetAddresses[index] = ds.facetAddresses[facetsLength - 1];
                    ds.facetAddresses.pop();
                    break;
                }
            }
        }
    }

    function _ensureFacetTracked(DiamondStorage storage ds, address facetAddress) private {
        if (!ds.knownFacet[facetAddress]) {
            ds.knownFacet[facetAddress] = true;
            ds.facetAddresses.push(facetAddress);
        }
    }

    function _initializeDiamondCut(address init, bytes memory initCalldata) private {
        if (init == address(0)) {
            return;
        }

        if (init.code.length == 0) revert InvalidFacetAddress(init);
        (bool success,) = init.delegatecall(initCalldata);
        if (!success) revert InitializationFailed();
    }
}
