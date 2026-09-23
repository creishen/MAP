/* 
  file summary: rbac stakeholder assignment helpers for filtering assurance sets and vessels by active user persona.
  responsibilities: determines if an assurance set or vessel is assigned to the current user persona.
  role in system: consumed by AssuranceTable, VerifierWorkspaceView, InspectorWorkspaceView, ApproverDashboardView, and FleetRegistryView.
*/

import { AssuranceSet } from "../types/assurance";
import { AuditTrailEvent, UserRolePersona } from "../types/audit";
import { MasterDocument } from "../types/document";
import { VesselParticulars } from "../types/vessel";
import { userMatchesAnyRole } from "./userRoleHelpers";

/**
  what: checks if an assurance set is assigned to the specified user persona role.
  how: evaluates assignedSubmitter, assignedVerifier, assignedInspector, assignedApprover, and initiatorRole against active persona.
  with what file: src/utils/rbacHelpers.ts used by views and tables.
*/
export function isAssuranceSetAssignedToPersona(
  set: AssuranceSet,
  persona: UserRolePersona,
): boolean {
  if (persona === "Administrator") return true;
  if (persona === "Submitter") {
    /* submitter / vessel admin can only access assurance sets for their own organization */
    const isAssignedToOrg = Boolean(
      (set.assignedSubmitter &&
        (set.assignedSubmitter.includes("M. Chen") ||
          set.assignedSubmitter.includes("E. Ramirez") ||
          set.assignedSubmitter.includes("Pacific Ocean") ||
          set.assignedSubmitter.includes("Northwind Marine"))) ||
      (set.initiatorOrg &&
        (set.initiatorOrg.includes("Pacific Ocean") ||
          set.initiatorOrg.includes("Northwind Marine")))
    );

    return isAssignedToOrg;
  }
  if (persona === "Verifier") {
    return Boolean(set.assignedVerifier);
  }
  if (persona === "Inspector") {
    return Boolean(set.mandatoryInspectionRequired && set.assignedInspector);
  }
  if (persona === "Approver") {
    /* approver persona can only see assurance sets that are already verified and awaiting approval or certified */
    const isVerifiedAndAwaitingApproval =
      set.stage === "Approval" ||
      set.stage === "Approved & Certified" ||
      set.approverDecision !== "Pending" ||
      (set.requirements.length > 0 &&
        set.requirements.every(
          (r) => !r.isMandatory || r.verifierStatus === "Verified" || r.isFulfilled,
        ));
    return Boolean(set.assignedApprover && isVerifiedAndAwaitingApproval);
  }
  if (persona === "C Admin") {
    return (
      set.initiatorRole === "C Admin · Client Created" ||
      set.initiatorOrg === "Chevron Australia Pty Ltd" ||
      set.charterer === "Chevron Australia Pty Ltd"
    );
  }
  return true;
}

/**
  what: collects document IDs linked to assurance requirements on sets assigned to the persona.
  how: filters assurance sets by stakeholder assignment and gathers requirement documentId values.
  with what file: src/utils/rbacHelpers.ts used by VerifierWorkspaceView.tsx.
*/
export function getVerifierQueueDocumentIds(
  assuranceSets: AssuranceSet[],
  persona: UserRolePersona,
): Set<string> {
  const assignedSets = assuranceSets.filter((set) =>
    isAssuranceSetAssignedToPersona(set, persona),
  );
  const ids = new Set<string>();
  assignedSets.forEach((set) => {
    set.requirements.forEach((req) => {
      if (req.documentId) ids.add(req.documentId);
    });
  });
  return ids;
}

/**
  what: filters master documents to those in the verifier's assigned assurance-set work queue.
  how: keeps only documents whose IDs appear on requirements for persona-assigned assurance sets.
  with what file: src/utils/rbacHelpers.ts used by VerifierWorkspaceView.tsx.
*/
export function filterDocumentsForVerifierQueue(
  documents: MasterDocument[],
  assuranceSets: AssuranceSet[],
  persona: UserRolePersona,
): MasterDocument[] {
  const allowedIds = getVerifierQueueDocumentIds(assuranceSets, persona);
  return documents.filter((d) => allowedIds.has(d.id));
}

/**
  what: filters a list of vessels based on active stakeholder assignments and ownership.
  how: for Submitter / Vessel Admin, matches vessels owned/managed by their company or assigned in their assurance sets; for other non-admin personas, matches assigned assurance sets.
  with what file: src/utils/rbacHelpers.ts used by FleetRegistryView.tsx, VesselTable.tsx, DashboardView.tsx, and InspectorWorkspaceView.tsx.
*/
export function filterVesselsForPersona(
  vessels: VesselParticulars[],
  assuranceSets: AssuranceSet[],
  persona: UserRolePersona,
): VesselParticulars[] {
  if (persona === "Administrator") return vessels;

  if (persona === "Submitter") {
    /* vessel admin / submitter can only see their OWN vessels (owned/managed by their organization or assigned in their assurance sets) */
    const assignedSetVesselIds = new Set(
      assuranceSets
        .filter((set) => isAssuranceSetAssignedToPersona(set, persona))
        .map((set) => set.vesselId),
    );

    return vessels.filter(
      (v) =>
        assignedSetVesselIds.has(v.id) ||
        v.registeredOwner.includes("Pacific Ocean Logistics") ||
        v.registeredOwner.includes("Northwind Marine") ||
        (v.technicalManager &&
          (v.technicalManager.includes("Pacific") ||
            v.technicalManager.includes("Northwind"))),
    );
  }

  const assignedSetVesselIds = new Set(
    assuranceSets
      .filter((set) => isAssuranceSetAssignedToPersona(set, persona))
      .map((set) => set.vesselId),
  );

  return vessels.filter((v) => assignedSetVesselIds.has(v.id));
}

/**
  what: filters list of users based on active user persona RBAC rules.
  how: returns all users for Administrator, and for C Admin returns relevant organization and third-party operational stakeholders while hiding platform administrators.
  with what file: src/utils/rbacHelpers.ts consumed by UserManagementView.tsx and UserTable.tsx.
*/
export function filterUsersForPersona(
  users: import("../types/user").UserProfile[],
  persona: UserRolePersona,
): import("../types/user").UserProfile[] {
  if (persona === "Administrator") return users;
  if (persona === "C Admin") {
    return users.filter(
      (u) =>
        !u.roles.includes("Administrator") &&
        (userMatchesAnyRole(u, ["C Admin", "Inspector", "Verifier", "Submitter", "Approver"]) ||
          u.organization.includes("Southern Basin") ||
          u.organization.includes("Chevron") ||
          u.organization.includes("Woodside") ||
          u.userType === "Third-Party")
    );
  }
  return users;
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
  vessels: VesselParticulars[],
): AuditTrailEvent[] {
  if (persona === "Administrator") {
    return events;
  }

  /* get IDs and names of assurance sets and vessels assigned to persona */
  const assignedSets = assuranceSets.filter((set) =>
    isAssuranceSetAssignedToPersona(set, persona),
  );
  const assignedVessels = filterVesselsForPersona(
    vessels,
    assuranceSets,
    persona,
  );

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
      ev.userRole === ("System" as any) ||
      ev.userRole.toLowerCase().includes("system") ||
      ev.userRole.toLowerCase().includes("ocr") ||
      ev.userId.toLowerCase().includes("sys") ||
      ev.userId.toLowerCase().includes("system");

    if (isSystemEvent) return true;

    /* 2. Tasks performed by active persona role */
    if (ev.userRole === persona) return true;

    /* 3. Tasks related to assigned sets or vessels */
    const targetLower = (ev.targetAsset || "").toLowerCase();

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
  parentView: "assurance-sets" | "vessels" | "documents" | "inspector" | "crew" | "capa" | "approver",
  parentLabel: string,
  previousHashView: string | undefined,
  activePersona: UserRolePersona,
  previousEntityId?: string,
): { label: string; targetView: string; targetEntityId?: string } {
  let isParentAllowedInSidepanel = true;

  if (parentView === "vessels") {
    isParentAllowedInSidepanel = [
      "Administrator",
      "C Admin",
      "Submitter",
    ].includes(activePersona);
  } else if (parentView === "assurance-sets") {
    isParentAllowedInSidepanel = [
      "Administrator",
      "C Admin",
      "Submitter",
    ].includes(activePersona);
  } else if (parentView === "documents") {
    isParentAllowedInSidepanel = ["Administrator", "Submitter"].includes(
      activePersona,
    );
  } else if (parentView === "inspector") {
    isParentAllowedInSidepanel = ["Administrator"].includes(activePersona);
  } else if (parentView === "crew") {
    isParentAllowedInSidepanel = ["Administrator", "Submitter"].includes(
      activePersona,
    );
  } else if (parentView === "capa") {
    isParentAllowedInSidepanel = [
      "Administrator",
      "Inspector",
      "Verifier",
      "Approver",
    ].includes(activePersona);
  } else if (parentView === "approver") {
    isParentAllowedInSidepanel = ["Administrator", "Approver"].includes(activePersona);
  }

  if (previousHashView === "dashboard" || !isParentAllowedInSidepanel) {
    return {
      label: "← Back to Dashboard",
      targetView: "dashboard",
    };
  }

  if (previousHashView === "crew") {
    return {
      label: previousEntityId
        ? "← Back to Seafarer Profile"
        : "← Back to Crew Directory",
      targetView: "crew",
      targetEntityId: previousEntityId,
    };
  }

  if (previousHashView === "vessels") {
    return {
      label: previousEntityId
        ? "← Back to Vessel Detail"
        : "← Back to Fleet Registry",
      targetView: "vessels",
      targetEntityId: previousEntityId,
    };
  }

  if (previousHashView === "assurance-sets") {
    return {
      label: previousEntityId
        ? "← Back to Assurance Set"
        : "← Back to Assurance Sets",
      targetView: "assurance-sets",
      targetEntityId: previousEntityId,
    };
  }

  if (previousHashView === "documents") {
    return {
      label: previousEntityId
        ? "← Back to Document Detail"
        : "← Back to Document Library",
      targetView: "documents",
      targetEntityId: previousEntityId,
    };
  }

  if (previousHashView === "capa") {
    return {
      label: "← Back to CAPA Management",
      targetView: "capa",
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
  persona: UserRolePersona,
): boolean {
  if (persona === "Administrator") return true;
  if (view === "roles-permissions") {
    return ["Administrator", "C Admin"].includes(persona);
  }
  if (view === "users" && !["Administrator", "C Admin"].includes(persona)) return false;
  if (view === "crew" && !["Administrator", "Submitter"].includes(persona))
    return false;
  if (view === "dashboard" || view === "audit" || view === "capa" || view === "capas") return true;

  if (persona === "C Admin") {
    if (["documents", "verifier", "approver", "inspector", "inspection"].includes(view)) {
      return false;
    }
    return true;
  }

  if (persona === "Submitter") {
    if (
      [
        "verifier",
        "inspector",
        "inspection",
        "create-assurance-set",
        "approver",
        "roles-permissions",
      ].includes(view)
    ) {
      return false;
    }
    return true;
  }

  if (persona === "Verifier") {
    if (
      [
        "vessels",
        "documents",
        "inspector",
        "inspection",
        "create-assurance-set",
        "approver",
        "users",
        "roles-permissions",
      ].includes(view)
    ) {
      return false;
    }
    if (view === "assurance-sets" && !entityId) {
      return false;
    }
    return true;
  }

  if (persona === "Inspector") {
    if (
      [
        "vessels",
        "assurance-sets",
        "documents",
        "verifier",
        "create-assurance-set",
        "approver",
        "users",
        "roles-permissions",
      ].includes(view)
    ) {
      return false;
    }
    if (view === "inspector" && !entityId) {
      return false;
    }
    return true;
  }

  if (persona === "Approver") {
    if (
      [
        "vessels",
        "documents",
        "verifier",
        "inspector",
        "inspection",
        "create-assurance-set",
        "users",
        "roles-permissions",
      ].includes(view)
    ) {
      return false;
    }
    if (view === "assurance-sets" && !entityId) {
      return false;
    }
    return true;
  }

  return true;
}
