/* 
  file summary: dedicated page view for initiating a new marine assurance set campaign in light theme.
  responsibilities: captures campaign info, vessel selection, charter dates, master document requirements, workflow switches, and stakeholder role assignments.
  role in system: rendered by App.tsx when currentHashView is 'create-assurance-set'.
*/

import React, { useState, useEffect, useCallback } from 'react';
import { useMapStore } from '../store/useMapStore';
import { AssuranceSet, AssuranceRequirement } from '../types/assurance';
import { UserProfile } from '../types/user';
import { getBackButtonInfo } from '../utils/rbacHelpers';
import { usersWithRole, getAssuranceAssignmentWarnings, hasBlockingAssuranceAssignmentConflict } from '../utils/userRoleHelpers';

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
  what: renders dedicated create assurance set page with 2-column layout, template selection, and automatic vessel stakeholder pre-population.
  how: checks selected template or recent vessel campaigns to pre-fill stakeholders, allows admin editing, and creates new AssuranceSet model in store.
  with what file: src/views/CreateAssuranceSetView.tsx rendered by App.tsx.
*/
interface CreateAssuranceSetViewProps {
  templateSetId?: string;
}

export const CreateAssuranceSetView: React.FC<CreateAssuranceSetViewProps> = ({ templateSetId }) => {
  const { vessels, assuranceSets, addAssuranceSet, activePersona, setCurrentHashView, previousHashView, previousEntityId, users } = useMapStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateSetId || '');
  const [title, setTitle] = useState('');
  const [vesselId, setVesselId] = useState(vessels[0]?.id || '');
  const [charterer, setCharterer] = useState('Chevron Australia Pty Ltd');
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2027-11-01');

  /* tracks which field ids are currently playing the autofill shimmer animation */
  const [animatingFields, setAnimatingFields] = useState<Set<string>>(new Set());

  /**
    what: triggers the autofill shimmer animation on a given list of field ids.
    how: adds all ids to the animating set, then removes them after 750ms so the
         css animation plays exactly once without permanently altering the element style.
    with what file: CreateAssuranceSetView.tsx — called from applyTemplateData.
  */
  const triggerAutofillAnimation = useCallback((fieldIds: string[]) => {
    setAnimatingFields(new Set(fieldIds));
    setTimeout(() => setAnimatingFields(new Set()), 750);
  }, []);

  /* master document toggles state */
  const [docToggles, setDocToggles] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    INITIAL_MASTER_DOCS.forEach((d) => {
      initial[d.id] = d.defaultEnabled;
    });
    return initial;
  });

  /* workflow requirements state */
  const [verificationRequired, setVerificationRequired] = useState(true);
  const [inspectionRequired, setInspectionRequired] = useState(true);
  const [approvalRequired, setApprovalRequired] = useState(true);

  /* filter users by role */
  const submitterUsers = usersWithRole(users, 'Submitter');
  const verifierUsers = usersWithRole(users, 'Verifier');
  const inspectorUsers = usersWithRole(users, 'Inspector');
  const approverUsers = usersWithRole(users, 'Approver');

  /* stakeholder assignment state */
  const [assignedSubmitter, setAssignedSubmitter] = useState(submitterUsers[0]?.id || '');
  const [assignedVerifier, setAssignedVerifier] = useState(verifierUsers[0]?.id || '');
  const [assignedInspector, setAssignedInspector] = useState(inspectorUsers[0]?.id || '');
  const [assignedApprover, setAssignedApprover] = useState(approverUsers[0]?.id || '');
  const [assignmentError, setAssignmentError] = useState('');

  const selectedVessel = vessels.find((v) => v.id === vesselId) || vessels[0];
  const tempSetId = 'AS-2041';

  /* locate recent assurance set for selected vessel to pre-populate established stakeholders */
  const recentVesselSet = assuranceSets.find(
    (s) => s.vesselId === vesselId && (s.assignedSubmitter || s.assignedVerifier)
  );

  /* apply template auto-fill data */
  const applyTemplateData = (targetSet: AssuranceSet) => {
    setVesselId(targetSet.vesselId);
    setTitle(`${targetSet.title} (C Admin Charter Vetting)`);
    if (targetSet.charterWindowStart) setStartDate(targetSet.charterWindowStart);
    if (targetSet.charterWindowEnd) setEndDate(targetSet.charterWindowEnd);
    setInspectionRequired(targetSet.mandatoryInspectionRequired);

    /* extract charterer from template set */
    const templateCharterer = targetSet.charterer || targetSet.initiatorOrg || 'Chevron Australia Pty Ltd';
    setCharterer(templateCharterer);

    /* map master document toggles based on existing template requirements */
    const updatedToggles: Record<string, boolean> = {};
    INITIAL_MASTER_DOCS.forEach((d) => {
      const isMatched = targetSet.requirements.some(
        (r) =>
          r.title.toLowerCase().includes(d.title.toLowerCase()) ||
          d.title.toLowerCase().includes(r.title.toLowerCase()) ||
          r.category.toLowerCase().includes(d.category.toLowerCase())
      );
      updatedToggles[d.id] = isMatched;
    });
    setDocToggles(updatedToggles);

    /* trigger autofill shimmer on all programmatically populated fields */
    triggerAutofillAnimation([
      'grid-campaign-title',
      'grid-charterer-org',
      'grid-target-vessel',
      'grid-charter-start',
      'grid-charter-end',
      'grid-assign-submitter',
      'grid-assign-verifier',
      'grid-assign-inspector',
      'grid-assign-approver',
    ]);

    /* pre-populate stakeholder selections matching user profiles */
    if (targetSet.assignedSubmitter) {
      const matchSub = submitterUsers.find(
        (u: UserProfile) =>
          targetSet.assignedSubmitter?.includes(u.name) ||
          targetSet.assignedSubmitter?.includes(u.organization)
      );
      if (matchSub) setAssignedSubmitter(matchSub.id);
    }
    if (targetSet.assignedVerifier) {
      const matchVer = verifierUsers.find(
        (u: UserProfile) =>
          targetSet.assignedVerifier?.includes(u.name) ||
          targetSet.assignedVerifier?.includes(u.organization)
      );
      if (matchVer) setAssignedVerifier(matchVer.id);
    }
    if (targetSet.assignedInspector) {
      const matchIns = inspectorUsers.find(
        (u: UserProfile) =>
          targetSet.assignedInspector?.includes(u.name) ||
          targetSet.assignedInspector?.includes(u.organization)
      );
      if (matchIns) setAssignedInspector(matchIns.id);
    }
    if (targetSet.assignedApprover) {
      const matchApp = approverUsers.find(
        (u: UserProfile) =>
          targetSet.assignedApprover?.includes(u.name) ||
          targetSet.assignedApprover?.includes(u.organization)
      );
      if (matchApp) setAssignedApprover(matchApp.id);
    }
  };

  /* template selection change handler */
  const handleSelectTemplate = (tId: string) => {
    setSelectedTemplateId(tId);
    if (!tId) return;
    const targetSet = assuranceSets.find((s) => s.id === tId);
    if (targetSet) {
      applyTemplateData(targetSet);
    }
  };

  /* trigger auto-fill on mount or when templateSetId prop changes */
  useEffect(() => {
    if (templateSetId) {
      handleSelectTemplate(templateSetId);
    }
  }, [templateSetId]);

  /* pre-populate stakeholder selections whenever target vessel changes (if not using template) */
  useEffect(() => {
    if (!selectedTemplateId && recentVesselSet) {
      if (recentVesselSet.assignedSubmitter) {
        const matchSub = submitterUsers.find(
          (u: UserProfile) =>
            recentVesselSet.assignedSubmitter?.includes(u.name) ||
            recentVesselSet.assignedSubmitter?.includes(u.organization)
        );
        if (matchSub) setAssignedSubmitter(matchSub.id);
      }
      if (recentVesselSet.assignedVerifier) {
        const matchVer = verifierUsers.find(
          (u: UserProfile) =>
            recentVesselSet.assignedVerifier?.includes(u.name) ||
            recentVesselSet.assignedVerifier?.includes(u.organization)
        );
        if (matchVer) setAssignedVerifier(matchVer.id);
      }
      if (recentVesselSet.assignedInspector) {
        const matchIns = inspectorUsers.find(
          (u: UserProfile) =>
            recentVesselSet.assignedInspector?.includes(u.name) ||
            recentVesselSet.assignedInspector?.includes(u.organization)
        );
        if (matchIns) setAssignedInspector(matchIns.id);
      }
      if (recentVesselSet.assignedApprover) {
        const matchApp = approverUsers.find(
          (u: UserProfile) =>
            recentVesselSet.assignedApprover?.includes(u.name) ||
            recentVesselSet.assignedApprover?.includes(u.organization)
        );
        if (matchApp) setAssignedApprover(matchApp.id);
      }
    }
  }, [vesselId, selectedTemplateId]);

  const handleToggleDoc = (docId: string) => {
    setDocToggles((prev) => ({
      ...prev,
      [docId]: !prev[docId],
    }));
  };

  const selectedSubmitter = users.find((u: UserProfile) => u.id === assignedSubmitter);
  const selectedVerifier = users.find((u: UserProfile) => u.id === assignedVerifier);
  const selectedInspector = users.find((u: UserProfile) => u.id === assignedInspector);
  const selectedApprover = users.find((u: UserProfile) => u.id === assignedApprover);

  const assignmentWarnings = getAssuranceAssignmentWarnings({
    submitterId: assignedSubmitter,
    verifierId: verificationRequired ? assignedVerifier : undefined,
    approverId: approvalRequired ? assignedApprover : undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedVessel) return;

    if (
      hasBlockingAssuranceAssignmentConflict({
        verifierId: verificationRequired ? assignedVerifier : undefined,
        approverId: approvalRequired ? assignedApprover : undefined,
      })
    ) {
      setAssignmentError(
        'Cannot create assurance set: Verifier and Approver must be different users on the same campaign.',
      );
      return;
    }
    setAssignmentError('');

    const isClientAdmin = activePersona === 'C Admin';

    /* construct enabled requirements list */
    const selectedRequirements: AssuranceRequirement[] = INITIAL_MASTER_DOCS
      .filter((doc) => docToggles[doc.id])
      .map((doc) => ({
        id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
        category: doc.category,
        title: doc.title,
        isMandatory: true,
        isFulfilled: false,
        ocrConfidence: Math.floor(90 + Math.random() * 9),
        verifierStatus: 'Pending',
      }));

    /* determine assigned stakeholders with organization attribution */
    const newSet: AssuranceSet = {
      id: `AS-2026-${Math.floor(100 + Math.random() * 900)}`,
      title,
      vesselId: selectedVessel.id,
      vesselName: selectedVessel.name,
      imoNumber: selectedVessel.imoNumber,
      initiatorOrg: isClientAdmin ? 'Chevron Australia Pty Ltd' : 'Pacific Ocean Logistics',
      initiatorRole: isClientAdmin ? 'C Admin · Client Created' : 'Vessel Provider Admin',
      charterer: charterer || (isClientAdmin ? 'Chevron Australia Pty Ltd' : 'Pacific Ocean Logistics'),
      charterWindowStart: startDate,
      charterWindowEnd: endDate,
      stage: 'Initiated',
      readinessScore: 0,
      mandatoryInspectionRequired: inspectionRequired,
      inspectionCompleted: false,
      assignedSubmitter: selectedSubmitter
        ? `${selectedSubmitter.name} (${selectedSubmitter.organization})`
        : 'Pending Admin Assignment',
      assignedVerifier: verificationRequired
        ? selectedVerifier
          ? `${selectedVerifier.name} (${selectedVerifier.organization})`
          : 'Pending Admin Assignment'
        : undefined,
      assignedInspector: inspectionRequired
        ? selectedInspector
          ? `${selectedInspector.name} (${selectedInspector.organization})`
          : 'Pending Admin Assignment'
        : undefined,
      assignedApprover: approvalRequired
        ? selectedApprover
          ? `${selectedApprover.name} (${selectedApprover.organization})`
          : 'Pending Admin Assignment'
        : undefined,
      requirements: selectedRequirements,
    };

    addAssuranceSet(newSet);
    setCurrentHashView('assurance-sets', newSet.id);
  };

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: '1280px' }}>

      {/* page top header */}
      <div className="d-flex flex-wrap align-items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="fw-bold text-slate-900 m-0 fs-3">Create Assurance Set</h2>
          <p className="text-muted small m-0 mt-1">
            Configure campaign particulars, master vessel/crew document requirements, workflow policies, and assigned role stakeholders.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>

        {/* 2-column grid layout: 1, 2 & 5 on left, 3 & 4 on right */}
        <div className="row g-4 mb-4">

          {/* left column: section 1, section 2, and section 5 */}
          <div className="col-12 col-lg-6 d-flex flex-column gap-4">

            {/* 1 · campaign & vessel information */}
            <div className="card border shadow-sm rounded-3 bg-white">
              <div className="card-header bg-light border-bottom px-4 py-3">
                <h5 className="fw-bold text-slate-900 m-0 fs-6">1 · Campaign & Vessel Information</h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  {/* template selection dropdown */}
                  <div className="col-12">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="grid-template-set">
                      Use Existing Assurance Set as Template (Auto-Fill for C Admin)
                    </label>
                    <select
                      id="grid-template-set"
                      className="form-select map-template-select-box text-dark border-secondary-subtle"
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                    >
                      <option value="">-- Select an existing Assurance Set to auto-fill --</option>
                      {assuranceSets.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.id}: {s.title} ({s.vesselName} · {s.initiatorRole})
                        </option>
                      ))}
                    </select>
                    <div className="form-text text-muted small mt-1">
                      Selecting an existing set (e.g. created by Vessel Admin) auto-fills vessel, campaign title, charter window, document toggles, and stakeholders.
                    </div>
                  </div>

                  {selectedTemplateId && (
                    <div className="col-12">
                      <div className="map-template-autofill-banner d-flex align-items-center justify-content-between p-3 rounded-2">
                        <div>
                          <div className="fw-bold fs-7 text-primary mb-1">
                            Auto-filled from Template: {assuranceSets.find((s) => s.id === selectedTemplateId)?.title}
                          </div>
                          <div className="text-secondary small">
                            Vessel, Charterer ({charterer}), Charter Window, Master Document Toggles, and Role Assignments loaded from template.
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setSelectedTemplateId('')}
                        >
                          Clear Template
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="col-12">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="grid-campaign-title">
                      Campaign / Set Title *
                    </label>
                    <input
                      id="grid-campaign-title"
                      type="text"
                      className={`form-control bg-white text-dark border-secondary-subtle${animatingFields.has('grid-campaign-title') ? ' map-autofill-animate' : ''}`}
                      placeholder="e.g. Chevron Gorgon Charter Vetting 2026"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="grid-charterer-org">
                      Charterer Organization *
                    </label>
                    <input
                      id="grid-charterer-org"
                      type="text"
                      className={`form-control bg-white text-dark border-secondary-subtle${animatingFields.has('grid-charterer-org') ? ' map-autofill-animate' : ''}`}
                      placeholder="e.g. Chevron Australia Pty Ltd"
                      value={charterer}
                      onChange={(e) => setCharterer(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="grid-target-vessel">
                      Target Vessel *
                    </label>
                    <select
                      id="grid-target-vessel"
                      className={`form-select bg-white text-dark border-secondary-subtle${animatingFields.has('grid-target-vessel') ? ' map-autofill-animate' : ''}`}
                      value={vesselId}
                      onChange={(e) => setVesselId(e.target.value)}
                    >
                      {vessels.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} (IMO: {v.imoNumber} · Flag: {v.flagState})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold">
                      Initiating Organization
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light text-secondary border-secondary-subtle"
                      value={activePersona === 'C Admin' ? 'Chevron Australia Pty Ltd' : 'Pacific Ocean Logistics'}
                      disabled
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold">
                      Initiator Role Context
                    </label>
                    <input
                      type="text"
                      className="form-control bg-light text-secondary border-secondary-subtle"
                      value={activePersona === 'C Admin' ? 'C Admin · Client Created' : 'Vessel Provider Admin'}
                      disabled
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2 · charter window timeline */}
            <div className="card border shadow-sm rounded-3 bg-white">
              <div className="card-header bg-light border-bottom px-4 py-3">
                <h5 className="fw-bold text-slate-900 m-0 fs-6">2 · Charter Window Timeline</h5>
              </div>
              <div className="card-body p-4">
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="grid-charter-start">
                      Charter Start Date *
                    </label>
                    <input
                      id="grid-charter-start"
                      type="date"
                      className={`form-control bg-white text-dark border-secondary-subtle font-mono-code${animatingFields.has('grid-charter-start') ? ' map-autofill-animate' : ''}`}
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label text-secondary small fw-semibold" htmlFor="grid-charter-end">
                      Charter End Date *
                    </label>
                    <input
                      id="grid-charter-end"
                      type="date"
                      className={`form-control bg-white text-dark border-secondary-subtle font-mono-code${animatingFields.has('grid-charter-end') ? ' map-autofill-animate' : ''}`}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 5 · stakeholder role assignments (only shown to Administrator, hidden for Client / non-admin personas) */}
            {activePersona === 'Administrator' && (
              <div className="card border shadow-sm rounded-3 bg-white">
                <div className="card-header bg-light border-bottom px-4 py-3 d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="fw-bold text-slate-900 m-0 fs-6">5 · Stakeholder Role Assignments</h5>
                    <p className="text-muted small m-0 mt-1">
                      Assign system users & organizations for active workflow roles.
                    </p>
                  </div>
                </div>
                <div className="card-body p-4">
                  {assignmentError && (
                    <div className="alert alert-danger py-2 small mb-3">{assignmentError}</div>
                  )}
                  {assignmentWarnings.length > 0 && (
                    <div className="alert alert-warning py-2 small mb-3">
                      <div className="fw-semibold mb-1">Segregation-of-Duty Notice</div>
                      <ul className="mb-0 ps-3">
                        {assignmentWarnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="d-flex flex-column gap-3">
                    {/* submitter assignment (always required) */}
                    <div className="p-3 border rounded-3 bg-light-subtle">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <label className="form-label text-slate-900 fw-bold mb-0 small" htmlFor="grid-assign-submitter">
                          Assigned Submitter *
                        </label>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle rounded-pill" style={{ fontSize: '0.65rem' }}>
                          Submitter Role
                        </span>
                      </div>
                      <select
                        id="grid-assign-submitter"
                        className={`form-select form-select-sm bg-white text-dark border-secondary-subtle mb-2${animatingFields.has('grid-assign-submitter') ? ' map-autofill-animate' : ''}`}
                        value={assignedSubmitter}
                        onChange={(e) => setAssignedSubmitter(e.target.value)}
                        required
                      >
                        {submitterUsers.map((u: UserProfile) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.organization}) — {u.departmentOrScope}
                          </option>
                        ))}
                      </select>
                      {selectedSubmitter && (
                        <div className="text-muted small border-top pt-2">
                          <div><strong>Assigned Org:</strong> {selectedSubmitter.organization}</div>
                          <div><strong>Email:</strong> {selectedSubmitter.email}</div>
                        </div>
                      )}
                    </div>

                    {/* verifier assignment - ONLY included if verificationRequired is true */}
                    {verificationRequired && (
                      <div className="p-3 border rounded-3 bg-light-subtle">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <label className="form-label text-slate-900 fw-bold mb-0 small" htmlFor="grid-assign-verifier">
                            Assigned Verifier *
                          </label>
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill" style={{ fontSize: '0.65rem' }}>
                            Verifier Role
                          </span>
                        </div>
                        <select
                          id="grid-assign-verifier"
                          className={`form-select form-select-sm bg-white text-dark border-secondary-subtle mb-2${animatingFields.has('grid-assign-verifier') ? ' map-autofill-animate' : ''}`}
                          value={assignedVerifier}
                          onChange={(e) => setAssignedVerifier(e.target.value)}
                          required
                        >
                          {verifierUsers.map((u: UserProfile) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.organization}) — {u.departmentOrScope}
                            </option>
                          ))}
                        </select>
                        {selectedVerifier && (
                          <div className="text-muted small border-top pt-2">
                            <div><strong>Assigned Org:</strong> {selectedVerifier.organization}</div>
                            <div><strong>Email:</strong> {selectedVerifier.email}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* inspector assignment - ONLY included if inspectionRequired is true */}
                    {inspectionRequired && (
                      <div className="p-3 border rounded-3 bg-light-subtle">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <label className="form-label text-slate-900 fw-bold mb-0 small" htmlFor="grid-assign-inspector">
                            Assigned Inspector *
                          </label>
                          <span className="badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill" style={{ fontSize: '0.65rem' }}>
                            Inspector Role
                          </span>
                        </div>
                        <select
                          id="grid-assign-inspector"
                          className={`form-select form-select-sm bg-white text-dark border-secondary-subtle mb-2${animatingFields.has('grid-assign-inspector') ? ' map-autofill-animate' : ''}`}
                          value={assignedInspector}
                          onChange={(e) => setAssignedInspector(e.target.value)}
                          required
                        >
                          {inspectorUsers.map((u: UserProfile) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.organization}) — {u.departmentOrScope}
                            </option>
                          ))}
                        </select>
                        {selectedInspector && (
                          <div className="text-muted small border-top pt-2">
                            <div><strong>Assigned Org:</strong> {selectedInspector.organization}</div>
                            <div><strong>Email:</strong> {selectedInspector.email}</div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* approver assignment - ONLY included if approvalRequired is true */}
                    {approvalRequired && (
                      <div className="p-3 border rounded-3 bg-light-subtle">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <label className="form-label text-slate-900 fw-bold mb-0 small" htmlFor="grid-assign-approver">
                            Assigned Approver *
                          </label>
                          <span className="badge bg-success-subtle text-success border border-success-subtle rounded-pill" style={{ fontSize: '0.65rem' }}>
                            Approver Role
                          </span>
                        </div>
                        <select
                          id="grid-assign-approver"
                          className={`form-select form-select-sm bg-white text-dark border-secondary-subtle mb-2${animatingFields.has('grid-assign-approver') ? ' map-autofill-animate' : ''}`}
                          value={assignedApprover}
                          onChange={(e) => setAssignedApprover(e.target.value)}
                          required
                        >
                          {approverUsers.map((u: UserProfile) => (
                            <option key={u.id} value={u.id}>
                              {u.name} ({u.organization}) — {u.departmentOrScope}
                            </option>
                          ))}
                        </select>
                        {selectedApprover && (
                          <div className="text-muted small border-top pt-2">
                            <div><strong>Assigned Org:</strong> {selectedApprover.organization}</div>
                            <div><strong>Email:</strong> {selectedApprover.email}</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* right column: section 3 and section 4 */}
          <div className="col-12 col-lg-6 d-flex flex-column gap-4">

            {/* 3 · required documents & information */}
            <div className="card border shadow-sm rounded-3 bg-white">
              <div className="card-header bg-light border-bottom px-4 py-3">
                <h5 className="fw-bold text-slate-900 m-0 fs-6">3 · Required documents & information</h5>
                <p className="text-muted small m-0 mt-1">
                  A document added here is marked <strong>Required</strong> with its toggle on. Switching a toggle off removes it from the set and hides it on the upload screen.
                </p>
              </div>
              <div className="card-body p-4">
                <div className="border-top">
                  {INITIAL_MASTER_DOCS.map((doc) => {
                    const isEnabled = !!docToggles[doc.id];
                    return (
                      <div
                        key={doc.id}
                        className="py-2 border-bottom d-flex align-items-center justify-content-between gap-3"
                      >
                        <div className="d-flex align-items-center gap-3">
                          <div className="form-check form-switch m-0 fs-5">
                            <input
                              className="form-check-input style-toggle-switch cursor-pointer"
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => handleToggleDoc(doc.id)}
                              id={`grid-toggle-${doc.id}`}
                              style={{ width: '2.5rem', height: '1.35rem', cursor: 'pointer' }}
                            />
                          </div>
                          <div>
                            <label htmlFor={`grid-toggle-${doc.id}`} className="fw-semibold text-slate-900 mb-0 d-block cursor-pointer small">
                              {doc.title}
                            </label>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                              {doc.type} · {isEnabled ? `Required in ${tempSetId}` : 'Excluded from set'}
                            </span>
                          </div>
                        </div>

                        <div>
                          {isEnabled ? (
                            <span
                              className="badge rounded-pill fw-semibold px-3 py-1"
                              style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontSize: '0.75rem' }}
                            >
                              Required
                            </span>
                          ) : (
                            <span
                              className="badge rounded-pill fw-semibold px-3 py-1 text-secondary"
                              style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}
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
            </div>

            {/* 4 · workflow requirements */}
            <div className="card border shadow-sm rounded-3 bg-white">
              <div className="card-header bg-light border-bottom px-4 py-3">
                <h5 className="fw-bold text-slate-900 m-0 fs-6">4 · Workflow requirements</h5>
              </div>
              <div className="card-body p-4">
                <div className="d-flex flex-column gap-3">
                  {/* card 1 */}
                  <div className="p-3 border rounded-3 d-flex align-items-center gap-3 bg-white shadow-sm">
                    <div className="form-check form-switch m-0 fs-5">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        checked={verificationRequired}
                        onChange={(e) => setVerificationRequired(e.target.checked)}
                        id="grid-wf-verification"
                        style={{ width: '2.5rem', height: '1.35rem', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="grid-wf-verification" className="fw-bold text-slate-900 mb-0 d-block cursor-pointer small">
                        Verification required
                      </label>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>Submitted documents route to an assigned Verifier</span>
                    </div>
                  </div>

                  {/* card 2 */}
                  <div className="p-3 border rounded-3 d-flex align-items-center gap-3 bg-white shadow-sm">
                    <div className="form-check form-switch m-0 fs-5">
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        checked={inspectionRequired}
                        onChange={(e) => setInspectionRequired(e.target.checked)}
                        id="grid-wf-inspection"
                        style={{ width: '2.5rem', height: '1.35rem', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="grid-wf-inspection" className="fw-bold text-slate-900 mb-0 d-block cursor-pointer small">
                        Visual / vessel inspection required
                      </label>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>Adds an Inspector step before approval</span>
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
                        id="grid-wf-approval"
                        style={{ width: '2.5rem', height: '1.35rem', cursor: 'pointer' }}
                      />
                    </div>
                    <div>
                      <label htmlFor="grid-wf-approval" className="fw-bold text-slate-900 mb-0 d-block cursor-pointer small">
                        Formal approval required
                      </label>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>Approver applies criteria and completes the set</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* action buttons directly below section 4 card */}
            <div className="d-flex align-items-center justify-content-end gap-3 pt-2 mb-4">
              <button
                type="button"
                className="btn btn-outline-secondary px-4 py-2"
                onClick={() => setCurrentHashView('assurance-sets')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn text-white px-5 py-2 fw-semibold shadow-sm"
                style={{ backgroundColor: 'rgb(11, 27, 43)', borderColor: 'rgb(11, 27, 43)' }}
              >
                Initiate Assurance Set
              </button>
            </div>

          </div>

        </div>

      </form>
    </div>
  );
};
