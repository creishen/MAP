/* 
  file summary: physical vessel inspection checklist modal drawer matching exact mockup design.
  responsibilities: presents split-screen visual survey checklist, findings recorded callout, supporting evidence photos, dark inspection result submission card, and corrective actions list.
  role in system: used by inspector workspace view.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';

interface InspectionItem {
  id: string;
  title: string;
  subtitle: string;
  status: 'Satisfactory' | 'Observation' | 'Deficiency';
  findingNotes?: string;
  capaCode?: string;
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
  how: manages local state for 5 inspection items, findings callouts, evidence boxes, dark inspection result selector, and corrective actions list.
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
    },
    {
      id: 'INS-02',
      title: 'Fire-fighting equipment and fixed systems',
      subtitle: 'SOLAS II-2 · FFE plan',
      status: 'Satisfactory',
    },
    {
      id: 'INS-03',
      title: 'Liferaft hydrostatic release units',
      subtitle: 'Service due check',
      status: 'Observation',
      findingNotes: 'Port-side liferaft HRU service date exceeded by 3 weeks. Replacement unit on order; corrective action CAPA-118 raised.',
      capaCode: 'CAPA-118',
    },
    {
      id: 'INS-04',
      title: 'Deck cargo securing arrangements',
      subtitle: 'Cargo securing manual',
      status: 'Satisfactory',
    },
    {
      id: 'INS-05',
      title: 'Crew familiarity — muster and abandon ship',
      subtitle: 'ISM · drill records',
      status: 'Satisfactory',
    },
  ]);

  const [selectedResult, setSelectedResult] = useState<'Pass' | 'Pass with observations' | 'Fail'>('Pass with observations');
  const [capaActions] = useState<CapaActionItem[]>([
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

  const handleStatusChange = (id: string, newStatus: 'Satisfactory' | 'Observation' | 'Deficiency') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
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
            {/* left column: checklist items & supporting evidence */}
            <div className="col-lg-7 d-flex flex-column gap-3">
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '10px', backgroundColor: '#ffffff' }}>
                <div className="font-mono-code text-uppercase small mb-3" style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.08em' }}>
                  STATUTORY VISUAL INSPECTION CHECKLIST
                </div>

                <div className="d-flex flex-column gap-3">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 border-bottom pb-3">
                      <div className="d-flex flex-column gap-2">
                        {/* checklist item title and subtitle */}
                        <div>
                          <div className="fw-bold text-dark" style={{ fontSize: '0.925rem' }}>{item.title}</div>
                          <div className="font-mono-code small" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{item.subtitle}</div>
                        </div>

                        {/* rating status pill buttons */}
                        <div className="d-flex align-items-center gap-1 mt-1">
                          <button
                            type="button"
                            className={`btn btn-sm rounded-pill px-3 py-1 ${item.status === 'Satisfactory'
                                ? 'btn-outline-primary fw-semibold active'
                                : 'btn-light text-secondary border-0'
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
                                : 'btn-light text-secondary border-0'
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
                                : 'btn-light text-secondary border-0'
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

                      {/* finding recorded callout box */}
                      {item.findingNotes && (
                        <div
                          className="mt-3 p-3 rounded"
                          style={{
                            backgroundColor: '#fffbeb',
                            border: '1px solid #fde68a',
                          }}
                        >
                          <div className="fw-bold mb-1" style={{ fontSize: '0.8rem', color: '#b45309' }}>
                            Finding recorded
                          </div>
                          <div style={{ fontSize: '0.775rem', color: '#92400e', lineHeight: '1.4' }}>
                            {item.findingNotes}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* supporting evidence section */}
                <div className="mt-4 pt-3 border-top">
                  <div className="font-mono-code text-uppercase small mb-3" style={{ fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.08em' }}>
                    SUPPORTING EVIDENCE
                  </div>
                  <div className="row g-2">
                    <div className="col-3">
                      <div className="p-3 border rounded text-center" style={{ borderStyle: 'dashed', backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
                        <div className="font-mono-code text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: '#64748b' }}>PHOTO</div>
                        <div className="small text-truncate" style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Liferaft HRU tag</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-3 border rounded text-center" style={{ borderStyle: 'dashed', backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
                        <div className="font-mono-code text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: '#64748b' }}>PHOTO</div>
                        <div className="small text-truncate" style={{ fontSize: '0.725rem', color: '#94a3b8' }}>FFE station 3</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-3 border rounded text-center" style={{ borderStyle: 'dashed', backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }}>
                        <div className="font-mono-code text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: '#64748b' }}>PHOTO</div>
                        <div className="small text-truncate" style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Deck securing</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-3 border rounded text-center cursor-pointer" style={{ borderStyle: 'dashed', backgroundColor: '#ffffff', borderColor: '#cbd5e1' }}>
                        <div className="font-mono-code text-uppercase fw-bold" style={{ fontSize: '0.65rem', color: '#0284c7' }}>+ ADD</div>
                        <div className="small text-truncate" style={{ fontSize: '0.725rem', color: '#94a3b8' }}>Drop evidence</div>
                      </div>
                    </div>
                  </div>
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

              {/* corrective actions card (white background) */}
              <div className="card border-0 shadow-sm p-4" style={{ borderRadius: '10px', backgroundColor: '#ffffff' }}>
                <h6 className="fw-bold text-dark mb-3" style={{ fontSize: '1rem' }}>
                  Corrective actions
                </h6>

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

