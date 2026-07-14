// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEnterpriseRootFactory {
    event FactoryOwnershipTransferStarted(
        address indexed currentOwner, address indexed pendingOwner
    );
    event FactoryOwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FactoryProvisionerUpdated(address indexed provisioner, bool authorized);

    event EnterpriseRootDeployed(
        bytes32 indexed companyKey,
        address indexed root,
        address indexed enterpriseMultisig,
        address enterpriseAdmin,
        string legalName,
        string jurisdictionCode,
        uint32 enabledServices
    );

    struct DeployEnterpriseRootParams {
        string legalName;
        string jurisdictionCode;
        address enterpriseAdmin;
        address enterpriseMultisig;
        string enterpriseMetadataURI;
        uint32 enabledServices;
        address finalProtocolAdmin;
        address finalUpgradeAdmin;
    }

    function deployEnterpriseRoot(DeployEnterpriseRootParams calldata params)
        external
        returns (address root, uint256 localEnterpriseId, bytes32 companyKey);

    function owner() external view returns (address);
    function pendingOwner() external view returns (address);
    function transferOwnership(address newOwner) external;
    function acceptOwnership() external;
    function setProvisioner(address provisioner, bool authorized) external;
    function isProvisioner(address account) external view returns (bool);
    function getRootByCompanyKey(bytes32 companyKey) external view returns (address root);
    function isRegisteredRoot(address root) external view returns (bool);
    function totalRoots() external view returns (uint256);
}
