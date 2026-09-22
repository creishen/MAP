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

  /* manual inline field editing state */
  const [isManualEditActive, setIsManualEditActive] = useState(false);
  const [correctedFields, setCorrectedFields] = useState<Set<string>>(new Set());
  const [revealedFields, setRevealedFields] = useState<{ certNo: boolean; authority: boolean; expiry: boolean; summary: boolean }>({
    certNo: true,
    authority: true,
    expiry: true,
    summary: true,
  });

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
      setRevealedFields({ certNo: false, authority: false, expiry: false, summary: false });
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
    setRevealedFields({ certNo: false, authority: false, expiry: false, summary: false });

    const generatedCertNo = `DNV-STAT-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const selectedVesselObj = vessels.find((v) => v.id === vesselId);
    const authority = selectedVesselObj?.classificationSociety
      ? `${selectedVesselObj.classificationSociety} Classification Society`
      : 'DNV Classification Society';

    /* step 1: complete ai scan after 1100ms then reveal fields with staggered delays */
    setTimeout(() => {
      setIsExtractingAi(false);
      setIsAiExtracted(true);
      setAiOcrConfidence(99.2);

      /* stagger 1: certificate number */
      setTimeout(() => {
        setCertificateNo(generatedCertNo);
        setRevealedFields((prev) => ({ ...prev, certNo: true }));
      }, 120);

      /* stagger 2: issuing authority */
      setTimeout(() => {
        setIssuingAuthority(authority);
        setRevealedFields((prev) => ({ ...prev, authority: true }));
      }, 420);

      /* stagger 3: expiry date */
      setTimeout(() => {
        setExpiryDate('2029-06-30');
        setRevealedFields((prev) => ({ ...prev, expiry: true }));
      }, 720);

      /* stagger 4: revision summary */
      setTimeout(() => {
        setRevealedFields((prev) => ({ ...prev, summary: true }));
      }, 980);
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



              {/* 4. Simulated AI Extraction Progress Indicator */}
              {isExtractingAi && (
                <div className="p-3 mb-3 bg-primary-subtle border border-primary-subtle rounded shadow-2xs">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="fw-bold text-primary small d-flex align-items-center gap-2">
                      <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
                      AI OCR Scanning &amp; Attribute Extraction in Progress...
                    </span>
                    <span className="badge bg-primary text-white font-mono-code">AI Processing</span>
                  </div>
                  {/* animated scan sweep bar */}
                  <div className="ai-scan-bar" />
                  <div className="font-mono-code text-muted small mt-2" style={{ fontSize: '0.75rem' }}>
                    Extracting Certificate Number, Issuing Authority, Expiry Date, and IACS Compliance Attributes from <strong>{fileName}</strong>...
                  </div>
                </div>
              )}

              {/* 5. AI Extracted Information Display & Preview Screen matching mockup */}
              {isAiExtracted && (
                <div className="map-extraction-preview-container p-4 mb-3">
                  {/* header accent and title */}
                  <div className="d-flex flex-wrap align-items-start justify-content-between border-bottom pb-3 mb-3">
                    <div>
                      <div className="map-extraction-header-accent" />
                      <h5 className="fw-bold text-dark m-0 mb-1">{title || 'Crew Medical Fitness (ENG1)'}</h5>
                      <div className="font-mono-code text-muted small" style={{ fontSize: '0.775rem' }}>
                        {(fileName || 'eng1-mendoza-scan.jpg')} · 640 KB · 1 page
                      </div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold lh-1" style={{ fontSize: '1.75rem', color: correctedFields.size > 0 ? '#059669' : aiOcrConfidence >= 90 ? '#059669' : '#c2410c' }}>
                        {correctedFields.size > 0 ? '100%' : `${aiOcrConfidence || 74}%`}
                      </div>
                      <div className="small lh-sm text-muted" style={{ fontSize: '0.675rem' }}>
                        overall confidence<br />threshold 90%
                      </div>
                    </div>
                  </div>

                  {/* 2-column preview layout */}
                  <div className="row g-4 mb-3">
                    {/* left column: scan thumbnail & quality checks */}
                    <div className="col-md-4 col-lg-3 d-flex flex-column gap-3">
                      <div
                        className="p-4 border rounded-3 text-center d-flex flex-column align-items-center justify-content-center bg-white shadow-2xs"
                        style={{ borderStyle: 'dashed', borderColor: '#cbd5e1', minHeight: '220px' }}
                      >
                        <div className="font-mono-code text-uppercase text-muted small fw-bold" style={{ fontSize: '0.725rem', letterSpacing: '0.08em' }}>
                          SCANNED PAGE
                        </div>
                        <div className="font-mono-code text-muted small mt-1" style={{ fontSize: '0.725rem' }}>
                          1 of 1
                        </div>
                      </div>

                      <div className="d-flex flex-column gap-2">
                        <div className="d-flex align-items-center gap-2 small" style={{ fontSize: '0.75rem', color: '#475569' }}>
                          <span className="d-flex align-items-center justify-content-center rounded text-white fw-bold" style={{ width: '18px', height: '18px', backgroundColor: '#059669', fontSize: '0.65rem' }}>✓</span>
                          <span>Resolution 240 DPI</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 small" style={{ fontSize: '0.75rem', color: '#475569' }}>
                          <span className="d-flex align-items-center justify-content-center rounded text-white fw-bold" style={{ width: '18px', height: '18px', backgroundColor: '#c2410c', fontSize: '0.65rem' }}>!</span>
                          <span>Full page captured</span>
                        </div>
                        <div className="d-flex align-items-center gap-2 small" style={{ fontSize: '0.75rem', color: '#475569' }}>
                          <span className="d-flex align-items-center justify-content-center rounded text-white fw-bold" style={{ width: '18px', height: '18px', backgroundColor: '#c2410c', fontSize: '0.65rem' }}>!</span>
                          <span>Signature / stamp present</span>
                        </div>
                      </div>
                    </div>

                    {/* right column: extracted fields with confidence bars & manual edit mode */}
                    <div className="col-md-8 col-lg-9 d-flex flex-column gap-1">
                      {/* cert number field */}
                      <div className={`map-extraction-field-row ${revealedFields.certNo ? 'ai-field-reveal ai-field-highlight' : ''}`} style={{ opacity: revealedFields.certNo ? 1 : 0 }}>
                        <div className="d-flex flex-column flex-grow-1 me-3">
                          <div className="font-mono-code text-uppercase small fw-bold mb-0.5" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            CERTIFICATE NUMBER / CREW ID
                          </div>
                          {isManualEditActive ? (
                            <input
                              type="text"
                              className="map-extraction-field-input"
                              value={certificateNo}
                              onChange={(e) => {
                                setCertificateNo(e.target.value);
                                setCorrectedFields((prev) => new Set(prev).add('certNo'));
                              }}
                              placeholder="Enter certificate number..."
                            />
                          ) : (
                            <div
                              className="font-mono-code fw-bold text-dark"
                              style={{ fontSize: '0.875rem', cursor: 'pointer' }}
                              onClick={() => setIsManualEditActive(true)}
                              title="Click to edit field manually"
                            >
                              {certificateNo || 'DNV-STAT-2026-99 (partially legible)'}
                            </div>
                          )}
                          {correctedFields.has('certNo') ? (
                            <div className="small mt-0.5 fw-bold text-success" style={{ fontSize: '0.7rem' }}>
                              ✓ Manually Corrected (100% Verified)
                            </div>
                          ) : (
                            <div className="small mt-0.5" style={{ fontSize: '0.7rem', color: '#b45309' }}>
                              Below 90% threshold — human review required
                            </div>
                          )}
                        </div>
                        <div className="d-flex flex-column align-items-end flex-shrink-0" style={{ width: '140px' }}>
                          <div className="w-100 bg-light rounded-pill overflow-hidden" style={{ height: '6px' }}>
                            <div className="h-100 rounded-pill transition-all" style={{ width: correctedFields.has('certNo') ? '100%' : '61%', backgroundColor: correctedFields.has('certNo') ? '#059669' : '#c2410c' }} />
                          </div>
                          <div className="font-mono-code small text-muted mt-1" style={{ fontSize: '0.725rem' }}>
                            {correctedFields.has('certNo') ? '100%' : '61%'}
                          </div>
                        </div>
                      </div>

                      {/* issuing authority field */}
                      <div className={`map-extraction-field-row ${revealedFields.authority ? 'ai-field-reveal ai-field-highlight' : ''}`} style={{ opacity: revealedFields.authority ? 1 : 0 }}>
                        <div className="d-flex flex-column flex-grow-1 me-3">
                          <div className="font-mono-code text-uppercase small fw-bold mb-0.5" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            ISSUING AUTHORITY
                          </div>
                          {isManualEditActive ? (
                            <input
                              type="text"
                              className="map-extraction-field-input"
                              value={issuingAuthority}
                              onChange={(e) => {
                                setIssuingAuthority(e.target.value);
                                setCorrectedFields((prev) => new Set(prev).add('authority'));
                              }}
                              placeholder="Enter issuing authority..."
                            />
                          ) : (
                            <div
                              className="font-mono-code fw-bold text-dark"
                              style={{ fontSize: '0.875rem', cursor: 'pointer' }}
                              onClick={() => setIsManualEditActive(true)}
                              title="Click to edit field manually"
                            >
                              {issuingAuthority || 'illegible stamp'}
                            </div>
                          )}
                          {correctedFields.has('authority') ? (
                            <div className="small mt-0.5 fw-bold text-success" style={{ fontSize: '0.7rem' }}>
                              ✓ Manually Corrected (100% Verified)
                            </div>
                          ) : (
                            <div className="small mt-0.5" style={{ fontSize: '0.7rem', color: '#b45309' }}>
                              Below 90% threshold — human review required
                            </div>
                          )}
                        </div>
                        <div className="d-flex flex-column align-items-end flex-shrink-0" style={{ width: '140px' }}>
                          <div className="w-100 bg-light rounded-pill overflow-hidden" style={{ height: '6px' }}>
                            <div className="h-100 rounded-pill transition-all" style={{ width: correctedFields.has('authority') ? '100%' : '44%', backgroundColor: correctedFields.has('authority') ? '#059669' : '#c2410c' }} />
                          </div>
                          <div className="font-mono-code small text-muted mt-1" style={{ fontSize: '0.725rem' }}>
                            {correctedFields.has('authority') ? '100%' : '44%'}
                          </div>
                        </div>
                      </div>

                      {/* expiry date field */}
                      <div className={`map-extraction-field-row ${revealedFields.expiry ? 'ai-field-reveal ai-field-highlight' : ''}`} style={{ opacity: revealedFields.expiry ? 1 : 0 }}>
                        <div className="d-flex flex-column flex-grow-1 me-3">
                          <div className="font-mono-code text-uppercase small fw-bold mb-0.5" style={{ fontSize: '0.65rem', color: '#64748b' }}>
                            EXPIRY DATE
                          </div>
                          {isManualEditActive ? (
                            <input
                              type="date"
                              className="map-extraction-field-input"
                              value={expiryDate}
                              onChange={(e) => {
                                setExpiryDate(e.target.value);
                                setCorrectedFields((prev) => new Set(prev).add('expiry'));
                              }}
                            />
                          ) : (
                            <div
                              className="font-mono-code fw-bold text-dark"
                              style={{ fontSize: '0.875rem', cursor: 'pointer' }}
                              onClick={() => setIsManualEditActive(true)}
                              title="Click to edit field manually"
                            >
                              {expiryDate || '2029-06-30'}
                            </div>
                          )}
                          {correctedFields.has('expiry') ? (
                            <div className="small mt-0.5 fw-bold text-success" style={{ fontSize: '0.7rem' }}>
                              ✓ Manually Corrected (100% Verified)
                            </div>
                          ) : (
                            <div className="small mt-0.5" style={{ fontSize: '0.7rem', color: '#b45309' }}>
                              Below 90% threshold — human review required
                            </div>
                          )}
                        </div>
                        <div className="d-flex flex-column align-items-end flex-shrink-0" style={{ width: '140px' }}>
                          <div className="w-100 bg-light rounded-pill overflow-hidden" style={{ height: '6px' }}>
                            <div className="h-100 rounded-pill transition-all" style={{ width: correctedFields.has('expiry') ? '100%' : '79%', backgroundColor: correctedFields.has('expiry') ? '#059669' : '#c2410c' }} />
                          </div>
                          <div className="font-mono-code small text-muted mt-1" style={{ fontSize: '0.725rem' }}>
                            {correctedFields.has('expiry') ? '100%' : '79%'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Exception Action Banner matching mockup */}
                  <div className="map-exception-banner">
                    <div>
                      <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.875rem', color: '#92400e' }}>
                        Exception identified — Submitter action required
                      </div>
                      <div className="small" style={{ fontSize: '0.775rem', color: '#b45309' }}>
                        Issuing authority illegible, crew ID partially legible, training completion date absent. Replace with a clearer scan or provide a renewed certificate.
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        className="btn btn-sm map-btn-outline-manual"
                        onClick={() => setIsManualEditActive(!isManualEditActive)}
                      >
                        {isManualEditActive ? 'Done Editing Fields' : 'Correct field manually'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm map-btn-orange-action"
                        onClick={() => {
                          setFileName('');
                          setIsAiExtracted(false);
                        }}
                      >
                        Upload replacement version
                      </button>
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
                  ' Upload Document'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Document File Preview & Verification Gate Popup Modal */}
      {isPendingVerification && (
        <div
          className="modal show d-block map-modal-backdrop"
          tabIndex={-1}
          style={{ zIndex: 1070 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsPendingVerification(false);
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-white text-dark border shadow-lg">
              {/* Header */}
              <div className="modal-header border-bottom bg-light d-flex align-items-center justify-content-between p-3">
                <div className="d-flex align-items-center gap-2">
                  <div className="p-2 rounded bg-primary-subtle text-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div>
                    <h5 className="modal-title fw-bold text-dark m-0">
                      Document Preview &amp; AI Extraction Verification Gate
                    </h5>
                    <div className="text-secondary small mt-0.5">
                      Verify document file scanning clarity before authorizing AI metadata extraction
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsPendingVerification(false)}
                  aria-label="Close"
                />
              </div>

              {/* Body */}
              <div className="modal-body p-4">
                <div className="bg-light border rounded p-3 mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-danger text-white font-mono-code" style={{ fontSize: '0.7rem' }}>PDF SCAN</span>
                      <span className="fw-bold text-dark font-mono-code">{fileName}</span>
                    </div>
                    <span className="badge bg-success text-white font-mono-code" style={{ fontSize: '0.7rem' }}>OCR LEGIBILITY: 100% CLEAR</span>
                  </div>

                  {/* Document Wireframe Scan Graphic */}
                  <div className="bg-white p-3 border rounded font-mono-code text-start" style={{ fontSize: '0.775rem', lineHeight: '1.5' }}>
                    <div className="text-uppercase fw-bold text-primary border-bottom pb-1 mb-2 d-flex justify-content-between">
                      <span>STATUTORY CERTIFICATE SCAN PREVIEW</span>
                      <span className="text-muted">PAGE 1 OF 1</span>
                    </div>
                    <div className="text-dark fw-bold">DOCUMENT TITLE: {title || 'MARITIME STATUTORY CERTIFICATE'}</div>
                    <div className="text-secondary mt-1">ENTITY TYPE: {entityType}</div>

                    <div className="p-2.5 bg-light border rounded mt-2.5 text-muted text-center" style={{ fontSize: '0.725rem' }}>
                      [ High resolution scan ready for automated AI OCR parsing &amp; metadata extraction ]
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-primary-subtle border border-primary-subtle rounded text-primary small d-flex align-items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Click <strong>Extract Specs &amp; Verify Document</strong> below to run AI OCR extraction and populate certificate attributes automatically.</span>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-top bg-light d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setIsPendingVerification(false)}
                >
                  Cancel / Back to Form
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-success fw-bold px-3 d-inline-flex align-items-center gap-1.5"
                  onClick={handleConfirmVerifyAndExtract}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Extract Specs &amp; Verify Document &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
