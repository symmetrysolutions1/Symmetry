// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEnterpriseRegistryFacet {
    event EnterpriseOnboarded(
        uint256 indexed enterpriseId,
        string legalName,
        string jurisdictionCode,
        address indexed admin,
        address indexed multisig,
        uint32 enabledServices,
        string metadataURI
    );
    event EnterpriseServiceConfigurationUpdated(
        uint256 indexed enterpriseId,
        uint32 previousServices,
        uint32 newServices,
        address indexed updatedBy
    );
    event EnterpriseAdminUpdated(
        uint256 indexed enterpriseId,
        address indexed previousAdmin,
        address indexed newAdmin,
        address updatedBy
    );
    event EnterpriseMultisigUpdated(
        uint256 indexed enterpriseId,
        address indexed previousMultisig,
        address indexed newMultisig,
        address updatedBy
    );
    event EnterpriseStatusUpdated(
        uint256 indexed enterpriseId, bool active, address indexed updatedBy
    );
    event EnterpriseMetadataUpdated(
        uint256 indexed enterpriseId, string metadataURI, address indexed updatedBy
    );

    struct EnterpriseView {
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

    function onboardEnterprise(
        string calldata legalName,
        string calldata jurisdictionCode,
        address admin,
        address multisig,
        string calldata metadataURI,
        uint32 enabledServices
    ) external returns (uint256 enterpriseId);

    function setEnterpriseServices(uint256 enterpriseId, uint32 enabledServices) external;
    function setEnterpriseAdmin(uint256 enterpriseId, address newAdmin) external;
    function setEnterpriseMultisig(uint256 enterpriseId, address newMultisig) external;
    function setEnterpriseStatus(uint256 enterpriseId, bool active) external;
    function setEnterpriseMetadata(uint256 enterpriseId, string calldata metadataURI) external;
    function getEnterprise(uint256 enterpriseId)
        external
        view
        returns (EnterpriseView memory enterprise);
    function getEnterpriseIdByLegalEntityKey(
        string calldata legalName,
        string calldata jurisdictionCode
    ) external view returns (uint256 enterpriseId);
}
