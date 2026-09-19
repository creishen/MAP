/* 
  file summary: rbac stakeholder assignment helpers for filtering assurance sets and vessels by active user persona.
  responsibilities: determines if an assurance set or vessel is assigned to the current user persona.
  role in system: consumed by AssuranceTable, VerifierWorkspaceView, InspectorWorkspaceView, ApproverDashboardView, and FleetRegistryView.
*/

import { AssuranceSet } from '../types/assurance';
import { UserRolePersona } from '../types/audit';
import { VesselParticulars } from '../types/vessel';

/**
  what: checks if an assurance set is assigned to the specified user persona role.
  how: evaluates assignedSubmitter, assignedVerifier, assignedInspector, assignedApprover, and initiatorRole against active persona.
  with what file: src/utils/rbacHelpers.ts used by views and tables.
*/
export function isAssuranceSetAssignedToPersona(set: AssuranceSet, persona: UserRolePersona): boolean {
  if (persona === 'Administrator') return true;
  if (persona === 'Submitter') {
    return Boolean(set.assignedSubmitter) || set.initiatorRole === 'Vessel Provider Admin';
  }
  if (persona === 'Verifier') {
    return Boolean(set.assignedVerifier);
  }
  if (persona === 'Inspector') {
    return Boolean(set.mandatoryInspectionRequired && set.assignedInspector);
  }
  if (persona === 'Approver') {
    return Boolean(set.assignedApprover);
  }
  if (persona === 'C Admin') {
    return set.initiatorRole === 'C Admin · Client Created' || Boolean(set.assignedApprover);
  }
  return true;
}

/**
  what: filters a list of vessels based on active stakeholder assignments.
  how: matches vessel id/name against assurance sets assigned to the persona.
  with what file: src/utils/rbacHelpers.ts used by FleetRegistryView.tsx and InspectorWorkspaceView.tsx.
*/
export function filterVesselsForPersona(
  vessels: VesselParticulars[],
  assuranceSets: AssuranceSet[],
  persona: UserRolePersona
): VesselParticulars[] {
  if (persona === 'Administrator') return vessels;

  const assignedSetVesselIds = new Set(
    assuranceSets
      .filter((set) => isAssuranceSetAssignedToPersona(set, persona))
      .map((set) => set.vesselId)
  );

  return vessels.filter((v) => assignedSetVesselIds.has(v.id));
}
