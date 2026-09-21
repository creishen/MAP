/* 
  file summary: master document upload & replacement modal form for submitting statutory certificates in light theme with AI information extraction.
  responsibilities: captures document title and entity type, supports file uploading with simulated AI OCR metadata extraction (certificate number, issuing authority, expiry date), and dispatches store actions.
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
  what: renders document upload / re-upload modal with file picker and simulated AI metadata extraction.
  how: pre-populates metadata if existingDocument is passed, simulates AI extraction upon file attach for new uploads, and populates extracted certificate attributes automatically into the form.
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
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [expiryDate, setExpiryDate] = useState('2029-06-30');
  const [fileName, setFileName] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  /* simulated AI extraction states */
  const [isExtractingAi, setIsExtractingAi] = useState(false);
  const [isAiExtracted, setIsAiExtracted] = useState(false);
  const [aiOcrConfidence, setAiOcrConfidence] = useState(99.2);

  /* simulated upload state */
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);

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
        setIsAiExtracted(true);
        setAiOcrConfidence(existingDocument.ocrConfidence || 98.5);
      } else {
        setTitle(requirementTitle || '');
        setEntityType('Vessel Certificate');
        setVesselId(defaultVesselId || '');
        setCertificateNo('');
        setIssuingAuthority('');
        setExpiryDate('2029-06-30');
        setFileName('');
        setChangeSummary(
          requirementTitle ? `Initial upload for assurance requirement: ${requirementTitle}.` : '',
        );
        setIsAiExtracted(false);
        setAiOcrConfidence(99.2);
      }
      setIsExtractingAi(false);
      setIsUploading(false);
      setUploadProgress(0);
      setStatusMessage('');
      setIsDraggingOver(false);
      setIsPendingVerification(false);
    }
  }, [isOpen, existingDocument, vessels, requirementTitle, defaultVesselId]);

  if (!isOpen) return null;

  const canUpload = activePersona === 'Administrator' || activePersona === 'Submitter';

  /*
    what: handles file attachment selection and stages document for user verification before AI extraction.
    how: sets fileName state and enables isPendingVerification preview gate.
    with what file: src/components/drawers/DocumentUploadModal.tsx.
  */
  const handleSelectFileForPreview = (selectedName: string) => {
    setFileName(selectedName);
    setIsPendingVerification(true);
    setIsAiExtracted(false);
    setIsExtractingAi(false);
  };

  const handleConfirmVerifyAndExtract = () => {
    setIsPendingVerification(false);
    triggerAiExtraction(fileName);
  };

  /*
    what: handles drag and drop file interactions.
    how: tracks dragover, dragleave, and drop events to trigger file preview verification.
    with what file: src/components/drawers/DocumentUploadModal.tsx.
  */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading && !isExtractingAi) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (isUploading || isExtractingAi) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const droppedFile = droppedFiles[0];
      handleSelectFileForPreview(droppedFile.name);
    }
  };

  /*
    what: simulates AI information extraction when a file is uploaded or selected.
    how: sets loading state, extracts certificate number, issuing authority, expiry date, and OCR confidence, and automatically populates form state.
    with what file: src/components/drawers/DocumentUploadModal.tsx.
  */
  const triggerAiExtraction = (selectedName: string) => {
    setFileName(selectedName);
    setIsExtractingAi(true);
    setIsAiExtracted(false);

    setTimeout(() => {
      const generatedCertNo = `DNV-STAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const selectedVesselObj = vessels.find((v) => v.id === vesselId);
      const authority = selectedVesselObj?.classificationSociety
        ? `${selectedVesselObj.classificationSociety} Classification Society`
        : 'DNV Classification Society';

      setCertificateNo(generatedCertNo);
      setIssuingAuthority(authority);
      setExpiryDate('2029-06-30');
      setAiOcrConfidence(99.2);
      setIsExtractingAi(false);
      setIsAiExtracted(true);
    }, 1100);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleSelectFileForPreview(selectedFile.name);
    }
  };

  const handleSampleFileClick = (sampleName: string) => {
    handleSelectFileForPreview(sampleName);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUpload || !title.trim()) return;

    const finalCertNo = certificateNo.trim() || `DNV-STAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalAuthority = issuingAuthority.trim() || 'DNV Classification Society';
    const finalExpiry = expiryDate || '2029-06-30';

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
      setStatusMessage('Verifying AI extracted attributes and validating IACS authority...');
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
        const targetVesselObj = vesselId ? vessels.find((v) => v.id === vesselId) : undefined;
        const newDoc: MasterDocument = {
          id: `DOC-2026-${Math.floor(100 + Math.random() * 900)}`,
          title,
          entityType,
          vesselId: vesselId || defaultVesselId || '',
          certificateNo: finalCertNo,
          issuingAuthority: finalAuthority,
          expiryDate: finalExpiry,
          ocrConfidence: aiOcrConfidence || 99,
          complianceState: 'Valid',
          currentVersion: 'v1.0',
          versions: [
            {
              versionLabel: 'v1.0',
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'Ops Submitter',
              fileSizeBytes: 2100000,
              fileName: finalFileName,
              changeSummary: changeSummary.trim() || 'Initial Master Document submission with AI extracted metadata.',
            },
          ],
          vesselAttributes:
            entityType === 'Vessel Certificate'
              ? {
                title,
                certificateNumber: finalCertNo,
                certType: 'Statutory Certificate',
                issuingBody: finalAuthority,
                issueDate: '2024-01-01',
                expiryDate: finalExpiry,
                vesselName: targetVesselObj?.name || '',
                imoNumber: targetVesselObj?.imoNumber || '',
                flagState: 'Australia',
                assetMatchFlag: true,
                lastSurveyDate: '2025-06-01',
                ocrConfidence: aiOcrConfidence || 99,
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
        if (e.target === e.currentTarget && !isUploading && !isExtractingAi) onClose();
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
              disabled={isUploading || isExtractingAi}
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
                      Simulating Document Upload &amp; Re-upload...
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

              {/* 1. Document Title & Entity Type (Same Row) */}
              <div className="row g-2 mb-3">
                <div className="col-md-6">
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
                    disabled={isUploading || isExtractingAi || !!existingDocument}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="doc-type">
                    Entity Type *
                  </label>
                  <select
                    id="doc-type"
                    className="form-select form-select-sm bg-white text-dark border-secondary"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value as DocumentEntityType)}
                    disabled={isUploading || isExtractingAi || !!existingDocument}
                  >
                    <option value="Vessel Certificate">Vessel Certificate</option>
                    <option value="Crew Certificate">Crew Certificate</option>
                  </select>
                </div>
              </div>

              {/* 2. Drag and Drop / Clickable File Upload Dropzone */}
              <div className="mb-3">
                <label className="form-label text-dark fw-bold small mb-1">
                  Select Document File *
                </label>
                <div
                  className={`p-4 border border-2 border-dashed rounded text-center transition-all ${isDraggingOver
                    ? 'border-primary bg-primary-subtle'
                    : fileName
                      ? 'border-success bg-light'
                      : 'border-secondary-subtle bg-light hover-bg-gray'
                    }`}
                  style={{ cursor: isUploading || isExtractingAi ? 'not-allowed' : 'pointer' }}
                  onClick={() => {
                    if (!isUploading && !isExtractingAi) {
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="d-flex flex-column align-items-center justify-content-center gap-2">
                    <div className="rounded-circle bg-white p-2.5 border shadow-2xs">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                    </div>
                    <div>
                      <div className="fw-bold text-dark mb-0.5">
                        {fileName ? (
                          <span className="text-success font-mono-code">{fileName}</span>
                        ) : (
                          <span>Drag &amp; drop document file here, or <span className="text-primary text-decoration-underline">browse files from system</span></span>
                        )}
                      </div>
                      <div className="text-secondary small" style={{ fontSize: '0.75rem' }}>
                        Supports PDF, PNG, JPG, DOCX (Max 25MB) · AI Information Extraction runs automatically
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick File Selection Chips */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-secondary small me-1" style={{ fontSize: '0.725rem' }}>
                    Sample file attach:
                  </span>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary font-mono-code py-0 px-2"
                    style={{ fontSize: '0.7rem' }}
                    onClick={() =>
                      handleSampleFileClick(
                        `${(title || 'Statutory_Document').replace(/\s+/g, '_')}_ClassScan.pdf`
                      )
                    }
                    disabled={isUploading || isExtractingAi}
                  >
                    + {(title || 'Statutory_Document').replace(/\s+/g, '_')}_ClassScan.pdf
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-secondary font-mono-code py-0 px-2"
                    style={{ fontSize: '0.7rem' }}
                    onClick={() =>
                      handleSampleFileClick(
                        `Safety_Equipment_Cert_HighRes_2026.pdf`
                      )
                    }
                    disabled={isUploading || isExtractingAi}
                  >
                    + Safety_Equipment_Cert_HighRes_2026.pdf
                  </button>
                </div>
              </div>

              {/* 3. Document Preview & User Verification Gate */}
              {isPendingVerification && (
                <div className="p-3 mb-3 bg-light border border-primary rounded shadow-2xs">
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                      </svg>
                      <span>Document Preview &amp; User Verification Required</span>
                    </span>
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle font-mono-code" style={{ fontSize: '0.7rem' }}>
                      Verification Gate
                    </span>
                  </div>

                  {/* Visual Document Scan Wireframe Preview */}
                  <div className="bg-white border rounded p-3 mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-danger text-white font-mono-code" style={{ fontSize: '0.7rem' }}>PDF SCAN</span>
                        <span className="fw-bold text-dark small font-mono-code">{fileName}</span>
                      </div>
                      <span className="text-secondary small font-mono-code" style={{ fontSize: '0.75rem' }}>2.4 MB · Page 1 of 1</span>
                    </div>

                    <div className="bg-light p-3 border rounded text-start" style={{ fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.4' }}>
                      <div className="text-uppercase fw-bold text-primary border-bottom pb-1 mb-2 d-flex justify-content-between">
                        <span>STATUTORY CERTIFICATE PREVIEW SCAN</span>
                        <span className="text-success fw-bold">LEGIBILITY: 100% CLEAR</span>
                      </div>
                      <div className="text-dark fw-semibold">DOCUMENT TITLE: {title || 'MARITIME STATUTORY CERTIFICATE'}</div>
                      <div className="text-secondary mt-1">ENTITY TYPE: {entityType}</div>
                      <div className="text-secondary">FILE ATTACHED: {fileName}</div>
                      <div className="text-muted border-top pt-1.5 mt-2 text-center" style={{ fontSize: '0.7rem' }}>
                        [ Preview Mode: Review document scan for accuracy before authorizing AI OCR extraction ]
                      </div>
                    </div>
                  </div>

                  {/* User Verification Confirmation Controls */}
                  <div className="d-flex align-items-center justify-content-between bg-white p-2.5 border rounded">
                    <button
                      type="button"
                      className="btn btn-sm btn-success fw-bold px-3 d-inline-flex align-items-center gap-1.5"
                      onClick={handleConfirmVerifyAndExtract}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Verify Document &amp; Run AI Extraction
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Simulated AI Extraction Progress Indicator */}
              {isExtractingAi && (
                <div className="p-3 mb-3 bg-primary-subtle border border-primary-subtle rounded shadow-2xs">
                  <div className="d-flex align-items-center justify-content-between mb-1.5">
                    <span className="fw-bold text-primary small d-flex align-items-center gap-2">
                      <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
                      Simulating AI OCR &amp; Attribute Extraction...
                    </span>
                    <span className="badge bg-primary text-white font-mono-code">AI Processing</span>
                  </div>
                  <div className="font-mono-code text-muted small" style={{ fontSize: '0.75rem' }}>
                    Extracting Certificate Number, Issuing Authority, Expiry Date, and IACS Compliance Attributes from <strong>{fileName}</strong>...
                  </div>
                </div>
              )}

              {/* 5. AI Extracted Information Display */}
              {isAiExtracted && (
                <div className="p-3 bg-light border rounded mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                    <span className="fw-bold text-dark small d-flex align-items-center gap-2">
                      <span>AI Extracted Document Metadata</span>
                      <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle font-mono-code" style={{ fontSize: '0.7rem' }}>
                        Auto-Extracted &amp; Verified ({aiOcrConfidence}% Confidence)
                      </span>
                    </span>
                  </div>

                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label text-secondary small fw-semibold" htmlFor="cert-no">
                        Certificate Number (Extracted) *
                      </label>
                      <input
                        id="cert-no"
                        type="text"
                        className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                        placeholder="e.g. DNV-STAT-2026-99"
                        value={certificateNo}
                        onChange={(e) => setCertificateNo(e.target.value)}
                        disabled={isUploading}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-secondary small fw-semibold" htmlFor="issuing-auth">
                        Issuing Authority (Extracted) *
                      </label>
                      <input
                        id="issuing-auth"
                        type="text"
                        className="form-control form-control-sm bg-white text-dark border-secondary"
                        placeholder="e.g. DNV Classification Society"
                        value={issuingAuthority}
                        onChange={(e) => setIssuingAuthority(e.target.value)}
                        disabled={isUploading}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-secondary small fw-semibold" htmlFor="expiry-date">
                        Expiry Date (Extracted) *
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
                        placeholder="e.g. Initial AI extracted upload"
                        value={changeSummary}
                        onChange={(e) => setChangeSummary(e.target.value)}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer border-top bg-light">
              <button
                type="button"
                className="btn btn-sm btn-secondary"
                onClick={onClose}
                disabled={isUploading || isExtractingAi}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm btn-primary fw-bold px-4 d-inline-flex align-items-center gap-2"
                disabled={isUploading || isExtractingAi || !title.trim()}
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
