/* 
  file summary: physical vessel inspection drawer presenting survey checklist and capa defect logger in light theme.
  responsibilities: captures survey checklist items (lsa, machinery, hull, fire safety) and logs capa deficiencies (critical, major, minor).
  role in system: used by inspector workspace view.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';

interface CapaItem {
  id: string;
  category: string;
  severity: 'Critical' | 'Major' | 'Minor';
  description: string;
  recommendedAction: string;
}

interface InspectionDrawerProps {
  vesselName: string;
  onClose: () => void;
}

/**
  what: renders physical survey checklist and capa deficiency logging drawer in light theme.
  how: maintains local state for checklist items and appends logged capa defects to audit trail.
  with what file: src/components/drawers/InspectionDrawer.tsx loaded by InspectorWorkspaceView.tsx.
*/
export const InspectionDrawer: React.FC<InspectionDrawerProps> = ({ vesselName, onClose }) => {
  const { logAuditEvent, activePersona } = useMapStore();

  const [checklist, setChecklist] = useState([
    { id: 'CHK-1', item: 'Life Saving Appliances (LSA) & Lifeboats', status: 'PASS' },
    { id: 'CHK-2', item: 'Main Propulsion & Auxiliary Generators', status: 'PASS' },
    { id: 'CHK-3', item: 'Fire Fighting Appliances (FFA) & Quick Closing Valves', status: 'DEFICIENT' },
    { id: 'CHK-4', item: 'Hull Integrity & Watertight Bulkheads', status: 'PASS' },
    { id: 'CHK-5', item: 'Oil-Water Separator 15ppm Alarm & 3-Way Valve', status: 'PASS' },
  ]);

  const [capaLogs, setCapaLogs] = useState<CapaItem[]>([
    {
      id: 'CAPA-101',
      category: 'Fire Fighting Appliances (FFA)',
      severity: 'Minor',
      description: 'Emergency fire pump pressure gauge glass cracked on aft station.',
      recommendedAction: 'Replace pressure gauge prior to departure.',
    },
  ]);

  const [newCategory, setNewCategory] = useState('Fire Fighting Appliances (FFA)');
  const [newSeverity, setNewSeverity] = useState<'Critical' | 'Major' | 'Minor'>('Minor');
  const [newDesc, setNewDesc] = useState('');
  const [newAction, setNewAction] = useState('');

  const toggleStatus = (id: string) => {
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 'PASS' ? 'DEFICIENT' : 'PASS' } : c))
    );
  };

  const handleAddCapa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;

    const newCap: CapaItem = {
      id: `CAPA-${Math.floor(1000 + Math.random() * 9000)}`,
      category: newCategory,
      severity: newSeverity,
      description: newDesc,
      recommendedAction: newAction,
    };

    setCapaLogs((prev) => [...prev, newCap]);

    logAuditEvent({
      userId: 'USR-INSPEC-01',
      userRole: activePersona,
      organization: 'Marine Inspectorate',
      action: `Logged CAPA Deficiency (${newSeverity})`,
      targetAsset: vesselName,
      justificationNotes: `${newCategory}: ${newDesc}`,
    });

    setNewDesc('');
    setNewAction('');
  };

  return (
    <>
      <div className="map-modal-backdrop" onClick={onClose} style={{ zIndex: 1040 }} />
      <div
        className="offcanvas offcanvas-end show bg-white text-dark border-start shadow-lg"
        style={{ width: '600px', visibility: 'visible', zIndex: 1050 }}
        tabIndex={-1}
      >
        <div className="offcanvas-header border-bottom p-3 bg-light d-flex align-items-center justify-content-between">
          <h5 className="offcanvas-title fw-bold text-slate-900 m-0">
            On-Site Survey Checklist: <span className="text-primary">{vesselName}</span>
          </h5>
          <button type="button" className="btn-close ms-auto" onClick={onClose} aria-label="Close" />
        </div>

        <div className="offcanvas-body p-3">
          {/* Survey Checklist */}
          <div className="mb-4">
            <h6 className="text-uppercase text-secondary small fw-bold mb-3" style={{ letterSpacing: '0.05em' }}>
              Statutory Visual Survey Checklist
            </h6>
            <div className="list-group">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="list-group-item bg-light text-dark border-secondary d-flex align-items-center justify-between p-3"
                >
                  <span className="fw-semibold">{item.item}</span>
                  <button
                    type="button"
                    className={`btn btn-sm ${item.status === 'PASS' ? 'btn-success text-white' : 'btn-danger text-white'}`}
                    onClick={() => toggleStatus(item.id)}
                  >
                    {item.status}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* CAPA Deficiency Logger */}
          <div>
            <h6 className="text-uppercase text-secondary small fw-bold mb-3" style={{ letterSpacing: '0.05em' }}>
              CAPA Deficiency Logger
            </h6>

            <form onSubmit={handleAddCapa} className="p-3 bg-light border border-secondary rounded mb-4 shadow-sm">
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="capa-category">Category:</label>
                  <select
                    id="capa-category"
                    className="form-select form-select-sm bg-white text-dark border-secondary"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    <option value="Life Saving Appliances (LSA)">LSA & Lifeboats</option>
                    <option value="Fire Fighting Appliances (FFA)">FFA & Quick Closing</option>
                    <option value="Machinery & Generators">Machinery & Generators</option>
                    <option value="Hull & Bulkheads">Hull & Bulkheads</option>
                    <option value="Environmental / OWS">Environmental / OWS</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="capa-severity">Severity:</label>
                  <select
                    id="capa-severity"
                    className="form-select form-select-sm bg-white text-dark border-secondary"
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as 'Critical' | 'Major' | 'Minor')}
                  >
                    <option value="Minor">Minor Deficiency</option>
                    <option value="Major">Major Deficiency</option>
                    <option value="Critical">Critical (Halts Charter)</option>
                  </select>
                </div>
              </div>

              <div className="mb-2">
                <label className="form-label text-secondary small fw-semibold" htmlFor="capa-desc">Deficiency Observation:</label>
                <textarea
                  id="capa-desc"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  rows={2}
                  placeholder="Describe deficiency..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold" htmlFor="capa-action">Recommended CAPA Action:</label>
                <input
                  id="capa-action"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="Corrective action required..."
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-sm btn-primary w-100">
                Log CAPA Item
              </button>
            </form>

            {/* CAPA Items List */}
            <div className="d-flex flex-column gap-2">
              {capaLogs.map((c) => (
                <div key={c.id} className="p-3 bg-light border border-secondary rounded shadow-sm">
                  <div className="d-flex align-items-center justify-between mb-1">
                    <span className="fw-bold text-dark">{c.category}</span>
                    <span
                      className={`badge ${c.severity === 'Critical'
                        ? 'bg-danger text-white'
                        : c.severity === 'Major'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary text-white'
                        }`}
                    >
                      {c.severity}
                    </span>
                  </div>
                  <div className="small text-secondary mb-1">{c.description}</div>
                  {c.recommendedAction && (
                    <div className="small text-primary font-weight-bold">CAPA: {c.recommendedAction}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
