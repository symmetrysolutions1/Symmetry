// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Script } from "../../lib/forge-std/src/Script.sol";
import { IEnterpriseRootFactory } from "../../contracts/interfaces/IEnterpriseRootFactory.sol";
import { ICorporateIdentityFacet } from "../../contracts/interfaces/ICorporateIdentityFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { IAccessControlFacet } from "../../contracts/interfaces/IAccessControlFacet.sol";
import { IAutomationFacet } from "../../contracts/interfaces/IAutomationFacet.sol";
import { IEvidenceFacet } from "../../contracts/interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../../contracts/interfaces/IAuditFacet.sol";
import { LibAutomation } from "../../contracts/libraries/LibAutomation.sol";

contract RunBaseSepoliaAutomationE2E is Script {
    event AutomationE2ECompleted(
        address indexed root,
        uint256 indexed enterpriseId,
        bytes32 indexed companyKey,
        uint256 templateId,
        uint256 instanceId,
        uint256 evidenceId,
        uint256 auditId
    );

    uint256 internal constant MANAGER_PK = 0xD00111;
    uint256 internal constant APPROVER_PK = 0xD00212;
    uint256 internal constant ORACLE_PK = 0xD00313;
    uint256 internal constant ACTOR_FUNDING = 0.001 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY_DEPLOYER");
        address factoryAddress = vm.envAddress("FACTORY_ADDRESS");
        address deployer = vm.addr(deployerPrivateKey);
        address processManager = vm.addr(MANAGER_PK);
        address processApprover = vm.addr(APPROVER_PK);
        address processOracle = vm.addr(ORACLE_PK);

        string memory legalName = "Symmetry Automation Live Base Sepolia";

        vm.startBroadcast(deployerPrivateKey);
        _fundActor(processManager);
        _fundActor(processApprover);
        _fundActor(processOracle);

        (address root, uint256 enterpriseId, bytes32 companyKey) = IEnterpriseRootFactory(
                factoryAddress
            )
            .deployEnterpriseRoot(
                IEnterpriseRootFactory.DeployEnterpriseRootParams({
                    legalName: legalName,
                    jurisdictionCode: "CO",
                    enterpriseAdmin: deployer,
                    enterpriseMultisig: deployer,
                    enterpriseMetadataURI: "ipfs://symmetry-automation-live-root",
                    enabledServices: 2,
                    finalProtocolAdmin: deployer,
                    finalUpgradeAdmin: deployer
                })
            );

        ICorporateIdentityFacet(root)
            .createCorporateIdentity(
                enterpriseId,
                legalName,
                "did:symmetry:enterprise:base-sepolia-automation-live",
                "ipfs://symmetry-automation-live-credentials",
                keccak256(bytes(legalName))
            );

        IServiceEntitlementFacet(root)
            .configureEnterpriseService(
                enterpriseId, 1, true, "ipfs://symmetry-automation-live-config"
            );

        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibAutomation.PROCESS_MANAGER_ROLE, processManager);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibAutomation.PROCESS_APPROVER_ROLE, processApprover);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibAutomation.PROCESS_ORACLE_ROLE, processOracle);
        vm.stopBroadcast();

        vm.startBroadcast(MANAGER_PK);
        uint256 templateId = IAutomationFacet(root)
            .registerProcessTemplate(
                enterpriseId,
                IAutomationFacet.ProcessTemplateRegistration({
                    name: "Exporter Due Diligence Approval",
                    configURI: "ipfs://automation-template-exporter-dd",
                    configDigest: keccak256("automation-template-exporter-dd"),
                    checkpointKeys: _checkpointKeys(),
                    checkpointRoles: _checkpointRoles(),
                    evidenceRequired: _evidenceRequired(),
                    oracleRequired: _oracleRequired()
                })
            );

        uint256 instanceId = IAutomationFacet(root)
            .instantiateProcess(
                enterpriseId,
                templateId,
                "ERP-REQ-2026-0001",
                keccak256("export_request"),
                keccak256("export-request-2026-0001"),
                "ipfs://automation-instance-export-request"
            );
        vm.stopBroadcast();

        vm.startBroadcast(APPROVER_PK);
        IAutomationFacet(root)
            .completeCheckpoint(enterpriseId, instanceId, keccak256("checkpoint-approval-evidence"));
        vm.stopBroadcast();

        vm.startBroadcast(MANAGER_PK);
        IAutomationFacet(root).completeCheckpoint(enterpriseId, instanceId, bytes32(0));
        vm.stopBroadcast();

        vm.startBroadcast(ORACLE_PK);
        IAutomationFacet(root)
            .submitOracleAttestation(enterpriseId, instanceId, keccak256("oracle-attestation"));
        vm.stopBroadcast();

        vm.startBroadcast(MANAGER_PK);
        IAutomationFacet(root)
            .finalizeProcess(enterpriseId, instanceId, keccak256("execution-manifest"));
        vm.stopBroadcast();

        vm.startBroadcast(deployerPrivateKey);
        uint256 evidenceId = IEvidenceFacet(root)
            .anchorEvidenceWithManifest(
                IEvidenceFacet.EvidenceAnchorParams({
                    enterpriseId: enterpriseId,
                    evidenceType: keccak256("AUTOMATION_EXECUTION_PACKAGE"),
                    digest: keccak256("automation-execution-results"),
                    uri: "ipfs://symmetry-automation-live-results",
                    manifestURI: "ipfs://automation-results-manifest",
                    manifestDigest: keccak256("automation-results-manifest"),
                    serviceKey: keccak256("automation"),
                    subjectType: keccak256("process_instance"),
                    subjectId: keccak256("ERP-REQ-2026-0001")
                })
            );

        uint256 auditId = IAuditFacet(root)
            .createAuditRecordWithContext(
                IAuditFacet.AuditRecordParams({
                    enterpriseId: enterpriseId,
                    category: keccak256("AUTOMATION_EXECUTION"),
                    serviceKey: keccak256("automation"),
                    actionKey: keccak256("FINALIZE_PROCESS"),
                    subjectType: keccak256("process_instance"),
                    subjectId: instanceId,
                    evidenceDigest: keccak256("automation-execution-results"),
                    manifestDigest: keccak256("automation-results-manifest"),
                    noteURI: "ipfs://audit-automation-finalize"
                })
            );
        vm.stopBroadcast();

        IAutomationFacet.ProcessInstanceView memory instanceView =
            IAutomationFacet(root).getProcessInstance(enterpriseId, instanceId);
        require(instanceView.status == 5, "instance not executed");
        require(instanceView.currentCheckpointIndex == 2, "checkpoint index mismatch");

        emit AutomationE2ECompleted(
            root, enterpriseId, companyKey, templateId, instanceId, evidenceId, auditId
        );
    }

    function _checkpointKeys() internal pure returns (bytes32[] memory keys) {
        keys = new bytes32[](2);
        keys[0] = keccak256("APPROVAL_REVIEW");
        keys[1] = keccak256("ERP_ORACLE_CONFIRMATION");
    }

    function _checkpointRoles() internal pure returns (bytes32[] memory roles) {
        roles = new bytes32[](2);
        roles[0] = LibAutomation.PROCESS_APPROVER_ROLE;
        roles[1] = LibAutomation.PROCESS_MANAGER_ROLE;
    }

    function _evidenceRequired() internal pure returns (bool[] memory values) {
        values = new bool[](2);
        values[0] = true;
        values[1] = false;
    }

    function _oracleRequired() internal pure returns (bool[] memory values) {
        values = new bool[](2);
        values[0] = false;
        values[1] = true;
    }

    function _fundActor(address actor) internal {
        (bool success,) = actor.call{ value: ACTOR_FUNDING }("");
        require(success, "actor funding failed");
    }
}
