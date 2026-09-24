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
import { VIEW_TO_SCOPE, canPerform, isUserOverride, getEffectiveUserScopeFlags, getRoleScopeFlags } from "./permissionHelpers";
import { RolePermissionMatrix, UserPermissionOverrides } from "../types/permissions";
import { UserProfile } from "../types/user";

/**
  what: checks if an assurance set is assigned to the specified user persona role.
  how: evaluates assignedSubmitter, assignedVerifier, assignedInspector, assignedApprover, and initiatorRole against active persona.
  with what file: src/utils/rbacHelpers.ts used by views and tables.
*/
export function isAssuranceSetAssignedToPersona(
  set: AssuranceSet,
  persona: UserRolePersona,
): boolean {
  if (persona === "Administrator") {
    /* administrator only sees assurance sets they made (northwind marine) or made by c admin for the admin's vessels (VESSEL-005 MV Atlantic Ocean) */
    const isNorthwindVessel =
      set.vesselId === "VESSEL-005" ||
      Boolean(set.vesselName?.toLowerCase().includes("atlantic ocean"));

    const isNorthwindStakeholder =
      Boolean(set.initiatorOrg?.toLowerCase().includes("northwind")) ||
      Boolean(set.assignedSubmitter?.toLowerCase().includes("northwind")) ||
      Boolean(set.stakeholders?.submitterOrg?.toLowerCase().includes("northwind")) ||
      Boolean(set.assignedStakeholders?.some((s: { company: string; }) => s.company?.toLowerCase().includes("northwind")));

    const isMadeByAdmin =
      Boolean(set.createdByPersona === "Administrator") ||
      Boolean(set.initiatorRole?.toLowerCase().includes("northwind"));

    return isNorthwindVessel || isNorthwindStakeholder || isMadeByAdmin;
  }
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
      set.stage === "Approved" ||
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
      set.charterer === "Chevron Australia Pty Ltd" ||
      set.charterer === "Southern Basin Energy Pty Ltd" ||
      set.initiatorOrg === "Southern Basin Energy Pty Ltd" ||
      set.initiatorOrg === "Woodside Energy Ltd" ||
      set.charterer === "Woodside Energy Ltd" ||
      set.initiatorOrg === "Inpex Operations Australia" ||
      set.charterer === "Inpex Operations Australia"
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
  how: for administrator, restricts to vessels owned/managed by northwind marine pty ltd; for submitter / vessel admin, matches vessels owned/managed by their company; for c admin, allows full access to all vessels under the platform; for other non-admin personas, matches assigned assurance sets.
  with what file: src/utils/rbacHelpers.ts used by FleetRegistryView.tsx, VesselTable.tsx, DashboardView.tsx, and InspectorWorkspaceView.tsx.
*/
export function filterVesselsForPersona(
  vessels: VesselParticulars[],
  assuranceSets: AssuranceSet[],
  persona: UserRolePersona,
): VesselParticulars[] {
  if (persona === "C Admin") return vessels;

  if (persona === "Administrator") {
    /* administrator only sees vessels owned/managed by their organization (northwind marine pty ltd) */
    return vessels.filter((v) => {
      const ownerLower = (v.registeredOwner || "").toLowerCase();
      const techManagerLower = (v.technicalManager || "").toLowerCase();
      const ismLower = (v.ismCompany || "").toLowerCase();

      return (
        ownerLower.includes("northwind") ||
        techManagerLower.includes("northwind") ||
        ismLower.includes("northwind")
      );
    });
  }

  if (persona === "Submitter") {
    /* vessel admin / submitter can only see their own vessels (owned/managed by their organization) */
    return vessels.filter((v) => {
      const ownerLower = (v.registeredOwner || "").toLowerCase();
      const techManagerLower = (v.technicalManager || "").toLowerCase();
      const ismLower = (v.ismCompany || "").toLowerCase();

      return (
        ownerLower.includes("pacific ocean") ||
        ownerLower.includes("northwind") ||
        techManagerLower.includes("pacific") ||
        techManagerLower.includes("northwind") ||
        ismLower.includes("pacific") ||
        ismLower.includes("northwind")
      );
    });
  }

  const assignedSetVesselIds = new Set(
    assuranceSets
      .filter((set) => isAssuranceSetAssignedToPersona(set, persona))
      .map((set) => set.vesselId),
  );

  return vessels.filter((v) => assignedSetVesselIds.has(v.id));
}

/**
  what: filters list of users based on active user persona rbac rules.
  how: c admin sees their own user profile details (c admin role / matching persona) plus any users they created/invited; vessel admin (administrator / submitter) sees their own details (administrator role / vessel provider admin) plus any users they created/invited; other personas have no user management access.
  with what file: src/utils/rbacHelpers.ts consumed by UserManagementView.tsx and UserTable.tsx.
*/
export function filterUsersForPersona(
  users: import("../types/user").UserProfile[],
  persona: UserRolePersona,
): import("../types/user").UserProfile[] {
  if (persona === "Administrator" || persona === "Submitter") {
    /* vessel admin sees their own details (and internal organization members) plus users they created or invited */
    return users.filter(
      (u) =>
        u.roles.includes("Administrator") ||
        u.roles.includes("Submitter") ||
        u.name === "K. Osei" ||
        u.organization === "Northwind Marine Pty Ltd" ||
        u.createdBy === "Administrator" ||
        u.invitedBy === "Administrator" ||
        u.createdBy === "Vessel Provider Admin" ||
        u.createdBy === "Submitter"
    );
  }

  if (persona === "C Admin") {
    /* c admin sees their own details plus any users they created or invited */
    return users.filter(
      (u) =>
        u.roles.includes("C Admin") ||
        u.name === "S. Basin" ||
        u.createdBy === "C Admin" ||
        u.invitedBy === "C Admin"
    );
  }

  /* verifier, inspector, approver — no access to user list */
  return [];
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

  if (previousHashView === "approver") {
    return {
      label: previousEntityId
        ? "Back to Approval Detail"
        : "Back to Approval Requests",
      targetView: "approver",
      targetEntityId: previousEntityId,
    };
  }

  if (previousHashView === "inspector" || previousHashView === "inspection") {
    return {
      label: previousEntityId
        ? "Back to Inspection Checklist"
        : "Back to Physical Survey Schedule",
      targetView: "inspector",
      targetEntityId: previousEntityId,
    };
  }

  return {
    label: `Back to ${parentLabel}`,
    targetView: parentView,
    targetEntityId: undefined,
  };
}

/**
  what: checks if a view route is accessible to persona evaluating initial baseline rules overridden by matrix flags.
  how: computes baseline persona route accessibility and overrides with per-user or role matrix read permission if present.
  with what file: src/utils/rbacHelpers.ts used by App.tsx and useMapStore.ts.
*/
export function isViewAccessibleToPersona(
  view: string,
  _entityId: string | undefined | null,
  persona: UserRolePersona,
  matrix?: RolePermissionMatrix,
  overrides?: UserPermissionOverrides,
  user?: Pick<UserProfile, 'id' | 'roles'> | null,
): boolean {
  /* roles & permissions settings page — administrator only (brd role_rights row is blank) */
  if (view === "roles-permissions") {
    return persona === "Administrator";
  }

  /* baseline initial persona route checks (matrix overrides when supplied) */
  const getInitialAllowed = (): boolean => {
    if (view === "users") {
      return persona === "Administrator" || persona === "C Admin";
    }
    if (view === "crew") {
      return persona === "Administrator";
    }
    if (view === "capa" || view === "capas") {
      return (
        persona === "Administrator" ||
        persona === "C Admin" ||
        persona === "Inspector"
      );
    }
    if (view === "dashboard" || view === "audit") return true;

    if (persona === "Administrator") {
      return true;
    }

    if (persona === "C Admin") {
      if (
        [
          "documents",
          "crew",
          "verifier",
          "approver",
          "inspector",
          "inspection",
        ].includes(view)
      ) {
        return false;
      }
      return true;
    }

    if (persona === "Submitter") {
      if (
        [
          "inspector",
          "inspection",
          "create-assurance-set",
          "approver",
          "users",
          "crew",
          "capa",
          "capas",
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
          "assurance-sets",
          "create-assurance-set",
          "inspector",
          "inspection",
          "approver",
          "users",
          "crew",
          "capa",
          "capas",
        ].includes(view)
      ) {
        return false;
      }
      return true;
    }

    if (persona === "Inspector") {
      return (
        view === "dashboard" ||
        view === "audit" ||
        view === "capa" ||
        view === "capas" ||
        view === "inspector" ||
        view === "inspection"
      );
    }

    if (persona === "Approver") {
      return (
        view === "dashboard" ||
        view === "audit" ||
        view === "approver"
      );
    }

    return true;
  };

  const initialAllowed = getInitialAllowed();

  /* if permission matrix is supplied, check for user override or role matrix override */
  if (matrix) {
    const scopeKey = VIEW_TO_SCOPE[view];
    if (scopeKey) {
      if (user && isUserOverride(overrides || {}, user.id, scopeKey, "read")) {
        return getEffectiveUserScopeFlags(matrix, overrides || {}, user, scopeKey).read;
      }
      return getRoleScopeFlags(matrix, persona, scopeKey).read;
    }
  }

  return initialAllowed;
}
