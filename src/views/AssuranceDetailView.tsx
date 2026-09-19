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

interface AssuranceDetailViewProps {
  setId: string;
}

/**
  what: renders assurance set command center deep-dive view in light theme.
  how: displays pipeline stepper header, requirement register table, and opens DocumentReviewDrawer for verifiers.
  with what file: src/views/AssuranceDetailView.tsx loaded by App.tsx.
*/
export const AssuranceDetailView: React.FC<AssuranceDetailViewProps> = ({ setId }) => {
  const { assuranceSets, updateAssuranceStage, updateRequirementStatus, documents, activePersona, setCurrentHashView } = useMapStore();
  const [selectedDocForReview, setSelectedDocForReview] = useState<MasterDocument | null>(null);

  const assuranceSet = assuranceSets.find((s) => s.id === setId) || assuranceSets[0];

  if (!assuranceSet) return <div>Assurance Set not found.</div>;

  const isCAdmin = activePersona === 'C Admin';

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
              Set ID: AS-2026-001 | Initiator: Chevron Australia Pty Ltd
            </div>
            <div className="text-secondary small font-mono-code">
              Vessel: <strong className="text-dark">{assuranceSet.vesselName}</strong> (IMO {assuranceSet.imoNumber}) | Charter Window: {formatMaritimeDate(assuranceSet.charterWindowStart)} - {formatMaritimeDate(assuranceSet.charterWindowEnd)}
            </div>
            {(assuranceSet.assignedSubmitter || assuranceSet.assignedVerifier || assuranceSet.assignedInspector || assuranceSet.assignedApprover) && (
              <div className="d-flex flex-wrap align-items-center gap-3 mt-2 pt-2 border-top small text-slate-700">
                {assuranceSet.assignedSubmitter && (
                  <span><strong className="text-dark">Submitter:</strong> {assuranceSet.assignedSubmitter}</span>
                )}
                {assuranceSet.assignedVerifier && (
                  <span><strong className="text-dark">Verifier:</strong> {assuranceSet.assignedVerifier}</span>
                )}
                {assuranceSet.assignedInspector && (
                  <span><strong className="text-dark">Inspector:</strong> {assuranceSet.assignedInspector}</span>
                )}
                {assuranceSet.assignedApprover && (
                  <span><strong className="text-dark">Approver:</strong> {assuranceSet.assignedApprover}</span>
                )}
              </div>
            )}
          </div>
          <div className="d-flex align-items-center gap-4">
            <div>
              <div className="text-secondary small text-uppercase font-weight-bold mb-1">Assurance Readiness Index</div>
              <ReadinessGauge score={assuranceSet.readinessScore} size="md" />
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
                      {linkedDoc && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => setSelectedDocForReview(linkedDoc)}
                        >
                          Review Evidence
                        </button>
                      )}
                      {!isCAdmin && !isVerified && (
                        <button
                          type="button"
                          className="btn btn-sm btn-success text-white me-1"
                          onClick={() => updateRequirementStatus(assuranceSet.id, req.id, 'Verified')}
                        >
                          Verify & Fulfill
                        </button>
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
    </div>
  );
};
