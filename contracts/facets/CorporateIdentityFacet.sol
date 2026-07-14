// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { ICorporateIdentityFacet } from "../interfaces/ICorporateIdentityFacet.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibCorporateIdentity } from "../libraries/LibCorporateIdentity.sol";
import { LibEnterpriseRegistry } from "../libraries/LibEnterpriseRegistry.sol";

contract CorporateIdentityFacet is ICorporateIdentityFacet {
    function createCorporateIdentity(
        uint256 enterpriseId,
        string calldata displayName,
        string calldata primaryDID,
        string calldata credentialsURI,
        bytes32 identityHash
    ) external {
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, msg.sender
        );

        LibCorporateIdentity.Layout storage ds = LibCorporateIdentity.data();
        if (ds.identities[enterpriseId].enterpriseId != 0) {
            revert LibCorporateIdentity.IdentityAlreadyExists(enterpriseId);
        }

        ds.identities[enterpriseId] = LibCorporateIdentity.CorporateIdentity({
            enterpriseId: enterpriseId,
            identityHash: identityHash,
            displayName: displayName,
            primaryDID: primaryDID,
            credentialsURI: credentialsURI,
            createdAt: uint64(block.timestamp),
            active: true
        });

        emit CorporateIdentityCreated(
            enterpriseId, identityHash, displayName, primaryDID, credentialsURI, msg.sender
        );
    }

    function setCorporateIdentityStatus(uint256 enterpriseId, bool active) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, msg.sender
        );
        LibCorporateIdentity.CorporateIdentity storage identity = _requireIdentity(enterpriseId);
        identity.active = active;
        emit CorporateIdentityActivated(enterpriseId, active, msg.sender);
    }

    function setCorporateIdentityCredentials(uint256 enterpriseId, string calldata credentialsURI)
        external
    {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, msg.sender
        );
        LibCorporateIdentity.CorporateIdentity storage identity = _requireIdentity(enterpriseId);
        identity.credentialsURI = credentialsURI;
        emit CorporateIdentityCredentialsUpdated(enterpriseId, credentialsURI, msg.sender);
    }

    function bindEnterpriseWallet(uint256 enterpriseId, address wallet) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, msg.sender
        );
        if (wallet == address(0)) revert LibCorporateIdentity.InvalidAddress();

        LibCorporateIdentity.Layout storage ds = LibCorporateIdentity.data();
        if (ds.walletEnterprise[wallet] != 0) revert LibCorporateIdentity.DuplicateWallet(wallet);

        _requireIdentity(enterpriseId);
        ds.enterpriseWallets[enterpriseId][wallet] = true;
        ds.walletEnterprise[wallet] = enterpriseId;

        emit EnterpriseWalletBound(enterpriseId, wallet, msg.sender);
    }

    function unbindEnterpriseWallet(uint256 enterpriseId, address wallet) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, msg.sender
        );

        LibCorporateIdentity.Layout storage ds = LibCorporateIdentity.data();
        if (!ds.enterpriseWallets[enterpriseId][wallet]) {
            revert LibCorporateIdentity.WalletNotFound(wallet);
        }

        ds.enterpriseWallets[enterpriseId][wallet] = false;
        ds.walletEnterprise[wallet] = 0;

        emit EnterpriseWalletUnbound(enterpriseId, wallet, msg.sender);
    }

    function authorizeSigner(uint256 enterpriseId, address signer, bytes32 purpose) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, msg.sender
        );
        if (signer == address(0)) revert LibCorporateIdentity.InvalidAddress();

        LibCorporateIdentity.Layout storage ds = LibCorporateIdentity.data();
        LibCorporateIdentity.AuthorizedSigner storage stored =
            ds.authorizedSigners[enterpriseId][signer];
        if (stored.active) revert LibCorporateIdentity.SignerAlreadyAuthorized(signer);

        _requireIdentity(enterpriseId);
        ds.authorizedSigners[enterpriseId][signer] = LibCorporateIdentity.AuthorizedSigner({
            purpose: purpose, authorizedAt: uint64(block.timestamp), active: true
        });

        emit AuthorizedSignerAdded(enterpriseId, signer, purpose, msg.sender);
    }

    function revokeSigner(uint256 enterpriseId, address signer) external {
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, msg.sender
        );
        LibCorporateIdentity.AuthorizedSigner storage stored =
            LibCorporateIdentity.data().authorizedSigners[enterpriseId][signer];
        if (!stored.active) revert LibCorporateIdentity.WalletNotFound(signer);

        stored.active = false;
        emit AuthorizedSignerRemoved(enterpriseId, signer, msg.sender);
    }

    function getCorporateIdentity(uint256 enterpriseId)
        external
        view
        returns (CorporateIdentityView memory identity)
    {
        LibCorporateIdentity.CorporateIdentity storage stored = _requireIdentity(enterpriseId);
        identity = CorporateIdentityView({
            enterpriseId: stored.enterpriseId,
            identityHash: stored.identityHash,
            displayName: stored.displayName,
            primaryDID: stored.primaryDID,
            credentialsURI: stored.credentialsURI,
            createdAt: stored.createdAt,
            active: stored.active
        });
    }

    function getWalletEnterprise(address wallet) external view returns (uint256 enterpriseId) {
        enterpriseId = LibCorporateIdentity.data().walletEnterprise[wallet];
    }

    function isEnterpriseWallet(uint256 enterpriseId, address wallet) external view returns (bool) {
        return LibCorporateIdentity.data().enterpriseWallets[enterpriseId][wallet];
    }

    function getAuthorizedSigner(uint256 enterpriseId, address signer)
        external
        view
        returns (AuthorizedSignerView memory signerView)
    {
        LibCorporateIdentity.AuthorizedSigner storage stored =
            LibCorporateIdentity.data().authorizedSigners[enterpriseId][signer];
        signerView = AuthorizedSignerView({
            purpose: stored.purpose, authorizedAt: stored.authorizedAt, active: stored.active
        });
    }

    function _requireIdentity(uint256 enterpriseId)
        internal
        view
        returns (LibCorporateIdentity.CorporateIdentity storage identity)
    {
        identity = LibCorporateIdentity.data().identities[enterpriseId];
        if (identity.enterpriseId == 0) revert LibCorporateIdentity.IdentityNotFound(enterpriseId);
    }
}
