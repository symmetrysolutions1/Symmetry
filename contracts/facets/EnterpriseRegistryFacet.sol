// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IEnterpriseRegistryFacet } from "../interfaces/IEnterpriseRegistryFacet.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibEnterpriseRegistry } from "../libraries/LibEnterpriseRegistry.sol";

contract EnterpriseRegistryFacet is IEnterpriseRegistryFacet {
    function onboardEnterprise(
        string calldata legalName,
        string calldata jurisdictionCode,
        address admin,
        address multisig,
        string calldata metadataURI,
        uint32 enabledServices
    ) external returns (uint256 enterpriseId) {
        LibAccessControl.enforceProtocolAdmin(msg.sender);
        LibEnterpriseRegistry.enforceValidServiceMask(enabledServices);
        if (admin == address(0) || multisig == address(0)) {
            revert LibEnterpriseRegistry.InvalidAddress();
        }

        LibEnterpriseRegistry.Layout storage ds = LibEnterpriseRegistry.data();
        bytes32 legalEntityKey = LibEnterpriseRegistry.keyFor(legalName, jurisdictionCode);
        if (ds.enterpriseIdByLegalEntityKey[legalEntityKey] != 0) {
            revert LibEnterpriseRegistry.EnterpriseAlreadyExists(legalEntityKey);
        }

        enterpriseId = LibEnterpriseRegistry.nextEnterpriseId(ds);
        ds.enterprises[enterpriseId] = LibEnterpriseRegistry.Enterprise({
            id: enterpriseId,
            legalName: legalName,
            jurisdictionCode: jurisdictionCode,
            admin: admin,
            multisig: multisig,
            metadataURI: metadataURI,
            createdAt: uint64(block.timestamp),
            enabledServices: enabledServices,
            active: true
        });
        ds.enterpriseIdByLegalEntityKey[legalEntityKey] = enterpriseId;

        LibAccessControl.setEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, admin, true
        );
        LibAccessControl.setEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_OPERATOR_ROLE, admin, true
        );
        LibAccessControl.setEnterpriseRole(
            enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, admin, true
        );
        LibAccessControl.setEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, multisig, true
        );

        emit EnterpriseOnboarded(
            enterpriseId, legalName, jurisdictionCode, admin, multisig, enabledServices, metadataURI
        );
    }

    function setEnterpriseServices(uint256 enterpriseId, uint32 enabledServices) external {
        LibAccessControl.enforceProtocolAdmin(msg.sender);
        LibEnterpriseRegistry.enforceValidServiceMask(enabledServices);
        LibEnterpriseRegistry.Enterprise storage enterprise =
            LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        uint32 previous = enterprise.enabledServices;
        enterprise.enabledServices = enabledServices;
        emit EnterpriseServiceConfigurationUpdated(
            enterpriseId, previous, enabledServices, msg.sender
        );
    }

    function setEnterpriseAdmin(uint256 enterpriseId, address newAdmin) external {
        if (newAdmin == address(0)) revert LibEnterpriseRegistry.InvalidAddress();
        LibEnterpriseRegistry.Enterprise storage enterprise = _requireEnterpriseAdmin(enterpriseId);

        address previousAdmin = enterprise.admin;
        address currentMultisig = enterprise.multisig;
        enterprise.admin = newAdmin;

        if (previousAdmin != newAdmin) {
            if (previousAdmin != currentMultisig) {
                LibAccessControl.setEnterpriseRole(
                    enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, previousAdmin, false
                );
            }
            LibAccessControl.setEnterpriseRole(
                enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, previousAdmin, false
            );
            LibAccessControl.setEnterpriseRole(
                enterpriseId, LibAccessControl.ENTERPRISE_OPERATOR_ROLE, previousAdmin, false
            );
        }

        LibAccessControl.setEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, newAdmin, true
        );
        LibAccessControl.setEnterpriseRole(
            enterpriseId, LibAccessControl.IDENTITY_ADMIN_ROLE, newAdmin, true
        );
        LibAccessControl.setEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_OPERATOR_ROLE, newAdmin, true
        );

        emit EnterpriseAdminUpdated(enterpriseId, previousAdmin, newAdmin, msg.sender);
    }

    function setEnterpriseMultisig(uint256 enterpriseId, address newMultisig) external {
        if (newMultisig == address(0)) revert LibEnterpriseRegistry.InvalidAddress();
        LibEnterpriseRegistry.Enterprise storage enterprise = _requireEnterpriseAdmin(enterpriseId);

        address previous = enterprise.multisig;
        address currentAdmin = enterprise.admin;
        enterprise.multisig = newMultisig;

        if (previous != currentAdmin && previous != newMultisig) {
            LibAccessControl.setEnterpriseRole(
                enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, previous, false
            );
        }
        LibAccessControl.setEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, newMultisig, true
        );

        emit EnterpriseMultisigUpdated(enterpriseId, previous, newMultisig, msg.sender);
    }

    function setEnterpriseStatus(uint256 enterpriseId, bool active) external {
        LibEnterpriseRegistry.Enterprise storage enterprise = _requireEnterpriseAdmin(enterpriseId);
        enterprise.active = active;
        emit EnterpriseStatusUpdated(enterpriseId, active, msg.sender);
    }

    function setEnterpriseMetadata(uint256 enterpriseId, string calldata metadataURI) external {
        LibEnterpriseRegistry.Enterprise storage enterprise = _requireEnterpriseAdmin(enterpriseId);
        enterprise.metadataURI = metadataURI;
        emit EnterpriseMetadataUpdated(enterpriseId, metadataURI, msg.sender);
    }

    function getEnterprise(uint256 enterpriseId)
        external
        view
        returns (EnterpriseView memory enterprise)
    {
        LibEnterpriseRegistry.Enterprise storage stored =
            LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        enterprise = EnterpriseView({
            id: stored.id,
            legalName: stored.legalName,
            jurisdictionCode: stored.jurisdictionCode,
            admin: stored.admin,
            multisig: stored.multisig,
            metadataURI: stored.metadataURI,
            createdAt: stored.createdAt,
            enabledServices: stored.enabledServices,
            active: stored.active
        });
    }

    function getEnterpriseIdByLegalEntityKey(
        string calldata legalName,
        string calldata jurisdictionCode
    ) external view returns (uint256 enterpriseId) {
        enterpriseId = LibEnterpriseRegistry.data()
        .enterpriseIdByLegalEntityKey[LibEnterpriseRegistry.keyFor(legalName, jurisdictionCode)];
    }

    function _requireEnterpriseAdmin(uint256 enterpriseId)
        internal
        view
        returns (LibEnterpriseRegistry.Enterprise storage enterprise)
    {
        enterprise = LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
        );
    }
}
