# Service Installation Model

## Goal

Install business services inside a company root without changing the enterprise identity model.

## Principle

The enterprise root is the institutional shell.

Each service is installed as:

- an enabled service entitlement
- a config reference
- an evidence-backed installation event
- an audit trail

## Current model

On-chain:

- `ServiceEntitlementFacet` enables the service
- `EvidenceFacet` anchors installation evidence
- `AuditFacet` records installation action

Off-chain:

- installation config artifact
- service manifest
- operator runbook

## Schema

- [service-installation.schema.json](../../sdk/schemas/service-installation.schema.json)
- [service-installation.example.json](../../services/enterprise-onboarding/service-installation.example.json)
