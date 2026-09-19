/* 
  file summary: modal dialog component for uploading, renewing, and updating stcw layer 1 core and layer 2 vessel-specific certificates for crew members.
  responsibilities: captures document title, stcw regulation, certificate number, issuing authority, expiry date, verification status, and file attachment.
  role in system: launched by CrewDetailView.tsx when admin or submitter clicks upload or reupload/update document.
*/

import React, { useState, useEffect } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { STCWDocumentItem, STCWLayer } from '../../types/crew';

interface CrewDocumentUploadModalProps {
  isOpen: boolean;
  crewId: string;
  crewName: string;
  existingDocument?: STCWDocumentItem | null;
  onClose: () => void;
}

/**
  what: renders modal for uploading, reuploading, or updating stcw crew certificates.
  how: pre-fills form fields if updating existing document, validates inputs, updates zustand store, and logs audit trail event.
  with what file: src/components/drawers/CrewDocumentUploadModal.tsx loaded by CrewDetailView.tsx.
*/
export const CrewDocumentUploadModal: React.FC<CrewDocumentUploadModalProps> = ({
  isOpen,
  crewId,
  crewName,
  existingDocument,
  onClose,
}) => {
  const { addCrewDocument, updateCrewDocument, activePersona } = useMapStore();

  const [title, setTitle] = useState('');
  const [layer, setLayer] = useState<STCWLayer>('Layer 1 - Universal Core');
  const [stcwRegulation, setStcwRegulation] = useState('STCW Reg VI/1');
  const [certificateNo, setCertificateNo] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('Australian Maritime Safety Authority (AMSA)');
  const [flagState, setFlagState] = useState('Australia');
  const [issueDate, setIssueDate] = useState('2026-01-01');
  const [expiryDate, setExpiryDate] = useState('2031-01-01');
  const [verificationStatus, setVerificationStatus] = useState<'Verified' | 'Pending' | 'Expiring' | 'Expired'>('Verified');
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (existingDocument) {
      setTitle(existingDocument.title);
      setLayer(existingDocument.layer);
      setStcwRegulation(existingDocument.stcwRegulation);
      setCertificateNo(existingDocument.certificateNo);
      setIssuingAuthority(existingDocument.issuingAuthority);
      setFlagState(existingDocument.flagState || 'Australia');
      setIssueDate(existingDocument.issueDate);
      setExpiryDate(existingDocument.expiryDate);
      setVerificationStatus(existingDocument.verificationStatus === 'Expired' ? 'Verified' : existingDocument.verificationStatus);
      setFileName(existingDocument.fileName || `${existingDocument.title.toLowerCase().replace(/\s+/g, '_')}_v2.pdf`);
    } else {
      setTitle('');
      setLayer('Layer 1 - Universal Core');
      setStcwRegulation('STCW Reg VI/1');
      setCertificateNo('');
      setIssuingAuthority('Australian Maritime Safety Authority (AMSA)');
      setFlagState('Australia');
      setIssueDate('2026-01-01');
      setExpiryDate('2031-01-01');
      setVerificationStatus('Verified');
      setFileName('');
    }
    setErrorMessage('');
  }, [existingDocument, isOpen]);

  if (!isOpen) return null;

  const canManage = activePersona === 'Administrator' || activePersona === 'Submitter';
  const isEditing = Boolean(existingDocument);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!canManage) {
      setErrorMessage('Permission Denied: Document modifications are restricted exclusively to Administrator or Submitter roles.');
      return;
    }

    if (!title.trim() || !certificateNo.trim() || !issuingAuthority.trim()) {
      setErrorMessage('Please fill out all required fields (Document Title, Certificate No, and Issuing Authority).');
      return;
    }

    const docToSave: STCWDocumentItem = {
      id: existingDocument ? existingDocument.id : `DOC-CRW-${Math.floor(600 + Math.random() * 400)}`,
      title: title.trim(),
      layer,
      stcwRegulation: stcwRegulation.trim() || 'STCW Convention Standard',
      certificateNo: certificateNo.trim(),
      issuingAuthority: issuingAuthority.trim(),
      flagState: flagState.trim() || 'Australia',
      issueDate,
      expiryDate,
      verificationStatus,
      fileName: fileName.trim() || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
      fileSizeBytes: existingDocument?.fileSizeBytes || 1500000,
    };

    if (isEditing) {
      updateCrewDocument(crewId, docToSave);
    } else {
      addCrewDocument(crewId, docToSave);
    }

    onClose();
  };

  return (
    <div className="map-modal-backdrop d-flex align-items-center justify-content-center p-3">
      <div className="card map-card-custom shadow-lg" style={{ width: '100%', maxWidth: '640px', zIndex: 1100 }}>
        {/* Modal Header */}
        <div className="card-header d-flex align-items-center justify-content-between p-3 border-bottom bg-light">
          <div>
            <div className="fw-bold text-dark fs-6">
              {isEditing ? `Reupload / Update STCW Document — ${existingDocument?.title}` : `Upload STCW Certificate / Endorsement — ${crewName}`}
            </div>
            <div className="text-secondary small font-mono-code">
              Seafarer: <strong>{crewName}</strong> {isEditing && `| Existing Ref: ${existingDocument?.certificateNo}`}
            </div>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          />
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="card-body p-4 d-flex flex-column gap-3" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {errorMessage && (
              <div className="alert alert-danger py-2 small mb-0">
                {errorMessage}
              </div>
            )}

            {isEditing && (
              <div className="alert alert-info py-2 px-3 small mb-0 font-mono-code">
                <strong>Reuploading/Updating Document:</strong> Updating this record will replace the current certificate file scan, refresh expiry dates, and update compliance logs.
              </div>
            )}

            {/* Compliance Layer Selector */}
            <div>
              <label className="form-label small fw-semibold text-secondary mb-1">STCW Compliance Layer *</label>
              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={layer}
                onChange={(e) => setLayer(e.target.value as STCWLayer)}
              >
                <option value="Layer 1 - Universal Core">Layer 1 — Universal STCW Core (Passport, Seaman Book, BST, ENG1 Medical)</option>
                <option value="Layer 2 - Vessel Specific & Endorsements">Layer 2 — Vessel Specific & Endorsements (CoC, Tanker, IGF, DP, FSE)</option>
              </select>
            </div>

            {/* Document Title & STCW Regulation */}
            <div className="row g-3">
              <div className="col-md-7">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="doc-title">Document / Certificate Title *</label>
                <input
                  id="doc-title"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="e.g. Master Unlimited CoC / IGF Code Training"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-5">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="stcw-reg">STCW Regulation Reference</label>
                <input
                  id="stcw-reg"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                  placeholder="e.g. STCW Reg II/2, VI/1"
                  value={stcwRegulation}
                  onChange={(e) => setStcwRegulation(e.target.value)}
                />
              </div>
            </div>

            {/* Certificate No & Issuing Authority */}
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="cert-no">Certificate / Document Number *</label>
                <input
                  id="cert-no"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                  placeholder="e.g. CoC-II-2-0041"
                  value={certificateNo}
                  onChange={(e) => setCertificateNo(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="issuing-auth">Issuing Authority / Body *</label>
                <input
                  id="issuing-auth"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="e.g. AMSA Australia / DNV"
                  value={issuingAuthority}
                  onChange={(e) => setIssuingAuthority(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Flag State Jurisdiction */}
            <div>
              <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="flag-state">Flag State Jurisdiction / Authority</label>
              <input
                id="flag-state"
                type="text"
                className="form-control form-control-sm bg-white text-dark border-secondary"
                placeholder="e.g. Australia / Marshall Islands / Liberia"
                value={flagState}
                onChange={(e) => setFlagState(e.target.value)}
              />
            </div>

            {/* Issue Date & Expiry Date */}
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="issue-date">Issue Date *</label>
                <input
                  id="issue-date"
                  type="date"
                  className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="expiry-date">New Expiry Date *</label>
                <input
                  id="expiry-date"
                  type="date"
                  className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="ver-status">Verification Status *</label>
                <select
                  id="ver-status"
                  className="form-select form-select-sm bg-white text-dark border-secondary"
                  value={verificationStatus}
                  onChange={(e) => setVerificationStatus(e.target.value as any)}
                >
                  <option value="Verified">Verified & Valid</option>
                  <option value="Pending">Pending Audit</option>
                  <option value="Expiring">Expiring Soon</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>
            </div>

            {/* File Upload Attachment */}
            <div>
              <label className="form-label small fw-semibold text-secondary mb-1" htmlFor="file-name">
                {isEditing ? 'Reupload New Scanned File Attachment (PDF / Image)' : 'Scanned Document Attachment (PDF / Image)'}
              </label>
              <input
                id="file-name"
                type="text"
                className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                placeholder="e.g. stcw_certificate_scan_v2.pdf"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="card-footer d-flex align-items-center justify-content-end gap-2 p-3 border-top bg-light">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={!canManage}
            >
              {isEditing ? 'Save & Update Certificate' : 'Upload & Register Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
