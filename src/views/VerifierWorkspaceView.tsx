/* 
  file summary: verifier workspace page displaying queue of pending statutory evidence and split-screen review drawer in light theme.
  responsibilities: presents pending verification queue and launches DocumentReviewDrawer split-screen pdf viewer.
  role in system: primary operational workspace for Verifiers (/verifier).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { DocumentReviewDrawer } from '../components/drawers/DocumentReviewDrawer';
import { MasterDocument } from '../types/document';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { formatMaritimeDate } from '../utils/formatters';

import { isAssuranceSetAssignedToPersona } from '../utils/rbacHelpers';

/**
  what: renders verifier operational workspace view in light theme.
  how: lists assigned assurance sets and documents requiring verifier sign-off and opens DocumentReviewDrawer on row click.
  with what file: src/views/VerifierWorkspaceView.tsx loaded by App.tsx.
*/
export const VerifierWorkspaceView: React.FC = () => {
  const { documents, assuranceSets, activePersona, setCurrentHashView } = useMapStore();
  const [selectedDoc, setSelectedDoc] = useState<MasterDocument | null>(null);

  const isCAdmin = activePersona === 'C Admin';

  const assignedSets = assuranceSets.filter((s) => isAssuranceSetAssignedToPersona(s, activePersona));
  const pendingDocs = documents.filter((d) => d.verificationStatus === 'Pending' || d.verificationStatus === 'Correction Requested');
  const verifiedDocs = documents.filter((d) => d.verificationStatus === 'Verified');

  return (
    <div className="d-flex flex-column gap-4">
      {/* Prominent C Admin Read-Only Rule Restriction Banner */}
      {isCAdmin && (
        <div className="map-cadmin-readonly-banner">
          <div>
            <strong>Client Admin (C Admin) View Mode:</strong> Reviewing verification queue in read-only mode.
          </div>
        </div>
      )}

      {/* Assurance Sets Stakeholder Role Assignments Overview */}
      <div className="card map-card-custom p-4">
        <div className="d-flex align-items-center justify-between mb-3">
          <div>
            <h5 className="fw-bold m-0 text-primary">Assigned Assurance Sets & Stakeholder Teams</h5>
            <div className="text-secondary small">Overview of assigned stakeholder roles across active campaigns</div>
          </div>
          <span className="badge bg-light text-dark border font-mono-code">{assignedSets.length} Campaigns Assigned</span>
        </div>

        <div className="row g-3">
          {assignedSets.map((set) => (
            <div key={set.id} className="col-lg-4 col-md-6">
              <div className="p-3 border rounded bg-white shadow-2xs h-100 d-flex flex-column justify-between">
                <div>
                  <div className="d-flex align-items-center justify-between mb-2">
                    <span className="font-mono-code fw-bold text-primary small">{set.id}</span>
                    <span className="badge bg-light text-dark border" style={{ fontSize: '0.7rem' }}>{set.stage}</span>
                  </div>
                  <h6 className="fw-bold text-dark mb-1">{set.title}</h6>
                  <div className="text-secondary small font-mono-code mb-3">Vessel: {set.vesselName}</div>

                  <div className="d-flex flex-column gap-1.5 small border-top pt-2">
                    <div className="d-flex justify-between">
                      <span className="text-secondary">Submitter:</span>
                      <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '180px' }}>{set.assignedSubmitter || 'Unassigned'}</span>
                    </div>
                    <div className="d-flex justify-between">
                      <span className="text-secondary">Verifier:</span>
                      <span className="fw-semibold text-primary text-truncate" style={{ maxWidth: '180px' }}>{set.assignedVerifier || 'Unassigned'}</span>
                    </div>
                    <div className="d-flex justify-between">
                      <span className="text-secondary">Inspector:</span>
                      <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '180px' }}>
                        {set.mandatoryInspectionRequired ? (set.assignedInspector || 'Unassigned') : 'N/A'}
                      </span>
                    </div>
                    <div className="d-flex justify-between">
                      <span className="text-secondary">Approver:</span>
                      <span className="fw-semibold text-dark text-truncate" style={{ maxWidth: '180px' }}>{set.assignedApprover || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary w-100 mt-3"
                  onClick={() => setCurrentHashView('assurance-sets', set.id)}
                >
                  View Command Center
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Items Queue */}
      <div className="card map-card-custom">
        <div className="card-header d-flex align-items-center justify-between">
          <span>Pending Verification Queue ({pendingDocs.length} Items)</span>
          <span className="badge bg-warning text-dark font-mono-code">Action Required</span>
        </div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Certificate Title</th>
                <th>Type</th>
                <th>Certificate No</th>
                <th>Issuing Authority</th>
                <th>Expiry Date</th>
                <th>OCR Confidence</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingDocs.map((doc) => (
                <tr key={doc.id} onClick={() => setSelectedDoc(doc)} style={{ cursor: 'pointer' }}>
                  <td className="fw-semibold text-primary">{doc.title}</td>
                  <td>
                    <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                      {doc.entityType}
                    </span>
                  </td>
                  <td className="font-mono-code">{doc.certificateNo}</td>
                  <td>{doc.issuingAuthority}</td>
                  <td className="font-mono-code small">{formatMaritimeDate(doc.expiryDate)}</td>
                  <td>
                    <ConfidenceBadge score={doc.ocrConfidence} />
                  </td>
                  <td>
                    <span className="badge bg-warning text-dark">{doc.verificationStatus}</span>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(doc);
                      }}
                    >
                      Review Document
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verified Items Log */}
      <div className="card map-card-custom">
        <div className="card-header">Recently Verified Documents ({verifiedDocs.length})</div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Certificate Title</th>
                <th>Certificate No</th>
                <th>Issuing Authority</th>
                <th>Verification Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {verifiedDocs.map((doc) => (
                <tr key={doc.id}>
                  <td className="fw-semibold text-dark">{doc.title}</td>
                  <td className="font-mono-code">{doc.certificateNo}</td>
                  <td>{doc.issuingAuthority}</td>
                  <td className="small text-secondary">{doc.verificationNotes || 'Verified'}</td>
                  <td>
                    <span className="badge bg-success text-white">Verified</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Split-Screen Review Drawer */}
      <DocumentReviewDrawer document={selectedDoc} onClose={() => setSelectedDoc(null)} />
    </div>
  );
};
