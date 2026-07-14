// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IVotoIDFacet {
    event BoardInitialized(
        uint256 indexed enterpriseId,
        address indexed chairperson,
        address indexed secretary,
        uint16 quorumPercentage
    );
    event ChairpersonUpdated(
        uint256 indexed enterpriseId, address indexed chairperson, address indexed updatedBy
    );
    event SecretaryUpdated(
        uint256 indexed enterpriseId, address indexed secretary, address indexed updatedBy
    );
    event BoardMemberAdded(
        uint256 indexed enterpriseId, address indexed member, address indexed addedBy
    );
    event BoardMemberRemoved(
        uint256 indexed enterpriseId, address indexed member, address indexed removedBy
    );
    event SessionOpened(
        uint256 indexed enterpriseId,
        uint256 indexed sessionId,
        string name,
        uint64 deliberationDuration,
        uint64 votingDuration
    );
    event SessionJoined(
        uint256 indexed enterpriseId, uint256 indexed sessionId, address indexed member
    );
    event SessionLeft(
        uint256 indexed enterpriseId, uint256 indexed sessionId, address indexed member
    );
    event SessionClosed(
        uint256 indexed enterpriseId, uint256 indexed sessionId, uint256 proposalCount
    );
    event ProposalCreated(
        uint256 indexed enterpriseId,
        uint256 indexed sessionId,
        uint256 indexed proposalId,
        string title,
        string evidenceManifestURI
    );
    event ProposalDeliberationStarted(
        uint256 indexed enterpriseId, uint256 indexed proposalId, uint64 deliberationDeadline
    );
    event ProposalVotingStarted(
        uint256 indexed enterpriseId,
        uint256 indexed proposalId,
        uint64 votingDeadline,
        uint256 eligibleVoterCount
    );
    event VoteCast(
        uint256 indexed enterpriseId,
        uint256 indexed proposalId,
        address indexed voter,
        bool support
    );
    event ProposalClosed(
        uint256 indexed enterpriseId,
        uint256 indexed proposalId,
        bool approved,
        uint256 yesVotes,
        uint256 noVotes,
        uint256 eligibleVoterCount
    );
    event ProposalExecutorAssigned(
        uint256 indexed enterpriseId, uint256 indexed proposalId, address indexed executor
    );
    event ProposalExecuted(
        uint256 indexed enterpriseId, uint256 indexed proposalId, address indexed operator
    );
    event ProposalVerified(
        uint256 indexed enterpriseId, uint256 indexed proposalId, address indexed verifier
    );

    struct BoardView {
        bool initialized;
        address chairperson;
        address secretary;
        uint16 quorumPercentage;
        uint256 boardMemberCount;
        uint256 activeSessionId;
        uint256 sessionCount;
        uint256 proposalCount;
    }

    struct SessionView {
        uint256 id;
        string name;
        uint8 status;
        uint64 openedAt;
        uint64 closedAt;
        uint64 deliberationDuration;
        uint64 votingDuration;
        uint256 proposalStartId;
        uint256 proposalEndId;
        uint256 activeMemberCount;
    }

    struct ProposalView {
        uint256 id;
        uint256 sessionId;
        string title;
        string description;
        bytes32 evidenceManifestDigest;
        string evidenceManifestURI;
        address executor;
        uint8 status;
        uint64 createdAt;
        uint64 deliberationDeadline;
        uint64 votingDeadline;
        uint256 eligibleVoterCount;
        uint256 yesVotes;
        uint256 noVotes;
        bool executed;
    }

    function initializeBoard(
        uint256 enterpriseId,
        address chairperson,
        address secretary,
        uint16 quorumPercentage
    ) external;
    function setChairperson(uint256 enterpriseId, address chairperson) external;
    function setSecretary(uint256 enterpriseId, address secretary) external;
    function addBoardMember(uint256 enterpriseId, address member) external;
    function removeBoardMember(uint256 enterpriseId, address member) external;
    function openSession(
        uint256 enterpriseId,
        string calldata name,
        uint64 deliberationDuration,
        uint64 votingDuration
    ) external returns (uint256 sessionId);
    function joinSession(uint256 enterpriseId) external;
    function leaveSession(uint256 enterpriseId) external;
    function closeSession(uint256 enterpriseId) external;
    function createProposal(
        uint256 enterpriseId,
        string calldata title,
        string calldata description,
        string calldata evidenceManifestURI,
        bytes32 evidenceManifestDigest
    ) external returns (uint256 proposalId);
    function startDeliberation(uint256 enterpriseId, uint256 proposalId) external;
    function startVoting(uint256 enterpriseId, uint256 proposalId) external;
    function castVote(uint256 enterpriseId, uint256 proposalId, bool support) external;
    function closeProposal(uint256 enterpriseId, uint256 proposalId) external;
    function assignProposalExecutor(uint256 enterpriseId, uint256 proposalId, address executor)
        external;
    function executeProposal(uint256 enterpriseId, uint256 proposalId) external;
    function verifyProposal(uint256 enterpriseId, uint256 proposalId) external;
    function getBoard(uint256 enterpriseId) external view returns (BoardView memory board);
    function getSession(uint256 enterpriseId, uint256 sessionId)
        external
        view
        returns (SessionView memory session);
    function getProposal(uint256 enterpriseId, uint256 proposalId)
        external
        view
        returns (ProposalView memory proposal);
    function isBoardMember(uint256 enterpriseId, address account) external view returns (bool);
    function isSessionActiveMember(uint256 enterpriseId, uint256 sessionId, address account)
        external
        view
        returns (bool);
    function isProposalEligibleVoter(
        uint256 enterpriseId,
        uint256 sessionId,
        uint256 proposalId,
        address account
    ) external view returns (bool);
    function listBoardMembers(uint256 enterpriseId) external view returns (address[] memory members);
    function listSessionProposalIds(uint256 enterpriseId, uint256 sessionId)
        external
        view
        returns (uint256[] memory proposalIds);
}
