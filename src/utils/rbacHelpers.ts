/* 
  file summary: rbac stakeholder assignment helpers for filtering assurance sets and vessels by active user persona.
  responsibilities: determines if an assurance set or vessel is assigned to the current user persona.
  role in system: consumed by AssuranceTable, VerifierWorkspaceView, InspectorWorkspaceView, ApproverDashboardView, and FleetRegistryView.
*/

import { AssuranceSet } from '../types/assurance';
import { AuditTrailEvent, UserRolePersona } from '../types/audit';
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

/**
  what: filters audit trail event logs based on active user persona RBAC rules.
  how: returns all events for Administrator, and for non-admin personas returns only events for tasks related to them or performed by the system.
  with what file: src/utils/rbacHelpers.ts consumed by AuditTrailView, AuditTrailDrawer, DashboardView, and VesselDetailView.
*/
export function filterAuditTrailForPersona(
  events: AuditTrailEvent[],
  persona: UserRolePersona,
  assuranceSets: AssuranceSet[],
  vessels: VesselParticulars[]
): AuditTrailEvent[] {
  if (persona === 'Administrator') {
    return events;
  }

  /* get IDs and names of assurance sets and vessels assigned to persona */
  const assignedSets = assuranceSets.filter((set) => isAssuranceSetAssignedToPersona(set, persona));
  const assignedVessels = filterVesselsForPersona(vessels, assuranceSets, persona);

  const assignedSetKeys = new Set<string>();
  assignedSets.forEach((set) => {
    if (set.id) assignedSetKeys.add(set.id.toLowerCase());
    if (set.title) assignedSetKeys.add(set.title.toLowerCase());
    if (set.vesselName) assignedSetKeys.add(set.vesselName.toLowerCase());
  });

  const assignedVesselKeys = new Set<string>();
  assignedVessels.forEach((v) => {
    if (v.id) assignedVesselKeys.add(v.id.toLowerCase());
    if (v.name) assignedVesselKeys.add(v.name.toLowerCase());
    if (v.imoNumber) assignedVesselKeys.add(v.imoNumber.toLowerCase());
  });

  return events.filter((ev) => {
    /* 1. Tasks performed by system / automated background routines */
    const isSystemEvent =
      ev.userRole === ('System' as any) ||
      ev.userRole.toLowerCase().includes('system') ||
      ev.userRole.toLowerCase().includes('ocr') ||
      ev.userId.toLowerCase().includes('sys') ||
      ev.userId.toLowerCase().includes('system');

    if (isSystemEvent) return true;

    /* 2. Tasks performed by active persona role */
    if (ev.userRole === persona) return true;

    /* 3. Tasks related to assigned sets or vessels */
    const targetLower = (ev.targetAsset || '').toLowerCase();

    for (const key of assignedSetKeys) {
      if (key && targetLower.includes(key)) return true;
    }

    for (const key of assignedVesselKeys) {
      if (key && targetLower.includes(key)) return true;
    }

    return false;
  });
}

/**
  what: computes dynamic back button label and target route based on previous hash view and active persona RBAC sidepanel access.
  how: returns 'Back to Dashboard' if opened from dashboard or if the active persona has no sidepanel button for the parent view.
  with what file: src/utils/rbacHelpers.ts consumed by HeaderBanner, VesselDetailView, DocumentDetailView, InspectionChecklistView, and CreateAssuranceSetView.
*/
export function getBackButtonInfo(
  parentView: 'assurance-sets' | 'vessels' | 'documents' | 'inspector' | 'crew',
  parentLabel: string,
  previousHashView: string | undefined,
  activePersona: UserRolePersona,
  previousEntityId?: string
): { label: string; targetView: string; targetEntityId?: string } {
  let isParentAllowedInSidepanel = true;

  if (parentView === 'vessels') {
    isParentAllowedInSidepanel = ['Administrator', 'C Admin', 'Submitter'].includes(activePersona);
  } else if (parentView === 'assurance-sets') {
    isParentAllowedInSidepanel = ['Administrator', 'C Admin', 'Submitter'].includes(activePersona);
  } else if (parentView === 'documents') {
    isParentAllowedInSidepanel = ['Administrator', 'Submitter'].includes(activePersona);
  } else if (parentView === 'inspector') {
    isParentAllowedInSidepanel = ['Administrator'].includes(activePersona);
  } else if (parentView === 'crew') {
    isParentAllowedInSidepanel = ['Administrator', 'Submitter'].includes(activePersona);
  }

  if (previousHashView === 'dashboard' || !isParentAllowedInSidepanel) {
    return {
      label: '← Back to Dashboard',
      targetView: 'dashboard',
    };
  }

  if (previousHashView === 'crew') {
    return {
      label: previousEntityId ? '← Back to Seafarer Profile' : '← Back to Crew Directory',
      targetView: 'crew',
      targetEntityId: previousEntityId,
    };
  }

  if (previousHashView === 'vessels') {
    return {
      label: previousEntityId ? '← Back to Vessel Detail' : '← Back to Fleet Registry',
      targetView: 'vessels',
      targetEntityId: previousEntityId,
    };
  }

  if (previousHashView === 'assurance-sets') {
    return {
      label: previousEntityId ? '← Back to Assurance Set' : '← Back to Assurance Sets',
      targetView: 'assurance-sets',
      targetEntityId: previousEntityId,
    };
  }

  if (previousHashView === 'documents') {
    return {
      label: previousEntityId ? '← Back to Document Detail' : '← Back to Document Library',
      targetView: 'documents',
      targetEntityId: previousEntityId,
    };
  }

  return {
    label: `← Back to ${parentLabel}`,
    targetView: parentView,
    targetEntityId: undefined,
  };
}

/**
  what: checks if a specific view route and optional entity ID is accessible to the specified user persona.
  how: checks view path against persona RBAC restrictions for vessels, assurance-sets, documents, verifier, inspector, and crew screens.
  with what file: src/utils/rbacHelpers.ts used by useMapStore.ts and App.tsx.
*/
export function isViewAccessibleToPersona(
  view: string,
  entityId: string | undefined | null,
  persona: UserRolePersona
): boolean {
  if (persona === 'Administrator') return true;
  if (view === 'users') return false;
  if (view === 'crew' && !['Administrator', 'Submitter'].includes(persona)) return false;
  if (view === 'dashboard' || view === 'audit') return true;

  if (persona === 'C Admin') {
    if (['documents', 'verifier', 'inspector', 'inspection'].includes(view)) {
      return false;
    }
    return true;
  }

  if (persona === 'Submitter') {
    if (['verifier', 'inspector', 'inspection'].includes(view)) {
      return false;
    }
    return true;
  }

  if (persona === 'Verifier') {
    if (['vessels', 'documents', 'inspector', 'inspection', 'create-assurance-set'].includes(view)) {
      return false;
    }
    if (view === 'assurance-sets' && !entityId) {
      return false;
    }
    return true;
  }

  if (persona === 'Inspector') {
    if (['vessels', 'assurance-sets', 'documents', 'verifier', 'create-assurance-set'].includes(view)) {
      return false;
    }
    if (view === 'inspector' && !entityId) {
      return false;
    }
    return true;
  }

  if (persona === 'Approver') {
    if (['vessels', 'documents', 'verifier', 'inspector', 'inspection', 'create-assurance-set'].includes(view)) {
      return false;
    }
    if (view === 'assurance-sets' && !entityId) {
      return false;
    }
    return true;
  }

  return true;
}



