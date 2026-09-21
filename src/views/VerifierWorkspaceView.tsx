/* 
  file summary: verifier workspace page displaying sortable and filterable queue of pending statutory evidence and split-screen review drawer in light theme.
  responsibilities: presents pending verification queue with search, entity type/status filters, column sorting, and launches DocumentReviewDrawer split-screen pdf viewer.
  role in system: primary operational workspace for Verifiers (/verifier).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { DocumentReviewDrawer } from '../components/drawers/DocumentReviewDrawer';
import { MasterDocument } from '../types/document';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { formatMaritimeDate } from '../utils/formatters';

import { isAssuranceSetAssignedToPersona, filterDocumentsForVerifierQueue } from '../utils/rbacHelpers';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';

type SortField = 'title' | 'entityType' | 'certificateNo' | 'issuingAuthority' | 'expiryDate' | 'ocrConfidence' | 'verificationStatus';

/**
  what: renders verifier operational workspace view in light theme with sortable, filterable table and export capabilities.
  how: lists assigned assurance sets and pending documents with search, filtering by type/status, column sorting, and export options.
  with what file: src/views/VerifierWorkspaceView.tsx loaded by App.tsx.
*/
export const VerifierWorkspaceView: React.FC = () => {
  const { documents, assuranceSets, activePersona, setCurrentHashView } = useMapStore();
  const [selectedDoc, setSelectedDoc] = useState<MasterDocument | null>(null);
  const [isPendingExportOpen, setIsPendingExportOpen] = useState(false);
  const [isVerifiedExportOpen, setIsVerifiedExportOpen] = useState(false);

  /* Search, Filter & Sort State for Verification Queue */
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const assignedSets = assuranceSets.filter((s) => isAssuranceSetAssignedToPersona(s, activePersona));
  const scopedDocs = filterDocumentsForVerifierQueue(documents, assuranceSets, activePersona);
  const pendingDocs = scopedDocs.filter((d) => d.verificationStatus === 'Pending' || d.verificationStatus === 'Correction Requested');
  const verifiedDocs = scopedDocs.filter((d) => d.verificationStatus === 'Verified');

  /* Filtering Logic */
  const filteredPendingDocs = pendingDocs.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.certificateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || d.entityType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || d.verificationStatus === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  /* Sorting Logic */
  const sortedPendingDocs = [...filteredPendingDocs].sort((a, b) => {
    let valA: any = a[sortField] ?? '';
    let valB: any = b[sortField] ?? '';

    if (sortField === 'ocrConfidence') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB as string).toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortHeader = (label: string, field: SortField) => (
    <th
      className="cursor-pointer user-select-none"
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer' }}
    >
      <div className="d-flex align-items-center justify-between gap-1">
        <span>{label}</span>
        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
          {sortField === field ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </div>
    </th>
  );

  const handleExportPendingCsv = () => {
    const exportData = sortedPendingDocs.map((d) => ({
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
    const rows = sortedPendingDocs.map((d) => [
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

      {/* Pending Items Queue Table */}
      <div className="card map-card-custom">
        {/* Table Header Controls: Search & Filters Left, Export Button Right */}
        <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            <input
              type="text"
              className="form-control form-control-sm bg-white text-dark border-secondary"
              placeholder="Search Title, Cert #, Authority..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '240px' }}
            />
            <select
              className="form-select form-select-sm bg-white text-dark border-secondary"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="ALL">All Entity Types</option>
              <option value="Vessel Certificate">Vessel Certificate</option>
              <option value="Crew Certificate">Crew Certificate</option>
            </select>
            <select
              className="form-select form-select-sm bg-white text-dark border-secondary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '170px' }}
            >
              <option value="ALL">All Queue Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Correction Requested">Correction Requested</option>
            </select>
          </div>

          <div className="dropdown position-relative ms-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle ms-2"
              onClick={() => setIsPendingExportOpen(!isPendingExportOpen)}
            >
              Export Data
            </button>
            {isPendingExportOpen && (
              <ul className="dropdown-menu dropdown-menu-light show position-absolute end-0 mt-1 shadow border" style={{ zIndex: 1050 }}>
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
                {renderSortHeader('Certificate Title', 'title')}
                {renderSortHeader('Type', 'entityType')}
                {renderSortHeader('Certificate No', 'certificateNo')}
                {renderSortHeader('Issuing Authority', 'issuingAuthority')}
                {renderSortHeader('Expiry Date', 'expiryDate')}
                {renderSortHeader('OCR Confidence', 'ocrConfidence')}
                {renderSortHeader('Status', 'verificationStatus')}
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPendingDocs.map((doc) => (
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
                      className="btn btn-sm btn-primary ms-2"
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

              {sortedPendingDocs.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4 fst-italic">
                    No pending items match the selected search terms or filters.
                  </td>
                </tr>
              )}
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
              className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle ms-2"
              onClick={() => setIsVerifiedExportOpen(!isVerifiedExportOpen)}
            >
              Export Data
            </button>
            {isVerifiedExportOpen && (
              <ul className="dropdown-menu dropdown-menu-light show position-absolute end-0 mt-1 shadow border" style={{ zIndex: 1050 }}>
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
