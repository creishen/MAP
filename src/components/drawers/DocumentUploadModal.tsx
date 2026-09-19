/* 
  file summary: master document upload modal form for submitting new statutory vessel or crew certificates in light theme.
  responsibilities: captures certificate title, entity type, certificate number, issuing authority, expiry date, and file upload metadata.
  role in system: invoked from DocumentLibraryView.tsx via DocumentTable header action button.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { MasterDocument, DocumentEntityType } from '../../types/document';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
  what: renders document upload modal form in light theme.
  how: aggregates certificate details and dispatches addDocument action to zustand store.
  with what file: src/components/drawers/DocumentUploadModal.tsx loaded by DocumentLibraryView.tsx.
*/
export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ isOpen, onClose }) => {
  const { vessels, addDocument } = useMapStore();

  const [title, setTitle] = useState('');
  const [entityType, setEntityType] = useState<DocumentEntityType>('Vessel Certificate');
  const [vesselId, setVesselId] = useState(vessels[0]?.id || '');
  const [certificateNo, setCertificateNo] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('DNV');
  const [expiryDate, setExpiryDate] = useState('2029-06-30');
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !certificateNo.trim()) return;

    const newDoc: MasterDocument = {
      id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
      title,
      entityType,
      vesselId,
      certificateNo,
      issuingAuthority,
      expiryDate,
      ocrConfidence: 97,
      complianceState: 'Valid',
      currentVersion: 'v1.0',
      versions: [
        {
          versionLabel: 'v1.0',
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'Ops Submitter',
          fileSizeBytes: 2100000,
          fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
          changeSummary: 'Initial master document vault submission.',
        },
      ],
      vesselAttributes:
        entityType === 'Vessel Certificate'
          ? {
              title,
              certificateNumber: certificateNo,
              certType: 'Statutory Certificate',
              issuingBody: issuingAuthority,
              issueDate: '2024-01-01',
              expiryDate,
              vesselName: vessels.find((v) => v.id === vesselId)?.name || 'MV Pacific Endeavour',
              imoNumber: vessels.find((v) => v.id === vesselId)?.imoNumber || '9123456',
              flagState: 'Australia',
              assetMatchFlag: true,
              lastSurveyDate: '2025-06-01',
              ocrConfidence: 97,
              status: 'Valid',
            }
          : undefined,
      validationRules: {
        charterBufferPassed: true,
        assetMatch100Percent: true,
        iacsAuthorityValid: true,
        overallValid: true,
      },
      verificationStatus: 'Pending',
    };

    addDocument(newDoc);
    onClose();
  };

  return (
    <div
      className="modal show d-block map-modal-backdrop"
      tabIndex={-1}
      style={{ zIndex: 1050 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-white text-dark border shadow-lg">
          <div className="modal-header border-bottom bg-light d-flex align-items-center justify-content-between p-3 position-relative">
            <h5 className="modal-title fw-bold text-slate-900 m-0">Upload New Master Document</h5>
            <button type="button" className="btn-close ms-auto" onClick={onClose} aria-label="Close" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold" htmlFor="doc-title">Document Title *</label>
                <input
                  id="doc-title"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="e.g. Certificate of Class"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="doc-type">Entity Type *</label>
                  <select
                    id="doc-type"
                    className="form-select form-select-sm bg-white text-dark border-secondary"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as DocumentEntityType)}
                  >
                    <option value="Vessel Certificate">Vessel Certificate</option>
                    <option value="Crew Certificate">Crew Certificate</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="target-vessel-doc">Target Vessel *</label>
                  <select
                    id="target-vessel-doc"
                    className="form-select form-select-sm bg-white text-dark border-secondary"
                    value={vesselId}
                    onChange={(e) => setVesselId(e.target.value)}
                  >
                    {vessels.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} (IMO {v.imoNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="cert-no">Certificate Number *</label>
                  <input
                    id="cert-no"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    placeholder="e.g. DNV-STAT-2026-99"
                    value={certificateNo}
                    onChange={(e) => setCertificateNo(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="issuing-auth">Issuing Authority *</label>
                  <input
                    id="issuing-auth"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    placeholder="e.g. DNV / ABS / AMSA"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="expiry-date">Expiry Date *</label>
                  <input
                    id="expiry-date"
                    type="date"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="upload-filename">File Name</label>
                  <input
                    id="upload-filename"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    placeholder="e.g. Class_Cert_2026.pdf"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Upload Master Document
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
