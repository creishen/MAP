/* 
  file summary: physical vessel inspection checklist modal drawer matching exact mockup design.
  responsibilities: presents split-screen visual survey checklist, item-level evidence management with simulated file upload, inline finding comments, direct CAPA creation per item, and dark inspection result submission.
  role in system: used by inspector workspace view.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';

interface EvidenceItem {
  id: string;
  title: string;
  type: 'Photo' | 'Document';
  fileName?: string;
  fileSize?: string;
}

interface InspectionItem {
  id: string;
  title: string;
  subtitle: string;
  status: 'Satisfactory' | 'Observation' | 'Deficiency';
  findingNotes?: string;
  capaCode?: string;
  evidences: EvidenceItem[];
}

interface CapaActionItem {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: 'Open' | 'Closed';
}

interface InspectionDrawerProps {
  vesselName: string;
  onClose: () => void;
}

/**
  what: renders visual vessel inspection split-screen modal drawer matching exact mockup layout.
  how: manages local state for 5 inspection items with item-level evidence attachments, simulated file uploads, finding comments, direct CAPA creation per item, and dark inspection result selector.
  with what file: src/components/drawers/InspectionDrawer.tsx loaded by InspectorWorkspaceView.tsx.
*/
export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({ vesselName, onClose }) => {
  const { logAuditEvent, activePersona } = useMapStore();

  const [items, setItems] = useState<InspectionItem[]>([
    {
      id: 'INS-01',
      title: 'Life-saving appliances — stowage and condition',
      subtitle: 'SOLAS III · LSA record',
      status: 'Satisfactory',
      evidences: [
        { id: 'EV-101', title: 'LSA locker photo', type: 'Photo', fileName: 'lsa_locker_01.jpg', fileSize: '2.4 MB' },
      ],
    },
    {
      id: 'INS-02',
      title: 'Fire-fighting equipment and fixed systems',
      subtitle: 'SOLAS II-2 · FFE plan',
      status: 'Satisfactory',
      evidences: [
        { id: 'EV-102', title: 'FFE station 3 tag', type: 'Photo', fileName: 'ffe_station3.jpg', fileSize: '1.8 MB' },
      ],
    },
    {
      id: 'INS-03',
      title: 'Liferaft hydrostatic release units',
      subtitle: 'Service due check',
      status: 'Observation',
      findingNotes: 'Port-side liferaft HRU service date exceeded by 3 weeks. Replacement unit on order; corrective action CAPA-118 raised.',
      capaCode: 'CAPA-118',
      evidences: [
        { id: 'EV-103', title: 'Liferaft HRU tag', type: 'Photo', fileName: 'hru_tag_port.jpg', fileSize: '3.1 MB' },
        { id: 'EV-104', title: 'Service cert scan', type: 'Document', fileName: 'hru_cert_2026.pdf', fileSize: '450 KB' },
      ],
    },
    {
      id: 'INS-04',
      title: 'Deck cargo securing arrangements',
      subtitle: 'Cargo securing manual',
      status: 'Satisfactory',
      evidences: [
        { id: 'EV-105', title: 'Deck securing photo', type: 'Photo', fileName: 'deck_securing_aft.jpg', fileSize: '2.9 MB' },
      ],
    },
    {
      id: 'INS-05',
      title: 'Crew familiarity — muster and abandon ship',
      subtitle: 'ISM · drill records',
      status: 'Satisfactory',
      evidences: [
        { id: 'EV-106', title: 'Muster drill log sheet', type: 'Document', fileName: 'muster_log_sep2026.pdf', fileSize: '620 KB' },
      ],
    },
  ]);

  const [selectedResult, setSelectedResult] = useState<'Pass' | 'Pass with observations' | 'Fail'>('Pass with observations');

  /* state for corrective actions */
  const [capaActions, setCapaActions] = useState<CapaActionItem[]>([
    {
      id: 'CAPA-118',
      title: 'Replace port liferaft HRU',
      owner: 'Northwind Technical Services',
      dueDate: '30 Sep 2026',
      status: 'Open',
    },
    {
      id: 'CAPA-114',
      title: 'Update cargo securing manual revision',
      owner: 'Northwind Marine',
      dueDate: '12 Sep 2026',
      status: 'Closed',
    },
  ]);

  /* state for general new capa item form */
  const [showAddCapa, setShowAddCapa] = useState(false);
  const [newCapaTitle, setNewCapaTitle] = useState('');
  const [newCapaOwner, setNewCapaOwner] = useState('');
  const [newCapaDueDate, setNewCapaDueDate] = useState('');

  /* state for evidence upload form per item */
  const [activeEvidenceItemId, setActiveEvidenceItemId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [newEvidenceTitle, setNewEvidenceTitle] = useState('');
  const [newEvidenceType, setNewEvidenceType] = useState<'Photo' | 'Document'>('Photo');
  const [isUploading, setIsUploading] = useState(false);

  /* state for comment editing per item */
  const [activeCommentItemId, setActiveCommentItemId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  /* state for direct item capa creation */
  const [activeItemCapaId, setActiveItemCapaId] = useState<string | null>(null);
  const [itemCapaTitle, setItemCapaTitle] = useState('');
  const [itemCapaOwner, setItemCapaOwner] = useState('');
  const [itemCapaDueDate, setItemCapaDueDate] = useState('');

  const handleStatusChange = (id: string, newStatus: 'Satisfactory' | 'Observation' | 'Deficiency') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  /* handle simulated file selection from input */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setNewEvidenceTitle(file.name);
      if (file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(file.name)) {
        setNewEvidenceType('Photo');
      } else {
        setNewEvidenceType('Document');
      }
    }
  };

  /* handle simulated evidence file upload */
  const handleAddEvidence = (itemId: string) => {
    const titleToUse = newEvidenceTitle.trim() || selectedFile?.name || 'Evidence Attachment';
    setIsUploading(true);

    setTimeout(() => {
      const formattedSize = selectedFile
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : '1.5 MB';

      const newEv: EvidenceItem = {
        id: `EV-${Date.now().toString().slice(-4)}`,
        title: titleToUse,
        type: newEvidenceType,
        fileName: selectedFile?.name || `${titleToUse.toLowerCase().replace(/\s+/g, '_')}.jpg`,
        fileSize: formattedSize,
      };

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? { ...item, evidences: [...item.evidences, newEv] }
            : item
        )
      );

      logAuditEvent({
        userId: 'USR-INSPEC-01',
        userRole: activePersona,
        organization: 'Meridian Marine Surveyors',
        action: `Uploaded ${newEvidenceType} Evidence for ${itemId}`,
        targetAsset: vesselName,
        justificationNotes: `Attached file: ${newEv.fileName} (${newEv.fileSize})`,
      });

      setIsUploading(false);
      setSelectedFile(null);
      setNewEvidenceTitle('');
      setActiveEvidenceItemId(null);
    }, 500);
  };

  /* remove evidence item */
  const handleRemoveEvidence = (itemId: string, evidenceId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, evidences: item.evidences.filter((ev) => ev.id !== evidenceId) }
          : item
      )
    );
  };

  /* save comment / finding note for an item */
  const handleSaveComment = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, findingNotes: commentInput.trim() || undefined } : item
      )
    );

    logAuditEvent({
      userId: 'USR-INSPEC-01',
      userRole: activePersona,
      organization: 'Meridian Marine Surveyors',
      action: `Updated Comment for ${itemId}`,
      targetAsset: vesselName,
      justificationNotes: `Finding comment saved for ${itemId}`,
    });

    setActiveCommentItemId(null);
    setCommentInput('');
  };

  /* raise corrective action directly for a checklist item */
  const handleRaiseItemCapa = (item: InspectionItem) => {
    if (!itemCapaTitle.trim()) return;

    const nextCapaNum = 119 + capaActions.length;
    const capaCode = `CAPA-${nextCapaNum}`;
    const newCapa: CapaActionItem = {
      id: capaCode,
      title: itemCapaTitle.trim(),
      owner: itemCapaOwner.trim() || 'Inspector Assigned',
      dueDate: itemCapaDueDate || '30 Oct 2026',
      status: 'Open',
    };

    /* add to global capa list and link to item */
    setCapaActions((prev) => [newCapa, ...prev]);
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, capaCode: capaCode } : it))
    );

    logAuditEvent({
      userId: 'USR-INSPEC-01',
      userRole: activePersona,
      organization: 'Meridian Marine Surveyors',
      action: `Raised ${capaCode} for ${item.id}`,
      targetAsset: vesselName,
      justificationNotes: `CAPA ${capaCode} linked to ${item.title}`,
    });

    setActiveItemCapaId(null);
    setItemCapaTitle('');
    setItemCapaOwner('');
    setItemCapaDueDate('');
  };

  /* add a general new corrective action item */
  const handleAddCapaItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCapaTitle.trim()) return;

    const nextCapaNum = 119 + capaActions.length;
    const newCapa: CapaActionItem = {
      id: `CAPA-${nextCapaNum}`,
      title: newCapaTitle.trim(),
      owner: newCapaOwner.trim() || 'Inspector Assigned',
      dueDate: newCapaDueDate || '30 Oct 2026',
      status: 'Open',
    };

    setCapaActions((prev) => [newCapa, ...prev]);

    logAuditEvent({
      userId: 'USR-INSPEC-01',
      userRole: activePersona,
      organization: 'Meridian Marine Surveyors',
      action: `Created Corrective Action ${newCapa.id}`,
      targetAsset: vesselName,
      justificationNotes: `CAPA raised: ${newCapa.title} (Owner: ${newCapa.owner})`,
    });

    setNewCapaTitle('');
    setNewCapaOwner('');
    setNewCapaDueDate('');
    setShowAddCapa(false);
  };

  const handleSubmitOutcome = () => {
    logAuditEvent({
      userId: 'USR-INSPEC-01',
      userRole: activePersona,
      organization: 'Meridian Marine Surveyors',
      action: `Submitted Visual Survey Outcome (${selectedResult})`,
      targetAsset: vesselName,
      justificationNotes: `Inspection outcome submitted: ${selectedResult}`,
    });
    alert(`Submitted Inspection Outcome: ${selectedResult} for ${vesselName}.`);
    onClose();
  };

  return (
    <>
      <div className="map-modal-backdrop" onClick={onClose} style={{ zIndex: 1040 }} />
      <div
        className="offcanvas offcanvas-end show bg-light text-dark border-start shadow-lg"
        style={{ width: '92vw', maxWidth: '1260px', visibility: 'visible', zIndex: 1050 }}
        tabIndex={-1}
      >
        <div className="offcanvas-header border-bottom p-3 bg-white d-flex align-items-center justify-content-between">
          <div>
            <div className="font-mono-code text-uppercase small" style={{ fontSize: '0.725rem', color: '#94a3b8', letterSpacing: '0.05em' }}>
              UC-09 · INSPECTOR
            </div>
            <h5 className="offcanvas-title fw-bold text-dark m-0" style={{ fontSize: '1.25rem' }}>
              Visual vessel inspection
            </h5>
            <div className="font-mono-code small text-muted" style={{ fontSize: '0.75rem' }}>
              AS-2041 · {vesselName} · Berth 4, Fremantle · 18 Sep 2026
            </div>
          </div>
          <button type="button" className="btn-close ms-auto" onClick={onClose} aria-label="Close" />
        </div>

        <div className="offcanvas-body p-4" style={{ backgroundColor: '#f1f5f9' }}>
          <div className="row g-4">
            {/* left column: statutory visual inspection checklist */}
            <div className="col-lg-7 d-flex flex-column gap-3">
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '10px', backgroundColor: '#ffffff' }}>
                <div className="font-mono-code text-uppercase small mb-3" style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.08em' }}>
                  STATUTORY VISUAL INSPECTION CHECKLIST
                </div>

                <div className="d-flex flex-column gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 border rounded-3 bg-white shadow-sm">
                      <div className="d-flex flex-column gap-2">
                        {/* checklist item title and subtitle */}
                        <div className="d-flex align-items-start justify-content-between gap-2">
                          <div>
                            <div className="fw-bold text-dark" style={{ fontSize: '0.95rem' }}>{item.title}</div>
                            <div className="font-mono-code small" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.subtitle}</div>
                          </div>
                          {item.capaCode && (
                            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle" style={{ fontSize: '0.675rem' }}>
                              Linked {item.capaCode}
                            </span>
                          )}
                        </div>

                        {/* rating status pill buttons */}
                        <div className="d-flex align-items-center gap-1.5 mt-1">
                          <button
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 py-1 ${item.status === 'Satisfactory'
                              ? 'btn-outline-primary fw-semibold active'
                              : 'btn-light text-secondary border'
                              }`}
                            style={{
                              fontSize: '0.775rem',
                              borderColor: item.status === 'Satisfactory' ? '#0d9488' : '#e2e8f0',
                              color: item.status === 'Satisfactory' ? '#0d9488' : '#64748b',
                              backgroundColor: item.status === 'Satisfactory' ? '#f0fdf4' : '#f8fafc',
                            }}
                            onClick={() => handleStatusChange(item.id, 'Satisfactory')}
                          >
                            Satisfactory
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 py-1 ${item.status === 'Observation'
                              ? 'btn-outline-info fw-semibold active'
                              : 'btn-light text-secondary border'
                              }`}
                            style={{
                              fontSize: '0.775rem',
                              borderColor: item.status === 'Observation' ? '#0284c7' : '#e2e8f0',
                              color: item.status === 'Observation' ? '#0369a1' : '#64748b',
                              backgroundColor: item.status === 'Observation' ? '#e0f2fe' : '#f8fafc',
                            }}
                            onClick={() => handleStatusChange(item.id, 'Observation')}
                          >
                            Observation
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 py-1 ${item.status === 'Deficiency'
                              ? 'btn-outline-danger fw-semibold active'
                              : 'btn-light text-secondary border'
                              }`}
                            style={{
                              fontSize: '0.775rem',
                              borderColor: item.status === 'Deficiency' ? '#b91c1c' : '#e2e8f0',
                              color: item.status === 'Deficiency' ? '#b91c1c' : '#64748b',
                              backgroundColor: item.status === 'Deficiency' ? '#fee2e2' : '#f8fafc',
                            }}
                            onClick={() => handleStatusChange(item.id, 'Deficiency')}
                          >
                            Deficiency
                          </button>
                        </div>
                      </div>

                      {/* finding notes callout box */}
                      {item.findingNotes && (
                        <div
                          className="mt-3 p-3 rounded-2"
                          style={{
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                          }}
                        >
                          <div className="d-flex align-items-center justify-content-between mb-1">
                            <div className="fw-bold" style={{ fontSize: '0.8rem', color: '#b45309' }}>
                              Finding recorded
                            </div>
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 text-decoration-none"
                              style={{ fontSize: '0.725rem', color: '#b45309' }}
                              onClick={() => {
                                setActiveCommentItemId(item.id);
                                setCommentInput(item.findingNotes || '');
                              }}
                            >
                              Edit Comment
                            </button>
                          </div>
                          <div style={{ fontSize: '0.775rem', color: '#92400e', lineHeight: '1.4' }}>
                            {item.findingNotes}
                          </div>
                        </div>
                      )}

                      {/* inline finding comment editor */}
                      {activeCommentItemId === item.id && (
                        <div className="mt-3 p-3 border rounded bg-light">
                          <div className="fw-bold text-dark small mb-2" style={{ fontSize: '0.8rem' }}>
                            Add / Edit Finding Comment for {item.id}
                          </div>
                          <textarea
                            className="form-control form-control-sm mb-2"
                            rows={2}
                            placeholder="Enter detailed observation notes or finding comment..."
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            style={{ fontSize: '0.775rem' }}
                          />
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              style={{ fontSize: '0.725rem' }}
                              onClick={() => setActiveCommentItemId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: '0.725rem', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                              onClick={() => handleSaveComment(item.id)}
                            >
                              Save Comment
                            </button>
                          </div>
                        </div>
                      )}

                      {/* inline item capa creation form */}
                      {activeItemCapaId === item.id && (
                        <div className="mt-3 p-3 border rounded bg-light">
                          <div className="fw-bold text-dark small mb-2" style={{ fontSize: '0.8rem' }}>
                            Raise Corrective Action (CAPA) for {item.title}
                          </div>
                          <div className="mb-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Action required description..."
                              value={itemCapaTitle}
                              onChange={(e) => setItemCapaTitle(e.target.value)}
                              style={{ fontSize: '0.775rem' }}
                            />
                          </div>
                          <div className="row g-2 mb-2">
                            <div className="col-6">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Assigned Owner..."
                                value={itemCapaOwner}
                                onChange={(e) => setItemCapaOwner(e.target.value)}
                                style={{ fontSize: '0.775rem' }}
                              />
                            </div>
                            <div className="col-6">
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="Due date e.g. 15 Oct 2026..."
                                value={itemCapaDueDate}
                                onChange={(e) => setItemCapaDueDate(e.target.value)}
                                style={{ fontSize: '0.775rem' }}
                              />
                            </div>
                          </div>
                          <div className="d-flex align-items-center justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary"
                              style={{ fontSize: '0.725rem' }}
                              onClick={() => setActiveItemCapaId(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-warning fw-bold"
                              style={{ fontSize: '0.725rem' }}
                              onClick={() => handleRaiseItemCapa(item)}
                            >
                              Raise CAPA Item
                            </button>
                          </div>
                        </div>
                      )}

                      {/* item action bar: comment, raise capa, add evidence */}
                      <div className="mt-3 pt-2 border-top d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-light border text-secondary px-2.5 py-1"
                            style={{ fontSize: '0.725rem' }}
                            onClick={() => {
                              setActiveCommentItemId(activeCommentItemId === item.id ? null : item.id);
                              setCommentInput(item.findingNotes || '');
                            }}
                          >
                            + Add Comment
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-light border text-secondary px-2.5 py-1"
                            style={{ fontSize: '0.725rem' }}
                            onClick={() => {
                              setActiveItemCapaId(activeItemCapaId === item.id ? null : item.id);
                              setItemCapaTitle(`Corrective action for ${item.title}`);
                            }}
                          >
                            + Raise CAPA
                          </button>
                        </div>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary px-2.5 py-1 fw-semibold"
                          style={{ fontSize: '0.725rem', borderColor: '#0284c7', color: '#0284c7' }}
                          onClick={() => {
                            if (activeEvidenceItemId === item.id) {
                              setActiveEvidenceItemId(null);
                              setSelectedFile(null);
                            } else {
                              setActiveEvidenceItemId(item.id);
                              setSelectedFile(null);
                              setNewEvidenceTitle('');
                            }
                          }}
                        >
                          {activeEvidenceItemId === item.id ? 'Close Upload' : '+ Attach Evidence'}
                        </button>
                      </div>

                      {/* evidence items display section */}
                      <div className="mt-2.5">
                        <div className="font-mono-code text-uppercase small mb-2" style={{ fontSize: '0.65rem', color: '#64748b', letterSpacing: '0.05em' }}>
                          Supporting Evidence ({item.evidences.length})
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                          {item.evidences.map((ev) => (
                            <div
                              key={ev.id}
                              className="px-2.5 py-1.5 border rounded-2 d-flex align-items-center gap-2 shadow-2xs"
                              style={{ backgroundColor: '#f8fafc', borderColor: '#cbd5e1', fontSize: '0.75rem' }}
                            >
                              <span
                                className="font-mono-code fw-bold text-uppercase px-1.5 py-0.5 rounded"
                                style={{ fontSize: '0.625rem', backgroundColor: '#e0f2fe', color: '#0369a1' }}
                              >
                                {ev.type}
                              </span>
                              <div className="d-flex flex-column lh-1">
                                <span className="text-dark fw-medium" style={{ fontSize: '0.75rem' }}>{ev.title}</span>
                                {ev.fileName && (
                                  <span className="font-mono-code text-muted" style={{ fontSize: '0.625rem' }}>
                                    {ev.fileName} {ev.fileSize ? `(${ev.fileSize})` : ''}
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                className="btn-close ms-1"
                                style={{ fontSize: '0.55rem' }}
                                aria-label="Remove evidence"
                                onClick={() => handleRemoveEvidence(item.id, ev.id)}
                              />
                            </div>
                          ))}
                          {item.evidences.length === 0 && (
                            <span className="text-muted small fst-italic" style={{ fontSize: '0.725rem' }}>
                              No supporting evidence attached to this checklist item.
                            </span>
                          )}
                        </div>

                        {/* inline simulated file upload form per checklist item */}
                        {activeEvidenceItemId === item.id && (
                          <div className="mt-3 p-3 border rounded-3 bg-white shadow-sm">
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="fw-bold small text-dark" style={{ fontSize: '0.8rem' }}>
                                Upload Evidence to {item.title}
                              </div>
                              <button
                                type="button"
                                className="btn-close"
                                style={{ fontSize: '0.65rem' }}
                                aria-label="Close"
                                onClick={() => {
                                  setActiveEvidenceItemId(null);
                                  setSelectedFile(null);
                                }}
                              />
                            </div>

                            {/* file input dropzone / picker */}
                            <input
                              type="file"
                              id={`evidence-file-input-${item.id}`}
                              className="d-none"
                              onChange={handleFileSelect}
                              accept="image/*,.pdf,.doc,.docx"
                            />
                            <label
                              htmlFor={`evidence-file-input-${item.id}`}
                              className="p-3 border rounded-2 text-center cursor-pointer w-100 bg-light d-block mb-3"
                              style={{ borderStyle: 'dashed', borderColor: '#cbd5e1' }}
                            >
                              <div className="font-mono-code text-uppercase fw-bold mb-1" style={{ fontSize: '0.725rem', color: '#0284c7' }}>
                                {selectedFile ? 'Change Selected File' : 'Click to Browse / Select File'}
                              </div>
                              <div className="small text-muted" style={{ fontSize: '0.725rem' }}>
                                {selectedFile
                                  ? `Selected: ${selectedFile.name} (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)`
                                  : 'Supports images (.jpg, .png) and documents (.pdf, .doc)'}
                              </div>
                            </label>

                            <div className="row g-2 align-items-center">
                              <div className="col-md-6">
                                <label className="form-label small text-muted m-0" style={{ fontSize: '0.7rem' }}>Evidence Label</label>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  placeholder="e.g. Liferaft HRU expiration tag"
                                  value={newEvidenceTitle}
                                  onChange={(e) => setNewEvidenceTitle(e.target.value)}
                                  style={{ fontSize: '0.775rem' }}
                                />
                              </div>
                              <div className="col-md-3">
                                <label className="form-label small text-muted m-0" style={{ fontSize: '0.7rem' }}>Category</label>
                                <select
                                  className="form-select form-select-sm"
                                  value={newEvidenceType}
                                  onChange={(e) => setNewEvidenceType(e.target.value as 'Photo' | 'Document')}
                                  style={{ fontSize: '0.775rem' }}
                                >
                                  <option value="Photo">Photo</option>
                                  <option value="Document">Document</option>
                                </select>
                              </div>
                              <div className="col-md-3 d-flex align-items-end gap-1" style={{ marginTop: '1.25rem' }}>
                                <button
                                  type="button"
                                  className="btn btn-outline-secondary btn-sm flex-fill"
                                  style={{ fontSize: '0.75rem' }}
                                  onClick={() => {
                                    setActiveEvidenceItemId(null);
                                    setSelectedFile(null);
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm flex-fill fw-semibold d-flex align-items-center justify-content-center gap-1"
                                  style={{ fontSize: '0.75rem', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                                  disabled={isUploading}
                                  onClick={() => handleAddEvidence(item.id)}
                                >
                                  {isUploading ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '0.75rem', height: '0.75rem' }} />
                                      Uploading...
                                    </>
                                  ) : (
                                    'Upload & Attach'
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* right column: inspection result card & corrective actions list */}
            <div className="col-lg-5 d-flex flex-column gap-3">
              {/* inspection result submission card (dark navy background) */}
              <div
                className="card border-0 shadow-sm p-4 text-white"
                style={{
                  borderRadius: '10px',
                  backgroundColor: 'rgb(11, 27, 43)',
                }}
              >
                <div className="font-mono-code text-uppercase small mb-3" style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.08em' }}>
                  INSPECTION RESULT
                </div>

                <div className="d-flex flex-column gap-2 mb-3">
                  {/* option 1: pass */}
                  <div
                    className="px-3 py-2 rounded cursor-pointer border"
                    style={{
                      backgroundColor: selectedResult === 'Pass' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: selectedResult === 'Pass' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedResult('Pass')}
                  >
                    <div className="fw-bold text-white mb-0.5" style={{ fontSize: '0.875rem' }}>Pass</div>
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                      No findings. Requirement routes straight to the Approver.
                    </div>
                  </div>

                  {/* option 2: pass with observations */}
                  <div
                    className="px-3 py-2 rounded cursor-pointer border"
                    style={{
                      backgroundColor: selectedResult === 'Pass with observations' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: selectedResult === 'Pass with observations' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedResult('Pass with observations')}
                  >
                    <div className="fw-bold text-white mb-0.5" style={{ fontSize: '0.875rem' }}>Pass with observations</div>
                    <div style={{ fontSize: '0.725rem', color: '#cbd5e1' }}>
                      Routes to the Approver with corrective actions tracked.
                    </div>
                  </div>

                  {/* option 3: fail */}
                  <div
                    className="px-3 py-2 rounded cursor-pointer border"
                    style={{
                      backgroundColor: selectedResult === 'Fail' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      borderColor: selectedResult === 'Fail' ? '#ef4444' : 'rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                    }}
                    onClick={() => setSelectedResult('Fail')}
                  >
                    <div className="fw-bold text-white mb-0.5" style={{ fontSize: '0.875rem' }}>Fail</div>
                    <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                      Returns the requirement for rectification and re-inspection.
                    </div>
                  </div>
                </div>

                {/* submit outcome button */}
                <button
                  type="button"
                  className="btn btn-success w-100 py-2.5 fw-bold shadow-sm mb-3"
                  style={{
                    backgroundColor: '#059669',
                    borderColor: '#059669',
                    fontSize: '0.9rem',
                    borderRadius: '8px',
                  }}
                  onClick={handleSubmitOutcome}
                >
                  Submit inspection outcome
                </button>

                <div className="small lh-sm" style={{ fontSize: '0.725rem', color: '#64748b' }}>
                  The Inspector role covers visual and vessel inspection only — it does not replace the Verifier for routine document verification.
                </div>
              </div>

              {/* corrective actions card with dynamic item entry */}
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '10px', backgroundColor: '#ffffff' }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold text-dark m-0" style={{ fontSize: '1rem' }}>
                    Corrective actions ({capaActions.length})
                  </h6>
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm px-2.5 py-1 fw-semibold"
                    style={{ fontSize: '0.75rem', borderRadius: '6px', borderColor: '#0284c7', color: '#0284c7' }}
                    onClick={() => setShowAddCapa(!showAddCapa)}
                  >
                    {showAddCapa ? 'Cancel' : '+ Add CAPA Item'}
                  </button>
                </div>

                {/* form for inspector to put a new corrective action item */}
                {showAddCapa && (
                  <form onSubmit={handleAddCapaItem} className="p-3 border rounded bg-light mb-3">
                    <div className="fw-bold text-dark small mb-2" style={{ fontSize: '0.8rem' }}>
                      New Corrective Action (CAPA)
                    </div>
                    <div className="mb-2">
                      <label className="form-label small text-muted m-0" style={{ fontSize: '0.725rem' }}>Action Title</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Replace damaged fire hose nozzle"
                        required
                        value={newCapaTitle}
                        onChange={(e) => setNewCapaTitle(e.target.value)}
                        style={{ fontSize: '0.775rem' }}
                      />
                    </div>
                    <div className="row g-2 mb-2">
                      <div className="col-6">
                        <label className="form-label small text-muted m-0" style={{ fontSize: '0.725rem' }}>Assigned Owner</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. Northwind Marine"
                          value={newCapaOwner}
                          onChange={(e) => setNewCapaOwner(e.target.value)}
                          style={{ fontSize: '0.775rem' }}
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-muted m-0" style={{ fontSize: '0.725rem' }}>Due Date</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="e.g. 15 Oct 2026"
                          value={newCapaDueDate}
                          onChange={(e) => setNewCapaDueDate(e.target.value)}
                          style={{ fontSize: '0.775rem' }}
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm w-100 fw-bold mt-1"
                      style={{ backgroundColor: 'rgb(11, 27, 43)', borderColor: 'rgb(11, 27, 43)', fontSize: '0.775rem' }}
                    >
                      Save Corrective Action
                    </button>
                  </form>
                )}

                <div className="d-flex flex-column gap-3">
                  {capaActions.map((capa) => (
                    <div key={capa.id} className="border-bottom pb-3">
                      <div className="d-flex align-items-center justify-between mb-1">
                        <div className="d-flex align-items-center gap-2">
                          <span className="font-mono-code text-uppercase small" style={{ fontSize: '0.725rem', color: '#94a3b8' }}>
                            {capa.id}
                          </span>
                          <span className="fw-bold text-dark" style={{ fontSize: '0.875rem' }}>
                            {capa.title}
                          </span>
                        </div>
                        <span
                          className={`badge rounded-pill ${capa.status === 'Open'
                            ? 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
                            : 'bg-success-subtle text-success-emphasis border border-success-subtle'
                            }`}
                          style={{ fontSize: '0.675rem' }}
                        >
                          {capa.status}
                        </span>
                      </div>
                      <div className="small" style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Owner: {capa.owner} · Due {capa.dueDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
