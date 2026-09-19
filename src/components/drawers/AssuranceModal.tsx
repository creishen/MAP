/* 
  file summary: assurance set creation modal form for initiating client and provider campaigns in light theme.
  responsibilities: captures campaign title, vessel selection, charter window dates, and mandatory/optional assurance requirement toggles.
  role in system: invoked from assurance sets view (AssuranceSetsView.tsx).
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { AssuranceSet } from '../../types/assurance';

interface AssuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
  what: renders assurance set creation modal form in light theme.
  how: aggregates requirement matrix toggles and dispatches addAssuranceSet store action.
  with what file: src/components/drawers/AssuranceModal.tsx loaded by AssuranceSetsView.tsx.
*/
export const AssuranceModal: React.FC<AssuranceModalProps> = ({ isOpen, onClose }) => {
  const { vessels, addAssuranceSet, activePersona } = useMapStore();

  const [title, setTitle] = useState('');
  const [vesselId, setVesselId] = useState(vessels[0]?.id || '');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2027-11-01');
  const [mandatoryInspection, setMandatoryInspection] = useState(true);

  if (!isOpen) return null;

  const selectedVessel = vessels.find((v) => v.id === vesselId) || vessels[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedVessel) return;

    const isClient = activePersona === 'C Admin';

    const newSet: AssuranceSet = {
      id: `AS-2026-${Math.floor(100 + Math.random() * 900)}`,
      title,
      vesselId: selectedVessel.id,
      vesselName: selectedVessel.name,
      imoNumber: selectedVessel.imoNumber,
      initiatorOrg: isClient ? 'Chevron Australia Pty Ltd' : 'Pacific Ocean Logistics',
      initiatorRole: isClient ? 'C Admin · Client Created' : 'Vessel Provider Admin',
      charterWindowStart: startDate,
      charterWindowEnd: endDate,
      stage: 'Initiated',
      readinessScore: 0,
      mandatoryInspectionRequired: mandatoryInspection,
      inspectionCompleted: false,
      requirements: [
        {
          id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          category: 'Statutory Certificate',
          title: 'Certificate of Class',
          isMandatory: true,
          isFulfilled: false,
          ocrConfidence: 95,
          verifierStatus: 'Pending',
        },
        {
          id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          category: 'Statutory Certificate',
          title: 'Cargo Ship Safety Equipment',
          isMandatory: true,
          isFulfilled: false,
          ocrConfidence: 96,
          verifierStatus: 'Pending',
        },
        {
          id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
          category: 'Crew Credential',
          title: 'STCW Master CoC Endorsement',
          isMandatory: true,
          isFulfilled: false,
          ocrConfidence: 98,
          verifierStatus: 'Pending',
        },
      ],
    };

    addAssuranceSet(newSet);
    onClose();
  };

  return (
    <div
      className="modal show d-block map-modal-backdrop"
      tabIndex={-1}
      style={{ zIndex: 1050 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content bg-white text-dark border shadow-lg">
          <div className="modal-header border-bottom bg-light d-flex align-items-center justify-content-between p-3 position-relative">
            <h5 className="modal-title fw-bold text-slate-900 m-0">Initiate New Assurance Set</h5>
            <button type="button" className="btn-close ms-auto" onClick={onClose} aria-label="Close" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold" htmlFor="campaign-title">Campaign / Set Title *</label>
                <input
                  id="campaign-title"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="e.g. Chevron Gorgon Charter Vetting 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold" htmlFor="target-vessel">Target Vessel *</label>
                <select
                  id="target-vessel"
                  className="form-select form-select-sm bg-white text-dark border-secondary"
                  value={vesselId}
                  onChange={(e) => setVesselId(e.target.value)}
                >
                  {vessels.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} (IMO: {v.imoNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="charter-start">Charter Start Date *</label>
                  <input
                    id="charter-start"
                    type="date"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="charter-end">Charter End Date *</label>
                  <input
                    id="charter-end"
                    type="date"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-check form-switch mb-3">
                <input
                  id="inspection-switch"
                  className="form-check-input"
                  type="checkbox"
                  checked={mandatoryInspection}
                  onChange={(e) => setMandatoryInspection(e.target.checked)}
                />
                <label className="form-check-input-label text-dark small fw-semibold" htmlFor="inspection-switch">
                  Require Mandatory Physical On-Site Inspection
                </label>
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Initiate Assurance Set
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
