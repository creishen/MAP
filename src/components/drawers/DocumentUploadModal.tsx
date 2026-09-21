/* 
  file summary: master document upload & replacement modal form for submitting statutory certificates in light theme.
  responsibilities: captures certificate metadata, supports choosing files via Add File picker or sample chips, replaces file name, and simulates multi-stage upload progress.
  role in system: invoked from DocumentLibraryView, DocumentReviewDrawer, and AssuranceDetailView for document creation and submitter revision re-uploads.
*/

import React, { useState, useEffect, useRef } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { MasterDocument, DocumentEntityType } from '../../types/document';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingDocument?: MasterDocument | null;
  onUploadComplete?: () => void;
  /** When uploading from an assurance set requirement row (demo mock link). */
  assuranceSetId?: string;
  requirementId?: string;
  requirementTitle?: string;
  defaultVesselId?: string;
}

/**
  what: renders document upload / re-upload modal with file picker and simulated upload progress.
  how: pre-populates metadata if existingDocument is passed, handles Add File file name replacement, animates progress bar, and dispatches store actions.
  with what file: src/components/drawers/DocumentUploadModal.tsx loaded by DocumentLibraryView.tsx and DocumentReviewDrawer.tsx.
*/
export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  existingDocument,
  onUploadComplete,
  assuranceSetId,
  requirementId,
  requirementTitle,
  defaultVesselId,
}) => {
  const { vessels, addDocument, uploadDocumentForRequirement, addDocumentVersion, verifyDocument, activePersona } =
    useMapStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [entityType, setEntityType] = useState<DocumentEntityType>('Vessel Certificate');
  const [vesselId, setVesselId] = useState('');
  const [certificateNo, setCertificateNo] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('DNV');
  const [expiryDate, setExpiryDate] = useState('2029-06-30');
  const [fileName, setFileName] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  /* simulated upload state */
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (existingDocument) {
        setTitle(existingDocument.title);
        setEntityType(existingDocument.entityType);
        setVesselId(existingDocument.vesselId);
        setCertificateNo(existingDocument.certificateNo);
        setIssuingAuthority(existingDocument.issuingAuthority);
        setExpiryDate(existingDocument.expiryDate);
        setFileName(
          existingDocument.versions[0]?.fileName ||
          `${existingDocument.title.replace(/\s+/g, '_')}_Rev.pdf`
        );
        setChangeSummary('Replacement document revision uploaded by submitter.');
      } else {
        setTitle(requirementTitle || '');
        setEntityType('Vessel Certificate');
        setVesselId(defaultVesselId || vessels[0]?.id || '');
        setCertificateNo(requirementTitle ? `DEMO-${Math.floor(10000 + Math.random() * 89999)}` : '');
        setIssuingAuthority('DNV');
        setExpiryDate('2029-06-30');
        setFileName(
          requirementTitle
            ? `${requirementTitle.replace(/\s+/g, '_')}_DemoUpload.pdf`
            : '',
        );
        setChangeSummary(
          requirementTitle ? `Initial upload for assurance requirement: ${requirementTitle}.` : '',
        );
      }
      setIsUploading(false);
      setUploadProgress(0);
      setStatusMessage('');
    }
  }, [isOpen, existingDocument, vessels, requirementTitle, defaultVesselId]);

  if (!isOpen) return null;

  const canUpload = activePersona === 'Administrator' || activePersona === 'Submitter';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFileName(selectedFile.name);
    }
  };

  const handleSampleFileClick = (sampleName: string) => {
    setFileName(sampleName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpload || !title.trim() || !certificateNo.trim()) return;

    /* start simulated upload sequence */
    setIsUploading(true);
    setUploadProgress(15);
    setStatusMessage('Reading document byte stream and preparing secure payload...');

    setTimeout(() => {
      setUploadProgress(45);
      setStatusMessage('Uploading document bytes to secure maritime vault...');
    }, 350);

    setTimeout(() => {
      setUploadProgress(80);
      setStatusMessage('Running OCR attribute extraction and validating IACS authority...');
    }, 750);

    setTimeout(() => {
      setUploadProgress(100);
      setStatusMessage('Upload complete! Registering document audit trail...');
    }, 1150);

    setTimeout(() => {
      const finalFileName = fileName.trim() || `${title.replace(/\s+/g, '_')}_document.pdf`;

      if (existingDocument) {
        const nextVerLabel = `v1.${existingDocument.versions.length + 1}`;
        addDocumentVersion(
          existingDocument.id,
          nextVerLabel,
          finalFileName,
          2400000,
          changeSummary.trim() || 'Replacement document revision uploaded.'
        );
        verifyDocument(existingDocument.id, 'Pending', 'New replacement revision submitted.');
      } else {
        const newDoc: MasterDocument = {
          id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
          title,
          entityType,
          vesselId: vesselId || vessels[0]?.id || 'VESSEL-001',
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
              fileName: finalFileName,
              changeSummary: changeSummary.trim() || 'Initial Master Document submission.',
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
        if (assuranceSetId && requirementId) {
          uploadDocumentForRequirement(assuranceSetId, requirementId, newDoc);
        } else {
          addDocument(newDoc);
        }
      }

      setIsUploading(false);
      if (onUploadComplete) onUploadComplete();
      onClose();
    }, 1500);
  };

  return (
    <div
      className="modal show d-block map-modal-backdrop"
      tabIndex={-1}
      style={{ zIndex: 1060 }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isUploading) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content bg-white text-dark border shadow-lg">
          {/* hidden native file input */}
          <input
            type="file"
            ref={fileInputRef}
            className="d-none"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
          />

          <div className="modal-header border-bottom bg-light d-flex align-items-center justify-content-between p-3 position-relative">
            <h5 className="modal-title fw-bold text-slate-900 m-0">
              {existingDocument
                ? `Upload Replacement Revision — ${existingDocument.title}`
                : requirementTitle
                  ? `Upload Document — ${requirementTitle}`
                  : 'Upload New Master Document'}
            </h5>
            <button
              type="button"
              className="btn-close ms-auto"
              onClick={onClose}
              aria-label="Close"
              disabled={isUploading}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              {/* Simulated Upload Progress Bar */}
              {isUploading && (
                <div className="p-3 mb-4 bg-light border border-primary rounded shadow-2xs">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="fw-bold text-primary small d-flex align-items-center gap-2">
                      <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
                      Simulating Document Upload & Re-upload...
                    </span>
                    <span className="font-mono-code fw-bold text-primary small">{uploadProgress}%</span>
                  </div>
                  <div className="progress mb-2" style={{ height: '8px' }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                      role="progressbar"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <div className="font-mono-code text-muted small" style={{ fontSize: '0.75rem' }}>
                    {statusMessage}
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold" htmlFor="doc-title">
                  Document Title *
                </label>
                <input
                  id="doc-title"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="e.g. Certificate of Class"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isUploading || !!existingDocument}
                  required
                />
              </div>

              {/* Add File Picker & File Name Replacement Section */}
              <div className="mb-3 p-3 bg-light border rounded">
                <label className="form-label text-dark fw-bold small mb-1" htmlFor="upload-filename">
                  Select Document File (Add File) *
                </label>
                <div className="input-group input-group-sm mb-2">
                  <input
                    id="upload-filename"
                    type="text"
                    className="form-control bg-white text-dark border-secondary font-mono-code"
                    placeholder="Click 'Add File' to choose file from your system..."
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    disabled={isUploading}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-primary text-white fw-bold px-3"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Add File
                  </button>
                </div>

                {/* Quick File Selection Chips */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
                  <span className="text-secondary small me-1" style={{ fontSize: '0.725rem' }}>
                    Sample file replace:
                  </span>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary font-mono-code py-0 px-2"
                    style={{ fontSize: '0.7rem' }}
                    onClick={() =>
                      handleSampleFileClick(
                        `${(title || 'Document').replace(/\s+/g, '_')}_Rev1.2_ClearScan.pdf`
                      )
                    }
                    disabled={isUploading}
                  >
                    + {(title || 'Document').replace(/\s+/g, '_')}_Rev1.2_ClearScan.pdf
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary font-mono-code py-0 px-2"
                    style={{ fontSize: '0.7rem' }}
                    onClick={() =>
                      handleSampleFileClick(
                        `${certificateNo || 'STAT-CERT'}_HighRes_2026.pdf`
                      )
                    }
                    disabled={isUploading}
                  >
                    + {certificateNo || 'STAT-CERT'}_HighRes_2026.pdf
                  </button>
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="doc-type">
                    Entity Type *
                  </label>
                  <select
                    id="doc-type"
                    className="form-select form-select-sm bg-white text-dark border-secondary"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as DocumentEntityType)}
                    disabled={isUploading || !!existingDocument}
                  >
                    <option value="Vessel Certificate">Vessel Certificate</option>
                    <option value="Crew Certificate">Crew Certificate</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="target-vessel-doc">
                    Target Vessel *
                  </label>
                  <select
                    id="target-vessel-doc"
                    className="form-select form-select-sm bg-white text-dark border-secondary"
                    value={vesselId}
                    onChange={(e) => setVesselId(e.target.value)}
                    disabled={isUploading || !!existingDocument}
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
                  <label className="form-label text-secondary small fw-semibold" htmlFor="cert-no">
                    Certificate Number *
                  </label>
                  <input
                    id="cert-no"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    placeholder="e.g. DNV-STAT-2026-99"
                    value={certificateNo}
                    onChange={(e) => setCertificateNo(e.target.value)}
                    disabled={isUploading || !!existingDocument}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="issuing-auth">
                    Issuing Authority *
                  </label>
                  <input
                    id="issuing-auth"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    placeholder="e.g. DNV / ABS / AMSA"
                    value={issuingAuthority}
                    onChange={(e) => setIssuingAuthority(e.target.value)}
                    disabled={isUploading || !!existingDocument}
                    required
                  />
                </div>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="expiry-date">
                    Expiry Date *
                  </label>
                  <input
                    id="expiry-date"
                    type="date"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    disabled={isUploading}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="change-summary">
                    Revision Summary / Notes
                  </label>
                  <input
                    id="change-summary"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    placeholder="e.g. High-res scan uploaded to clarify stamp"
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    disabled={isUploading}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={onClose}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary fw-bold px-4 d-inline-flex align-items-center gap-2"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Uploading...
                  </>
                ) : existingDocument ? (
                  'Submit Replacement Revision'
                ) : (
                  'Upload Master Document'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
