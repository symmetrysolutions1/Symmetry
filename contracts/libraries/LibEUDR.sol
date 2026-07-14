// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LibEUDR {
    bytes32 internal constant STORAGE_SLOT = keccak256("symmetry.enterprises.storage.eudr");
    bytes32 internal constant SERVICE_KEY = keccak256("eudr");
    bytes32 internal constant EXPORTER_ROLE = keccak256("EXPORTER_ROLE");
    bytes32 internal constant PRODUCER_ROLE = keccak256("PRODUCER_ROLE");
    bytes32 internal constant EUDR_VERIFIER_ROLE = keccak256("EUDR_VERIFIER_ROLE");

    error InvalidAddress();
    error InvalidText();
    error InvalidDigest();
    error InvalidQuantity();
    error ActorNotFound(uint256 enterpriseId, address actor);
    error ActorAlreadyRegistered(uint256 enterpriseId, address actor);
    error ParcelNotFound(uint256 enterpriseId, uint256 parcelId);
    error BatchNotFound(uint256 enterpriseId, uint256 batchId);
    error CertificateNotFound(uint256 enterpriseId, uint256 certificateId);
    error InvalidState();
    error UnauthorizedCustody(uint256 enterpriseId, uint256 batchId, address actor);

    enum BatchStatus {
        None,
        Created,
        InTransit,
        Validated,
        Certified,
        Rejected
    }

    enum CertificateStatus {
        None,
        Issued,
        Revoked
    }

    struct SupplyActor {
        uint256 id;
        address account;
        bytes32 roleKey;
        string legalName;
        string metadataURI;
        uint64 registeredAt;
        bool active;
    }

    struct Parcel {
        uint256 id;
        string parcelRef;
        bytes32 geoDigest;
        string metadataURI;
        uint64 registeredAt;
        address registeredBy;
    }

    struct Batch {
        uint256 id;
        string batchRef;
        uint256 parcelId;
        uint256 quantity;
        string unit;
        string dossierManifestURI;
        bytes32 dossierManifestDigest;
        address currentCustodian;
        uint16 riskScore;
        BatchStatus status;
        uint64 createdAt;
        uint64 validatedAt;
        uint256 certificateId;
    }

    struct Certificate {
        uint256 id;
        uint256 batchId;
        string certificateURI;
        string passportURI;
        bytes32 manifestDigest;
        CertificateStatus status;
        uint64 issuedAt;
        uint64 revokedAt;
        address issuedBy;
    }

    struct Layout {
        mapping(uint256 => uint256) enterpriseActorCount;
        mapping(uint256 => mapping(address => SupplyActor)) actorsByAddress;
        mapping(uint256 => address[]) actorAccounts;
        mapping(uint256 => uint256) enterpriseParcelCount;
        mapping(uint256 => uint256[]) parcelIds;
        mapping(uint256 => mapping(uint256 => Parcel)) parcels;
        mapping(uint256 => uint256) enterpriseBatchCount;
        mapping(uint256 => uint256[]) batchIds;
        mapping(uint256 => mapping(uint256 => Batch)) batches;
        mapping(uint256 => uint256) enterpriseCertificateCount;
        mapping(uint256 => uint256[]) certificateIds;
        mapping(uint256 => mapping(uint256 => Certificate)) certificates;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }
}
