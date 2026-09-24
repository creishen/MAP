/* 
  file summary: assurance set data models and pipeline stage definitions for the marine assurance platform (map).
  responsibilities: defines types for assurance projects, charter window timelines, stage progression, requirement toggles, and compliance scoring.
  role in system: consumed by assurance set command center, tables, state management, and approver readiness dial.
*/

export type AssuranceStage =
  | 'Initiated'
  | 'Validation'
  | 'Verification'
  | 'Inspection'
  | 'Approval'
  | 'Certified'
  | 'Approved'
  | 'Approved';

export type InitiatingRoleType =
  | 'Vessel Provider'
  | 'Client Admin'
  | 'C Admin · Client Created'
  | 'Vessel Provider Admin';

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
  stakeholders: any;
  assignedStakeholders: any;
  createdByPersona: string;
  id: string; // e.g. AS-2026-001
  title: string; // e.g. Chevron Gorgon Charter Vetting
  vesselId: string;
  vesselName: string;
  imoNumber: string;
  initiatorOrg: string;
  initiatorRole: InitiatingRoleType;
  charterer?: string; /* charterer organization or entity assigned to the campaign set */
  charterWindowStart: string; /* iso date */
  charterWindowEnd: string; /* iso date */
  stage: AssuranceStage;
  readinessScore: number; // 0 - 100%
  requirements: AssuranceRequirement[];
  verificationRequired?: boolean;
  mandatoryInspectionRequired: boolean;
  formalApprovalRequired?: boolean;
  inspectionCompleted: boolean;
  assignedSubmitter?: string;
  assignedVerifier?: string;
  assignedInspector?: string;
  assignedApprover?: string;
  approverDecision?: 'Approved' | 'Returned for Correction' | 'Rejected' | 'Pending';
  approverNotes?: string;
}
