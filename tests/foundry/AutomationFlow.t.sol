// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { Test } from "../../lib/forge-std/src/Test.sol";
import { EnterpriseRootFactory } from "../../contracts/factory/EnterpriseRootFactory.sol";
import { IEnterpriseRootFactory } from "../../contracts/interfaces/IEnterpriseRootFactory.sol";
import { DiamondCutFacet } from "../../contracts/core/DiamondCutFacet.sol";
import { DiamondLoupeFacet } from "../../contracts/core/DiamondLoupeFacet.sol";
import { OwnershipFacet } from "../../contracts/core/OwnershipFacet.sol";
import { DiamondInit } from "../../contracts/core/DiamondInit.sol";
import { AccessControlFacet } from "../../contracts/facets/AccessControlFacet.sol";
import { EnterpriseRegistryFacet } from "../../contracts/facets/EnterpriseRegistryFacet.sol";
import { CorporateIdentityFacet } from "../../contracts/facets/CorporateIdentityFacet.sol";
import { EvidenceFacet } from "../../contracts/facets/EvidenceFacet.sol";
import { AuditFacet } from "../../contracts/facets/AuditFacet.sol";
import { ServiceEntitlementFacet } from "../../contracts/facets/ServiceEntitlementFacet.sol";
import { VotoIDFacet } from "../../contracts/facets/VotoIDFacet.sol";
import { AutomationFacet } from "../../contracts/facets/AutomationFacet.sol";
import { EUDRFacet } from "../../contracts/facets/EUDRFacet.sol";
import { IAccessControlFacet } from "../../contracts/interfaces/IAccessControlFacet.sol";
import { IAutomationFacet } from "../../contracts/interfaces/IAutomationFacet.sol";
import { IServiceEntitlementFacet } from "../../contracts/interfaces/IServiceEntitlementFacet.sol";
import { IEvidenceFacet } from "../../contracts/interfaces/IEvidenceFacet.sol";
import { IAuditFacet } from "../../contracts/interfaces/IAuditFacet.sol";
import { LibAutomation } from "../../contracts/libraries/LibAutomation.sol";

contract AutomationFlowTest is Test {
    address internal symmetryOps = address(0xA11CE);
    address internal enterpriseAdmin = address(0xB0B);
    address internal enterpriseMultisig = address(0xCAFE);
    address internal processManager = address(0xC001);
    address internal processApprover = address(0xC002);
    address internal processOracle = address(0xC003);

    EnterpriseRootFactory internal factory;

    function setUp() external {
        vm.startPrank(symmetryOps);
        factory = new EnterpriseRootFactory(
            EnterpriseRootFactory.SharedFacetSet({
                diamondCutFacet: address(new DiamondCutFacet()),
                diamondLoupeFacet: address(new DiamondLoupeFacet()),
                ownershipFacet: address(new OwnershipFacet()),
                accessControlFacet: address(new AccessControlFacet()),
                enterpriseRegistryFacet: address(new EnterpriseRegistryFacet()),
                corporateIdentityFacet: address(new CorporateIdentityFacet()),
                evidenceFacet: address(new EvidenceFacet()),
                auditFacet: address(new AuditFacet()),
                serviceEntitlementFacet: address(new ServiceEntitlementFacet()),
                votoIDFacet: address(new VotoIDFacet()),
                automationFacet: address(new AutomationFacet()),
                eudrFacet: address(new EUDRFacet()),
                diamondInit: address(new DiamondInit())
            }),
            symmetryOps,
            symmetryOps
        );
        vm.stopPrank();
    }

    function testAutomationEndToEnd() external {
        vm.prank(symmetryOps);
        (address root, uint256 enterpriseId,) = factory.deployEnterpriseRoot(
            IEnterpriseRootFactory.DeployEnterpriseRootParams({
                legalName: "Symmetry Automation Enterprise SAS",
                jurisdictionCode: "CO",
                enterpriseAdmin: enterpriseAdmin,
                enterpriseMultisig: enterpriseMultisig,
                enterpriseMetadataURI: "ipfs://symmetry-automation-enterprise-root",
                enabledServices: 0,
                finalProtocolAdmin: symmetryOps,
                finalUpgradeAdmin: enterpriseMultisig
            })
        );

        vm.prank(symmetryOps);
        IServiceEntitlementFacet(root)
            .configureEnterpriseService(enterpriseId, 1, true, "ipfs://automation-service-config");

        vm.startPrank(enterpriseAdmin);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibAutomation.PROCESS_MANAGER_ROLE, processManager);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibAutomation.PROCESS_APPROVER_ROLE, processApprover);
        IAccessControlFacet(root)
            .grantEnterpriseRole(enterpriseId, LibAutomation.PROCESS_ORACLE_ROLE, processOracle);
        vm.stopPrank();

        vm.prank(processManager);
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

        vm.prank(processManager);
        uint256 instanceId = IAutomationFacet(root)
            .instantiateProcess(
                enterpriseId,
                templateId,
                "ERP-REQ-2026-0001",
                keccak256("export_request"),
                keccak256("export-request-2026-0001"),
                "ipfs://automation-instance-export-request"
            );

        vm.prank(processApprover);
        IAutomationFacet(root)
            .completeCheckpoint(enterpriseId, instanceId, keccak256("checkpoint-approval-evidence"));

        vm.prank(processManager);
        IAutomationFacet(root).completeCheckpoint(enterpriseId, instanceId, bytes32(0));

        vm.prank(processOracle);
        IAutomationFacet(root)
            .submitOracleAttestation(enterpriseId, instanceId, keccak256("oracle-attestation"));

        vm.prank(processManager);
        IAutomationFacet(root)
            .finalizeProcess(enterpriseId, instanceId, keccak256("execution-manifest"));

        vm.prank(enterpriseAdmin);
        uint256 evidenceId = IEvidenceFacet(root)
            .anchorEvidenceWithManifest(
                IEvidenceFacet.EvidenceAnchorParams({
                    enterpriseId: enterpriseId,
                    evidenceType: keccak256("AUTOMATION_EXECUTION_PACKAGE"),
                    digest: keccak256("automation-execution-results"),
                    uri: "s3://symmetry-enterprise-root/automation/execution-results.json",
                    manifestURI: "ipfs://automation-results-manifest",
                    manifestDigest: keccak256("automation-results-manifest"),
                    serviceKey: keccak256("automation"),
                    subjectType: keccak256("process_instance"),
                    subjectId: keccak256("ERP-REQ-2026-0001")
                })
            );

        vm.prank(enterpriseAdmin);
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

        IAutomationFacet.ProcessTemplateView memory templateView =
            IAutomationFacet(root).getProcessTemplate(enterpriseId, templateId);
        IAutomationFacet.ProcessInstanceView memory instanceView =
            IAutomationFacet(root).getProcessInstance(enterpriseId, instanceId);
        IAutomationFacet.CheckpointRecordView memory recordView =
            IAutomationFacet(root).getCheckpointRecord(enterpriseId, instanceId, 1);
        IServiceEntitlementFacet.ServiceConfigView memory serviceConfig =
            IServiceEntitlementFacet(root).getEnterpriseService(enterpriseId, 1);
        IEvidenceFacet.EvidenceView memory evidenceView =
            IEvidenceFacet(root).getEvidence(evidenceId);
        IAuditFacet.AuditRecordView memory auditView = IAuditFacet(root).getAuditRecord(auditId);

        assertTrue(templateView.active);
        assertEq(templateView.checkpointCount, 2);
        assertEq(instanceView.status, 5);
        assertEq(instanceView.currentCheckpointIndex, 2);
        assertEq(instanceView.executionManifestDigest, keccak256("execution-manifest"));
        assertEq(recordView.status, 2);
        assertEq(recordView.oracleDigest, keccak256("oracle-attestation"));
        assertTrue(serviceConfig.enabled);
        assertEq(evidenceView.serviceKey, keccak256("automation"));
        assertEq(auditView.serviceKey, keccak256("automation"));
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
}
