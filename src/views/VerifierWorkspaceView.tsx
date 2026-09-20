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
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';

/**
  what: renders verifier operational workspace view in light theme with table export capabilities.
  how: lists assigned assurance sets and documents requiring verifier sign-off with export options for pending/verified queues.
  with what file: src/views/VerifierWorkspaceView.tsx loaded by App.tsx.
*/
export const VerifierWorkspaceView: React.FC = () => {
  const { documents, assuranceSets, activePersona, setCurrentHashView } = useMapStore();
  const [selectedDoc, setSelectedDoc] = useState<MasterDocument | null>(null);
  const [isPendingExportOpen, setIsPendingExportOpen] = useState(false);
  const [isVerifiedExportOpen, setIsVerifiedExportOpen] = useState(false);

  const isCAdmin = activePersona === 'C Admin';

  const assignedSets = assuranceSets.filter((s) => isAssuranceSetAssignedToPersona(s, activePersona));
  const pendingDocs = documents.filter((d) => d.verificationStatus === 'Pending' || d.verificationStatus === 'Correction Requested');
  const verifiedDocs = documents.filter((d) => d.verificationStatus === 'Verified');

  const handleExportPendingCsv = () => {
    const exportData = pendingDocs.map((d) => ({
      Title: d.title,
      EntityType: d.entityType,
      CertificateNo: d.certificateNo,
      IssuingAuthority: d.issuingAuthority,
      ExpiryDate: d.expiryDate,
      OcrConfidence: `${d.ocrConfidence}%`,
      Status: d.verificationStatus,
    }));
    exportToCsv('Pending_Verification_Queue', exportData);
    setIsPendingExportOpen(false);
  };

  const handleExportPendingPdf = () => {
    const headers = ['Title', 'Type', 'Cert No', 'Authority', 'Expiry Date', 'OCR Conf', 'Status'];
    const rows = pendingDocs.map((d) => [
      d.title,
      d.entityType,
      d.certificateNo,
      d.issuingAuthority,
      d.expiryDate,
      `${d.ocrConfidence}%`,
      d.verificationStatus,
    ]);
    exportToPdf('Pending Verification Queue', headers, rows);
    setIsPendingExportOpen(false);
  };

  const handleExportVerifiedCsv = () => {
    const exportData = verifiedDocs.map((d) => ({
      Title: d.title,
      CertificateNo: d.certificateNo,
      IssuingAuthority: d.issuingAuthority,
      Notes: d.verificationNotes || 'Verified',
      Status: 'Verified',
    }));
    exportToCsv('Verified_Documents_Log', exportData);
    setIsVerifiedExportOpen(false);
  };

  const handleExportVerifiedPdf = () => {
    const headers = ['Title', 'Cert No', 'Issuing Authority', 'Notes', 'Status'];
    const rows = verifiedDocs.map((d) => [
      d.title,
      d.certificateNo,
      d.issuingAuthority,
      d.verificationNotes || 'Verified',
      'Verified',
    ]);
    exportToPdf('Recently Verified Documents', headers, rows);
    setIsVerifiedExportOpen(false);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Assurance Sets Overview Cards */}
      <div className="row g-3">
        {assignedSets.map((set) => (
          <div key={set.id} className="col-lg-4 col-md-6">
            <div className="p-4 border rounded-3 bg-white shadow-sm h-100 d-flex flex-column justify-between position-relative">
              <div>
                <span
                  className="badge bg-light text-dark border font-mono-code position-absolute top-0 end-0 mt-3.5 me-3.5"
                  style={{ fontSize: '0.725rem' }}
                >
                  {set.stage}
                </span>
                <div className="font-mono-code fw-bold text-primary small mb-2">{set.id}</div>
                <h6 className="fw-bold text-dark mb-2 pe-5" style={{ fontSize: '1rem', lineHeight: '1.3' }}>
                  {set.title}
                </h6>
                <div className="text-secondary small font-mono-code">Vessel: {set.vesselName}</div>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline-primary w-100 mt-4 py-2 fw-semibold"
                onClick={() => setCurrentHashView('assurance-sets', set.id)}
              >
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* Pending Items Queue */}
      <div className="card map-card-custom">
        <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
          <div className="fw-bold text-dark">
            Pending Verification Queue ({pendingDocs.length} Items)
          </div>
          <div className="dropdown position-relative ms-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle"
              onClick={() => setIsPendingExportOpen(!isPendingExportOpen)}
            >
              Export Data
            </button>
            {isPendingExportOpen && (
              <ul className="dropdown-menu dropdown-menu-light show position-absolute end-0 mt-1 shadow border">
                <li>
                  <button type="button" className="dropdown-item small" onClick={handleExportPendingCsv}>
                    Export as CSV (.csv)
                  </button>
                </li>
                <li>
                  <button type="button" className="dropdown-item small" onClick={handleExportPendingPdf}>
                    Export as PDF (.pdf)
                  </button>
                </li>
              </ul>
            )}
          </div>
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
        <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
          <div className="fw-bold text-dark">
            Recently Verified Documents ({verifiedDocs.length})
          </div>
          <div className="dropdown position-relative ms-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle"
              onClick={() => setIsVerifiedExportOpen(!isVerifiedExportOpen)}
            >
              Export Data
            </button>
            {isVerifiedExportOpen && (
              <ul className="dropdown-menu dropdown-menu-light show position-absolute end-0 mt-1 shadow border">
                <li>
                  <button type="button" className="dropdown-item small" onClick={handleExportVerifiedCsv}>
                    Export as CSV (.csv)
                  </button>
                </li>
                <li>
                  <button type="button" className="dropdown-item small" onClick={handleExportVerifiedPdf}>
                    Export as PDF (.pdf)
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>
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
