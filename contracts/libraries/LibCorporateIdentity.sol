// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LibCorporateIdentity {
    bytes32 internal constant STORAGE_SLOT =
        keccak256("symmetry.enterprises.storage.corporate.identity");

    error IdentityAlreadyExists(uint256 enterpriseId);
    error IdentityNotFound(uint256 enterpriseId);
    error InvalidAddress();
    error DuplicateWallet(address wallet);
    error WalletNotFound(address wallet);
    error SignerAlreadyAuthorized(address signer);

    struct AuthorizedSigner {
        bytes32 purpose;
        uint64 authorizedAt;
        bool active;
    }

    struct CorporateIdentity {
        uint256 enterpriseId;
        bytes32 identityHash;
        string displayName;
        string primaryDID;
        string credentialsURI;
        uint64 createdAt;
        bool active;
    }

    struct Layout {
        mapping(uint256 => CorporateIdentity) identities;
        mapping(uint256 => mapping(address => bool)) enterpriseWallets;
        mapping(address => uint256) walletEnterprise;
        mapping(uint256 => mapping(address => AuthorizedSigner)) authorizedSigners;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }
}
