// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICorporateIdentityFacet {
    event CorporateIdentityCreated(
        uint256 indexed enterpriseId,
        bytes32 indexed identityHash,
        string displayName,
        string primaryDID,
        string credentialsURI,
        address createdBy
    );
    event CorporateIdentityActivated(
        uint256 indexed enterpriseId, bool active, address indexed updatedBy
    );
    event CorporateIdentityCredentialsUpdated(
        uint256 indexed enterpriseId, string credentialsURI, address indexed updatedBy
    );
    event EnterpriseWalletBound(
        uint256 indexed enterpriseId, address indexed wallet, address indexed updatedBy
    );
    event EnterpriseWalletUnbound(
        uint256 indexed enterpriseId, address indexed wallet, address indexed updatedBy
    );
    event AuthorizedSignerAdded(
        uint256 indexed enterpriseId,
        address indexed signer,
        bytes32 indexed purpose,
        address addedBy
    );
    event AuthorizedSignerRemoved(
        uint256 indexed enterpriseId, address indexed signer, address indexed removedBy
    );

    struct CorporateIdentityView {
        uint256 enterpriseId;
        bytes32 identityHash;
        string displayName;
        string primaryDID;
        string credentialsURI;
        uint64 createdAt;
        bool active;
    }

    struct AuthorizedSignerView {
        bytes32 purpose;
        uint64 authorizedAt;
        bool active;
    }

    function createCorporateIdentity(
        uint256 enterpriseId,
        string calldata displayName,
        string calldata primaryDID,
        string calldata credentialsURI,
        bytes32 identityHash
    ) external;

    function setCorporateIdentityStatus(uint256 enterpriseId, bool active) external;
    function setCorporateIdentityCredentials(uint256 enterpriseId, string calldata credentialsURI)
        external;
    function bindEnterpriseWallet(uint256 enterpriseId, address wallet) external;
    function unbindEnterpriseWallet(uint256 enterpriseId, address wallet) external;
    function authorizeSigner(uint256 enterpriseId, address signer, bytes32 purpose) external;
    function revokeSigner(uint256 enterpriseId, address signer) external;
    function getCorporateIdentity(uint256 enterpriseId)
        external
        view
        returns (CorporateIdentityView memory identity);
    function getWalletEnterprise(address wallet) external view returns (uint256 enterpriseId);
    function isEnterpriseWallet(uint256 enterpriseId, address wallet) external view returns (bool);
    function getAuthorizedSigner(uint256 enterpriseId, address signer)
        external
        view
        returns (AuthorizedSignerView memory signerView);
}
