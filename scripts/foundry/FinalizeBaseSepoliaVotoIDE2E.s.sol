// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "../../lib/forge-std/src/Script.sol";
import { IVotoIDFacet } from "../../contracts/interfaces/IVotoIDFacet.sol";

contract FinalizeBaseSepoliaVotoIDE2E is Script {
    event VotoIDE2EVotingCastCompleted(
        address indexed root,
        uint256 indexed enterpriseId,
        uint256 indexed proposalId,
        uint256 yesVotes,
        uint256 noVotes
    );

    uint256 internal constant CHAIR_PK = 0xA11CE11;
    uint256 internal constant SECRETARY_PK = 0xB0B12;
    uint256 internal constant MEMBER_ONE_PK = 0xC00313;
    uint256 internal constant MEMBER_TWO_PK = 0xC00414;
    uint256 internal constant EXECUTOR_PK = 0xC00515;

    function run() external {
        address root = vm.envAddress("VOTOID_E2E_ROOT_ADDRESS");
        uint256 enterpriseId = vm.envUint("VOTOID_E2E_ENTERPRISE_ID");
        uint256 proposalId = 1;

        vm.startBroadcast(SECRETARY_PK);
        IVotoIDFacet(root).startVoting(enterpriseId, proposalId);
        vm.stopBroadcast();

        vm.startBroadcast(CHAIR_PK);
        IVotoIDFacet(root).castVote(enterpriseId, proposalId, true);
        vm.stopBroadcast();

        vm.startBroadcast(SECRETARY_PK);
        IVotoIDFacet(root).castVote(enterpriseId, proposalId, true);
        vm.stopBroadcast();

        vm.startBroadcast(MEMBER_ONE_PK);
        IVotoIDFacet(root).castVote(enterpriseId, proposalId, true);
        vm.stopBroadcast();

        vm.startBroadcast(MEMBER_TWO_PK);
        IVotoIDFacet(root).castVote(enterpriseId, proposalId, false);
        vm.stopBroadcast();

        IVotoIDFacet.ProposalView memory proposal =
            IVotoIDFacet(root).getProposal(enterpriseId, proposalId);
        require(proposal.yesVotes == 3, "unexpected yes votes");
        require(proposal.noVotes == 1, "unexpected no votes");
        require(proposal.status == 3, "proposal not in voting state");
        emit VotoIDE2EVotingCastCompleted(
            root, enterpriseId, proposalId, proposal.yesVotes, proposal.noVotes
        );
    }
}
