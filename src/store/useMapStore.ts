/* 
  file summary: unified zustand global state management store for the marine assurance platform (map).
  responsibilities: manages state for active persona rbac, vessel fleet, assurance sets, document vault, audit logs, hash route tracking, and compliance workflows.
  role in system: central state store consumed by all header, sidebar, table, view, drawer, and modal components.
*/

import { create } from 'zustand';
import { UserRolePersona, AuditTrailEvent } from '../types/audit';
import { VesselParticulars } from '../types/vessel';
import { AssuranceSet, AssuranceStage } from '../types/assurance';
import { MasterDocument } from '../types/document';
import { MOCK_VESSELS, MOCK_ASSURANCE_SETS, MOCK_DOCUMENTS, MOCK_AUDIT_TRAIL, MOCK_USERS } from './mockData';
import { MOCK_CREW } from './crewMockData';
import { isDuplicateVessel } from '../utils/validation';
import { isViewAccessibleToPersona } from '../utils/rbacHelpers';
import { UserProfile } from '../types/user';
import { CrewMember, STCWDocumentItem } from '../types/crew';
import { CapaItem, CapaStatus, CapaEvidenceItem } from '../types/capa';
import { MOCK_CAPA_ITEMS } from './capaMockData';
import {
  CrudAction,
  PermissionCategory,
  PermissionScopeDefinition,
  RolePermissionMatrix,
  UserPermissionOverrides,
  emptyCrud,
  slugifyPermissionKey,
  ALL_ROLE_PERSONAS,
} from '../types/permissions';
import {
  PERMISSION_SCOPE_CATALOG,
  buildBrdRolePermissionDefaults,
  buildEmptyFlagsForCatalog,
} from '../utils/permissionDefaults';
import { applyPermissionGuards } from '../utils/permissionHelpers';

export interface MapStoreState {

  // Authentication State
  isAuthenticated: boolean;
  login: (role: UserRolePersona) => void;
  logout: () => void;

  // Persona & RBAC State
  activePersona: UserRolePersona;
  setActivePersona: (persona: UserRolePersona) => void;

  // Hash Navigation State
  currentHashView: string;
  previousHashView?: string;
  currentEntityId?: string;
  previousEntityId?: string;
  setCurrentHashView: (view: string, entityId?: string) => void;

  // Active Asset Context
  activeVesselId: string;
  setActiveVesselId: (id: string) => void;

  // Vessel Fleet State
  vessels: VesselParticulars[];
  addVessel: (vessel: VesselParticulars) => { success: boolean; message?: string; vesselId?: string };
  updateVessel: (vessel: VesselParticulars) => void;
  updateVesselStatus: (vesselId: string, status: VesselParticulars['status']) => void;

  // Assurance Sets State
  assuranceSets: AssuranceSet[];
  addAssuranceSet: (set: AssuranceSet) => void;
  updateAssuranceStage: (setId: string, stage: AssuranceStage) => void;
  updateAssuranceInspector: (setId: string, inspectorName: string) => void;
  updateRequirementStatus: (
    setId: string,
    reqId: string,
    status: 'Verified' | 'Correction Requested' | 'Rejected',
    notes?: string
  ) => void;
  setApproverDecision: (
    setId: string,
    decision: 'Approved' | 'Returned for Correction' | 'Rejected',
    notes?: string
  ) => void;

  // Document Library State
  documents: MasterDocument[];
  addDocument: (doc: MasterDocument) => void;
  linkDocumentToVessel: (docId: string, vesselId: string, vesselName?: string, imoNumber?: string) => void;
  uploadDocumentForRequirement: (
    setId: string,
    requirementId: string,
    doc: MasterDocument,
  ) => void;
  addDocumentVersion: (
    docId: string,
    newVersionLabel: string,
    fileName: string,
    fileSizeBytes: number,
    changeSummary: string
  ) => void;
  verifyDocument: (
    docId: string,
    status: 'Pending' | 'Verified' | 'Correction Requested' | 'Rejected',
    notes?: string,
    routeTarget?: 'Inspector' | 'Approver',
  ) => void;

  // Audit Trail State
  auditEvents: AuditTrailEvent[];
  logAuditEvent: (event: Omit<AuditTrailEvent, 'id' | 'timestampUtc'>) => void;

  // User Management State
  users: UserProfile[];
  addUser: (user: UserProfile) => void;
  updateUser: (user: UserProfile) => void;
  updateUserStatus: (userId: string, status: UserProfile['status']) => void;

  // Roles & Permissions State (BRD defaults + admin overrides)
  rolePermissionDefaults: RolePermissionMatrix;
  userPermissionOverrides: UserPermissionOverrides;
  customRoles: string[];
  customScopes: PermissionScopeDefinition[];
  setRolePermissionFlag: (
    role: string,
    scopeKey: string,
    action: CrudAction,
    value: boolean,
  ) => void;
  commitRolePermissionDefaults: (matrix: RolePermissionMatrix) => void;
  commitUserPermissionOverrides: (overrides: UserPermissionOverrides) => void;
  resetRolePermissionsToBrd: () => void;
  setUserPermissionOverride: (
    userId: string,
    scopeKey: string,
    action: CrudAction,
    value: boolean,
  ) => void;
  clearUserPermissionOverrides: (userId: string) => void;
  addCustomRole: (roleName: string) => { success: boolean; message?: string };
  addCustomScope: (input: {
    label: string;
    description: string;
    category: PermissionCategory;
  }) => { success: boolean; message?: string; key?: string };

  // Crew Directory State
  crew: CrewMember[];
  addCrewMember: (crew: CrewMember) => void;
  assignCrewToVessel: (crewId: string, vesselId: string | undefined) => void;
  addCrewDocument: (crewId: string, doc: STCWDocumentItem) => void;
  updateCrewDocument: (crewId: string, doc: STCWDocumentItem) => void;
  deleteCrewDocument: (crewId: string, docId: string) => void;

  // Global Drawers State
  isAuditDrawerOpen: boolean;
  setAuditDrawerOpen: (open: boolean) => void;

  // CAPA Management State
  capaItems: CapaItem[];
  addCapaItem: (capa: CapaItem) => void;
  updateCapaStatus: (capaId: string, status: CapaStatus, inspectorNotes?: string) => void;
  addCapaEvidence: (capaId: string, evidence: CapaEvidenceItem) => void;
  removeCapaEvidence: (capaId: string, evidenceId: string) => void;
  flagCapaForReinspection: (capaId: string, reason?: string) => void;
}

const BRD_PERMISSION_DEFAULTS = buildBrdRolePermissionDefaults();


export const useMapStore = create<MapStoreState>((set, get) => ({
  isAuthenticated: false,
  login: (role) => {
    get().logAuditEvent({
      userId: 'USR-LOGIN',
      userRole: role,
      organization: role === 'C Admin' ? 'Southern Basin Energy' : 'Northwind Marine',
      action: 'Authenticated User Session',
      targetAsset: 'Authentication Gateway',
      justificationNotes: `Logged in as ${role}`,
    });
    const targetView = role === 'Verifier' ? 'verifier' : role === 'Inspector' ? 'inspector' : 'dashboard';
    window.location.hash = `#/${targetView}`;
    set({ isAuthenticated: true, activePersona: role, currentHashView: targetView });
  },
  logout: () => {
    get().logAuditEvent({
      userId: 'USR-LOGOUT',
      userRole: get().activePersona,
      organization: 'MAP Gateway',
      action: 'Terminated User Session',
      targetAsset: 'Authentication Gateway',
      justificationNotes: 'User signed out.',
    });
    window.location.hash = '#/login';
    set({ isAuthenticated: false, currentHashView: 'login' });
  },

  activePersona: 'Administrator',
  setActivePersona: (persona) => {
    get().logAuditEvent({
      userId: 'USR-PERSONA-SWITCH',
      userRole: persona,
      organization: persona === 'C Admin' ? 'Southern Basin Energy' : 'Northwind Marine',
      action: 'Switched Active User Persona',
      targetAsset: 'Global System Context',
      justificationNotes: `Persona set to ${persona}`,
    });

    /* default to dashboard if active view is not accessible to newly selected persona */
    const currentView = get().currentHashView;
    const currentId = get().currentEntityId;

    if (!isViewAccessibleToPersona(currentView, currentId, persona)) {
      get().setCurrentHashView('dashboard');
    }

    set({ activePersona: persona });
  },

  currentHashView: 'login',
  previousHashView: undefined,
  currentEntityId: undefined,
  previousEntityId: undefined,
  setCurrentHashView: (view, entityId) => {
    const currentView = get().currentHashView;
    const currentId = get().currentEntityId;

    let prevView = get().previousHashView;
    let prevId = get().previousEntityId;

    if (currentView !== view || currentId !== entityId) {
      prevView = currentView;
      prevId = currentId;
    }

    window.location.hash = entityId ? `#/${view}/${entityId}` : `#/${view}`;
    set({
      previousHashView: prevView,
      previousEntityId: prevId,
      currentHashView: view,
      currentEntityId: entityId,
    });
  },

  activeVesselId: 'VESSEL-001',
  setActiveVesselId: (id) => set({ activeVesselId: id }),

  // Fleet Vessels
  vessels: MOCK_VESSELS,
  addVessel: (newVessel) => {
    const dupCheck = isDuplicateVessel(newVessel.imoNumber, newVessel.officialRegNumber, get().vessels);
    if (dupCheck.isDuplicate) {
      return { success: false, message: dupCheck.reason };
    }

    set((state) => ({ vessels: [...state.vessels, newVessel] }));

    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: 'Pacific Ocean Logistics',
      action: 'Registered Unique Vessel Record',
      targetAsset: `${newVessel.name} (IMO ${newVessel.imoNumber})`,
      justificationNotes: `Registered vessel under ${newVessel.flagState} flag.`,
    });

    return { success: true, vesselId: newVessel.id };
  },

  updateVessel: (updatedVessel) => {
    set((state) => ({
      vessels: state.vessels.map((v) => (v.id === updatedVessel.id ? updatedVessel : v)),
    }));

    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: get().activePersona === 'C Admin' ? 'Chevron Australia' : 'Pacific Ocean Logistics',
      action: 'Updated Vessel Specifications',
      targetAsset: `${updatedVessel.name} (IMO ${updatedVessel.imoNumber})`,
      justificationNotes: `Updated vessel particulars for ${updatedVessel.name}`,
    });
  },

  updateVesselStatus: (vesselId, status) => {
    set((state) => ({
      vessels: state.vessels.map((v) => (v.id === vesselId ? { ...v, status } : v)),
    }));
  },

  // Assurance Sets
  assuranceSets: MOCK_ASSURANCE_SETS,
  addAssuranceSet: (newSet) => {
    set((state) => ({ assuranceSets: [...state.assuranceSets, newSet] }));
    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: newSet.initiatorOrg,
      action: 'Initiated Assurance Set',
      targetAsset: `${newSet.id} (${newSet.title})`,
      justificationNotes: `Created assurance set for vessel ${newSet.vesselName}`,
    });
  },
  updateAssuranceStage: (setId, stage) => {
    set((state) => ({
      assuranceSets: state.assuranceSets.map((s) => (s.id === setId ? { ...s, stage } : s)),
    }));
  },
  updateAssuranceInspector: (setId, inspectorName) => {
    set((state) => ({
      assuranceSets: state.assuranceSets.map((s) =>
        s.id === setId ? { ...s, assignedInspector: inspectorName, mandatoryInspectionRequired: true } : s
      ),
    }));
    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: get().activePersona === 'C Admin' ? 'Southern Basin Energy' : 'Northwind Marine',
      action: 'Assigned Vessel Inspector',
      targetAsset: `${setId} · ${inspectorName}`,
      justificationNotes: `Assigned inspector ${inspectorName} to assurance campaign ${setId}`,
    });
  },
  updateRequirementStatus: (setId, reqId, status, notes) => {
    set((state) => {
      let linkedDocId: string | undefined = undefined;

      const updatedSets = state.assuranceSets.map((s) => {
        if (s.id !== setId) return s;
        const updatedReqs = s.requirements.map((r) =>
          r.id === reqId ? { ...r, verifierStatus: status, notes, isFulfilled: status === 'Verified' } : r
        );
        const verifiedCount = updatedReqs.filter((r) => r.verifierStatus === 'Verified').length;
        const newScore = Math.round((verifiedCount / updatedReqs.length) * 100);
        const allVerified = updatedReqs.length > 0 && updatedReqs.every((r) => r.verifierStatus === 'Verified');

        let nextStage = s.stage;
        if (allVerified) {
          nextStage = 'Approval';
        } else if (status === 'Correction Requested' || status === 'Rejected') {
          nextStage = 'Verification';
        }

        return {
          ...s,
          requirements: updatedReqs,
          readinessScore: newScore,
          stage: nextStage,
          approverDecision: allVerified ? 'Pending' : (status === 'Verified' ? s.approverDecision : undefined),
        };
      });

      const updatedDocs = linkedDocId
        ? state.documents.map((d) =>
          d.id === linkedDocId ? { ...d, verificationStatus: status, verificationNotes: notes } : d
        )
        : state.documents;

      return {
        assuranceSets: updatedSets,
        documents: updatedDocs,
      };
    });

    get().logAuditEvent({
      userId: 'USR-VERIFY-01',
      userRole: get().activePersona,
      organization: 'Compliance Services',
      action: `Requirement Verification: ${status}`,
      targetAsset: `${setId} / Requirement ${reqId}`,
      justificationNotes: notes || `Verifier status set to ${status}`,
    });
  },
  setApproverDecision: (setId, decision, notes) => {
    set((state) => ({
      assuranceSets: state.assuranceSets.map((s) => {
        if (s.id !== setId) return s;
        const newStage = decision === 'Approved' ? 'Approved & Certified' : 'Verification';
        return {
          ...s,
          stage: newStage,
          approverDecision: decision,
          approverNotes: notes,
          readinessScore: decision === 'Approved' ? 100 : s.readinessScore,
        };
      }),
    }));

    get().logAuditEvent({
      userId: 'USR-APPROVE-01',
      userRole: get().activePersona,
      organization: 'Marine Assurance Authority',
      action: `Approver Final Decision: ${decision}`,
      targetAsset: `Assurance Set ${setId}`,
      justificationNotes: notes || `Executive decision: ${decision}`,
    });
  },

  // Documents
  documents: MOCK_DOCUMENTS,
  addDocument: (doc) => {
    set((state) => ({ documents: [...state.documents, doc] }));
    get().logAuditEvent({
      userId: 'USR-SUBMIT-01',
      userRole: get().activePersona,
      organization: 'Vessel Provider Operations',
      action: 'Uploaded New Master Document',
      targetAsset: `${doc.id} (${doc.title})`,
      justificationNotes: `Uploaded certificate ${doc.certificateNo}`,
    });
  },
  linkDocumentToVessel: (docId, vesselId, vesselName, imoNumber) => {
    set((state) => ({
      documents: state.documents.map((d) => {
        if (d.id !== docId) return d;
        return {
          ...d,
          vesselId,
          vesselAttributes: d.vesselAttributes
            ? {
              ...d.vesselAttributes,
              vesselName: vesselName || d.vesselAttributes.vesselName,
              imoNumber: imoNumber || d.vesselAttributes.imoNumber,
            }
            : undefined,
        };
      }),
    }));
  },
  uploadDocumentForRequirement: (setId, requirementId, doc) => {
    set((state) => {
      const updatedSets = state.assuranceSets.map((s) => {
        if (s.id !== setId) return s;

        const updatedReqs = s.requirements.map((r) => {
          if (r.id !== requirementId) return r;
          return {
            ...r,
            documentId: doc.id,
            documentVersion: doc.currentVersion,
            verifierStatus: 'Pending' as const,
            isFulfilled: false,
            ocrConfidence: doc.ocrConfidence,
            notes: `Mock upload linked to requirement (${doc.versions[0]?.fileName || doc.title}).`,
          };
        });

        const hasLinkedDocuments = updatedReqs.some((r) => r.documentId);
        let nextStage = s.stage;
        if (hasLinkedDocuments && (s.stage === 'Initiated' || s.stage === 'Validation')) {
          nextStage = 'Verification';
        }

        return {
          ...s,
          requirements: updatedReqs,
          stage: nextStage,
        };
      });

      return {
        documents: [...state.documents, doc],
        assuranceSets: updatedSets,
      };
    });

    get().logAuditEvent({
      userId: 'USR-SUBMIT-01',
      userRole: get().activePersona,
      organization: 'Vessel Provider Operations',
      action: 'Uploaded Document for Assurance Requirement',
      targetAsset: `${doc.id} → ${setId} / ${requirementId}`,
      justificationNotes: `Mock upload: ${doc.title} (${doc.certificateNo}) queued for verifier review.`,
    });
  },
  addDocumentVersion: (docId, newVersionLabel, fileName, fileSizeBytes, changeSummary) => {
    set((state) => {
      const updatedDocs = state.documents.map((d) => {
        if (d.id !== docId) return d;
        const newVersionObj = {
          versionLabel: newVersionLabel,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Ops Submitter',
          fileSizeBytes,
          fileName,
          changeSummary,
        };
        return {
          ...d,
          currentVersion: newVersionLabel,
          ocrConfidence: 98,
          verificationStatus: 'Pending' as const,
          versions: [newVersionObj, ...d.versions],
        };
      });
      const targetDoc = updatedDocs.find((d) => d.id === docId);

      const updatedSets = state.assuranceSets.map((s) => {
        let hasMatchedReq = false;
        const updatedReqs = s.requirements.map((r) => {
          if (r.documentId === docId || (targetDoc && r.title.toLowerCase() === targetDoc.title.toLowerCase())) {
            hasMatchedReq = true;
            return {
              ...r,
              documentId: docId,
              documentVersion: newVersionLabel,
              verifierStatus: 'Pending' as const,
              isFulfilled: false,
              ocrConfidence: 98,
              notes: changeSummary || `Replacement revision ${newVersionLabel} uploaded by submitter.`,
            };
          }
          return r;
        });

        if (!hasMatchedReq) return s;

        const verifiedCount = updatedReqs.filter((r) => r.verifierStatus === 'Verified').length;
        const newScore = Math.round((verifiedCount / updatedReqs.length) * 100);

        return {
          ...s,
          requirements: updatedReqs,
          readinessScore: newScore,
          stage: 'Verification' as const,
        };
      });

      return {
        documents: updatedDocs,
        assuranceSets: updatedSets,
      };
    });

    get().logAuditEvent({
      userId: 'USR-SUBMIT-01',
      userRole: get().activePersona,
      organization: 'Vessel Provider Operations',
      action: `Uploaded Document Revision ${newVersionLabel}`,
      targetAsset: `Document ${docId}`,
      justificationNotes: changeSummary,
    });
  },
  verifyDocument: (docId, status, notes, routeTarget) => {
    set((state) => {
      const updatedDocs = state.documents.map((d) =>
        d.id === docId ? { ...d, verificationStatus: status, verificationNotes: notes } : d
      );
      const targetDoc = updatedDocs.find((d) => d.id === docId);

      const updatedSets = state.assuranceSets.map((s) => {
        let hasMatchedReq = false;

        const updatedReqs = s.requirements.map((r) => {
          const isDocIdMatch = r.documentId === docId;
          const isTitleMatch = targetDoc && r.title.toLowerCase() === targetDoc.title.toLowerCase();
          const isSubTitleMatch = targetDoc && (
            r.title.toLowerCase().includes(targetDoc.title.toLowerCase()) ||
            targetDoc.title.toLowerCase().includes(r.title.toLowerCase())
          );

          if (isDocIdMatch || isTitleMatch || (s.vesselId === targetDoc?.vesselId && isSubTitleMatch)) {
            hasMatchedReq = true;
            return {
              ...r,
              documentId: docId,
              verifierStatus: status,
              isFulfilled: status === 'Verified',
              ocrConfidence: targetDoc?.ocrConfidence || 98,
              notes: notes || r.notes,
              verificationRoute:
                status === 'Verified' && routeTarget ? routeTarget : r.verificationRoute,
            };
          }
          return r;
        });

        if (!hasMatchedReq) return s;

        const verifiedCount = updatedReqs.filter((r) => r.verifierStatus === 'Verified').length;
        const newScore = Math.round((verifiedCount / updatedReqs.length) * 100);
        const allVerified = updatedReqs.length > 0 && updatedReqs.every((r) => r.verifierStatus === 'Verified');

        let nextStage = s.stage;
        if (allVerified) {
          const routesToInspector =
            updatedReqs.some((r) => r.verificationRoute === 'Inspector') ||
            (s.mandatoryInspectionRequired && !s.inspectionCompleted);
          nextStage = routesToInspector ? 'Inspection' : 'Approval';
        } else if (status === 'Correction Requested' || status === 'Rejected') {
          nextStage = 'Verification';
        }

        return {
          ...s,
          requirements: updatedReqs,
          readinessScore: newScore,
          stage: nextStage,
          approverDecision: allVerified ? 'Pending' : (status === 'Verified' ? s.approverDecision : undefined),
        };
      });

      return {
        documents: updatedDocs,
        assuranceSets: updatedSets,
      };
    });

    const routeNote = routeTarget ? ` | Routed to ${routeTarget}` : '';
    get().logAuditEvent({
      userId: 'USR-VERIFY-01',
      userRole: get().activePersona,
      organization: 'Verifier Inspectorate',
      action: `Document Verification Action: ${status}`,
      targetAsset: `Document ${docId}`,
      justificationNotes: `${notes || `Verification status updated to ${status}`}${routeNote}`,
    });
  },

  // Audit Events
  auditEvents: MOCK_AUDIT_TRAIL,
  logAuditEvent: (eventData) => {
    const newEvent: AuditTrailEvent = {
      id: `AUD-${Math.floor(10000 + Math.random() * 90000)}`,
      timestampUtc: new Date().toISOString(),
      ...eventData,
    };
    set((state) => ({ auditEvents: [newEvent, ...state.auditEvents] }));
  },

  // User Management
  users: MOCK_USERS,
  addUser: (newUser) => {
    set((state) => ({ users: [newUser, ...state.users] }));
    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: `Provisioned New User Profile (${newUser.userType})`,
      targetAsset: `${newUser.name} (${newUser.email})`,
      justificationNotes: `Added ${newUser.userType} user assigned as ${newUser.roles.join(', ')} for ${newUser.organization}.`,
    });
  },
  updateUser: (updatedUser) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
    }));
    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Updated User Profile',
      targetAsset: `${updatedUser.name} (${updatedUser.email})`,
      justificationNotes: `Updated user profile for ${updatedUser.name} (${updatedUser.roles.join(', ')}, ${updatedUser.userType}).`,
    });
  },
  updateUserStatus: (userId, status) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, status } : u)),
    }));
  },

  rolePermissionDefaults: BRD_PERMISSION_DEFAULTS,
  userPermissionOverrides: {},
  customRoles: [],
  customScopes: [],
  setRolePermissionFlag: (role, scopeKey, action, value) => {
    const guarded = applyPermissionGuards(
      scopeKey,
      role,
      {
        ...(get().rolePermissionDefaults[role]?.[scopeKey] ?? emptyCrud()),
        [action]: value,
      },
      get().customScopes,
    );
    set((state) => ({
      rolePermissionDefaults: {
        ...state.rolePermissionDefaults,
        [role]: {
          ...state.rolePermissionDefaults[role],
          [scopeKey]: guarded,
        },
      },
    }));
    get().logAuditEvent({
      userId: 'USR-ADMIN',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Updated Role Permission Default',
      targetAsset: `${role} · ${scopeKey} · ${action}`,
      justificationNotes: `Set ${action} to ${value ? 'allowed' : 'denied'} for role ${role} on scope ${scopeKey}.`,
    });
  },
  commitRolePermissionDefaults: (matrix) => {
    set({ rolePermissionDefaults: matrix });
    get().logAuditEvent({
      userId: 'USR-ADMIN',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Saved Role Permission Defaults',
      targetAsset: 'Role Rights Matrix',
      justificationNotes: 'Administrator committed role-default permission changes.',
    });
  },
  commitUserPermissionOverrides: (overrides) => {
    set({ userPermissionOverrides: overrides });
    get().logAuditEvent({
      userId: 'USR-ADMIN',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Saved User Permission Overrides',
      targetAsset: 'User Rights Matrix',
      justificationNotes: 'Administrator committed per-user permission overrides.',
    });
  },
  resetRolePermissionsToBrd: () => {
    set({
      rolePermissionDefaults: buildBrdRolePermissionDefaults(),
      userPermissionOverrides: {},
      customRoles: [],
      customScopes: [],
    });
    get().logAuditEvent({
      userId: 'USR-ADMIN',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Reset Role Permissions to BRD Defaults',
      targetAsset: 'Role Rights Matrix',
      justificationNotes: 'Restored BRD-seeded CRUD defaults and cleared custom roles/scopes/overrides.',
    });
  },
  setUserPermissionOverride: (userId, scopeKey, action, value) => {
    set((state) => {
      const userOverrides = { ...(state.userPermissionOverrides[userId] || {}) };
      const scopePatch = { ...(userOverrides[scopeKey] || {}), [action]: value };
      userOverrides[scopeKey] = scopePatch;
      return {
        userPermissionOverrides: {
          ...state.userPermissionOverrides,
          [userId]: userOverrides,
        },
      };
    });
    get().logAuditEvent({
      userId: 'USR-ADMIN',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Updated User Permission Override',
      targetAsset: `${userId} · ${scopeKey} · ${action}`,
      justificationNotes: `Override ${action}=${value} for user ${userId} on scope ${scopeKey}.`,
    });
  },
  clearUserPermissionOverrides: (userId) => {
    set((state) => {
      const next = { ...state.userPermissionOverrides };
      delete next[userId];
      return { userPermissionOverrides: next };
    });
    get().logAuditEvent({
      userId: 'USR-ADMIN',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Cleared User Permission Overrides',
      targetAsset: userId,
      justificationNotes: `Restored user ${userId} to role-default permissions.`,
    });
  },
  addCustomRole: (roleName) => {
    const name = roleName.trim();
    if (!name) return { success: false, message: 'Role name is required.' };
    const existing = [...ALL_ROLE_PERSONAS, ...get().customRoles];
    if (existing.some((r) => r.toLowerCase() === name.toLowerCase())) {
      return { success: false, message: 'A role with this name already exists.' };
    }
    const catalog = [...PERMISSION_SCOPE_CATALOG, ...get().customScopes];
    set((state) => ({
      customRoles: [...state.customRoles, name],
      rolePermissionDefaults: {
        ...state.rolePermissionDefaults,
        [name]: buildEmptyFlagsForCatalog(catalog),
      },
    }));
    get().logAuditEvent({
      userId: 'USR-ADMIN',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Created Custom Role',
      targetAsset: name,
      justificationNotes: `Added custom role "${name}" with empty CRUD defaults.`,
    });
    return { success: true };
  },
  addCustomScope: ({ label, description, category }) => {
    const trimmed = label.trim();
    if (!trimmed) return { success: false, message: 'Feature / scope name is required.' };
    let key = `custom_${slugifyPermissionKey(trimmed)}`;
    const allKeys = new Set([
      ...PERMISSION_SCOPE_CATALOG.map((s) => s.key),
      ...get().customScopes.map((s) => s.key),
    ]);
    if (allKeys.has(key)) key = `${key}_${Date.now()}`;

    const def: PermissionScopeDefinition = {
      key,
      label: trimmed,
      description: description.trim() || 'Custom feature scope added by administrator.',
      category,
      isCustom: true,
    };

    set((state) => {
      const nextMatrix: RolePermissionMatrix = { ...state.rolePermissionDefaults };
      for (const role of Object.keys(nextMatrix)) {
        nextMatrix[role] = {
          ...nextMatrix[role],
          [key]: emptyCrud(),
        };
      }
      return {
        customScopes: [...state.customScopes, def],
        rolePermissionDefaults: nextMatrix,
      };
    });
    get().logAuditEvent({
      userId: 'USR-ADMIN',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Created Custom Permission Scope',
      targetAsset: key,
      justificationNotes: `Added custom scope "${trimmed}" under ${category}.`,
    });
    return { success: true, key };
  },

  // Crew Directory
  crew: MOCK_CREW,
  addCrewMember: (newCrew) => {
    set((state) => ({ crew: [newCrew, ...state.crew] }));
    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Registered Crew Member',
      targetAsset: `${newCrew.fullName} (${newCrew.rank})`,
      justificationNotes: `Registered crew member with Seaman's Book ${newCrew.seamansBookNo}`,
    });
  },
  assignCrewToVessel: (crewId, vesselId) => {
    const vessel = get().vessels.find((v) => v.id === vesselId);
    set((state) => ({
      crew: state.crew.map((c) => {
        if (c.id !== crewId) return c;
        if (!vesselId) {
          return {
            ...c,
            currentVesselId: undefined,
            currentVesselName: undefined,
          };
        }
        const existingAssignments = c.assignments || [];
        const newAssignment = {
          id: `ASG-${Math.floor(600 + Math.random() * 300)}`,
          vesselId: vessel!.id,
          vesselName: vessel!.name,
          imoNumber: vessel!.imoNumber,
          vesselType: vessel!.classificationSociety ? `${vessel!.classificationSociety} Vessel` : 'Offshore Support Vessel',
          rankHeld: c.rank,
          embarkDate: new Date().toISOString().split('T')[0],
          isCurrent: true,
        };
        const updatedAssignments = [newAssignment, ...existingAssignments.map((a) => ({ ...a, isCurrent: false }))];
        return {
          ...c,
          currentVesselId: vessel!.id,
          currentVesselName: `${vessel!.name} (IMO ${vessel!.imoNumber})`,
          assignments: updatedAssignments,
        };
      }),
    }));
    get().logAuditEvent({
      userId: 'USR-ADMIN-01',
      userRole: get().activePersona,
      organization: 'Northwind Marine',
      action: 'Updated Crew Vessel Assignment',
      targetAsset: `Crew ${crewId}`,
      justificationNotes: vesselId ? `Assigned crew ${crewId} to vessel ${vessel?.name}` : `Unassigned crew ${crewId}`,
    });
  },
  addCrewDocument: (crewId, doc) => {
    set((state) => ({
      crew: state.crew.map((c) => {
        if (c.id !== crewId) return c;
        const isLayer1 = doc.layer === 'Layer 1 - Universal Core';
        const updatedL1 = isLayer1 ? [doc, ...c.layer1CoreDocuments] : c.layer1CoreDocuments;
        const updatedL2 = !isLayer1 ? [doc, ...c.layer2Endorsements] : c.layer2Endorsements;
        return {
          ...c,
          layer1CoreDocuments: updatedL1,
          layer2Endorsements: updatedL2,
          lastAuditedDate: new Date().toISOString().split('T')[0],
        };
      }),
    }));
    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: `Uploaded Crew STCW Document (${doc.title})`,
      targetAsset: `Crew ${crewId} / ${doc.certificateNo}`,
      justificationNotes: `Uploaded ${doc.layer} certificate for STCW compliance tracking.`,
    });
  },
  updateCrewDocument: (crewId, doc) => {
    set((state) => ({
      crew: state.crew.map((c) => {
        if (c.id !== crewId) return c;
        const filteredL1 = c.layer1CoreDocuments.filter((d) => d.id !== doc.id);
        const filteredL2 = c.layer2Endorsements.filter((d) => d.id !== doc.id);
        const isLayer1 = doc.layer === 'Layer 1 - Universal Core';
        const updatedL1 = isLayer1 ? [doc, ...filteredL1] : filteredL1;
        const updatedL2 = !isLayer1 ? [doc, ...filteredL2] : filteredL2;
        return {
          ...c,
          layer1CoreDocuments: updatedL1,
          layer2Endorsements: updatedL2,
          lastAuditedDate: new Date().toISOString().split('T')[0],
        };
      }),
    }));
    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: `Updated / Reuploaded Crew STCW Document (${doc.title})`,
      targetAsset: `Crew ${crewId} / ${doc.certificateNo}`,
      justificationNotes: `Reuploaded / updated ${doc.layer} certificate status (${doc.verificationStatus}), expiry date ${doc.expiryDate}.`,
    });
  },
  deleteCrewDocument: (crewId, docId) => {
    set((state) => ({
      crew: state.crew.map((c) => {
        if (c.id !== crewId) return c;
        const updatedL1 = c.layer1CoreDocuments.filter((d) => d.id !== docId);
        const updatedL2 = c.layer2Endorsements.filter((d) => d.id !== docId);
        return {
          ...c,
          layer1CoreDocuments: updatedL1,
          layer2Endorsements: updatedL2,
          lastAuditedDate: new Date().toISOString().split('T')[0],
        };
      }),
    }));
    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: get().activePersona,
      organization: 'Northwind Marine Pty Ltd',
      action: 'Deleted Crew STCW Document',
      targetAsset: `Crew ${crewId} / Doc ${docId}`,
      justificationNotes: 'Removed STCW certificate record from crew profile.',
    });
  },

  isAuditDrawerOpen: false,
  setAuditDrawerOpen: (open) => set({ isAuditDrawerOpen: open }),

  // CAPA Management Store Implementation
  capaItems: MOCK_CAPA_ITEMS,
  addCapaItem: (capa) => set((state) => ({ capaItems: [capa, ...state.capaItems] })),
  updateCapaStatus: (capaId, status, inspectorNotes) => {
    set((state) => ({
      capaItems: state.capaItems.map((item) =>
        item.id === capaId
          ? {
            ...item,
            status,
            inspectorNotes: inspectorNotes !== undefined ? inspectorNotes : item.inspectorNotes,
            lastInspectedDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          }
          : item
      ),
    }));
  },
  addCapaEvidence: (capaId, evidence) => {
    set((state) => ({
      capaItems: state.capaItems.map((item) =>
        item.id === capaId ? { ...item, evidences: [...item.evidences, evidence] } : item
      ),
    }));
  },
  removeCapaEvidence: (capaId, evidenceId) => {
    set((state) => ({
      capaItems: state.capaItems.map((item) =>
        item.id === capaId
          ? { ...item, evidences: item.evidences.filter((ev) => ev.id !== evidenceId) }
          : item
      ),
    }));
  },
  flagCapaForReinspection: (capaId, reason) => {
    set((state) => ({
      capaItems: state.capaItems.map((item) =>
        item.id === capaId
          ? {
            ...item,
            status: 'Under Re-Inspection',
            flaggedForReinspection: true,
            cadminFlagReason: reason?.trim() || 'Re-inspection requested by C Admin charterer',
            flaggedByCAdminDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          }
          : item
      ),
    }));
    get().logAuditEvent({
      userId: 'USR-CADMIN-01',
      userRole: get().activePersona,
      organization: 'Charterer Organization',
      action: `Flagged CAPA (${capaId}) for Re-Inspection`,
      targetAsset: `CAPA ${capaId}`,
      justificationNotes: reason || 'C Admin requested re-inspection verification by inspector',
    });
  },
}));
