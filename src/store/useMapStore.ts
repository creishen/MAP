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
import { isDuplicateVessel } from '../utils/validation';
import { isViewAccessibleToPersona } from '../utils/rbacHelpers';
import { UserProfile } from '../types/user';

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
    notes?: string
  ) => void;

  // Audit Trail State
  auditEvents: AuditTrailEvent[];
  logAuditEvent: (event: Omit<AuditTrailEvent, 'id' | 'timestampUtc'>) => void;

  // User Management State
  users: UserProfile[];
  addUser: (user: UserProfile) => void;
  updateUserStatus: (userId: string, status: UserProfile['status']) => void;

  // Global Drawers State
  isAuditDrawerOpen: boolean;
  setAuditDrawerOpen: (open: boolean) => void;
}

export const useMapStore = create<MapStoreState>((set, get) => ({
  isAuthenticated: true,
  login: (role) => {
    get().logAuditEvent({
      userId: 'USR-LOGIN',
      userRole: role,
      organization: role === 'C Admin' ? 'Southern Basin Energy' : 'Northwind Marine',
      action: 'Authenticated User Session',
      targetAsset: 'Authentication Gateway',
      justificationNotes: `Logged in as ${role}`,
    });
    set({ isAuthenticated: true, activePersona: role });
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
    set({ isAuthenticated: false });
  },

  activePersona: 'Administrator',
  setActivePersona: (persona) => {
    get().logAuditEvent({
      userId: 'USR-CURRENT',
      userRole: persona,
      organization: persona === 'C Admin' ? 'Chevron Australia' : 'Pacific Ocean Logistics',
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

  currentHashView: 'dashboard',
  previousHashView: undefined,
  currentEntityId: undefined,
  setCurrentHashView: (view, entityId) => {
    const current = get().currentHashView;
    const prev = current !== view ? current : get().previousHashView;
    window.location.hash = entityId ? `#/${view}/${entityId}` : `#/${view}`;
    set({ previousHashView: prev, currentHashView: view, currentEntityId: entityId });
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
        const newStage = decision === 'Approved' ? 'Certified' : 'Verification';
        return {
          ...s,
          stage: newStage,
          approverDecision: decision,
          approverNotes: notes,
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
              verifierStatus: 'Pending' as const,
              isFulfilled: false,
              ocrConfidence: 98,
              notes: changeSummary || 'Replacement revision uploaded by submitter.',
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
  verifyDocument: (docId, status, notes) => {
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

      return {
        documents: updatedDocs,
        assuranceSets: updatedSets,
      };
    });

    get().logAuditEvent({
      userId: 'USR-VERIFY-01',
      userRole: get().activePersona,
      organization: 'Verifier Inspectorate',
      action: `Document Verification Action: ${status}`,
      targetAsset: `Document ${docId}`,
      justificationNotes: notes || `Verification status updated to ${status}`,
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
      justificationNotes: `Added ${newUser.userType} user assigned as ${newUser.role} for ${newUser.organization}.`,
    });
  },
  updateUserStatus: (userId, status) => {
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, status } : u)),
    }));
  },

  isAuditDrawerOpen: false,
  setAuditDrawerOpen: (open) => set({ isAuditDrawerOpen: open }),
}));