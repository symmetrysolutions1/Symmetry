// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library LibVotoID {
    bytes32 internal constant STORAGE_SLOT = keccak256("symmetry.enterprises.storage.votoid");

    error BoardNotInitialized(uint256 enterpriseId);
    error BoardAlreadyInitialized(uint256 enterpriseId);
    error InvalidAddress();
    error InvalidPercentage();
    error SessionNotActive(uint256 enterpriseId);
    error SessionAlreadyActive(uint256 enterpriseId);
    error SessionNotFound(uint256 enterpriseId, uint256 sessionId);
    error ProposalNotFound(uint256 enterpriseId, uint256 proposalId);
    error NotBoardMember(address account);
    error AlreadyBoardMember(address account);
    error AlreadyActive(address account);
    error NotActive(address account);
    error NotEligible(address account);
    error AlreadyVoted(address account);
    error InvalidState();
    error InvalidDuration();
    error InvalidText();
    error ExecutorRequired();

    bytes32 internal constant SERVICE_KEY = keccak256("votoid");

    enum SessionStatus {
        None,
        Open,
        Closed
    }

    enum ProposalStatus {
        None,
        Created,
        Deliberation,
        Voting,
        Approved,
        Rejected,
        Executed,
        Verified
    }

    struct BoardConfig {
        bool initialized;
        address chairperson;
        address secretary;
        uint16 quorumPercentage;
        uint256 boardMemberCount;
        uint256 activeSessionId;
        uint256 sessionCount;
        uint256 proposalCount;
    }

    struct Session {
        uint256 id;
        string name;
        SessionStatus status;
        uint64 openedAt;
        uint64 closedAt;
        uint64 deliberationDuration;
        uint64 votingDuration;
        uint256 proposalStartId;
        uint256 proposalEndId;
        uint256 activeMemberCount;
    }

    struct Proposal {
        uint256 id;
        uint256 sessionId;
        string title;
        string description;
        bytes32 evidenceManifestDigest;
        string evidenceManifestURI;
        address executor;
        ProposalStatus status;
        uint64 createdAt;
        uint64 deliberationDeadline;
        uint64 votingDeadline;
        uint256 eligibleVoterCount;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
    }

    struct Layout {
        mapping(uint256 => BoardConfig) boards;
        mapping(uint256 => mapping(address => bool)) boardMembers;
        mapping(uint256 => address[]) boardMemberList;
        mapping(uint256 => mapping(uint256 => Session)) sessions;
        mapping(uint256 => mapping(uint256 => Proposal)) proposals;
        mapping(uint256 => mapping(uint256 => mapping(address => bool))) sessionActiveMembers;
        mapping(uint256 => mapping(uint256 => mapping(uint256 => mapping(address => bool))))
            proposalEligible;
        mapping(uint256 => mapping(uint256 => mapping(address => bool))) proposalHasVoted;
        mapping(uint256 => mapping(uint256 => uint256[])) sessionProposalIds;
    }

    function data() internal pure returns (Layout storage ds) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            ds.slot := slot
        }
    }
}
