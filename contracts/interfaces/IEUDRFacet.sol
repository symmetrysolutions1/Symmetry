// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IEUDRFacet {
    event SupplyActorRegistered(
        uint256 indexed enterpriseId,
        uint256 indexed actorId,
        address indexed actor,
        bytes32 roleKey,
        string legalName
    );
    event ParcelRegistered(
        uint256 indexed enterpriseId,
        uint256 indexed parcelId,
        string parcelRef,
        bytes32 geoDigest,
        address indexed registeredBy
    );
    event BatchCreated(
        uint256 indexed enterpriseId,
        uint256 indexed batchId,
        uint256 indexed parcelId,
        string batchRef,
        address custodian
    );
    event CustodyTransferred(
        uint256 indexed enterpriseId,
        uint256 indexed batchId,
        address indexed fromActor,
        address toActor,
        bytes32 manifestDigest
    );
    event DossierValidated(
        uint256 indexed enterpriseId,
        uint256 indexed batchId,
        uint16 riskScore,
        bool approved,
        bytes32 validationManifestDigest,
        address indexed verifier
    );
    event CertificateIssued(
        uint256 indexed enterpriseId,
        uint256 indexed certificateId,
        uint256 indexed batchId,
        string certificateURI,
        string passportURI
    );
    event CertificateRevoked(
        uint256 indexed enterpriseId,
        uint256 indexed certificateId,
        uint256 indexed batchId,
        string reasonURI,
        address actor
    );

    struct SupplyActorView {
        uint256 id;
        address account;
        bytes32 roleKey;
        string legalName;
        string metadataURI;
        uint64 registeredAt;
        bool active;
    }

    struct ParcelView {
        uint256 id;
        string parcelRef;
        bytes32 geoDigest;
        string metadataURI;
        uint64 registeredAt;
        address registeredBy;
    }

    struct BatchView {
        uint256 id;
        string batchRef;
        uint256 parcelId;
        uint256 quantity;
        string unit;
        string dossierManifestURI;
        bytes32 dossierManifestDigest;
        address currentCustodian;
        uint16 riskScore;
        uint8 status;
        uint64 createdAt;
        uint64 validatedAt;
        uint256 certificateId;
    }

    struct CertificateView {
        uint256 id;
        uint256 batchId;
        string certificateURI;
        string passportURI;
        bytes32 manifestDigest;
        uint8 status;
        uint64 issuedAt;
        uint64 revokedAt;
        address issuedBy;
    }

    function registerSupplyActor(
        uint256 enterpriseId,
        address actor,
        bytes32 roleKey,
        string calldata legalName,
        string calldata metadataURI
    ) external returns (uint256 actorId);

    function registerParcel(
        uint256 enterpriseId,
        string calldata parcelRef,
        bytes32 geoDigest,
        string calldata metadataURI
    ) external returns (uint256 parcelId);

    function createBatch(
        uint256 enterpriseId,
        string calldata batchRef,
        uint256 parcelId,
        uint256 quantity,
        string calldata unit,
        string calldata dossierManifestURI,
        bytes32 dossierManifestDigest
    ) external returns (uint256 batchId);

    function transferCustody(
        uint256 enterpriseId,
        uint256 batchId,
        address toActor,
        bytes32 manifestDigest
    ) external;

    function validateDossier(
        uint256 enterpriseId,
        uint256 batchId,
        uint16 riskScore,
        bool approved,
        bytes32 validationManifestDigest
    ) external;

    function issueCertificate(
        uint256 enterpriseId,
        uint256 batchId,
        string calldata certificateURI,
        string calldata passportURI,
        bytes32 manifestDigest
    ) external returns (uint256 certificateId);

    function revokeCertificate(
        uint256 enterpriseId,
        uint256 certificateId,
        string calldata reasonURI
    ) external;

    function getSupplyActor(uint256 enterpriseId, address actor)
        external
        view
        returns (SupplyActorView memory);

    function getParcel(uint256 enterpriseId, uint256 parcelId)
        external
        view
        returns (ParcelView memory);

    function getBatch(uint256 enterpriseId, uint256 batchId)
        external
        view
        returns (BatchView memory);

    function getCertificate(uint256 enterpriseId, uint256 certificateId)
        external
        view
        returns (CertificateView memory);

    function listEnterpriseParcels(uint256 enterpriseId) external view returns (uint256[] memory);

    function listEnterpriseBatches(uint256 enterpriseId) external view returns (uint256[] memory);

    function listEnterpriseCertificates(uint256 enterpriseId)
        external
        view
        returns (uint256[] memory);
}
