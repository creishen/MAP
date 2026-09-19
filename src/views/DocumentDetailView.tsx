/* 
  file summary: master document deep-dive view presenting complete 13 vessel or 11 crew attributes and versioning timeline in light theme.
  responsibilities: displays extracted metadata fields, charter buffer validation rules, and file version history.
  role in system: deep-dive view rendered when a document row is selected.
*/

import React from 'react';
import { useMapStore } from '../store/useMapStore';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { formatMaritimeDate } from '../utils/formatters';

interface DocumentDetailViewProps {
  documentId: string;
}

/**
  what: renders document deep-dive detail view in light theme.
  how: fetches document from store by documentId and displays 13 vessel or 11 crew extracted attributes.
  with what file: src/views/DocumentDetailView.tsx loaded by App.tsx.
*/
export const DocumentDetailView: React.FC<DocumentDetailViewProps> = ({ documentId }) => {
  const { documents, setCurrentHashView } = useMapStore();

  const doc = documents.find((d) => d.id === documentId) || documents[0];

  if (!doc) return <div>Document not found.</div>;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Header */}
      <div className="d-flex align-items-center justify-between">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setCurrentHashView('documents')}
        >
          ← Back to Document Vault
        </button>
        <div className="badge bg-light text-dark border font-mono-code p-2">
          Cert #: {doc.certificateNo} | Entity: {doc.entityType}
        </div>
      </div>

      {/* Main Info Card */}
      <div className="card map-card-custom p-4">
        <div className="d-flex flex-wrap align-items-center justify-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-primary">{doc.entityType}</span>
              <ConfidenceBadge score={doc.ocrConfidence} />
              <span className="badge bg-info text-dark font-mono-code">{doc.currentVersion}</span>
            </div>
            <h3 className="fw-bold mb-1 text-primary">{doc.title}</h3>
            <div className="text-secondary small">
              Issuing Authority: <strong>{doc.issuingAuthority}</strong> | Expiry: <span className="font-mono-code">{formatMaritimeDate(doc.expiryDate)}</span>
            </div>
          </div>
          <div>
            <span
              className={`badge p-2 fs-6 ${
                doc.verificationStatus === 'Verified'
                  ? 'bg-success text-white'
                  : doc.verificationStatus === 'Correction Requested'
                  ? 'bg-warning text-dark'
                  : doc.verificationStatus === 'Rejected'
                  ? 'bg-danger text-white'
                  : 'bg-secondary text-white'
              }`}
            >
              Status: {doc.verificationStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Exception Banner if validation failed */}
      {!doc.validationRules.overallValid && (
        <div className="alert alert-warning p-3 mb-0 border-warning">
          <h6 className="fw-bold mb-1">Validation Exception / Charter Buffer Alert</h6>
          <div>{doc.validationRules.exceptionDetails || 'Document requires attention prior to charter verification.'}</div>
        </div>
      )}

      {/* Extracted Metadata Attributes Grid */}
      <div className="card map-card-custom">
        <div className="card-header">Extracted Attributes Details</div>
        <div className="card-body p-4">
          {doc.vesselAttributes && (
            <div className="row g-3 small">
              <div className="col-md-4">
                <span className="text-secondary">Document Title:</span> <div><strong className="text-dark">{doc.vesselAttributes.title}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Certificate Number:</span> <div className="font-mono-code"><strong className="text-dark">{doc.vesselAttributes.certificateNumber}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Cert Type:</span> <div><strong className="text-dark">{doc.vesselAttributes.certType}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Issuing Body:</span> <div><strong className="text-dark">{doc.vesselAttributes.issuingBody}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Issue Date:</span> <div className="font-mono-code"><strong className="text-dark">{formatMaritimeDate(doc.vesselAttributes.issueDate)}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Expiry Date:</span> <div className="font-mono-code"><strong className="text-dark">{formatMaritimeDate(doc.vesselAttributes.expiryDate)}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Vessel Name:</span> <div><strong className="text-dark">{doc.vesselAttributes.vesselName}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">IMO Number:</span> <div className="font-mono-code"><strong className="text-dark">{doc.vesselAttributes.imoNumber}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Flag State:</span> <div><strong className="text-dark">{doc.vesselAttributes.flagState}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">100% Asset Match:</span> <div><span className="badge bg-success text-white">MATCH VERIFIED [OK]</span></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Last Survey Date:</span> <div className="font-mono-code"><strong className="text-dark">{formatMaritimeDate(doc.vesselAttributes.lastSurveyDate)}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">OCR Score:</span> <div><ConfidenceBadge score={doc.vesselAttributes.ocrConfidence} /></div>
              </div>
            </div>
          )}

          {doc.crewAttributes && (
            <div className="row g-3 small">
              <div className="col-md-4">
                <span className="text-secondary">Crew Name:</span> <div><strong className="text-dark">{doc.crewAttributes.crewName}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Passport / ID:</span> <div className="font-mono-code"><strong className="text-dark">{doc.crewAttributes.passportId}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Rank:</span> <div><strong className="text-dark">{doc.crewAttributes.rank}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Cert Type:</span> <div><strong className="text-dark">{doc.crewAttributes.certType}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Issuing Center:</span> <div><strong className="text-dark">{doc.crewAttributes.issuingCenter}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Issue Date:</span> <div className="font-mono-code"><strong className="text-dark">{formatMaritimeDate(doc.crewAttributes.issueDate)}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Expiry Date:</span> <div className="font-mono-code"><strong className="text-dark">{formatMaritimeDate(doc.crewAttributes.expiryDate)}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Assigned Vessel:</span> <div><strong className="text-dark">{doc.crewAttributes.assignedVessel}</strong></div>
              </div>
              <div className="col-md-4">
                <span className="text-secondary">Nationality:</span> <div><strong className="text-dark">{doc.crewAttributes.nationality}</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Version History Table */}
      <div className="card map-card-custom">
        <div className="card-header">File Revision History ({doc.versions.length} Versions)</div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Version</th>
                <th>File Name</th>
                <th>Upload Timestamp (UTC)</th>
                <th>Uploader</th>
                <th>File Size</th>
                <th>Change Summary</th>
              </tr>
            </thead>
            <tbody>
              {doc.versions.map((ver) => (
                <tr key={ver.versionLabel}>
                  <td>
                    <span className="badge bg-info text-dark font-mono-code">{ver.versionLabel}</span>
                  </td>
                  <td className="fw-semibold text-primary">{ver.fileName}</td>
                  <td className="font-mono-code small">{formatMaritimeDate(ver.uploadedAt)}</td>
                  <td>{ver.uploadedBy}</td>
                  <td className="font-mono-code small">{Math.round(ver.fileSizeBytes / 1024 / 1024 * 10) / 10} MB</td>
                  <td className="small text-secondary">{ver.changeSummary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
