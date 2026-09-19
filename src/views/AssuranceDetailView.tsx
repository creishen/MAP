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
  const { assuranceSets, updateRequirementStatus, documents, activePersona, setCurrentHashView, setApproverDecision } = useMapStore();
  const [selectedDocForReview, setSelectedDocForReview] = useState<MasterDocument | null>(null);
  const [selectedDocForVersionHistory, setSelectedDocForVersionHistory] = useState<MasterDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [approverNotes, setApproverNotes] = useState('');

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
        {/* Campaign Header Title */}
        <div className="mb-3">
          <span className="badge bg-primary mb-2">{assuranceSet.initiatorRole}</span>
          <h3 className="fw-bold mb-0 text-primary">{assuranceSet.title}</h3>
        </div>

        <div className="row g-4 align-items-stretch">
          {/* Column 1: Campaign Particulars */}
          <div className="col-lg-4 col-md-6">
            <div className="p-3 bg-light border rounded-3 h-100 font-mono-code small d-flex flex-column gap-2.5">
              <div className="text-uppercase fw-bold text-secondary mb-1" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                Campaign Particulars
              </div>
              <div className="border-bottom pb-1.5">
                <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Set ID:</div>
                <div className="fw-bold text-dark">{assuranceSet.id}</div>
              </div>
              <div className="border-bottom pb-1.5">
                <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Initiator:</div>
                <div className="fw-bold text-dark">{assuranceSet.initiatorOrg}</div>
              </div>
              <div className="border-bottom pb-1.5">
                <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Vessel:</div>
                <div className="fw-bold text-dark">{assuranceSet.vesselName} (IMO {assuranceSet.imoNumber})</div>
              </div>
              <div>
                <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Charter Window:</div>
                <div className="fw-bold text-dark">{formatMaritimeDate(assuranceSet.charterWindowStart)} - {formatMaritimeDate(assuranceSet.charterWindowEnd)}</div>
              </div>
            </div>
          </div>

          {/* Column 2: Stakeholder Role Assignments */}
          <div className="col-lg-4 col-md-6">
            <div className="p-3 bg-light border rounded-3 h-100 font-mono-code small d-flex flex-column gap-2.5">
              <div className="text-uppercase fw-bold text-secondary mb-1" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                Stakeholder Role Assignments
              </div>
              <div className="border-bottom pb-1.5">
                <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Submitter:</div>
                <div className="fw-bold text-dark">{assuranceSet.assignedSubmitter || 'M. Chen (Pacific Ocean Logistics Operations)'}</div>
              </div>
              <div className="border-bottom pb-1.5">
                <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Verifier:</div>
                <div className="fw-bold text-dark">{assuranceSet.assignedVerifier || 'A. Fontaine (DNV Compliance Services)'}</div>
              </div>
              <div className="border-bottom pb-1.5">
                <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Inspector:</div>
                <div className="fw-bold text-dark">
                  {assuranceSet.mandatoryInspectionRequired
                    ? (assuranceSet.assignedInspector || 'N. Technical (AMSA Marine Audit Division)')
                    : 'N/A (Not Required)'}
                </div>
              </div>
              <div>
                <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Approver:</div>
                <div className="fw-bold text-dark">{assuranceSet.assignedApprover || 'P. Nardelli (Chevron Australia Pty Ltd)'}</div>
              </div>
            </div>
          </div>

          {/* Column 3: Assurance Campaign Stage Pipeline & Assurance Readiness Index */}
          <div className="col-lg-4 col-md-12 d-flex flex-column gap-3">
            {/* Vertical Assurance Campaign Stage Pipeline */}
            <div className="p-3 bg-light border rounded-3 flex-grow-1">
              <div className="text-uppercase font-mono-code fw-bold text-secondary mb-2.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                Assurance Campaign Stage Pipeline
              </div>
              <PipelineStepper currentStage={assuranceSet.stage} orientation="vertical" />
            </div>

            {/* Assurance Readiness Index */}
            <div className="p-3 bg-light border rounded-3">
              <div className="text-secondary small text-uppercase font-mono-code fw-bold mb-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                Assurance Readiness Index
              </div>
              <div className="d-flex align-items-center justify-content-center p-2 bg-white border rounded-2">
                <ReadinessGauge score={assuranceSet.readinessScore} size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Executive Approver Decision Card */}
      {(activePersona === 'Approver' || activePersona === 'Administrator') && (
        <div className="card map-card-custom p-4 border border-primary-subtle">
          <div className="d-flex align-items-center justify-between mb-3">
            <h5 className="fw-bold m-0 text-slate-900">Executive Approver Sign-Off & Certification</h5>
            <span className={`badge ${assuranceSet.stage === 'Certified' ? 'bg-success text-white' : isSetFullyFulfilled ? 'bg-primary text-white' : 'bg-warning text-dark'}`}>
              {assuranceSet.stage === 'Certified' ? 'Certified & Approved' : isSetFullyFulfilled ? 'Pending Approver Sign-Off' : 'Verification In Progress'}
            </span>
          </div>

          {isSetFullyFulfilled ? (
            <div className="p-3 bg-light border border-success-subtle rounded mb-3">
              <div className="fw-semibold text-success mb-1" style={{ fontSize: '0.875rem' }}>
                All Statutory Documents Verified (100% Fulfillment)
              </div>
              <div className="text-secondary small">
                The Verifier has verified all statutory requirements for this campaign. As the Approver, you can now execute final charter certification.
              </div>
            </div>
          ) : (
            <div className="p-3 bg-light border border-warning-subtle rounded mb-3">
              <div className="fw-semibold text-warning-emphasis mb-1" style={{ fontSize: '0.875rem' }}>
                Verification In Progress ({verifiedCount}/{totalCount} Verified)
              </div>
              <div className="text-secondary small">
                Waiting for the Verifier to verify all statutory requirements before final executive approval sign-off.
              </div>
            </div>
          )}

          <div className="mb-3">
            <label className="form-label text-secondary small fw-semibold" htmlFor="set-approver-notes">
              Approver Notes / Justification:
            </label>
            <textarea
              id="set-approver-notes"
              className="form-control form-control-sm bg-white border-secondary"
              rows={2}
              placeholder="Enter approval justification notes..."
              value={approverNotes}
              onChange={(e) => setApproverNotes(e.target.value)}
            />
          </div>

          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-success text-white px-4 py-2 fw-bold shadow-sm"
              onClick={() => {
                setApproverDecision(assuranceSet.id, 'Approved', approverNotes || 'Approved & Certified by Executive Approver.');
                setApproverNotes('');
              }}
              disabled={!isSetFullyFulfilled}
            >
              Approve & Certify Assurance Set
            </button>
            <button
              type="button"
              className="btn btn-sm btn-warning text-dark px-3 py-2 fw-bold shadow-sm"
              onClick={() => {
                setApproverDecision(assuranceSet.id, 'Returned for Correction', approverNotes || 'Returned to verifier for correction.');
                setApproverNotes('');
              }}
            >
              Return for Correction
            </button>
            <button
              type="button"
              className="btn btn-sm btn-danger text-white px-3 py-2 fw-bold shadow-sm"
              onClick={() => {
                setApproverDecision(assuranceSet.id, 'Rejected', approverNotes || 'Assurance set rejected.');
                setApproverNotes('');
              }}
            >
              Reject Campaign
            </button>
          </div>
        </div>
      )}

      {/* Requirements Register Table */}
      <div className="card map-card-custom">
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
