/* 
  file summary: interactive vessel capa re-inspection drawer supporting role-scoped read-only governance for c admin and full re-inspection sign-off for inspectors.
  responsibilities: presents capa finding details, role-based status decisions, evidence attachments, camera capture, and c admin re-inspection flagging.
  role in system: drawer overlay rendered in VesselDetailView and CapaManagementView.
*/

import React, { useState, useRef } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { CapaItem, CapaStatus, CapaEvidenceItem } from '../../types/capa';

interface CapaReinspectionDrawerProps {
  capa: CapaItem;
  onClose: () => void;
}

/**
  what: renders interactive capa re-inspection drawer for inspectors (editable) and c admins (read-only with flag action).
  how: checks activePersona context; inspectors can edit status, notes, evidence & endorse; c admins get read-only view with flag for re-inspection workflow.
  with what file: src/components/drawers/CapaReinspectionDrawer.tsx loaded by VesselDetailView.tsx and CapaManagementView.tsx.
*/
export const CapaReinspectionDrawer: React.FC<CapaReinspectionDrawerProps> = ({ capa, onClose }) => {
  const {
    activePersona,
    updateCapaStatus,
    addCapaEvidence,
    removeCapaEvidence,
    flagCapaForReinspection,
    logAuditEvent,
  } = useMapStore();

  const isInspector = activePersona === 'Inspector';
  const isAdminPersona = activePersona === 'C Admin' || activePersona === 'Administrator';

  /* local state for inspector edit controls */
  const [reInspectStatus, setReInspectStatus] = useState<CapaStatus>(capa.status);
  const [reInspectNotes, setReInspectNotes] = useState(capa.inspectorNotes || '');

  /* local state for admin flag workflow */
  const [cAdminReason, setCAdminReason] = useState(capa.cadminFlagReason || '');
  const [flagSuccessToast, setFlagSuccessToast] = useState(false);

  /* photo & file upload input refs */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  /* live camera modal state */
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotoDataUrl, setCapturedPhotoDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* inspector save re-inspection endorsement */
  const handleSaveReInspection = () => {
    updateCapaStatus(capa.id, reInspectStatus, reInspectNotes.trim() ? reInspectNotes.trim() : undefined);

    logAuditEvent({
      userId: 'USR-INSPEC-01',
      userRole: activePersona,
      organization: 'Meridian Marine Surveyors',
      action: `Re-Inspected CAPA (${capa.id})`,
      targetAsset: `${capa.vesselName} · ${capa.title}`,
      justificationNotes: `Updated CAPA ${capa.id} status to ${reInspectStatus}. Notes: ${reInspectNotes || 'Endorsed'}`,
    });

    alert(`Saved Re-Inspection status (${reInspectStatus}) for ${capa.id}.`);
    onClose();
  };

  /* admin flag for re-inspection handler */
  const handleFlagForReinspection = () => {
    flagCapaForReinspection(capa.id, cAdminReason);
    setFlagSuccessToast(true);
    setTimeout(() => setFlagSuccessToast(false), 3000);
  };

  /* trigger native mobile camera input */
  const handleTriggerCameraInput = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  /* process camera photo upload */
  const handleCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newEv: CapaEvidenceItem = {
        id: `EV-${Date.now().toString().slice(-4)}`,
        title: `Re-Inspection Photo (${timeStamp})`,
        type: 'Photo',
        fileName: file.name || `capa_photo_${Date.now()}.jpg`,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        previewUrl: dataUrl,
        uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        uploadedBy: activePersona === 'Inspector' ? 'Inspector Marcus Vance' : 'User Operations',
      };

      addCapaEvidence(capa.id, newEv);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  /* trigger general document file upload input */
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
    const newEv: CapaEvidenceItem = {
      id: `EV-${Date.now().toString().slice(-4)}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      type: isImage ? 'Photo' : 'Document',
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      uploadedBy: activePersona === 'Inspector' ? 'Inspector Marcus Vance' : 'User Operations',
    };

    addCapaEvidence(capa.id, newEv);
    e.target.value = '';
  };

  /* open live camera video stream modal */
  const openLiveCameraModal = async () => {
    setCapturedPhotoDataUrl(null);
    setIsCameraModalOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      closeCameraModal();
      handleTriggerCameraInput();
    }
  };

  /* take camera snapshot from live stream */
  const takeCameraSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedPhotoDataUrl(dataUrl);
    }
  };

  /* attach snapshot captured from live stream */
  const attachLiveSnapshot = () => {
    if (!capturedPhotoDataUrl) return;
    const timeStamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEv: CapaEvidenceItem = {
      id: `EV-${Date.now().toString().slice(-4)}`,
      title: `On-Site Photo (${timeStamp})`,
      type: 'Photo',
      fileName: `capa_photo_${Date.now().toString().slice(-4)}.jpg`,
      fileSize: '1.4 MB',
      previewUrl: capturedPhotoDataUrl,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      uploadedBy: 'Inspector Marcus Vance',
    };

    addCapaEvidence(capa.id, newEv);
    closeCameraModal();
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setCapturedPhotoDataUrl(null);
    setIsCameraModalOpen(false);
  };

  return (
    <>
      {/* hidden input triggers for file attachments and native camera capture */}
      <input
        type="file"
        ref={fileInputRef}
        className="d-none"
        onChange={handleDocumentFileChange}
        accept="image/*,.pdf,.doc,.docx"
      />
      <input
        type="file"
        ref={cameraInputRef}
        className="d-none"
        accept="image/*"
        capture="environment"
        onChange={handleCameraFileChange}
      />

      <div className="map-modal-backdrop" onClick={onClose} style={{ zIndex: 1040 }} />
      <div
        className="offcanvas offcanvas-end show bg-light text-dark border-start shadow-lg"
        style={{ width: '92vw', maxWidth: '850px', visibility: 'visible', zIndex: 1050 }}
        tabIndex={-1}
      >
        <div className="offcanvas-header border-bottom p-3 bg-white d-flex align-items-center justify-content-between">
          <div>
            <div className="font-mono-code text-uppercase small" style={{ fontSize: '0.725rem', color: '#94a3b8', letterSpacing: '0.05em' }}>
              {isInspector ? 'INSPECTOR RE-INSPECTION WORKFLOW' : 'CAPA MONITORING'} · {capa.id}
            </div>
            <h5 className="offcanvas-title fw-bold text-dark m-0" style={{ fontSize: '1.2rem' }}>
              {capa.title}
            </h5>
            <div className="font-mono-code small text-muted" style={{ fontSize: '0.75rem' }}>
              Vessel: {capa.vesselName} · Checklist Item: {capa.checklistItemTitle}
            </div>
          </div>
          <button type="button" className="btn-close ms-auto" onClick={onClose} aria-label="Close" />
        </div>

        <div className="offcanvas-body p-4" style={{ backgroundColor: '#f8fafc' }}>
          <div className="d-flex flex-column gap-4">

            {/* Flagged Alert Banner if C Admin requested re-inspection */}
            {capa.flaggedForReinspection && (
              <div className="p-3 rounded-3 bg-danger-subtle text-danger-emphasis border border-danger-subtle d-flex align-items-start gap-2.5">
                <div className="fw-bold fs-5 leading-none">🚩</div>
                <div className="flex-grow-1">
                  <div className="fw-bold" style={{ fontSize: '0.875rem' }}>
                    Flagged for Re-Inspection by C Admin
                  </div>
                  <div className="small mt-0.5" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                    {capa.cadminFlagReason || 'Re-inspection requested by C Admin charterer.'}
                  </div>
                  {capa.flaggedByCAdminDate && (
                    <div className="font-mono-code small text-muted mt-1" style={{ fontSize: '0.725rem' }}>
                      Flagged on: {capa.flaggedByCAdminDate}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Initial Finding Summary Box */}
            <div className="card map-card-custom p-3 bg-white">
              <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.85rem' }}>Original Survey Finding:</div>
              <div className="small text-secondary mb-3" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                {capa.findingDescription}
              </div>
              <div className="d-flex flex-wrap align-items-center justify-between gap-2 pt-2 border-top small text-muted" style={{ fontSize: '0.75rem' }}>
                <span>Responsible Owner: <strong className="text-dark">{capa.owner}</strong></span>
                <span>Target Due Date: <span className="font-mono-code fw-bold text-dark">{capa.dueDate}</span></span>
              </div>
            </div>

            {/* Inspector Status Evaluation Selector (Editable for Inspector, Read-only for C Admin) */}
            <div className="card map-card-custom p-3 bg-white">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <label className="form-label fw-bold text-dark small m-0">
                  Re-Inspection Status
                </label>
              </div>

              {isInspector ? (
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {(['Open', 'Under Re-Inspection', 'Verified & Closed', 'Rectification Required'] as CapaStatus[]).map((statusChoice) => (
                    <button
                      key={statusChoice}
                      type="button"
                      className={`btn btn-sm rounded-pill px-3 py-1.5 ${reInspectStatus === statusChoice ? 'btn-primary fw-semibold' : 'btn-light border text-secondary'}`}
                      style={{
                        fontSize: '0.775rem',
                        backgroundColor: reInspectStatus === statusChoice ? (statusChoice === 'Verified & Closed' ? '#059669' : 'rgb(11, 27, 43)') : '#f8fafc',
                        borderColor: reInspectStatus === statusChoice ? (statusChoice === 'Verified & Closed' ? '#059669' : 'rgb(11, 27, 43)') : '#e2e8f0',
                      }}
                      onClick={() => setReInspectStatus(statusChoice)}
                    >
                      {statusChoice}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mb-3">
                  <span
                    className={`badge ${capa.status === 'Verified & Closed'
                      ? 'bg-success-subtle text-success-emphasis border border-success-subtle'
                      : capa.status === 'Under Re-Inspection'
                        ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                        : 'bg-danger-subtle text-danger-emphasis border border-danger-subtle'
                      } px-3 py-1.5 font-mono-code`}
                    style={{ fontSize: '0.85rem' }}
                  >
                    {capa.status}
                  </span>
                </div>
              )}

              {/* Re-inspection notes text area (Editable for Inspector, Read-only for C Admin) */}
              <div className="mb-2">
                <label className="form-label fw-bold text-dark small mb-1">
                  Inspector Re-Inspection Notes & Finding Verification
                </label>
                {isInspector ? (
                  <textarea
                    className="form-control form-control-sm"
                    rows={3}
                    placeholder="Enter detailed re-inspection observations, physical condition checks, or reason for closure/rectification..."
                    value={reInspectNotes}
                    onChange={(e) => setReInspectNotes(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                ) : (
                  <div className="p-3 rounded-2 bg-light border text-secondary small" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                    {capa.inspectorNotes || 'No inspector verification notes recorded yet.'}
                  </div>
                )}
              </div>
            </div>

            {/* Supporting Evidence List & Camera Capture Section */}
            <div className="card map-card-custom p-3 bg-white">
              <div className="d-flex align-items-center justify-between mb-3 border-bottom pb-2">
                <div>
                  <h6 className="fw-bold text-dark m-0" style={{ fontSize: '0.9rem' }}>
                    Re-Inspection Supporting Evidence
                  </h6>
                  <div className="small text-muted" style={{ fontSize: '0.725rem' }}>
                    {isInspector ? 'Attach real-life photos or documents endorsing CAPA status' : 'Inspect evidence photos and documents uploaded by inspector'}
                  </div>
                </div>

                {/* Hide Upload & Camera buttons for C Admin */}
                {isInspector && (
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1.5"
                      onClick={openLiveCameraModal}
                      style={{ fontSize: '0.775rem' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                        <circle cx="12" cy="13" r="4" />
                      </svg>
                      Take Photo
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-light border text-secondary d-flex align-items-center gap-1.5"
                      onClick={handleTriggerFileInput}
                      style={{ fontSize: '0.775rem', backgroundColor: '#f8fafc' }}
                    >
                      + Attach File
                    </button>
                  </div>
                )}
              </div>

              {/* List of Evidence Items */}
              <div className="d-flex flex-wrap gap-2.5">
                {capa.evidences.map((ev) => (
                  <div key={ev.id} className="map-checklist-evidence-item shadow-2xs position-relative">
                    {ev.previewUrl ? (
                      <img src={ev.previewUrl} alt={ev.title} className="map-checklist-evidence-thumb" />
                    ) : (
                      <div
                        className="d-flex align-items-center justify-content-center rounded-2 flex-shrink-0"
                        style={{
                          width: '48px',
                          height: '48px',
                          backgroundColor: ev.type === 'Photo' ? '#e0f2fe' : '#f1f5f9',
                          border: '1px solid',
                          borderColor: ev.type === 'Photo' ? '#bae6fd' : '#cbd5e1',
                        }}
                      >
                        {ev.type === 'Photo' ? (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                            <circle cx="12" cy="13" r="4" />
                          </svg>
                        ) : (
                          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        )}
                      </div>
                    )}

                    <div className="d-flex flex-column flex-grow-1 overflow-hidden">
                      <span
                        className="font-mono-code fw-bold text-uppercase px-2 py-0.5 rounded align-self-start mb-0.5"
                        style={{
                          fontSize: '0.625rem',
                          backgroundColor: ev.type === 'Photo' ? '#e0f2fe' : '#f1f5f9',
                          color: ev.type === 'Photo' ? '#0369a1' : '#475569',
                        }}
                      >
                        {ev.type}
                      </span>
                      <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.825rem' }}>
                        {ev.title}
                      </div>
                      <div className="font-mono-code text-muted small text-truncate" style={{ fontSize: '0.675rem' }}>
                        {ev.fileName || ev.title}
                      </div>
                    </div>

                    {/* Remove 'x' button ONLY for Inspector */}
                    {isInspector && (
                      <button
                        type="button"
                        className="btn-close ms-auto flex-shrink-0 align-self-start"
                        style={{ fontSize: '0.6rem' }}
                        aria-label="Remove"
                        onClick={() => removeCapaEvidence(capa.id, ev.id)}
                      />
                    )}
                  </div>
                ))}

                {capa.evidences.length === 0 && (
                  <div className="text-muted small fst-italic py-2">
                    No supporting evidence files attached to this CAPA yet.
                  </div>
                )}
              </div>
            </div>

            {/* Action Footer: Endorse for Inspector vs Flag for Admin */}
            {isInspector ? (
              <button
                type="button"
                className="btn btn-warning w-100 py-2.5 fw-bold shadow-sm"
                onClick={handleSaveReInspection}
                style={{ fontSize: '0.9rem' }}
              >
                Endorse &amp; Save CAPA Re-Inspection Status
              </button>
            ) : isAdminPersona ? (
              <div className="card map-card-custom p-3 bg-white border border-primary-subtle">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <h6 className="fw-bold text-primary m-0" style={{ fontSize: '0.9rem' }}>
                    Admin Governance: Flag CAPA as Addressed
                  </h6>
                  {flagSuccessToast && (
                    <span className="badge bg-success text-white font-mono-code">
                      ✓ Flagged as Addressed — Inspector Notified!
                    </span>
                  )}
                </div>
                <div className="text-secondary small mb-2.5" style={{ fontSize: '0.775rem' }}>
                  Flag this CAPA item as addressed by the vessel operator to notify the assigned inspector for re-inspection verification.
                </div>
                <textarea
                  className="form-control form-control-sm mb-3"
                  rows={2}
                  placeholder="Enter resolution notes or details on how this finding was addressed for inspector..."
                  value={cAdminReason}
                  onChange={(e) => setCAdminReason(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
                <button
                  type="button"
                  className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                  style={{ backgroundColor: '#0284c7', borderColor: '#0284c7', fontSize: '0.875rem' }}
                  onClick={handleFlagForReinspection}
                >
                  {capa.flaggedForReinspection ? 'Update Addressed Notes & Notify Inspector' : 'Flag CAPA as Addressed (Notify Inspector)'}
                </button>
              </div>
            ) : null}

          </div>
        </div>
      </div>

      {/* Camera Live Stream Snapshot Modal */}
      {isCameraModalOpen && (
        <div className="map-modal-backdrop d-flex align-items-center justify-content-center p-3" style={{ zIndex: 1060 }}>
          <div className="map-camera-modal-dialog card p-3">
            <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-3">
              <h6 className="fw-bold text-dark m-0">Live Camera Photo Capture</h6>
              <button type="button" className="btn-close" onClick={closeCameraModal} aria-label="Close modal" />
            </div>

            <div className="d-flex flex-column align-items-center gap-3">
              {!capturedPhotoDataUrl ? (
                <>
                  <video ref={videoRef} autoPlay playsInline className="map-camera-video-preview" />
                  <canvas ref={canvasRef} className="d-none" />
                  <div className="d-flex justify-content-center flex-wrap gap-2 w-100">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={closeCameraModal}>
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        closeCameraModal();
                        handleTriggerCameraInput();
                      }}
                    >
                      Use Device Camera
                    </button>
                    <button type="button" className="btn btn-primary btn-sm px-4" onClick={takeCameraSnapshot}>
                      Snap Photo
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <img src={capturedPhotoDataUrl} alt="Captured preview" className="map-camera-video-preview" />
                  <div className="d-flex justify-content-center gap-2 w-100">
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setCapturedPhotoDataUrl(null)}>
                      Retake
                    </button>
                    <button type="button" className="btn btn-success btn-sm px-4" onClick={attachLiveSnapshot}>
                      Attach Photo
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
