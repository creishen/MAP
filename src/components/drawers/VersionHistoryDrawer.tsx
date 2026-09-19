/* 
  file summary: document version history offcanvas drawer component in light theme.
  responsibilities: displays chronological file revision table (v1.0, v1.1) and enables submitters to upload replacement revisions.
  role in system: invoked from document vault table or document deep-dive view.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { MasterDocument } from '../../types/document';
import { formatMaritimeDate } from '../../utils/formatters';

interface VersionHistoryDrawerProps {
  document: MasterDocument | null;
  onClose: () => void;
}

/**
  what: renders document version history drawer in light theme.
  how: lists version entries array from document and exposes revision upload form.
  with what file: src/components/drawers/VersionHistoryDrawer.tsx loaded by DocumentLibraryView.tsx.
*/
export const VersionHistoryDrawer: React.FC<VersionHistoryDrawerProps> = ({ document, onClose }) => {
  const { addDocumentVersion, activePersona } = useMapStore();
  const [newVersionLabel, setNewVersionLabel] = useState('v1.2');
  const [newFileName, setNewFileName] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  if (!document) return null;

  const isCAdmin = activePersona === 'C Admin';

  const handleUploadRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    addDocumentVersion(
      document.id,
      newVersionLabel,
      newFileName,
      2500000,
      changeSummary || 'Document revision upload.'
    );

    setNewFileName('');
    setChangeSummary('');
    onClose();
  };

  return (
    <>
      <div className="map-modal-backdrop" onClick={onClose} style={{ zIndex: 1040 }} />
      <div
        className="offcanvas offcanvas-end show bg-white text-dark border-start shadow-lg"
        style={{ width: '540px', visibility: 'visible', zIndex: 1050 }}
        tabIndex={-1}
      >
        <div className="offcanvas-header border-bottom p-3 bg-light d-flex align-items-center justify-content-between">
          <div>
            <h5 className="offcanvas-title mb-1 fw-bold text-slate-900">{document.title}</h5>
            <div className="text-secondary small font-mono-code">{document.certificateNo}</div>
          </div>
          <button type="button" className="btn-close ms-auto" onClick={onClose} aria-label="Close" />
        </div>

        <div className="offcanvas-body p-3">
          {/* Prominent C Admin Read-Only Banner */}
          {isCAdmin && (
            <div className="map-cadmin-readonly-banner">
              <span>Read-Only Mode (C Admin Persona): Revision uploads disabled for Client Admin.</span>
            </div>
          )}

          {/* Upload New Revision Form (For Submitter / Admin) */}
          {!isCAdmin && (
            <form onSubmit={handleUploadRevision} className="p-3 bg-light border border-secondary rounded mb-4 shadow-sm">
              <h6 className="text-uppercase text-primary small fw-bold mb-3" style={{ letterSpacing: '0.05em' }}>
                Upload New Revision / Corrected File
              </h6>

              <div className="row g-2 mb-2">
                <div className="col-4">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="ver-label">Version:</label>
                  <input
                    id="ver-label"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    value={newVersionLabel}
                    onChange={(e) => setNewVersionLabel(e.target.value)}
                    required
                  />
                </div>
                <div className="col-8">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="ver-filename">File Name:</label>
                  <input
                    id="ver-filename"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    placeholder="e.g. DNV_Cert_Rev_1.2.pdf"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold" htmlFor="ver-summary">Reason for Revision / Change Summary:</label>
                <textarea
                  id="ver-summary"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  rows={2}
                  placeholder="Enter details on what changed..."
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-sm btn-primary w-100">
                Submit Revision
              </button>
            </form>
          )}

          {/* Version History Timeline */}
          <h6 className="text-uppercase text-secondary small fw-bold mb-3" style={{ letterSpacing: '0.05em' }}>
            Revision History Timeline
          </h6>

          <div className="d-flex flex-column gap-3">
            {document.versions.map((ver) => (
              <div key={ver.versionLabel} className="p-3 bg-light border border-secondary rounded shadow-sm">
                <div className="d-flex align-items-center justify-between mb-2">
                  <span className="badge bg-info text-dark font-mono-code" style={{ fontSize: '0.8rem' }}>
                    {ver.versionLabel}
                  </span>
                  <span className="text-secondary small font-mono-code">
                    {formatMaritimeDate(ver.uploadedAt)}
                  </span>
                </div>

                <div className="fw-bold text-dark mb-1">{ver.fileName}</div>
                <div className="text-secondary small mb-2">
                  Uploaded by: <strong>{ver.uploadedBy}</strong> ({Math.round(ver.fileSizeBytes / 1024 / 1024 * 10) / 10} MB)
                </div>
                <div className="p-2 bg-white rounded small text-secondary border fst-italic">
                  "{ver.changeSummary}"
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
