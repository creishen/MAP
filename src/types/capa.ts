/* 
  file summary: type definitions for corrective and preventive action (capa) items and evidence attachments.
  responsibilities: defines interfaces for capa items, re-inspection statuses, and photo/document evidence files.
  role in system: consumed by zustand store, capa management view, checklist view, and inspector drawers.
*/

export type CapaStatus = 'Open' | 'Under Re-Inspection' | 'Verified & Closed' | 'Rectification Required';

export interface CapaEvidenceItem {
  id: string;
  title: string;
  type: 'Photo' | 'Document';
  fileName?: string;
  fileSize?: string;
  previewUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface CapaItem {
  id: string;
  vesselName: string;
  vesselId?: string;
  checklistId?: string;
  checklistItemTitle: string;
  title: string;
  findingDescription: string;
  owner: string;
  dueDate: string;
  status: CapaStatus;
  inspectorNotes?: string;
  evidences: CapaEvidenceItem[];
  createdDate: string;
  lastInspectedDate?: string;
}
