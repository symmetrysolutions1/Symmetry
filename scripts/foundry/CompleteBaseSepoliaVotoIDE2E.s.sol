// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "../../lib/forge-std/src/Script.sol";
import { IVotoIDFacet } from "../../contracts/interfaces/IVotoIDFacet.sol";
import { IEvidenceFacet } from "../../contracts/interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../../contracts/interfaces/IAuditFacet.sol";

contract CompleteBaseSepoliaVotoIDE2E is Script {
    event VotoIDE2ECompleted(
        address indexed root,
        uint256 indexed enterpriseId,
        uint256 indexed proposalId,
        uint256 evidenceId,
        uint256 auditId
    );

    uint256 internal constant SECRETARY_PK = 0xB0B12;
    uint256 internal constant EXECUTOR_PK = 0xC00515;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_DEPLOYER");
        address root = vm.envAddress("VOTOID_E2E_ROOT_ADDRESS");
        uint256 enterpriseId = vm.envUint("VOTOID_E2E_ENTERPRISE_ID");
        uint256 proposalId = 1;

        vm.startBroadcast(EXECUTOR_PK);
        IVotoIDFacet(root).executeProposal(enterpriseId, proposalId);
        vm.stopBroadcast();

        vm.startBroadcast(SECRETARY_PK);
        IVotoIDFacet(root).verifyProposal(enterpriseId, proposalId);
        vm.stopBroadcast();

        vm.startBroadcast(deployerPrivateKey);
        uint256 evidenceId = IEvidenceFacet(root)
            .anchorEvidenceWithManifest(
                IEvidenceFacet.EvidenceAnchorParams({
                    enterpriseId: enterpriseId,
                    evidenceType: keccak256("VOTOID_SESSION_RESULTS"),
                    digest: keccak256("symmetry-votoid-live-results"),
                    uri: "ipfs://symmetry-votoid-live-results",
                    manifestURI: "ipfs://symmetry-votoid-live-results-manifest",
                    manifestDigest: keccak256("symmetry-votoid-live-results-manifest"),
                    serviceKey: keccak256("votoid"),
                    subjectType: keccak256("proposal"),
                    subjectId: bytes32(proposalId)
                })
            );

        uint256 auditId = IAuditFacet(root)
            .createAuditRecordWithContext(
                IAuditFacet.AuditRecordParams({
                    enterpriseId: enterpriseId,
                    category: keccak256("VOTOID_EXECUTION"),
                    serviceKey: keccak256("votoid"),
                    actionKey: keccak256("VERIFY_PROPOSAL"),
                    subjectType: keccak256("proposal"),
                    subjectId: proposalId,
                    evidenceDigest: keccak256("symmetry-votoid-live-results"),
                    manifestDigest: keccak256("symmetry-votoid-live-results-manifest"),
                    noteURI: "ipfs://symmetry-votoid-live-audit-note"
                })
            );
        vm.stopBroadcast();

        IVotoIDFacet.ProposalView memory proposal =
            IVotoIDFacet(root).getProposal(enterpriseId, proposalId);
        require(proposal.status == 7, "proposal not verified");

        emit VotoIDE2ECompleted(root, enterpriseId, proposalId, evidenceId, auditId);
    }
}
