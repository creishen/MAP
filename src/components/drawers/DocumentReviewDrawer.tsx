/* 
  file summary: extraction review drawer matching exact mockup layout with document scan preview, OCR confidence scores, and action banner.
  responsibilities: presents OCR extraction review with confidence threshold progress bars, quality indicators, and verifier action controls.
  role in system: invoked from verifier workspace, document detail view, or requirements register.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { MasterDocument } from '../../types/document';
import { DocumentUploadModal } from './DocumentUploadModal';

interface DocumentReviewDrawerProps {
  document: MasterDocument | null;
  onClose: () => void;
}

interface ExtractedAttribute {
  id: string;
  label: string;
  value: string;
  confidence: number;
  isMandatoryMissing?: boolean;
}

/**
  what: renders extraction review modal drawer matching exact mockup layout.
  how: displays document metadata header, scanned page preview box with quality checks, OCR extracted attributes with progress bars, and exception action banner.
  with what file: src/components/drawers/DocumentReviewDrawer.tsx loaded by VerifierWorkspaceView.tsx and AssuranceDetailView.tsx.
*/
export const DocumentReviewDrawer: React.FC<DocumentReviewDrawerProps> = ({ document, onClose }) => {
  const { verifyDocument, activePersona } = useMapStore();
  const [comment, setComment] = useState('');
  const [showManualEdit, setShowManualEdit] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  if (!document) return null;

  const isVerified = document.verificationStatus === 'Verified';
  const canSubmit = activePersona === 'Submitter' || activePersona === 'Administrator';
  const canVerify = activePersona === 'Verifier' || activePersona === 'Administrator';

  const isReuploaded = document.versions.length > 1 || document.currentVersion !== 'v1.0' || (document.ocrConfidence && document.ocrConfidence >= 90);

  /* mock extracted attributes matching design screenshot */
  const extractedAttributes: ExtractedAttribute[] = document.crewAttributes
    ? [
      { id: '1', label: 'CREW MEMBER NAME', value: document.crewAttributes.crewName || 'A. Mendoza', confidence: isReuploaded ? 98 : 91 },
      { id: '2', label: 'CREW ID / PASSPORT NUMBER', value: isReuploaded ? (document.crewAttributes.passportId || 'P9912447') : `${document.crewAttributes.passportId || 'P9912447'} (partially legible)`, confidence: isReuploaded ? 98 : 61 },
      { id: '3', label: 'RANK / ROLE', value: document.crewAttributes.rank || 'Able Seafarer', confidence: isReuploaded ? 97 : 88 },
      { id: '4', label: 'CERTIFICATE TYPE', value: document.title || 'Medical Fitness Certificate', confidence: isReuploaded ? 99 : 94 },
      { id: '5', label: 'ISSUING AUTHORITY', value: isReuploaded ? (document.issuingAuthority || 'AMSA (Verified Seal)') : `${document.issuingAuthority || 'illegible stamp'}`, confidence: isReuploaded ? 97 : 44 },
      { id: '6', label: 'ISSUE DATE', value: '2024-11-02', confidence: isReuploaded ? 98 : 79 },
      { id: '7', label: 'EXPIRY DATE', value: '2026-10-29', confidence: isReuploaded ? 99 : 86 },
      { id: '8', label: 'VESSEL ASSIGNMENT', value: 'MV Torrens Supporter', confidence: isReuploaded ? 98 : 72 },
      { id: '9', label: 'NATIONALITY', value: 'Philippines', confidence: isReuploaded ? 98 : 90 },
      { id: '10', label: 'TRAINING COMPLETION DATE', value: isReuploaded ? '2024-10-15' : 'not present', confidence: isReuploaded ? 96 : 0, isMandatoryMissing: isReuploaded ? false : true },
    ]
    : [
      { id: '1', label: 'CERTIFICATE NUMBER', value: document.certificateNo || 'CERT-99412', confidence: isReuploaded ? 99 : 94 },
      { id: '2', label: 'VESSEL NAME', value: document.vesselAttributes?.vesselName || 'MV Torrens Supporter', confidence: isReuploaded ? 98 : 91 },
      { id: '3', label: 'IMO NUMBER', value: document.vesselAttributes?.imoNumber || 'IMO 9840123', confidence: isReuploaded ? 99 : 88 },
      { id: '4', label: 'ISSUING AUTHORITY', value: isReuploaded ? (document.issuingAuthority || 'DNV GL (Verified)') : (document.issuingAuthority || 'DNV GL (partially legible)'), confidence: isReuploaded ? 97 : 65 },
      { id: '5', label: 'EXPIRY DATE', value: document.expiryDate || '2026-10-29', confidence: isReuploaded ? 98 : 79 },
    ];

  const overallConfidence = isReuploaded ? 98 : (document.ocrConfidence || 74);

  const handleVerify = () => {
    verifyDocument(document.id, 'Verified', comment || 'Verified extracted document attributes.');
    onClose();
  };

  const handleCorrection = () => {
    verifyDocument(document.id, 'Correction Requested', comment || 'Issuing authority illegible, crew ID partially legible. Replace with clearer scan.');
    onClose();
  };

  return (
    <>
      <div className="map-modal-backdrop" onClick={onClose} style={{ zIndex: 1040 }} />
      <div
        className="offcanvas offcanvas-end show bg-white text-dark border-start shadow-lg"
        style={{ width: '92vw', maxWidth: '1240px', visibility: 'visible', zIndex: 1050 }}
        tabIndex={-1}
      >
        {/* drawer header: document title and overall confidence score */}
        <div className="offcanvas-header border-bottom p-4 bg-white d-flex align-items-start justify-content-between">
          <div>
            <h4 className="offcanvas-title fw-bold text-dark m-0 mb-1" style={{ fontSize: '1.25rem', letterSpacing: '-0.01em' }}>
              {document.title}
            </h4>
            <div className="font-mono-code small" style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
              {document.title.toLowerCase().replace(/\s+/g, '-')}-scan.jpg · 640 KB · {document.currentVersion}
            </div>
          </div>

          <div className="d-flex align-items-center gap-4">
            <div className="text-end">
              <div className="fw-bold lh-1" style={{ fontSize: '1.75rem', color: overallConfidence >= 90 ? '#059669' : '#c2410c' }}>
                {overallConfidence}%
              </div>
              <div className="small lh-sm text-muted" style={{ fontSize: '0.675rem' }}>
                overall confidence<br />threshold 90%
              </div>
            </div>
            <button type="button" className="btn-close ms-2" onClick={onClose} aria-label="Close" />
          </div>
        </div>

        {/* drawer body */}
        <div className="offcanvas-body p-4 d-flex flex-column justify-between" style={{ backgroundColor: '#fcfcfd' }}>
          <div className="row g-4 mb-4">
            {/* left column: scanned document page preview box & quality checks */}
            <div className="col-md-4 col-lg-3 d-flex flex-column gap-3">
              <div
                className="p-4 border rounded-3 text-center d-flex flex-column align-items-center justify-content-center bg-white shadow-2xs"
                style={{
                  borderStyle: 'dashed',
                  borderColor: '#cbd5e1',
                  minHeight: '260px',
                }}
              >
                <div className="font-mono-code text-uppercase text-muted small fw-bold" style={{ fontSize: '0.725rem', letterSpacing: '0.08em' }}>
                  SCANNED PAGE
                </div>
                <div className="font-mono-code text-muted small mt-1" style={{ fontSize: '0.725rem' }}>
                  1 of 1
                </div>
              </div>

              {/* quality checks list */}
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-center gap-2 small" style={{ fontSize: '0.75rem', color: '#475569' }}>
                  <span
                    className="d-flex align-items-center justify-content-center rounded text-white fw-bold"
                    style={{ width: '18px', height: '18px', backgroundColor: '#059669', fontSize: '0.65rem' }}
                  >
                    ✓
                  </span>
                  <span>Resolution 240 DPI</span>
                </div>
                <div className="d-flex align-items-center gap-2 small" style={{ fontSize: '0.75rem', color: '#475569' }}>
                  <span
                    className="d-flex align-items-center justify-content-center rounded text-white fw-bold"
                    style={{
                      width: '18px',
                      height: '18px',
                      backgroundColor: isReuploaded ? '#059669' : '#c2410c',
                      fontSize: '0.65rem',
                    }}
                  >
                    {isReuploaded ? '✓' : '!'}
                  </span>
                  <span>Full page captured</span>
                </div>
                <div className="d-flex align-items-center gap-2 small" style={{ fontSize: '0.75rem', color: '#475569' }}>
                  <span
                    className="d-flex align-items-center justify-content-center rounded text-white fw-bold"
                    style={{
                      width: '18px',
                      height: '18px',
                      backgroundColor: isReuploaded ? '#059669' : '#c2410c',
                      fontSize: '0.65rem',
                    }}
                  >
                    {isReuploaded ? '✓' : '!'}
                  </span>
                  <span>Signature / stamp present</span>
                </div>
              </div>
            </div>

            {/* right column: extracted metadata attributes & ocr confidence bars */}
            <div className="col-md-8 col-lg-9 d-flex flex-column gap-1">
              {extractedAttributes.map((attr) => {
                const isBelowThreshold = attr.confidence < 90 && attr.confidence > 0;
                const isMissing = attr.isMandatoryMissing;
                const barColor = isMissing ? '#e2e8f0' : attr.confidence >= 90 ? '#059669' : '#c2410c';

                return (
                  <div key={attr.id} className="py-2.5 border-bottom d-flex align-items-center justify-between gap-3">
                    <div className="d-flex flex-column">
                      <div className="font-mono-code text-uppercase small fw-bold mb-0.5" style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.06em' }}>
                        {attr.label}
                      </div>
                      <div
                        className={`font-mono-code fw-bold ${isMissing ? 'text-danger' : 'text-dark'}`}
                        style={{ fontSize: '0.875rem' }}
                      >
                        {attr.value}
                      </div>
                      {isBelowThreshold && (
                        <div className="small mt-0.5" style={{ fontSize: '0.7rem', color: '#b45309' }}>
                          Below 90% threshold — human review required
                        </div>
                      )}
                      {isMissing && (
                        <div className="small mt-0.5 fw-semibold" style={{ fontSize: '0.7rem', color: '#dc2626' }}>
                          Mandatory field missing
                        </div>
                      )}
                    </div>

                    {/* ocr confidence bar */}
                    <div className="d-flex flex-column align-items-end flex-shrink-0" style={{ width: '140px' }}>
                      <div className="w-100 bg-light rounded-pill overflow-hidden" style={{ height: '6px', backgroundColor: '#f1f5f9' }}>
                        <div
                          className="h-100 rounded-pill transition-all"
                          style={{
                            width: `${attr.confidence}%`,
                            backgroundColor: barColor,
                          }}
                        />
                      </div>
                      <div className="font-mono-code small text-muted mt-1" style={{ fontSize: '0.725rem' }}>
                        {attr.confidence}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Locked Notice if Verified */}
          {isVerified ? (
            <div
              className="p-3.5 rounded-3 d-flex align-items-center justify-content-between border shadow-2xs"
              style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
            >
              <div>
                <div className="fw-bold text-success-emphasis mb-0.5" style={{ fontSize: '0.875rem' }}>
                  Document Verified & Locked
                </div>
                <div style={{ fontSize: '0.75rem', color: '#166534', lineHeight: '1.4' }}>
                  This statutory document has been verified. Verified data cannot be altered or re-uploaded.
                </div>
              </div>
              <span className="badge bg-success text-white font-mono-code px-3 py-2" style={{ fontSize: '0.775rem' }}>
                Verified
              </span>
            </div>
          ) : (
            /* Bottom sticky exception action banner for unverified documents */
            <div
              className="p-3.5 rounded-3 d-flex flex-wrap align-items-center justify-content-between gap-3 border shadow-sm"
              style={{
                backgroundColor: '#fffbeb',
                borderColor: '#fde68a',
              }}
            >
              <div>
                <div className="fw-bold mb-0.5" style={{ fontSize: '0.875rem', color: '#92400e' }}>
                  Verification Pending / Exception Review
                </div>
                <div style={{ fontSize: '0.75rem', color: '#78350f', lineHeight: '1.4' }}>
                  Review extracted attributes. Verifiers may request correction or verify; Submitters can submit replacement revisions.
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                {canSubmit && (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary text-white px-3 py-2 fw-bold shadow-sm"
                    style={{ fontSize: '0.775rem' }}
                    onClick={() => setIsUploadModalOpen(true)}
                  >
                    Upload Replacement Revision
                  </button>
                )}
                {canVerify && (
                  <>
                    <button
                      type="button"
                      className="btn btn-sm text-white px-3 py-2 fw-bold shadow-sm"
                      style={{ fontSize: '0.775rem', backgroundColor: '#c2410c', borderColor: '#c2410c' }}
                      onClick={handleCorrection}
                    >
                      Request Correction
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-success text-white px-3 py-2 fw-bold shadow-sm"
                      style={{ fontSize: '0.775rem', backgroundColor: '#059669', borderColor: '#059669' }}
                      onClick={handleVerify}
                    >
                      Verify Document
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Master Document Upload & Replacement Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        existingDocument={document}
        onUploadComplete={() => {
          setIsUploadModalOpen(false);
          onClose();
        }}
      />
    </>
  );
};
