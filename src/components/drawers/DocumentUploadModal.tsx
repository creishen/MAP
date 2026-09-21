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
    }
  }, [isOpen, existingDocument, vessels, requirementTitle, defaultVesselId]);

  if (!isOpen) return null;

  const canUpload = activePersona === 'Administrator' || activePersona === 'Submitter';

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
      triggerAiExtraction(selectedFile.name);
    }
  };

  const handleSampleFileClick = (sampleName: string) => {
    triggerAiExtraction(sampleName);
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

              {/* 1. Document Title */}
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
                  disabled={isUploading || isExtractingAi || !!existingDocument}
                  required
                />
              </div>

              {/* 2. Target Vessel & Entity Type */}
              <div className="mb-3">
                <div className="col-6">
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

              {/* 3. Add File Picker & File Name Replacement Section */}
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
                    disabled={isUploading || isExtractingAi}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-primary text-white fw-bold px-3"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading || isExtractingAi}
                  >
                    Add File
                  </button>
                </div>

                {/* Quick File Selection Chips */}
                <div className="d-flex align-items-center gap-1.5 flex-wrap">
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

              {!isAiExtracted && !isExtractingAi && !existingDocument && (
                <div className="p-3 bg-light border border-dashed rounded text-center mb-3">
                  <div className="small fw-semibold text-dark">Upload a document file above to trigger AI Information Extraction</div>
                  <div className="text-secondary small mt-1" style={{ fontSize: '0.75rem' }}>
                    The AI system will automatically scan your file, extract the certificate number, issuing authority, and expiry date, and bind them as this document's master data.
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
