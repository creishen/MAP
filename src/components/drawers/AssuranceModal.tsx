/* 
  file summary: assurance set creation modal form for initiating client and provider campaigns in light theme.
  responsibilities: captures campaign details, vessel selection, master document attachments, and workflow requirements.
  role in system: invoked from assurance sets view (AssuranceSetsView.tsx).
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { AssuranceSet, AssuranceRequirement } from '../../types/assurance';
import { filterVesselsForPersona } from '../../utils/rbacHelpers';
import { isDuplicateCampaignTitle, generateUniqueAssuranceSetId, generateUniqueRequirementId } from '../../utils/validation';

interface AssuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MasterDocItem {
  id: string;
  title: string;
  type: 'Vessel' | 'Crew' | 'Inspection';
  category: 'Statutory Certificate' | 'Crew Credential' | 'Inspection Report';
  defaultEnabled: boolean;
}

const INITIAL_MASTER_DOCS: MasterDocItem[] = [
  { id: 'doc-1', title: 'Certificate of Class', type: 'Vessel', category: 'Statutory Certificate', defaultEnabled: true },
  { id: 'doc-2', title: 'Safety Certificate (SOLAS)', type: 'Vessel', category: 'Statutory Certificate', defaultEnabled: true },
  { id: 'doc-3', title: 'Flag State Certificate', type: 'Vessel', category: 'Statutory Certificate', defaultEnabled: true },
  { id: 'doc-4', title: 'Minimum Safe Manning Document', type: 'Vessel', category: 'Statutory Certificate', defaultEnabled: true },
  { id: 'doc-5', title: 'Crew Medical Fitness (ENG1)', type: 'Crew', category: 'Crew Credential', defaultEnabled: true },
  { id: 'doc-6', title: 'STCW Training Certificate', type: 'Crew', category: 'Crew Credential', defaultEnabled: true },
  { id: 'doc-7', title: 'Crew License / Endorsement (CoC)', type: 'Crew', category: 'Crew Credential', defaultEnabled: true },
  { id: 'doc-8', title: 'Safety Drill Participation Record', type: 'Crew', category: 'Crew Credential', defaultEnabled: false },
  { id: 'doc-9', title: 'Visual Vessel Inspection', type: 'Inspection', category: 'Inspection Report', defaultEnabled: true },
];

/**
  what: renders assurance set creation modal form with master document selection and workflow configuration.
  how: captures user selections, builds assurance set model with toggled requirements, and updates store state.
  with what file: src/components/drawers/AssuranceModal.tsx loaded by AssuranceSetsView.tsx.
*/
export const AssuranceModal: React.FC<AssuranceModalProps> = ({ isOpen, onClose }) => {
  const { vessels, assuranceSets, addAssuranceSet, activePersona } = useMapStore();

  const availableVessels =
    activePersona === 'Administrator'
      ? vessels
      : filterVesselsForPersona(vessels, assuranceSets, activePersona);

  const isClient = activePersona === 'C Admin';
  const defaultOrg = isClient ? 'Chevron Australia Pty Ltd' : 'Northwind Marine Pty Ltd';
  const [vesselId, setVesselId] = useState(availableVessels[0]?.id || vessels[0]?.id || '');
  const [title, setTitle] = useState(
    () => `${defaultOrg} - ${availableVessels[0]?.name || vessels[0]?.name || 'Vessel'} Charter Vetting`
  );
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2027-11-01');

  /* master document toggles state */
  const [docToggles, setDocToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    INITIAL_MASTER_DOCS.forEach((d) => {
      if (activePersona === 'C Admin' && d.type === 'Inspection') {
        initial[d.id] = false;
      } else {
        initial[d.id] = d.defaultEnabled;
      }
    });
    return initial;
  });

  /* workflow requirements state */
  const [verificationRequired, setVerificationRequired] = useState(true);
  const [inspectionRequired, setInspectionRequired] = useState(activePersona !== 'C Admin');
  const [approvalRequired, setApprovalRequired] = useState(true);

  if (!isOpen) return null;

  const selectedVessel = vessels.find((v) => v.id === vesselId) || vessels[0];
  const tempSetId = 'AS-2041';

  const handleToggleDoc = (docId: string) => {
    setDocToggles((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedVessel) return;

    const duplicateCheck = isDuplicateCampaignTitle(title, assuranceSets);
    if (duplicateCheck.isDuplicate) {
      return;
    }

    const uniqueSetId = generateUniqueAssuranceSetId(assuranceSets);

    /* construct enabled requirements list with guaranteed unique transactional requirement ids */
    const selectedRequirements: AssuranceRequirement[] = INITIAL_MASTER_DOCS
      .filter((doc) => docToggles[doc.id] && (!isClient || doc.type !== 'Inspection'))
      .map((doc, idx) => ({
        id: generateUniqueRequirementId(uniqueSetId, idx),
        category: doc.category,
        title: doc.title,
        isMandatory: true,
        isFulfilled: false,
        ocrConfidence: Math.floor(90 + Math.random() * 9),
        verifierStatus: 'Pending',
      }));

    const initiatorOrg = isClient ? 'Chevron Australia Pty Ltd' : 'Northwind Marine Pty Ltd';
    const effectiveCharterer = isClient ? 'Chevron Australia Pty Ltd' : 'Northwind Marine Pty Ltd';

    const newSet: AssuranceSet = {
      id: uniqueSetId,
      title: title.trim(),
      vesselId: selectedVessel.id,
      vesselName: selectedVessel.name,
      imoNumber: selectedVessel.imoNumber,
      initiatorOrg,
      initiatorRole: isClient ? 'C Admin · Client Created' : 'Vessel Provider Admin',
      charterer: effectiveCharterer,
      charterWindowStart: startDate,
      charterWindowEnd: endDate,
      stage: 'Initiated',
      readinessScore: 10,
      mandatoryInspectionRequired: isClient ? false : inspectionRequired,
      inspectionCompleted: false,
      requirements: selectedRequirements,
      stakeholders: undefined,
      assignedStakeholders: undefined,
      createdByPersona: ''
    };

    addAssuranceSet(newSet);
    onClose();
  };

  return (
    <div
      className="modal show d-block map-modal-backdrop"
      tabIndex={-1}
      style={{ zIndex: 1050, backgroundColor: 'rgba(15, 23, 42, 0.45)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content bg-white text-dark border shadow-lg rounded-3">
          <div className="modal-header border-bottom bg-light px-4 py-3 d-flex align-items-center justify-content-between">
            <h5 className="modal-title fw-bold text-slate-900 m-0 fs-5">Create Assurance Set</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column overflow-hidden flex-grow-1">
            <div className="modal-body px-4 py-3 overflow-y-auto">

              {/* section 1: campaign & vessel details */}
              <div className="mb-4">
                <h6 className="fw-bold text-slate-800 mb-3 border-bottom pb-2 fs-6">1 · Campaign & Vessel Information</h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="campaign-title">
                      Campaign / Set Title *
                    </label>
                    <input
                      id="campaign-title"
                      type="text"
                      className={`form-control form-control-sm bg-white text-dark border-secondary-subtle${isDuplicateCampaignTitle(title, assuranceSets).isDuplicate ? ' is-invalid' : ''}`}
                      placeholder="e.g. Chevron Gorgon Charter Vetting 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                    {isDuplicateCampaignTitle(title, assuranceSets).isDuplicate && (
                      <div className="invalid-feedback d-block small mt-1">
                        {isDuplicateCampaignTitle(title, assuranceSets).reason}
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="target-vessel">
                      Target Vessel *
                    </label>
                    <select
                      id="target-vessel"
                      className="form-select form-select-sm bg-white text-dark border-secondary-subtle"
                      value={vesselId}
                      onChange={(e) => setVesselId(e.target.value)}
                    >
                      {availableVessels.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (IMO: {v.imoNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* section 2: charter window dates */}
              <div className="mb-4">
                <h6 className="fw-bold text-slate-800 mb-3 border-bottom pb-2 fs-6">2 · Charter Window Timeline</h6>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="charter-start">
                      Charter Start Date *
                    </label>
                    <input
                      id="charter-start"
                      type="date"
                      className="form-control form-control-sm bg-white text-dark border-secondary-subtle font-mono-code"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="charter-end">
                      Charter End Date *
                    </label>
                    <input
                      id="charter-end"
                      type="date"
                      className="form-control form-control-sm bg-white text-dark border-secondary-subtle font-mono-code"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* section 3: required documents & information */}
              <div className="mb-4">
                <h6 className="fw-bold text-slate-900 mb-1 fs-6">3 · Required documents & information</h6>
                <p className="text-muted small mb-3">
                  A document added here is marked <strong>Required</strong> with its toggle on. Switching a toggle off removes it from the set and hides it on the upload screen.
                </p>

                <div className="border-top">
                  {INITIAL_MASTER_DOCS.map((doc) => {
                    const isInspectionDoc = doc.type === 'Inspection';
                    const isRestrictedForPersona = isClient && isInspectionDoc;
                    const isEnabled = !isRestrictedForPersona && !!docToggles[doc.id];
                    return (
                      <div
                        key={doc.id}
                        className={`py-3 border-bottom d-flex align-items-center justify-content-between gap-3 ${isRestrictedForPersona ? 'bg-light-subtle px-2 rounded opacity-75' : ''}`}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="form-check form-switch m-0 fs-5">
                            <input
                              className="form-check-input style-toggle-switch cursor-pointer"
                              type="checkbox"
                              checked={isEnabled}
                              disabled={isRestrictedForPersona}
                              onChange={() => !isRestrictedForPersona && handleToggleDoc(doc.id)}
                              id={`toggle-${doc.id}`}
                              style={{ width: '2.5rem', height: '1.35rem', cursor: isRestrictedForPersona ? 'not-allowed' : 'pointer' }}
                            />
                          </div>
                          <div>
                            <label
                              htmlFor={`toggle-${doc.id}`}
                              className="fw-semibold text-slate-900 mb-0 d-block"
                              style={{ cursor: isRestrictedForPersona ? 'not-allowed' : 'pointer' }}
                            >
                              {doc.title}
                            </label>
                            <span className="text-muted small">
                              {doc.type} · {isRestrictedForPersona ? 'Restricted: Inspector checklists configured exclusively by Maritime Inspector' : isEnabled ? `Required in ${tempSetId}` : 'Excluded from set'}
                            </span>
                          </div>
                        </div>

                        <div>
                          {isRestrictedForPersona ? (
                            <span
                              className="badge rounded-pill fw-semibold px-2 py-1 text-secondary"
                              style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '0.7rem' }}
                            >
                              Inspector Only
                            </span>
                          ) : isEnabled ? (
                            <span
                              className="badge rounded-pill fw-semibold px-3 py-1"
                              style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                            >
                              Required
                            </span>
                          ) : (
                            <span
                              className="badge rounded-pill fw-semibold px-3 py-1 text-secondary"
                              style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0' }}
                            >
                              Off
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* section 4: workflow requirements */}
              <div className="mb-3">
                <h6 className="fw-bold text-slate-900 mb-3 fs-6">4 · Workflow requirements</h6>

                <div className="d-flex flex-column gap-2">
                  {/* card 1 */}
                  <div className="p-3 border rounded-3 d-flex align-items-center gap-3 bg-white shadow-sm">
                    <div className="form-check form-switch m-0 fs-5">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        checked={verificationRequired}
                        onChange={(e) => setVerificationRequired(e.target.checked)}
                        id="wf-verification"
                        style={{ width: '2.5rem', height: '1.35rem', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="wf-verification" className="fw-bold text-slate-900 mb-0 d-block cursor-pointer">
                        Verification required
                      </label>
                      <span className="text-muted small">Submitted documents route to an assigned Verifier</span>
                    </div>
                  </div>

                  {/* card 2 */}
                  <div className={`p-3 border rounded-3 d-flex align-items-center gap-3 ${isClient ? 'bg-light-subtle opacity-75' : 'bg-white shadow-sm'}`}>
                    <div className="form-check form-switch m-0 fs-5">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!isClient && inspectionRequired}
                        disabled={isClient}
                        onChange={(e) => !isClient && setInspectionRequired(e.target.checked)}
                        id="wf-inspection"
                        style={{ width: '2.5rem', height: '1.35rem', cursor: isClient ? 'not-allowed' : 'pointer' }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="wf-inspection"
                        className="fw-bold text-slate-900 mb-0 d-block"
                        style={{ cursor: isClient ? 'not-allowed' : 'pointer' }}
                      >
                        Visual / vessel inspection required
                      </label>
                      <span className="text-muted small">
                        {isClient
                          ? 'Inspection checklists and surveyor assignments are managed exclusively by Maritime Inspectors and Platform Administrators'
                          : 'Adds an Inspector step before approval'}
                      </span>
                    </div>
                  </div>

                  {/* card 3 */}
                  <div className="p-3 border rounded-3 d-flex align-items-center gap-3 bg-white shadow-sm">
                    <div className="form-check form-switch m-0 fs-5">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        checked={approvalRequired}
                        onChange={(e) => setApprovalRequired(e.target.checked)}
                        id="wf-approval"
                        style={{ width: '2.5rem', height: '1.35rem', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="wf-approval" className="fw-bold text-slate-900 mb-0 d-block cursor-pointer">
                        Formal approval required
                      </label>
                      <span className="text-muted small">Approver applies criteria and completes the set</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <div className="modal-footer border-top bg-light px-4 py-3">
              <button type="button" className="btn btn-sm btn-outline-secondary px-3" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary px-4 fw-semibold" style={{ backgroundColor: 'rgb(11, 27, 43)', borderColor: 'rgb(11, 27, 43)' }}>
                Initiate Assurance Set
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
