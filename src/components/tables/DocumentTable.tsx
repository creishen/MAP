/* 
  file summary: Document Library data table component with grouped search box/filters on left and grouped export/upload buttons on right.
  responsibilities: presents certificate numbers, issuing authorities, ocr confidence scores, and action controls on opposite side of search.
  role in system: main data table for DocumentLibraryView.tsx.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { MasterDocument, ComplianceState } from '../../types/document';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { formatMaritimeDate } from '../../utils/formatters';
import { exportToCsv, exportToPdf } from '../../utils/exportHelpers';

interface DocumentTableProps {
  onSelectDocument: (doc: MasterDocument) => void;
  onOpenVersionHistory?: (doc: MasterDocument) => void;
  onUploadDocument?: () => void;
}

/**
  what: renders Document Library table with search filters and export/upload actions.
  how: filters documents array and triggers csv/pdf exports or opens upload modal on button clicks.
  with what file: src/components/tables/DocumentTable.tsx loaded by DocumentLibraryView.tsx.
*/
export const DocumentTable: React.FC<DocumentTableProps> = ({
  onSelectDocument,
  onOpenVersionHistory,
  onUploadDocument,
}) => {
  const { documents, activePersona } = useMapStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isExportOpen, setIsExportOpen] = useState(false);

  const canUpload = activePersona === 'Administrator' || activePersona === 'Submitter';

  const filteredDocs = documents.filter((d) => {
    const matchesSearch =
      d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.certificateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.issuingAuthority.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || d.entityType === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || d.complianceState === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getComplianceBadgeClass = (state: ComplianceState) => {
    switch (state) {
      case 'Valid': return 'bg-success text-white';
      case 'Expiring < 6 Mos': return 'bg-warning text-dark';
      case 'Mismatch/Exception': return 'bg-danger text-white';
      case 'Expired': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  };

  const handleExportCsv = () => {
    const exportData = filteredDocs.map((d) => ({
      DocumentTitle: d.title,
      EntityType: d.entityType,
      CertificateNo: d.certificateNo,
      IssuingAuthority: d.issuingAuthority,
      ExpiryDate: d.expiryDate,
      OcrConfidence: `${d.ocrConfidence}%`,
      ComplianceState: d.complianceState,
      CurrentVersion: d.currentVersion,
      VerificationStatus: d.verificationStatus,
    }));
    exportToCsv('Master_Document_Vault', exportData);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['Document Title', 'Type', 'Certificate No', 'Issuing Authority', 'Expiry Date', 'OCR Conf', 'State', 'Version'];
    const rows = filteredDocs.map((d) => [
      d.title,
      d.entityType,
      d.certificateNo,
      d.issuingAuthority,
      d.expiryDate,
      `${d.ocrConfidence}%`,
      d.complianceState,
      d.currentVersion,
    ]);
    exportToPdf('Document Library', headers, rows);
    setIsExportOpen(false);
  };

  return (
    <div className="card map-card-custom">
      {/* Table Header Controls Row: Grouped Search/Filter Left, Grouped Export/Upload Right */}
      <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
        {/* Group 1 (Left): Search Box & Filter Dropdowns */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <input
            type="text"
            className="form-control form-control-sm bg-white text-dark border-secondary"
            placeholder="Search Cert #, Title, Authority..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '260px' }}
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
            style={{ width: '160px' }}
          >
            <option value="ALL">All States</option>
            <option value="Valid">Valid</option>
            <option value="Expiring < 6 Mos">Expiring &lt; 6 Mos</option>
            <option value="Mismatch/Exception">Mismatch/Exception</option>
          </select>
        </div>

        {/* Group 2 (Right): Export & Upload Action Buttons on corner right of the row */}
        <div className="d-flex align-items-center gap-2 ms-auto">
          {/* Export Dropdown */}
          <div className="dropdown position-relative">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle"
              onClick={() => setIsExportOpen(!isExportOpen)}
            >
              Export Data
            </button>
            {isExportOpen && (
              <ul className="dropdown-menu dropdown-menu-light show position-absolute end-0 mt-1 shadow border">
                <li>
                  <button type="button" className="dropdown-item small" onClick={handleExportCsv}>
                    Export as CSV (.csv)
                  </button>
                </li>
                <li>
                  <button type="button" className="dropdown-item small" onClick={handleExportPdf}>
                    Export as PDF (.pdf)
                  </button>
                </li>
              </ul>
            )}
          </div>

          {/* Upload Document Action Button */}
          {canUpload && onUploadDocument && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onUploadDocument}
            >
              Upload Master Document
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table map-table-custom align-middle mb-0">
          <thead>
            <tr>
              <th>Document Title</th>
              <th>Type</th>
              <th>Certificate No</th>
              <th>Issuing Authority</th>
              <th>Expiry Date</th>
              <th>OCR Confidence</th>
              <th>Compliance State</th>
              <th>Version</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocs.map((doc) => (
              <tr
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                style={{ cursor: 'pointer' }}
              >
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
                  <span className={`badge ${getComplianceBadgeClass(doc.complianceState)}`}>
                    {doc.complianceState}
                  </span>
                </td>
                <td>
                  <span
                    className="badge bg-info text-dark font-mono-code"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenVersionHistory) onOpenVersionHistory(doc);
                    }}
                  >
                    {doc.currentVersion}
                  </span>
                </td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDocument(doc);
                    }}
                  >
                    Deep Dive
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
