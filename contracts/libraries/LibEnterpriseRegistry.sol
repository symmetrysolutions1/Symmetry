// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LibEnterpriseRegistry {
    bytes32 internal constant STORAGE_SLOT =
        keccak256("symmetry.enterprises.storage.enterprise.registry");

    error EnterpriseAlreadyExists(bytes32 legalEntityKey);
    error EnterpriseNotFound(uint256 enterpriseId);
    error InvalidAddress();
    error InvalidEnterpriseId();
    error EmptyString();
    error InvalidServiceMask(uint32 enabledServices);

    uint32 internal constant ALL_SERVICES_MASK = 7;

    struct Enterprise {
        uint256 id;
        string legalName;
        string jurisdictionCode;
        address admin;
        address multisig;
        string metadataURI;
        uint64 createdAt;
        uint32 enabledServices;
        bool active;
    }

    struct Layout {
        uint256 nextEnterpriseId;
        mapping(uint256 => Enterprise) enterprises;
        mapping(bytes32 => uint256) enterpriseIdByLegalEntityKey;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }

    function requireEnterprise(uint256 enterpriseId)
        internal
        view
        returns (Enterprise storage enterprise)
    {
        if (enterpriseId == 0) revert InvalidEnterpriseId();
        enterprise = data().enterprises[enterpriseId];
        if (enterprise.id == 0) revert EnterpriseNotFound(enterpriseId);
    }

    function nextEnterpriseId(Layout storage ds) internal returns (uint256 enterpriseId) {
        enterpriseId = ds.nextEnterpriseId + 1;
        ds.nextEnterpriseId = enterpriseId;
    }

    function enforceValidServiceMask(uint32 enabledServices) internal pure {
        if ((enabledServices & ~ALL_SERVICES_MASK) != 0) {
            revert InvalidServiceMask(enabledServices);
        }
    }

    function keyFor(string memory legalName, string memory jurisdictionCode)
        internal
        pure
        returns (bytes32)
    {
        if (bytes(legalName).length == 0 || bytes(jurisdictionCode).length == 0) {
            revert EmptyString();
        }
        return keccak256(abi.encodePacked(legalName, "|", jurisdictionCode));
    }
}
