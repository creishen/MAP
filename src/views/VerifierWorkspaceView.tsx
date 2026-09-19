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

/**
  what: renders verifier operational workspace view in light theme.
  how: lists documents requiring verifier sign-off and opens DocumentReviewDrawer on row click.
  with what file: src/views/VerifierWorkspaceView.tsx loaded by App.tsx.
*/
export const VerifierWorkspaceView: React.FC = () => {
  const { documents, activePersona } = useMapStore();
  const [selectedDoc, setSelectedDoc] = useState<MasterDocument | null>(null);

  const isCAdmin = activePersona === 'C Admin';

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
                      Open Split-Screen Review
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
                    <span className="badge bg-success text-white">Verified [OK]</span>
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
