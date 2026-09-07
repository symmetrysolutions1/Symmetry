import {
  Alert,
  EnsNamespace,
  EvidencePassport,
  Observation,
  Territory,
} from "../generated/schema";
import {
  AlertCreated,
  EnsNamespaceLinked,
  EvidencePassportAnchored,
  ObservationRecorded,
  TerritoryRegistered,
} from "../generated/NatureEvidenceRegistry/NatureEvidenceRegistry";

export function handleTerritoryRegistered(event: TerritoryRegistered): void {
  const entity = new Territory(event.params.territoryId);
  entity.workspaceId = event.params.workspaceId;
  entity.geometryDigest = event.params.geometryDigest;
  entity.ensNode = event.params.ensNode;
  entity.ensName = event.params.ensName;
  entity.save();
}

export function handleObservationRecorded(event: ObservationRecorded): void {
  const entity = new Observation(event.params.observationId);
  entity.territoryId = event.params.territoryId;
  entity.evidenceDigest = event.params.evidenceDigest;
  entity.ndviBps = event.params.ndviBps;
  entity.treeCoverBps = event.params.treeCoverBps.toI32();
  entity.capturedAt = event.params.capturedAt;
  entity.save();
}

export function handleAlertCreated(event: AlertCreated): void {
  const entity = new Alert(event.params.alertId);
  entity.territoryId = event.params.territoryId;
  entity.observationId = event.params.observationId;
  entity.reason = event.params.reason;
  entity.save();
}

export function handleEvidencePassportAnchored(event: EvidencePassportAnchored): void {
  const entity = new EvidencePassport(event.params.passportId);
  entity.workspaceId = event.params.workspaceId;
  entity.territoryId = event.params.territoryId;
  entity.observationId = event.params.observationId;
  entity.manifestDigest = event.params.manifestDigest;
  entity.ensNode = event.params.ensNode;
  entity.anchoredAt = event.params.anchoredAt;
  entity.save();
}

export function handleEnsNamespaceLinked(event: EnsNamespaceLinked): void {
  const entity = new EnsNamespace(event.params.ensNode);
  entity.workspaceId = event.params.workspaceId;
  entity.ensNode = event.params.ensNode;
  entity.resolver = event.params.resolver;
  entity.save();
}
