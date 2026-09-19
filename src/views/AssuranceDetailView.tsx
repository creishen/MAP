/* 
  file summary: assurance set command center deep-dive view presenting stage pipeline stepper and requirements register in light theme.
  responsibilities: manages requirement verification statuses, displays pipeline stage progress, and enforces C Admin read-only rules.
  role in system: deep-dive view rendered when an assurance set row is selected.
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { PipelineStepper } from '../components/common/PipelineStepper';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { DocumentReviewDrawer } from '../components/drawers/DocumentReviewDrawer';
import { formatMaritimeDate } from '../utils/formatters';
import { MasterDocument } from '../types/document';

import { VersionHistoryDrawer } from '../components/drawers/VersionHistoryDrawer';
import { DocumentUploadModal } from '../components/drawers/DocumentUploadModal';

interface AssuranceDetailViewProps {
  setId: string;
}

/**
  what: renders assurance set command center deep-dive view in light theme.
  how: displays pipeline stepper header, requirement register table, and opens DocumentReviewDrawer, VersionHistoryDrawer, or DocumentUploadModal based on persona RBAC.
  with what file: src/views/AssuranceDetailView.tsx loaded by App.tsx.
*/
export const AssuranceDetailView: React.FC<AssuranceDetailViewProps> = ({ setId }) => {
  const { assuranceSets, updateRequirementStatus, documents, activePersona, setCurrentHashView } = useMapStore();
  const [selectedDocForReview, setSelectedDocForReview] = useState<MasterDocument | null>(null);
  const [selectedDocForVersionHistory, setSelectedDocForVersionHistory] = useState<MasterDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const assuranceSet = assuranceSets.find((s) => s.id === setId) || assuranceSets[0];

  if (!assuranceSet) return <div>Assurance Set not found.</div>;

  const isCAdmin = activePersona === 'C Admin';
  const canUpload = activePersona === 'Submitter' || activePersona === 'Administrator';
  const canVerify = activePersona === 'Verifier' || activePersona === 'Administrator';

  /* requirement is fulfilled ONLY if verifier status is 'Verified' */
  const verifiedCount = assuranceSet.requirements.filter((r) => r.verifierStatus === 'Verified').length;
  const totalCount = assuranceSet.requirements.length;
  const isSetFullyFulfilled = totalCount > 0 && verifiedCount === totalCount;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Header */}
      <div className="d-flex align-items-center justify-between">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setCurrentHashView('assurance-sets')}
        >
          ← Back to Assurance Sets
        </button>
      </div>

      {/* Prominent C Admin Read-Only Rule Restriction Banner */}
      {isCAdmin && (
        <div className="map-cadmin-readonly-banner">
          <div>
            <strong>Client Admin (C Admin) View Mode:</strong> Document editing, uploading, deletion, and stage progression controls are restricted on Vessel Provider files.
          </div>
          <span className="badge bg-primary text-white font-mono-code">Read-Only</span>
        </div>
      )}

      {/* Campaign Summary & Readiness Dial Card */}
      <div className="card map-card-custom p-4">
        <div className="d-flex flex-wrap align-items-center justify-between gap-3">
          <div>
            <span className="badge bg-primary mb-2">{assuranceSet.initiatorRole}</span>
            <h3 className="fw-bold mb-1 text-primary">{assuranceSet.title}</h3>
            <div className="text-secondary small font-mono-code mb-2">
              Set ID: {assuranceSet.id} | Initiator: {assuranceSet.initiatorOrg}
            </div>
            <div className="text-secondary small font-mono-code mb-3">
              Vessel: <strong className="text-dark">{assuranceSet.vesselName}</strong> (IMO {assuranceSet.imoNumber}) | Charter Window: {formatMaritimeDate(assuranceSet.charterWindowStart)} - {formatMaritimeDate(assuranceSet.charterWindowEnd)}
            </div>
          </div>
          <div className="d-flex align-items-center gap-4">
            <div>
              <div className="text-secondary small text-uppercase font-weight-bold mb-1">Assurance Readiness Index</div>
              <ReadinessGauge score={assuranceSet.readinessScore} size="md" />
            </div>
          </div>
        </div>

        {/* Stakeholder Role Assignments Grid */}
        <div className="mt-3 pt-3 border-top">
          <div className="text-uppercase font-mono-code fw-bold text-secondary mb-2" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
            Stakeholder Role Assignments
          </div>
          <div className="row g-3">
            <div className="col-md-3 col-6">
              <div className="p-3 rounded-3 bg-light border">
                <div className="small text-secondary fw-semibold mb-1" style={{ fontSize: '0.725rem' }}>Submitter</div>
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>
                  {assuranceSet.assignedSubmitter || 'Unassigned'}
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-3 rounded-3 bg-light border">
                <div className="small text-secondary fw-semibold mb-1" style={{ fontSize: '0.725rem' }}>Verifier</div>
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>
                  {assuranceSet.assignedVerifier || 'Unassigned'}
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-3 rounded-3 bg-light border">
                <div className="small text-secondary fw-semibold mb-1" style={{ fontSize: '0.725rem' }}>Inspector</div>
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>
                  {assuranceSet.mandatoryInspectionRequired
                    ? (assuranceSet.assignedInspector || 'Unassigned')
                    : 'N/A (Not Required)'}
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="p-3 rounded-3 bg-light border">
                <div className="small text-secondary fw-semibold mb-1" style={{ fontSize: '0.725rem' }}>Approver</div>
                <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>
                  {assuranceSet.assignedApprover || 'Unassigned'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Requirements Register Table */}
      <div className="card map-card-custom">
        <div className="card-header d-flex align-items-center justify-between">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold">Requirements Register</span>
            <span className={`badge ${isSetFullyFulfilled ? 'bg-success text-white' : 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'}`}>
              {verifiedCount}/{totalCount} Fulfilled {isSetFullyFulfilled ? '(All Verified)' : '(Pending Verification)'}
            </span>
          </div>
          <span className="badge bg-light text-dark border font-mono-code">
            Fulfillment Requires 'Verified' Status
          </span>
        </div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Category</th>
                <th>Requirement Title</th>
                <th>Mandatory</th>
                <th>OCR Confidence</th>
                <th>Verifier Status</th>
                <th>Fulfillment</th>
                <th>Notes / Feedback</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assuranceSet.requirements.map((req) => {
                const linkedDoc = documents.find((d) => d.id === req.documentId);
                const isVerified = req.verifierStatus === 'Verified';

                return (
                  <tr key={req.id}>
                    <td>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        {req.category}
                      </span>
                    </td>
                    <td className="fw-semibold text-dark">{req.title}</td>
                    <td>
                      <span className={`badge ${req.isMandatory ? 'bg-danger text-white' : 'bg-secondary text-white'}`}>
                        {req.isMandatory ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>
                      <ConfidenceBadge score={req.ocrConfidence} />
                    </td>
                    <td>
                      <span
                        className={`badge ${isVerified
                          ? 'bg-success text-white'
                          : req.verifierStatus === 'Correction Requested'
                            ? 'bg-warning text-dark'
                            : req.verifierStatus === 'Rejected'
                              ? 'bg-danger text-white'
                              : 'bg-light text-dark border'
                          }`}
                      >
                        {req.verifierStatus}
                      </span>
                    </td>
                    <td>
                      {isVerified ? (
                        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle font-mono-code" style={{ fontSize: '0.725rem' }}>
                          Fulfilled
                        </span>
                      ) : (
                        <span className="badge bg-light text-secondary border font-mono-code" style={{ fontSize: '0.725rem' }}>
                          Unfulfilled
                        </span>
                      )}
                    </td>
                    <td className="small text-secondary">{req.notes || '-'}</td>
                    <td className="text-end">
                      {linkedDoc ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedDocForReview(linkedDoc)}
                        >
                          Review Document
                        </button>
                      ) : canUpload ? (
                        <button
                          type="button"
                          className="btn btn-sm btn-primary text-white"
                          onClick={() => setIsUploadModalOpen(true)}
                        >
                          Upload Document
                        </button>
                      ) : (
                        <span className="text-secondary small font-mono-code">No Document</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Review Drawer */}
      <DocumentReviewDrawer
        document={selectedDocForReview}
        onClose={() => setSelectedDocForReview(null)}
      />

      {/* Version History Drawer for Submitter / Admin Reupload */}
      <VersionHistoryDrawer
        document={selectedDocForVersionHistory}
        onClose={() => setSelectedDocForVersionHistory(null)}
      />

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />
    </div>
  );
};
