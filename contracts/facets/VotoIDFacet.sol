// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { IVotoIDFacet } from "../interfaces/IVotoIDFacet.sol";
import { LibAccessControl } from "../libraries/LibAccessControl.sol";
import { LibEnterpriseRegistry } from "../libraries/LibEnterpriseRegistry.sol";
import { LibServiceEntitlement } from "../libraries/LibServiceEntitlement.sol";
import { LibVotoID } from "../libraries/LibVotoID.sol";

contract VotoIDFacet is IVotoIDFacet {
    modifier onlyOperationalVotoID(uint256 enterpriseId) {
        LibServiceEntitlement.enforceOperational(
            enterpriseId, LibServiceEntitlement.SERVICE_VOTO_ID
        );
        _;
    }

    function initializeBoard(
        uint256 enterpriseId,
        address chairperson,
        address secretary,
        uint16 quorumPercentage
    ) external onlyOperationalVotoID(enterpriseId) {
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        LibAccessControl.enforceEnterpriseRole(
            enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
        );
        if (chairperson == address(0) || secretary == address(0)) {
            revert LibVotoID.InvalidAddress();
        }
        if (quorumPercentage == 0 || quorumPercentage > 100) revert LibVotoID.InvalidPercentage();

        LibVotoID.Layout storage ds = LibVotoID.data();
        LibVotoID.BoardConfig storage board = ds.boards[enterpriseId];
        if (board.initialized) revert LibVotoID.BoardAlreadyInitialized(enterpriseId);

        board.initialized = true;
        board.chairperson = chairperson;
        board.secretary = secretary;
        board.quorumPercentage = quorumPercentage;

        _addBoardMemberInternal(ds, enterpriseId, chairperson);
        if (!ds.boardMembers[enterpriseId][secretary]) {
            _addBoardMemberInternal(ds, enterpriseId, secretary);
        }

        emit BoardInitialized(enterpriseId, chairperson, secretary, quorumPercentage);
    }

    function setChairperson(uint256 enterpriseId, address chairperson)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        if (chairperson == address(0)) revert LibVotoID.InvalidAddress();
        LibVotoID.BoardConfig storage board = _requireBoardAdmin(enterpriseId);
        board.chairperson = chairperson;
        if (!LibVotoID.data().boardMembers[enterpriseId][chairperson]) {
            _addBoardMemberInternal(LibVotoID.data(), enterpriseId, chairperson);
        }
        emit ChairpersonUpdated(enterpriseId, chairperson, msg.sender);
    }

    function setSecretary(uint256 enterpriseId, address secretary)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        if (secretary == address(0)) revert LibVotoID.InvalidAddress();
        LibVotoID.BoardConfig storage board = _requireBoardAdmin(enterpriseId);
        board.secretary = secretary;
        if (!LibVotoID.data().boardMembers[enterpriseId][secretary]) {
            _addBoardMemberInternal(LibVotoID.data(), enterpriseId, secretary);
        }
        emit SecretaryUpdated(enterpriseId, secretary, msg.sender);
    }

    function addBoardMember(uint256 enterpriseId, address member)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        if (member == address(0)) revert LibVotoID.InvalidAddress();
        _requireChairOrSecretaryOrAdmin(enterpriseId);
        _addBoardMemberInternal(LibVotoID.data(), enterpriseId, member);
        emit BoardMemberAdded(enterpriseId, member, msg.sender);
    }

    function removeBoardMember(uint256 enterpriseId, address member)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        _requireChairOrSecretaryOrAdmin(enterpriseId);
        LibVotoID.Layout storage ds = LibVotoID.data();
        if (!ds.boardMembers[enterpriseId][member]) revert LibVotoID.NotBoardMember(member);
        ds.boardMembers[enterpriseId][member] = false;
        if (ds.boards[enterpriseId].boardMemberCount > 0) {
            ds.boards[enterpriseId].boardMemberCount--;
        }
        emit BoardMemberRemoved(enterpriseId, member, msg.sender);
    }

    function openSession(
        uint256 enterpriseId,
        string calldata name,
        uint64 deliberationDuration,
        uint64 votingDuration
    ) external onlyOperationalVotoID(enterpriseId) returns (uint256 sessionId) {
        if (bytes(name).length == 0) revert LibVotoID.InvalidText();
        if (deliberationDuration == 0 || votingDuration == 0) revert LibVotoID.InvalidDuration();

        LibVotoID.BoardConfig storage board = _requireChairOrSecretaryOrAdmin(enterpriseId);
        if (board.activeSessionId != 0) revert LibVotoID.SessionAlreadyActive(enterpriseId);

        LibVotoID.Layout storage ds = LibVotoID.data();
        sessionId = ++board.sessionCount;
        board.activeSessionId = sessionId;

        ds.sessions[enterpriseId][sessionId] = LibVotoID.Session({
            id: sessionId,
            name: name,
            status: LibVotoID.SessionStatus.Open,
            openedAt: uint64(block.timestamp),
            closedAt: 0,
            deliberationDuration: deliberationDuration,
            votingDuration: votingDuration,
            proposalStartId: board.proposalCount + 1,
            proposalEndId: board.proposalCount,
            activeMemberCount: 0
        });

        emit SessionOpened(enterpriseId, sessionId, name, deliberationDuration, votingDuration);
    }

    function joinSession(uint256 enterpriseId) external onlyOperationalVotoID(enterpriseId) {
        _requireBoardMember(enterpriseId, msg.sender);
        LibVotoID.Layout storage ds = LibVotoID.data();
        uint256 sessionId = _requireActiveSession(ds, enterpriseId).id;
        if (ds.sessionActiveMembers[enterpriseId][sessionId][msg.sender]) {
            revert LibVotoID.AlreadyActive(msg.sender);
        }
        ds.sessionActiveMembers[enterpriseId][sessionId][msg.sender] = true;
        ds.sessions[enterpriseId][sessionId].activeMemberCount++;
        emit SessionJoined(enterpriseId, sessionId, msg.sender);
    }

    function leaveSession(uint256 enterpriseId) external onlyOperationalVotoID(enterpriseId) {
        LibVotoID.Layout storage ds = LibVotoID.data();
        uint256 sessionId = _requireActiveSession(ds, enterpriseId).id;
        if (!ds.sessionActiveMembers[enterpriseId][sessionId][msg.sender]) {
            revert LibVotoID.NotActive(msg.sender);
        }
        ds.sessionActiveMembers[enterpriseId][sessionId][msg.sender] = false;
        if (ds.sessions[enterpriseId][sessionId].activeMemberCount > 0) {
            ds.sessions[enterpriseId][sessionId].activeMemberCount--;
        }
        emit SessionLeft(enterpriseId, sessionId, msg.sender);
    }

    function closeSession(uint256 enterpriseId) external onlyOperationalVotoID(enterpriseId) {
        LibVotoID.BoardConfig storage board = _requireChairOrSecretaryOrAdmin(enterpriseId);
        LibVotoID.Layout storage ds = LibVotoID.data();
        uint256 sessionId = board.activeSessionId;
        LibVotoID.Session storage session = ds.sessions[enterpriseId][sessionId];
        if (session.status != LibVotoID.SessionStatus.Open) {
            revert LibVotoID.SessionNotActive(enterpriseId);
        }

        uint256[] storage proposalIds = ds.sessionProposalIds[enterpriseId][sessionId];
        for (uint256 i; i < proposalIds.length; i++) {
            LibVotoID.Proposal storage proposal = ds.proposals[enterpriseId][proposalIds[i]];
            if (
                proposal.status == LibVotoID.ProposalStatus.Created
                    || proposal.status == LibVotoID.ProposalStatus.Deliberation
                    || proposal.status == LibVotoID.ProposalStatus.Voting
            ) revert LibVotoID.InvalidState();
        }

        session.status = LibVotoID.SessionStatus.Closed;
        session.closedAt = uint64(block.timestamp);
        board.activeSessionId = 0;
        emit SessionClosed(enterpriseId, sessionId, proposalIds.length);
    }

    function createProposal(
        uint256 enterpriseId,
        string calldata title,
        string calldata description,
        string calldata evidenceManifestURI,
        bytes32 evidenceManifestDigest
    ) external onlyOperationalVotoID(enterpriseId) returns (uint256 proposalId) {
        if (bytes(title).length == 0 || bytes(description).length == 0) {
            revert LibVotoID.InvalidText();
        }
        if (bytes(evidenceManifestURI).length == 0 || evidenceManifestDigest == bytes32(0)) {
            revert LibVotoID.InvalidText();
        }

        LibVotoID.BoardConfig storage board = _requireChairOrSecretaryOrAdmin(enterpriseId);
        LibVotoID.Layout storage ds = LibVotoID.data();
        LibVotoID.Session storage session = _requireActiveSession(ds, enterpriseId);

        proposalId = ++board.proposalCount;
        ds.proposals[enterpriseId][proposalId] = LibVotoID.Proposal({
            id: proposalId,
            sessionId: session.id,
            title: title,
            description: description,
            evidenceManifestDigest: evidenceManifestDigest,
            evidenceManifestURI: evidenceManifestURI,
            executor: address(0),
            status: LibVotoID.ProposalStatus.Created,
            createdAt: uint64(block.timestamp),
            deliberationDeadline: 0,
            votingDeadline: 0,
            eligibleVoterCount: 0,
            yesVotes: 0,
            noVotes: 0,
            executed: false
        });

        ds.sessionProposalIds[enterpriseId][session.id].push(proposalId);
        session.proposalEndId = proposalId;

        emit ProposalCreated(enterpriseId, session.id, proposalId, title, evidenceManifestURI);
    }

    function startDeliberation(uint256 enterpriseId, uint256 proposalId)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        _requireChairOrSecretaryOrAdmin(enterpriseId);
        LibVotoID.Layout storage ds = LibVotoID.data();
        LibVotoID.Proposal storage proposal = _requireProposal(ds, enterpriseId, proposalId);
        LibVotoID.Session storage session = _requireSession(ds, enterpriseId, proposal.sessionId);
        if (proposal.status != LibVotoID.ProposalStatus.Created) revert LibVotoID.InvalidState();
        proposal.status = LibVotoID.ProposalStatus.Deliberation;
        proposal.deliberationDeadline = uint64(block.timestamp + session.deliberationDuration);
        emit ProposalDeliberationStarted(enterpriseId, proposalId, proposal.deliberationDeadline);
    }

    function startVoting(uint256 enterpriseId, uint256 proposalId)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        _requireChairOrSecretaryOrAdmin(enterpriseId);
        LibVotoID.Layout storage ds = LibVotoID.data();
        LibVotoID.Proposal storage proposal = _requireProposal(ds, enterpriseId, proposalId);
        LibVotoID.Session storage session = _requireSession(ds, enterpriseId, proposal.sessionId);
        if (proposal.status != LibVotoID.ProposalStatus.Deliberation) {
            revert LibVotoID.InvalidState();
        }
        if (block.timestamp < proposal.deliberationDeadline) revert LibVotoID.InvalidState();

        uint256 eligibleCount = _snapshotEligibleVoters(ds, enterpriseId, session.id, proposalId);
        proposal.eligibleVoterCount = eligibleCount;
        proposal.status = LibVotoID.ProposalStatus.Voting;
        proposal.votingDeadline = uint64(block.timestamp + session.votingDuration);

        emit ProposalVotingStarted(enterpriseId, proposalId, proposal.votingDeadline, eligibleCount);
    }

    function castVote(uint256 enterpriseId, uint256 proposalId, bool support)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        LibVotoID.Layout storage ds = LibVotoID.data();
        LibVotoID.Proposal storage proposal = _requireProposal(ds, enterpriseId, proposalId);
        if (
            proposal.status != LibVotoID.ProposalStatus.Voting
                || block.timestamp > proposal.votingDeadline
        ) {
            revert LibVotoID.InvalidState();
        }
        if (!ds.proposalEligible[enterpriseId][proposal.sessionId][proposalId][msg.sender]) {
            revert LibVotoID.NotEligible(msg.sender);
        }
        if (ds.proposalHasVoted[enterpriseId][proposalId][msg.sender]) {
            revert LibVotoID.AlreadyVoted(msg.sender);
        }

        ds.proposalHasVoted[enterpriseId][proposalId][msg.sender] = true;
        if (support) {
            proposal.yesVotes++;
        } else {
            proposal.noVotes++;
        }

        emit VoteCast(enterpriseId, proposalId, msg.sender, support);
    }

    function closeProposal(uint256 enterpriseId, uint256 proposalId)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        _requireChairOrSecretaryOrAdmin(enterpriseId);
        LibVotoID.Layout storage ds = LibVotoID.data();
        LibVotoID.Proposal storage proposal = _requireProposal(ds, enterpriseId, proposalId);
        if (
            proposal.status != LibVotoID.ProposalStatus.Voting
                || block.timestamp < proposal.votingDeadline
        ) {
            revert LibVotoID.InvalidState();
        }

        LibVotoID.BoardConfig storage board = ds.boards[enterpriseId];
        uint256 totalVotes = proposal.yesVotes + proposal.noVotes;
        uint256 quorumRequired = (proposal.eligibleVoterCount * board.quorumPercentage) / 100;
        if (proposal.eligibleVoterCount > 0 && quorumRequired == 0) {
            quorumRequired = 1;
        }

        bool approved = totalVotes >= quorumRequired && proposal.yesVotes > proposal.noVotes;
        proposal.status =
            approved ? LibVotoID.ProposalStatus.Approved : LibVotoID.ProposalStatus.Rejected;

        emit ProposalClosed(
            enterpriseId,
            proposalId,
            approved,
            proposal.yesVotes,
            proposal.noVotes,
            proposal.eligibleVoterCount
        );
    }

    function assignProposalExecutor(uint256 enterpriseId, uint256 proposalId, address executor)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        if (executor == address(0)) revert LibVotoID.InvalidAddress();
        _requireChairOrSecretaryOrAdmin(enterpriseId);
        LibVotoID.Proposal storage proposal =
            _requireProposal(LibVotoID.data(), enterpriseId, proposalId);
        if (proposal.status != LibVotoID.ProposalStatus.Approved) revert LibVotoID.InvalidState();
        proposal.executor = executor;
        emit ProposalExecutorAssigned(enterpriseId, proposalId, executor);
    }

    function executeProposal(uint256 enterpriseId, uint256 proposalId)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        LibVotoID.Layout storage ds = LibVotoID.data();
        LibVotoID.Proposal storage proposal = _requireProposal(ds, enterpriseId, proposalId);
        if (proposal.status != LibVotoID.ProposalStatus.Approved) revert LibVotoID.InvalidState();
        if (proposal.executor == address(0)) revert LibVotoID.ExecutorRequired();
        if (
            msg.sender != proposal.executor && msg.sender != ds.boards[enterpriseId].chairperson
                && msg.sender != ds.boards[enterpriseId].secretary
                && !LibAccessControl.hasEnterpriseRole(
                    enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
                )
        ) {
            revert LibAccessControl.AccessDenied(
                LibAccessControl.ENTERPRISE_OPERATOR_ROLE, msg.sender, enterpriseId
            );
        }

        proposal.executed = true;
        proposal.status = LibVotoID.ProposalStatus.Executed;
        emit ProposalExecuted(enterpriseId, proposalId, msg.sender);
    }

    function verifyProposal(uint256 enterpriseId, uint256 proposalId)
        external
        onlyOperationalVotoID(enterpriseId)
    {
        _requireChairOrSecretaryOrAdmin(enterpriseId);
        LibVotoID.Proposal storage proposal =
            _requireProposal(LibVotoID.data(), enterpriseId, proposalId);
        if (proposal.status != LibVotoID.ProposalStatus.Executed) revert LibVotoID.InvalidState();
        proposal.status = LibVotoID.ProposalStatus.Verified;
        emit ProposalVerified(enterpriseId, proposalId, msg.sender);
    }

    function getBoard(uint256 enterpriseId) external view returns (BoardView memory board) {
        LibVotoID.BoardConfig storage stored = _requireBoard(LibVotoID.data(), enterpriseId);
        board = BoardView({
            initialized: stored.initialized,
            chairperson: stored.chairperson,
            secretary: stored.secretary,
            quorumPercentage: stored.quorumPercentage,
            boardMemberCount: stored.boardMemberCount,
            activeSessionId: stored.activeSessionId,
            sessionCount: stored.sessionCount,
            proposalCount: stored.proposalCount
        });
    }

    function getSession(uint256 enterpriseId, uint256 sessionId)
        external
        view
        returns (SessionView memory session)
    {
        LibVotoID.Session storage stored =
            _requireSession(LibVotoID.data(), enterpriseId, sessionId);
        session = SessionView({
            id: stored.id,
            name: stored.name,
            status: uint8(stored.status),
            openedAt: stored.openedAt,
            closedAt: stored.closedAt,
            deliberationDuration: stored.deliberationDuration,
            votingDuration: stored.votingDuration,
            proposalStartId: stored.proposalStartId,
            proposalEndId: stored.proposalEndId,
            activeMemberCount: stored.activeMemberCount
        });
    }

    function getProposal(uint256 enterpriseId, uint256 proposalId)
        external
        view
        returns (ProposalView memory proposal)
    {
        LibVotoID.Proposal storage stored =
            _requireProposal(LibVotoID.data(), enterpriseId, proposalId);
        proposal = ProposalView({
            id: stored.id,
            sessionId: stored.sessionId,
            title: stored.title,
            description: stored.description,
            evidenceManifestDigest: stored.evidenceManifestDigest,
            evidenceManifestURI: stored.evidenceManifestURI,
            executor: stored.executor,
            status: uint8(stored.status),
            createdAt: stored.createdAt,
            deliberationDeadline: stored.deliberationDeadline,
            votingDeadline: stored.votingDeadline,
            eligibleVoterCount: stored.eligibleVoterCount,
            yesVotes: stored.yesVotes,
            noVotes: stored.noVotes,
            executed: stored.executed
        });
    }

    function isBoardMember(uint256 enterpriseId, address account) external view returns (bool) {
        return LibVotoID.data().boardMembers[enterpriseId][account];
    }

    function isSessionActiveMember(uint256 enterpriseId, uint256 sessionId, address account)
        external
        view
        returns (bool)
    {
        return LibVotoID.data().sessionActiveMembers[enterpriseId][sessionId][account];
    }

    function isProposalEligibleVoter(
        uint256 enterpriseId,
        uint256 sessionId,
        uint256 proposalId,
        address account
    ) external view returns (bool) {
        return LibVotoID.data().proposalEligible[enterpriseId][sessionId][proposalId][account];
    }

    function listBoardMembers(uint256 enterpriseId)
        external
        view
        returns (address[] memory members)
    {
        members = LibVotoID.data().boardMemberList[enterpriseId];
    }

    function listSessionProposalIds(uint256 enterpriseId, uint256 sessionId)
        external
        view
        returns (uint256[] memory proposalIds)
    {
        proposalIds = LibVotoID.data().sessionProposalIds[enterpriseId][sessionId];
    }

    function _addBoardMemberInternal(
        LibVotoID.Layout storage ds,
        uint256 enterpriseId,
        address member
    ) internal {
        if (member == address(0)) revert LibVotoID.InvalidAddress();
        if (ds.boardMembers[enterpriseId][member]) revert LibVotoID.AlreadyBoardMember(member);
        ds.boardMembers[enterpriseId][member] = true;
        ds.boardMemberList[enterpriseId].push(member);
        ds.boards[enterpriseId].boardMemberCount++;
    }

    function _snapshotEligibleVoters(
        LibVotoID.Layout storage ds,
        uint256 enterpriseId,
        uint256 sessionId,
        uint256 proposalId
    ) internal returns (uint256 eligibleCount) {
        address[] storage members = ds.boardMemberList[enterpriseId];
        for (uint256 i; i < members.length; i++) {
            address member = members[i];
            if (
                ds.boardMembers[enterpriseId][member]
                    && ds.sessionActiveMembers[enterpriseId][sessionId][member]
            ) {
                ds.proposalEligible[enterpriseId][sessionId][proposalId][member] = true;
                eligibleCount++;
            }
        }
    }

    function _requireBoard(LibVotoID.Layout storage ds, uint256 enterpriseId)
        internal
        view
        returns (LibVotoID.BoardConfig storage board)
    {
        LibEnterpriseRegistry.requireEnterprise(enterpriseId);
        board = ds.boards[enterpriseId];
        if (!board.initialized) revert LibVotoID.BoardNotInitialized(enterpriseId);
    }

    function _requireBoardAdmin(uint256 enterpriseId)
        internal
        view
        returns (LibVotoID.BoardConfig storage board)
    {
        board = _requireBoard(LibVotoID.data(), enterpriseId);
        if (
            msg.sender != board.chairperson
                && !LibAccessControl.hasEnterpriseRole(
                    enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
                )
        ) {
            revert LibAccessControl.AccessDenied(
                LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender, enterpriseId
            );
        }
    }

    function _requireChairOrSecretaryOrAdmin(uint256 enterpriseId)
        internal
        view
        returns (LibVotoID.BoardConfig storage board)
    {
        board = _requireBoard(LibVotoID.data(), enterpriseId);
        if (
            msg.sender != board.chairperson && msg.sender != board.secretary
                && !LibAccessControl.hasEnterpriseRole(
                    enterpriseId, LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender
                )
        ) {
            revert LibAccessControl.AccessDenied(
                LibAccessControl.ENTERPRISE_ADMIN_ROLE, msg.sender, enterpriseId
            );
        }
    }

    function _requireBoardMember(uint256 enterpriseId, address account) internal view {
        _requireBoard(LibVotoID.data(), enterpriseId);
        if (!LibVotoID.data().boardMembers[enterpriseId][account]) {
            revert LibVotoID.NotBoardMember(account);
        }
    }

    function _requireActiveSession(LibVotoID.Layout storage ds, uint256 enterpriseId)
        internal
        view
        returns (LibVotoID.Session storage session)
    {
        LibVotoID.BoardConfig storage board = _requireBoard(ds, enterpriseId);
        if (board.activeSessionId == 0) revert LibVotoID.SessionNotActive(enterpriseId);
        session = ds.sessions[enterpriseId][board.activeSessionId];
        if (session.status != LibVotoID.SessionStatus.Open) {
            revert LibVotoID.SessionNotActive(enterpriseId);
        }
    }

    function _requireSession(LibVotoID.Layout storage ds, uint256 enterpriseId, uint256 sessionId)
        internal
        view
        returns (LibVotoID.Session storage session)
    {
        session = ds.sessions[enterpriseId][sessionId];
        if (session.id == 0) revert LibVotoID.SessionNotFound(enterpriseId, sessionId);
    }

    function _requireProposal(
        LibVotoID.Layout storage ds,
        uint256 enterpriseId,
        uint256 proposalId
    ) internal view returns (LibVotoID.Proposal storage proposal) {
        proposal = ds.proposals[enterpriseId][proposalId];
        if (proposal.id == 0) revert LibVotoID.ProposalNotFound(enterpriseId, proposalId);
    }
}
