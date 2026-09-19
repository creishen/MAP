/* 
  file summary: verifier split-screen document review drawer displaying simulated pdf canvas and extracted metadata controls in light theme.
  responsibilities: presents side-by-side pdf preview and 13/11 extracted attributes with high contrast verification action buttons.
  role in system: invoked from verifier workspace or document table row actions.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { MasterDocument } from '../../types/document';
import { ConfidenceBadge } from '../common/ConfidenceBadge';
import { formatMaritimeDate } from '../../utils/formatters';

interface DocumentReviewDrawerProps {
  document: MasterDocument | null;
  onClose: () => void;
}

/**
  what: renders split-screen document review drawer for verifiers in light theme.
  how: displays simulated pdf canvas on left panel and extracted attributes with verification controls on right panel.
  with what file: src/components/drawers/DocumentReviewDrawer.tsx loaded by VerifierWorkspaceView.tsx and DocumentTable.tsx.
*/
export const DocumentReviewDrawer: React.FC<DocumentReviewDrawerProps> = ({ document, onClose }) => {
  const { verifyDocument, activePersona } = useMapStore();
  const [comment, setComment] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!document) return null;

  const isCAdmin = activePersona === 'C Admin';

  const handleVerify = () => {
    verifyDocument(document.id, 'Verified', comment || 'Verified extracted attributes against class registry.');
    onClose();
  };

  const handleCorrection = () => {
    if (!comment.trim()) {
      setErrorMessage('Mandatory comment required when requesting correction.');
      return;
    }
    verifyDocument(document.id, 'Correction Requested', comment);
    onClose();
  };

  const handleReject = () => {
    if (!comment.trim()) {
      setErrorMessage('Mandatory comment required when rejecting document.');
      return;
    }
    verifyDocument(document.id, 'Rejected', comment);
    onClose();
  };

  return (
    <>
      <div className="map-modal-backdrop" onClick={onClose} style={{ zIndex: 1040 }} />
      <div
        className="offcanvas offcanvas-end show bg-white text-dark border-start shadow-lg"
        style={{ width: '90vw', maxWidth: '1200px', visibility: 'visible', zIndex: 1050 }}
        tabIndex={-1}
      >
        <div className="offcanvas-header border-bottom p-3 bg-light d-flex align-items-center justify-content-between">
          <div>
            <h5 className="offcanvas-title mb-1 d-flex align-items-center gap-2 font-weight-bold text-slate-900">
              <span>{document.title}</span>
              <span className="badge bg-secondary font-mono-code">{document.certificateNo}</span>
            </h5>
            <div className="text-secondary small">
              Entity: {document.entityType} | Version: {document.currentVersion}
            </div>
          </div>
          <button type="button" className="btn-close ms-auto" onClick={onClose} aria-label="Close" />
        </div>

        <div className="offcanvas-body p-3">
          {/* Prominent C Admin Read-Only Banner */}
          {isCAdmin && (
            <div className="map-cadmin-readonly-banner">
              <span>Read-Only Review Mode (C Admin Persona): Document modification controls disabled.</span>
            </div>
          )}

          <div className="map-verifier-split">
            {/* Left Panel: Simulated PDF Canvas Viewer */}
            <div className="map-pdf-viewer-sim">
              <div className="text-secondary small mb-2 text-uppercase font-weight-bold" style={{ letterSpacing: '0.05em' }}>
                Simulated Statutory PDF Viewer
              </div>
              <div className="map-pdf-page-sim">
                <div className="text-center border-bottom pb-3 mb-3">
                  <h4 className="fw-bold text-dark">{document.title}</h4>
                  <div className="text-muted small">ISSUED BY: {document.issuingAuthority}</div>
                </div>

                <div className="row g-3 text-dark small mb-4">
                  <div className="col-6">
                    <strong>Certificate Number:</strong>
                    <div className="font-mono-code">{document.certificateNo}</div>
                  </div>
                  <div className="col-6">
                    <strong>Expiry Date:</strong>
                    <div className="font-mono-code">{formatMaritimeDate(document.expiryDate)}</div>
                  </div>

                  {document.vesselAttributes && (
                    <>
                      <div className="col-6">
                        <strong>Vessel Name:</strong>
                        <div>{document.vesselAttributes.vesselName}</div>
                      </div>
                      <div className="col-6">
                        <strong>IMO Number:</strong>
                        <div className="font-mono-code">{document.vesselAttributes.imoNumber}</div>
                      </div>
                      <div className="col-6">
                        <strong>Flag State:</strong>
                        <div>{document.vesselAttributes.flagState}</div>
                      </div>
                      <div className="col-6">
                        <strong>Survey Date:</strong>
                        <div className="font-mono-code">{document.vesselAttributes.lastSurveyDate}</div>
                      </div>
                    </>
                  )}

                  {document.crewAttributes && (
                    <>
                      <div className="col-6">
                        <strong>Crew Member:</strong>
                        <div>{document.crewAttributes.crewName}</div>
                      </div>
                      <div className="col-6">
                        <strong>Rank:</strong>
                        <div>{document.crewAttributes.rank}</div>
                      </div>
                      <div className="col-6">
                        <strong>Passport ID:</strong>
                        <div className="font-mono-code">{document.crewAttributes.passportId}</div>
                      </div>
                      <div className="col-6">
                        <strong>Issuing Center:</strong>
                        <div>{document.crewAttributes.issuingCenter}</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-3 bg-light border rounded text-muted small">
                  This official statutory certificate is issued in compliance with IMO / SOLAS regulations.
                </div>
              </div>
            </div>

            {/* Right Panel: Extracted Metadata Attributes & Actions */}
            <div className="d-flex flex-column gap-3 overflow-y-auto">
              <div className="card map-card-custom">
                <div className="card-header d-flex align-items-center justify-between">
                  <span>Extracted Metadata Attributes</span>
                  <ConfidenceBadge score={document.ocrConfidence} />
                </div>
                <div className="card-body p-3">
                  {document.vesselAttributes && (
                    <div className="row g-2 small">
                      <div className="col-6 text-secondary">Certificate Number:</div>
                      <div className="col-6 font-mono-code text-primary fw-bold">{document.vesselAttributes.certificateNumber}</div>

                      <div className="col-6 text-secondary">Vessel Name:</div>
                      <div className="col-6 fw-semibold">{document.vesselAttributes.vesselName}</div>

                      <div className="col-6 text-secondary">IMO Number:</div>
                      <div className="col-6 font-mono-code">{document.vesselAttributes.imoNumber}</div>

                      <div className="col-6 text-secondary">Flag State:</div>
                      <div className="col-6">{document.vesselAttributes.flagState}</div>

                      <div className="col-6 text-secondary">Asset Match:</div>
                      <div className="col-6">
                        <span className="badge bg-success">100% Match Verified</span>
                      </div>

                      <div className="col-6 text-secondary">Expiry Date:</div>
                      <div className="col-6 font-mono-code">{formatMaritimeDate(document.vesselAttributes.expiryDate)}</div>
                    </div>
                  )}

                  {document.crewAttributes && (
                    <div className="row g-2 small">
                      <div className="col-6 text-secondary">Crew Name:</div>
                      <div className="col-6 fw-semibold">{document.crewAttributes.crewName}</div>

                      <div className="col-6 text-secondary">Rank:</div>
                      <div className="col-6">{document.crewAttributes.rank}</div>

                      <div className="col-6 text-secondary">Passport / ID:</div>
                      <div className="col-6 font-mono-code">{document.crewAttributes.passportId}</div>

                      <div className="col-6 text-secondary">Issuing Center:</div>
                      <div className="col-6">{document.crewAttributes.issuingCenter}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Validation Rules Panel */}
              <div className="card map-card-custom">
                <div className="card-header">Automated System Rules Check</div>
                <div className="card-body p-3 small">
                  <div className="d-flex align-items-center justify-between mb-2">
                    <span>100% Asset & Identifier Match</span>
                    <span className={document.validationRules.assetMatch100Percent ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                      {document.validationRules.assetMatch100Percent ? 'PASS [VALID]' : 'FAIL [INVALID]'}
                    </span>
                  </div>

                  <div className="d-flex align-items-center justify-between mb-2">
                    <span>IACS Recognized Issuing Authority</span>
                    <span className={document.validationRules.iacsAuthorityValid ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                      {document.validationRules.iacsAuthorityValid ? 'PASS [VALID]' : 'FAIL [INVALID]'}
                    </span>
                  </div>

                  <div className="d-flex align-items-center justify-between mb-2">
                    <span>6-Month Charter Buffer Rule</span>
                    <span className={document.validationRules.charterBufferPassed ? 'text-success fw-bold' : 'text-warning fw-bold'}>
                      {document.validationRules.charterBufferPassed ? 'PASS [VALID]' : 'BUFFER WARNING [ACTION REQUIRED]'}
                    </span>
                  </div>

                  {document.validationRules.exceptionDetails && (
                    <div className="p-2 bg-warning bg-opacity-25 text-dark border border-warning rounded mt-2">
                      {document.validationRules.exceptionDetails}
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Sticky Footer Controls */}
              {!isCAdmin && (
                <div className="p-3 bg-light border border-secondary rounded mt-auto">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="verifier-comments">
                    Verifier Decision Notes / Justification:
                  </label>
                  <textarea
                    id="verifier-comments"
                    className="form-control form-control-sm bg-white text-dark border-secondary mb-2"
                    rows={2}
                    placeholder="Enter comments or mandatory correction feedback..."
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setErrorMessage('');
                    }}
                  />

                  {errorMessage && (
                    <div className="text-danger small mb-2">{errorMessage}</div>
                  )}

                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-success flex-grow-1 text-white" onClick={handleVerify}>
                      Verify Certificate
                    </button>
                    <button type="button" className="btn btn-sm btn-warning text-dark flex-grow-1" onClick={handleCorrection}>
                      Request Correction
                    </button>
                    <button type="button" className="btn btn-sm btn-danger flex-grow-1 text-white" onClick={handleReject}>
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
