/* 
  file summary: assurance set data models and pipeline stage definitions for the marine assurance platform (map).
  responsibilities: defines types for assurance projects, charter window timelines, stage progression, requirement toggles, and compliance scoring.
  role in system: consumed by assurance set command center, tables, state management, and approver readiness dial.
*/

export type AssuranceStage = 'Initiated' | 'Validation' | 'Verification' | 'Inspection' | 'Approval' | 'Certified' | 'Approved & Certified';

export type InitiatingRoleType = 'Vessel Provider Admin' | 'C Admin · Client Created';

export interface AssuranceRequirement {
  id: string;
  category: 'Statutory Certificate' | 'Crew Credential' | 'Inspection Report' | 'Environmental';
  title: string; // e.g. Cargo Ship Safety Equipment
  isMandatory: boolean;
  isFulfilled: boolean;
  ocrConfidence: number; // 0 - 100%
  documentId?: string;
  linkedDocumentId?: string;
  documentVersion?: string;
  verifierStatus: 'Pending' | 'Verified' | 'Correction Requested' | 'Rejected';
  verificationRoute?: 'Inspector' | 'Approver';
  notes?: string;
}

export interface AssuranceSet {
  id: string; // e.g. AS-2026-001
  title: string; // e.g. Chevron Gorgon Charter Vetting
  vesselId: string;
  vesselName: string;
  imoNumber: string;
  initiatorOrg: string;
  initiatorRole: InitiatingRoleType;
  charterWindowStart: string; // ISO date
  charterWindowEnd: string; // ISO date
  stage: AssuranceStage;
  readinessScore: number; // 0 - 100%
  requirements: AssuranceRequirement[];
  mandatoryInspectionRequired: boolean;
  inspectionCompleted: boolean;
  assignedSubmitter?: string;
  assignedVerifier?: string;
  assignedInspector?: string;
  assignedApprover?: string;
  approverDecision?: 'Approved' | 'Returned for Correction' | 'Rejected' | 'Pending';
  approverNotes?: string;
}
