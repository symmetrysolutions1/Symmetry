// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "../../lib/forge-std/src/Script.sol";
import { IEnterpriseRootFactory } from "../../contracts/interfaces/IEnterpriseRootFactory.sol";
import { ICorporateIdentityFacet } from "../../contracts/interfaces/ICorporateIdentityFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { IVotoIDFacet } from "../../contracts/interfaces/IVotoIDFacet.sol";

contract RunBaseSepoliaVotoIDE2E is Script {
    event VotoIDE2EPhaseOneCompleted(
        address indexed root,
        uint256 indexed enterpriseId,
        bytes32 indexed companyKey,
        uint256 sessionId,
        uint256 proposalId
    );

    uint256 internal constant CHAIR_PK = 0xA11CE11;
    uint256 internal constant SECRETARY_PK = 0xB0B12;
    uint256 internal constant MEMBER_ONE_PK = 0xC00313;
    uint256 internal constant MEMBER_TWO_PK = 0xC00414;

    uint256 internal constant ACTOR_FUNDING = 0.001 ether;
    uint64 internal constant DELIBERATION_DURATION = 10;
    uint64 internal constant VOTING_DURATION = 120;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_DEPLOYER");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        address deployer = vm.addr(deployerPrivateKey);
        address chairperson = vm.addr(CHAIR_PK);
        address secretary = vm.addr(SECRETARY_PK);
        address memberOne = vm.addr(MEMBER_ONE_PK);
        address memberTwo = vm.addr(MEMBER_TWO_PK);

        string memory legalName = "Symmetry VotoID Live Base Sepolia v2";

        vm.startBroadcast(deployerPrivateKey);
        _fundActor(chairperson);
        _fundActor(secretary);
        _fundActor(memberOne);
        _fundActor(memberTwo);

        (address root, uint256 enterpriseId, bytes32 companyKey) = IEnterpriseRootFactory(
                factoryAddress
            )
            .deployEnterpriseRoot(
                IEnterpriseRootFactory.DeployEnterpriseRootParams({
                    legalName: legalName,
                    jurisdictionCode: "CO",
                    enterpriseAdmin: deployer,
                    enterpriseMultisig: deployer,
                    enterpriseMetadataURI: "ipfs://symmetry-votoid-live-root",
                    enabledServices: 1,
                    finalProtocolAdmin: deployer,
                    finalUpgradeAdmin: deployer
                })
            );

        ICorporateIdentityFacet(root)
            .createCorporateIdentity(
                enterpriseId,
                legalName,
                "did:symmetry:enterprise:base-sepolia-votoid-live-v2",
                "ipfs://symmetry-votoid-live-credentials",
                keccak256(bytes(legalName))
            );
        ICorporateIdentityFacet(root).bindEnterpriseWallet(enterpriseId, chairperson);
        ICorporateIdentityFacet(root).bindEnterpriseWallet(enterpriseId, secretary);
        ICorporateIdentityFacet(root)
            .authorizeSigner(enterpriseId, secretary, keccak256("BOARD_SECRETARY"));

        IServiceEntitlementFacet(root)
            .configureEnterpriseService(enterpriseId, 0, true, "ipfs://symmetry-votoid-live-config");
        IVotoIDFacet(root).initializeBoard(enterpriseId, chairperson, secretary, 50);
        vm.stopBroadcast();

        vm.startBroadcast(CHAIR_PK);
        IVotoIDFacet(root).addBoardMember(enterpriseId, memberOne);
        IVotoIDFacet(root).addBoardMember(enterpriseId, memberTwo);
        uint256 sessionId = IVotoIDFacet(root)
            .openSession(
                enterpriseId,
                "Symmetry Base Sepolia Board Session",
                DELIBERATION_DURATION,
                VOTING_DURATION
            );
        IVotoIDFacet(root).joinSession(enterpriseId);
        vm.stopBroadcast();

        vm.startBroadcast(SECRETARY_PK);
        IVotoIDFacet(root).joinSession(enterpriseId);
        uint256 proposalId = IVotoIDFacet(root)
            .createProposal(
                enterpriseId,
                "Approve VotoID base template",
                "Approve the Symmetry enterprise VotoID base template for live validation.",
                "ipfs://symmetry-votoid-live-proposal-manifest",
                keccak256("symmetry-votoid-live-proposal-manifest")
            );
        IVotoIDFacet(root).startDeliberation(enterpriseId, proposalId);
        vm.stopBroadcast();

        vm.startBroadcast(MEMBER_ONE_PK);
        IVotoIDFacet(root).joinSession(enterpriseId);
        vm.stopBroadcast();

        vm.startBroadcast(MEMBER_TWO_PK);
        IVotoIDFacet(root).joinSession(enterpriseId);
        vm.stopBroadcast();

        IVotoIDFacet(root).getBoard(enterpriseId);
        IVotoIDFacet(root).getProposal(enterpriseId, proposalId);
        emit VotoIDE2EPhaseOneCompleted(root, enterpriseId, companyKey, sessionId, proposalId);
    }

    function _fundActor(address actor) internal {
        (bool success,) = actor.call{ value: ACTOR_FUNDING }("");
        require(success, "actor funding failed");
    }
}
