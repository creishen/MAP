/* 
  file summary: dedicated vessel capa tracking and re-inspection management view in light theme.
  responsibilities: presents vessel corrective actions (capa) queue, status filter tabs, interactive re-inspection drawer, real-life photo camera capture, and evidence attachment.
  role in system: full-page view rendered when clicking capa tracker in sidebar or inspector workspace (/capa or /capa/vesselName).
*/

import React, { useState, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';
import { getBackButtonInfo } from '../utils/rbacHelpers';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';
import { CapaItem, CapaStatus, CapaEvidenceItem } from '../types/capa';

interface CapaManagementViewProps {
  vesselName?: string;
}

/**
  what: renders dedicated vessel capa items list and inspector re-inspection workspace with camera evidence capture.
  how: filters store capaItems by vesselName and active status tab, allowing inspectors to re-inspect findings, update statuses, snap real-life photo evidence, and log immutable audit trail events.
  with what file: src/views/CapaManagementView.tsx loaded by App.tsx when currentHashView is capa or capas.
*/
export const CapaManagementView: React.FC<CapaManagementViewProps> = ({ vesselName }) => {
  const {
    capaItems,
    vessels,
    updateCapaStatus,
    addCapaEvidence,
    removeCapaEvidence,
    logAuditEvent,
    activePersona,
    setCurrentHashView,
    previousHashView,
    previousEntityId,
  } = useMapStore();

  const backInfo = getBackButtonInfo('inspector', 'Inspector Workspace', previousHashView, activePersona, previousEntityId);

  /* parse vesselName prop or target CAPA ID if passed as vesselName:capaId or CAPA ID */
  const rawProp = vesselName || '';
  let targetVesselName = rawProp;
  let targetCapaId: string | undefined = undefined;

  if (rawProp.includes(':')) {
    const parts = rawProp.split(':');
    targetVesselName = parts[0];
    targetCapaId = parts[1];
  } else if (rawProp.startsWith('CAPA-')) {
    targetCapaId = rawProp;
    const foundCapa = capaItems.find((c) => c.id === rawProp);
    if (foundCapa) {
      targetVesselName = foundCapa.vesselName;
    }
  }

  const isFleetOverview = targetVesselName === 'ALL_FLEET' || targetVesselName === 'All Vessels';
  const selectedVesselName = isFleetOverview
    ? 'All Fleet Vessels'
    : (targetVesselName || vessels[0]?.name || 'MV Pacific Endeavour');

  const vesselCapas = isFleetOverview
    ? capaItems
    : capaItems.filter(
      (c) => c.vesselName.toLowerCase() === selectedVesselName.toLowerCase()
    );

  /* filter & search state */
  const [activeTab, setActiveTab] = useState<'All' | CapaStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);

  /* re-inspection drawer state */
  const [activeCapa, setActiveCapa] = useState<CapaItem | null>(null);
  const [reInspectStatus, setReInspectStatus] = useState<CapaStatus>('Open');
  const [reInspectNotes, setReInspectNotes] = useState('');

  /* auto-open target CAPA item re-inspection drawer if targetCapaId is specified */
  React.useEffect(() => {
    if (targetCapaId) {
      const found = capaItems.find((c) => c.id === targetCapaId);
      if (found) {
        setActiveCapa(found);
        setReInspectStatus(found.status);
        setReInspectNotes(found.inspectorNotes || '');
      }
    }
  }, [targetCapaId, capaItems]);

  /* photo & file upload input refs */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  /* live camera modal state */
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedPhotoDataUrl, setCapturedPhotoDataUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* compute capa KPI counts */
  const totalCount = vesselCapas.length;
  const openCount = vesselCapas.filter((c) => c.status === 'Open').length;
  const reInspectionCount = vesselCapas.filter((c) => c.status === 'Under Re-Inspection').length;
  const closedCount = vesselCapas.filter((c) => c.status === 'Verified & Closed').length;

  /* apply search & status filtering */
  const filteredCapas = vesselCapas.filter((item) => {
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.checklistItemTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleExportCsv = () => {
    const exportData = filteredCapas.map((c) => ({
      CapaId: c.id,
      Vessel: c.vesselName,
      ChecklistItem: c.checklistItemTitle,
      Title: c.title,
      FindingDescription: c.findingDescription,
      Status: c.status,
      Owner: c.owner,
      DueDate: c.dueDate,
      InspectorNotes: c.inspectorNotes || 'None',
      EvidenceCount: c.evidences.length,
    }));
    exportToCsv(`${selectedVesselName.replace(/\s+/g, '_')}_CAPA_Report`, exportData);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['CAPA ID', 'Title & Checklist Link', 'Status & Owner', 'Notes & Details'];
    const rows = filteredCapas.map((c) => [
      c.id,
      `${c.title}\n(${c.checklistItemTitle})`,
      `${c.status}\nOwner: ${c.owner} · Due: ${c.dueDate}`,
      `Notes: ${c.inspectorNotes || 'Pending re-inspection'}\nEvidence Files: ${c.evidences.length}`,
    ]);
    exportToPdf(`${selectedVesselName} CAPA Re-Inspection Summary`, headers, rows);
    setIsExportOpen(false);
  };

  /* open re-inspection drawer for a capa item */
  const handleOpenReInspect = (capa: CapaItem) => {
    setActiveCapa(capa);
    setReInspectStatus(capa.status);
    setReInspectNotes(capa.inspectorNotes || '');
  };

  /* save re-inspection outcome */
  const handleSaveReInspection = () => {
    if (!activeCapa) return;
    updateCapaStatus(activeCapa.id, reInspectStatus, reInspectNotes.trim() ? reInspectNotes.trim() : undefined);

    logAuditEvent({
      userId: 'USR-INSPEC-01',
      userRole: activePersona,
      organization: 'Meridian Marine Surveyors',
      action: `Re-Inspected CAPA (${activeCapa.id})`,
      targetAsset: `${selectedVesselName} · ${activeCapa.title}`,
      justificationNotes: `Updated CAPA ${activeCapa.id} status to ${reInspectStatus}. Notes: ${reInspectNotes || 'Endorsed'}`,
    });

    alert(`Saved Re-Inspection status (${reInspectStatus}) for ${activeCapa.id}.`);
    setActiveCapa(null);
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
    if (!file || !activeCapa) return;

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
        uploadedBy: 'Inspector Marcus Vance',
      };

      addCapaEvidence(activeCapa.id, newEv);

      /* update active capa state locally for responsive UI update */
      setActiveCapa((prev) => (prev ? { ...prev, evidences: [...prev.evidences, newEv] } : prev));

      logAuditEvent({
        userId: 'USR-INSPEC-01',
        userRole: activePersona,
        organization: 'Meridian Marine Surveyors',
        action: `Attached Photo Evidence for ${activeCapa.id}`,
        targetAsset: `${selectedVesselName} · ${activeCapa.id}`,
        justificationNotes: `Uploaded photo evidence: ${newEv.fileName}`,
      });

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
    if (!file || !activeCapa) return;

    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name);
    const newEv: CapaEvidenceItem = {
      id: `EV-${Date.now().toString().slice(-4)}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      type: isImage ? 'Photo' : 'Document',
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      uploadedBy: 'Inspector Marcus Vance',
    };

    addCapaEvidence(activeCapa.id, newEv);
    setActiveCapa((prev) => (prev ? { ...prev, evidences: [...prev.evidences, newEv] } : prev));

    logAuditEvent({
      userId: 'USR-INSPEC-01',
      userRole: activePersona,
      organization: 'Meridian Marine Surveyors',
      action: `Attached ${newEv.type} Evidence for ${activeCapa.id}`,
      targetAsset: `${selectedVesselName} · ${activeCapa.id}`,
      justificationNotes: `Uploaded ${newEv.type} evidence file: ${newEv.fileName}`,
    });

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
      /* camera video stream unavailable, fallback to direct device camera file input */
      console.warn('live camera video stream unaccessible, falling back to camera input');
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
    if (!capturedPhotoDataUrl || !activeCapa) return;
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

    addCapaEvidence(activeCapa.id, newEv);
    setActiveCapa((prev) => (prev ? { ...prev, evidences: [...prev.evidences, newEv] } : prev));

    logAuditEvent({
      userId: 'USR-INSPEC-01',
      userRole: activePersona,
      organization: 'Meridian Marine Surveyors',
      action: `Captured Live Photo Evidence for ${activeCapa.id}`,
      targetAsset: `${selectedVesselName} · ${activeCapa.id}`,
      justificationNotes: `Attached live webcam photo for ${activeCapa.id}`,
    });

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

  const handleRemoveEv = (capaId: string, evId: string) => {
    removeCapaEvidence(capaId, evId);
    setActiveCapa((prev) => (prev ? { ...prev, evidences: prev.evidences.filter((e) => e.id !== evId) } : prev));
  };

  return (
    <div className="d-flex flex-column gap-4">
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

      {/* Top Header & Context Banner */}
      <div className="card map-card-custom map-checklist-card bg-white">
        <div className="d-flex flex-wrap align-items-center justify-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div>
              <h5 className="fw-bold text-dark m-0" style={{ fontSize: '1.25rem' }}>
                Corrective Actions (CAPA) & Re-Inspection Registry
              </h5>
              <div className="font-mono-code small text-muted mt-0.5" style={{ fontSize: '0.75rem' }}>
                Vessel: <span className="fw-bold text-primary">{selectedVesselName}</span> · Active Survey CAPA Audit Queue
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 ms-auto">
            {/* Vessel Selector dropdown */}
            <select
              className="form-select form-select-sm fw-semibold"
              value={selectedVesselName}
              onChange={(e) => setCurrentHashView('capas', e.target.value)}
              style={{ fontSize: '0.8125rem', minWidth: '200px' }}
            >
              {vessels.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} ({v.flagState})
                </option>
              ))}
            </select>

            <div className="dropdown position-relative">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle"
                onClick={() => setIsExportOpen(!isExportOpen)}
              >
                Export CAPA Report
              </button>
              {isExportOpen && (
                <ul className="dropdown-menu dropdown-menu-light show position-absolute end-0 mt-1 shadow border" style={{ zIndex: 1050 }}>
                  <li>
                    <button type="button" className="dropdown-item small" onClick={handleExportCsv}>
                      Export as CSV (.csv)
                    </button>
                  </li>
                  <li>
                    <button type="button" className="dropdown-item small" onClick={handleExportPdf}>
                      Export as PDF (.pdf)
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CAPA Metric KPI Cards */}
      <div className="row g-3">
        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Total Vessel CAPAs
            </div>
            <div className="display-6 fw-bold text-primary font-mono-code mt-1">{totalCount}</div>
            <div className="text-muted small mt-1">Total Logged Corrective Actions</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Open Findings
            </div>
            <div className="display-6 fw-bold text-danger font-mono-code mt-1">{openCount}</div>
            <div className="text-muted small mt-1">Awaiting Rectification</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Under Re-Inspection
            </div>
            <div className="display-6 fw-bold text-warning font-mono-code mt-1">{reInspectionCount}</div>
            <div className="text-muted small mt-1">Inspector Verification Pending</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Verified & Closed
            </div>
            <div className="display-6 fw-bold text-success font-mono-code mt-1">{closedCount}</div>
            <div className="text-muted small mt-1">Signed Off & Compliant</div>
          </div>
        </div>
      </div>

      {/* Main CAPA Registry Card */}
      <div className="card map-card-custom map-checklist-card">
        {/* Controls Header: Status Filter Pills & Search */}
        <div className="d-flex flex-wrap align-items-center justify-between gap-3 mb-4 pb-3 border-bottom">
          <div className="d-flex align-items-center gap-1.5 flex-wrap">
            {(['All', 'Open', 'Under Re-Inspection', 'Verified & Closed'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1.5 ${activeTab === tab ? 'btn-primary fw-semibold' : 'btn-light text-secondary border'}`}
                style={{
                  fontSize: '0.775rem',
                  backgroundColor: activeTab === tab ? 'rgb(11, 27, 43)' : '#f8fafc',
                  borderColor: activeTab === tab ? 'rgb(11, 27, 43)' : '#e2e8f0',
                }}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'All' ? 'All CAPAs' : tab}
              </button>
            ))}
          </div>

          <div style={{ maxWidth: '280px', width: '100%' }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search CAPA code, title, owner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.8125rem' }}
            />
          </div>
        </div>

        {/* CAPA Item List */}
        <div className="d-flex flex-column gap-3.5">
          {filteredCapas.map((capa) => (
            <div key={capa.id} className="map-checklist-item-container">
              <div className="d-flex flex-wrap align-items-start justify-content-between gap-2 mb-2">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <span className="font-mono-code fw-bold text-primary" style={{ fontSize: '0.9rem' }}>
                      {capa.id}
                    </span>
                    <span className="badge bg-light text-dark border font-mono-code" style={{ fontSize: '0.7rem' }}>
                      Linked {capa.checklistId || 'General Audit'}
                    </span>
                  </div>
                  <h6 className="fw-bold text-dark m-0" style={{ fontSize: '1rem' }}>
                    {capa.title}
                  </h6>
                  <div className="small text-secondary mt-0.5" style={{ fontSize: '0.775rem' }}>
                    Checklist Point: <span className="fw-semibold text-dark">{capa.checklistItemTitle}</span>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span
                    className={`badge ${capa.status === 'Verified & Closed'
                      ? 'bg-success-subtle text-success-emphasis border border-success-subtle'
                      : capa.status === 'Under Re-Inspection'
                        ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                        : capa.status === 'Rectification Required'
                          ? 'bg-danger-subtle text-danger-emphasis border border-danger-subtle'
                          : 'bg-secondary-subtle text-secondary-emphasis border'
                      } px-3 py-1.5 font-mono-code`}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {capa.status}
                  </span>
                </div>
              </div>

              {/* Finding Description callout */}
              <div className="p-3 rounded-2 mb-3 bg-light border">
                <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.775rem' }}>Finding Description:</div>
                <div className="small text-secondary" style={{ fontSize: '0.775rem', lineHeight: '1.4' }}>
                  {capa.findingDescription}
                </div>
              </div>

              {/* Owner, Target Date & Evidence Metadata Bar */}
              <div className="d-flex flex-wrap align-items-center justify-between gap-3 mb-3 small text-secondary" style={{ fontSize: '0.75rem' }}>
                <div>Responsible Owner: <strong className="text-dark">{capa.owner}</strong></div>
                <div>Target Completion Due: <span className="font-mono-code fw-bold text-dark">{capa.dueDate}</span></div>
                <div>Supporting Evidence Files: <strong className="text-primary">{capa.evidences.length} Attached</strong></div>
              </div>

              {/* Supporting Evidence Thumbnails */}
              {capa.evidences.length > 0 && (
                <div className="mb-3 pt-2 border-top">
                  <div className="font-mono-code text-uppercase small mb-2" style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.05em' }}>
                    CAPA Evidence ({capa.evidences.length})
                  </div>
                  <div className="d-flex flex-wrap gap-2">
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
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Inspector Action Toolbar */}
              <div className="map-checklist-action-toolbar pt-2 border-top">
                <button
                  type="button"
                  className="btn btn-sm btn-primary d-flex align-items-center gap-1.5 fw-semibold ms-auto"
                  onClick={() => handleOpenReInspect(capa)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Re-Inspect CAPA & Endorse Evidence
                </button>
              </div>
            </div>
          ))}

          {filteredCapas.length === 0 && (
            <div className="text-muted small text-center py-5 fst-italic">
              No corrective action items match the active status or search filter for {selectedVesselName}.
            </div>
          )}
        </div>
      </div>

      {/* Interactive CAPA Re-Inspection Drawer / Modal */}
      {activeCapa && (
        <>
          <div className="map-modal-backdrop" onClick={() => setActiveCapa(null)} style={{ zIndex: 1040 }} />
          <div
            className="offcanvas offcanvas-end show bg-light text-dark border-start shadow-lg"
            style={{ width: '92vw', maxWidth: '850px', visibility: 'visible', zIndex: 1050 }}
            tabIndex={-1}
          >
            <div className="offcanvas-header border-bottom p-3 bg-white d-flex align-items-center justify-content-between">
              <div>
                <div className="font-mono-code text-uppercase small" style={{ fontSize: '0.725rem', color: '#94a3b8', letterSpacing: '0.05em' }}>
                  INSPECTOR RE-INSPECTION WORKFLOW · {activeCapa.id}
                </div>
                <h5 className="offcanvas-title fw-bold text-dark m-0" style={{ fontSize: '1.2rem' }}>
                  {activeCapa.title}
                </h5>
                <div className="font-mono-code small text-muted" style={{ fontSize: '0.75rem' }}>
                  Vessel: {activeCapa.vesselName} · Linked Point: {activeCapa.checklistItemTitle}
                </div>
              </div>
              <button type="button" className="btn-close ms-auto" onClick={() => setActiveCapa(null)} aria-label="Close" />
            </div>

            <div className="offcanvas-body p-4" style={{ backgroundColor: '#f8fafc' }}>
              <div className="d-flex flex-column gap-4">
                {/* Initial Finding Summary Box */}
                <div className="card map-card-custom p-3 bg-white">
                  <div className="fw-bold text-dark mb-1" style={{ fontSize: '0.85rem' }}>Original Survey Finding:</div>
                  <div className="small text-secondary mb-3" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                    {activeCapa.findingDescription}
                  </div>
                  <div className="d-flex flex-wrap align-items-center justify-between gap-2 pt-2 border-top small text-muted" style={{ fontSize: '0.75rem' }}>
                    <span>Responsible Owner: <strong className="text-dark">{activeCapa.owner}</strong></span>
                    <span>Target Due Date: <span className="font-mono-code fw-bold text-dark">{activeCapa.dueDate}</span></span>
                  </div>
                </div>

                {/* Inspector Status Evaluation Selector */}
                <div className="card map-card-custom p-3 bg-white">
                  <label className="form-label fw-bold text-dark small mb-2">
                    Inspector Re-Inspection Status Decision
                  </label>

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

                  {/* Re-inspection notes text area */}
                  <div className="mb-2">
                    <label className="form-label fw-bold text-dark small mb-1">
                      Inspector Re-Inspection Notes & Finding Verification
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      rows={3}
                      placeholder="Enter detailed re-inspection observations, physical condition checks, or reason for closure/rectification..."
                      value={reInspectNotes}
                      onChange={(e) => setReInspectNotes(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>
                </div>

                {/* Supporting Evidence List & Camera Capture Section */}
                <div className="card map-card-custom p-3 bg-white">
                  <div className="d-flex align-items-center justify-between mb-3 border-bottom pb-2">
                    <div>
                      <h6 className="fw-bold text-dark m-0" style={{ fontSize: '0.9rem' }}>
                        Re-Inspection Supporting Evidence ({activeCapa.evidences.length})
                      </h6>
                      <div className="small text-muted" style={{ fontSize: '0.725rem' }}>
                        Attach real-life photos or documents endorsing CAPA status
                      </div>
                    </div>

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
                  </div>

                  {/* List of Evidence Items */}
                  <div className="d-flex flex-wrap gap-2.5">
                    {activeCapa.evidences.map((ev) => (
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

                        <button
                          type="button"
                          className="btn-close ms-auto flex-shrink-0 align-self-start"
                          style={{ fontSize: '0.6rem' }}
                          aria-label="Remove evidence"
                          onClick={() => handleRemoveEv(activeCapa.id, ev.id)}
                        />
                      </div>
                    ))}

                    {activeCapa.evidences.length === 0 && (
                      <div className="text-muted small fst-italic py-2">
                        No supporting evidence files attached to this CAPA yet. Use Take Photo or Attach File above.
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Re-Inspection Endorsement */}
                <button
                  type="button"
                  className="btn btn-warning w-100 py-2.5 fw-bold shadow-sm"
                  onClick={handleSaveReInspection}
                  style={{ fontSize: '0.9rem' }}
                >
                  Endorse & Save CAPA Re-Inspection Status
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
    </div>
  );
};
