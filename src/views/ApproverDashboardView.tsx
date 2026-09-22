/* 
  file summary: executive approval gate view presenting approval requests table and deep-dive approval detail page.
  responsibilities: renders assigned vetting campaigns in a responsive table, displays 2-column assurance set information with vertically stacked executive readiness dial and certification controls, and enforces sign-off blocking logic.
  role in system: primary operational workspace for Approvers (/approver and /approver/:setId).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { formatMaritimeDate } from '../utils/formatters';
import { isAssuranceSetAssignedToPersona } from '../utils/rbacHelpers';
import { MasterDocument } from '../types/document';
import { DocumentReviewDrawer } from '../components/drawers/DocumentReviewDrawer';

/**
  what: renders approval requests table list view or approval detail page.
  how: checks store currentEntityId to switch between table list and 2-column detail page with stacked readiness dial and controls.
  with what file: src/views/ApproverDashboardView.tsx loaded by App.tsx.
*/
export const ApproverDashboardView: React.FC = () => {
  const {
    assuranceSets,
    setApproverDecision,
    activePersona,
    vessels,
    documents,
    currentEntityId,
    setCurrentHashView,
  } = useMapStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [approverNotes, setApproverNotes] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedDocForReview, setSelectedDocForReview] = useState<{ doc: MasterDocument; notes?: string } | null>(null);

  /* filter assigned sets that are verified and awaiting approval */
  const assignedSets = assuranceSets.filter((s) => {
    const isAssigned = isAssuranceSetAssignedToPersona(s, activePersona);
    if (activePersona === 'Approver') {
      const isVerifiedAndReady =
        s.stage === 'Approval' ||
        s.stage === 'Approved & Certified' ||
        s.approverDecision !== 'Pending' ||
        (s.requirements.length > 0 &&
          s.requirements.every((r) => !r.isMandatory || r.verifierStatus === 'Verified' || r.isFulfilled));
      return isAssigned && isVerifiedAndReady;
    }
    return isAssigned;
  });

  /* active selected set from currentEntityId route parameter or state fallback */
  const selectedSet = assignedSets.find((s) => s.id === currentEntityId);

  /* check approval blocking logic: any unverified or missing mandatory requirement blocks sign-off */
  const unfulfilledMandatory = selectedSet
    ? selectedSet.requirements.filter((r) => r.isMandatory && !r.isFulfilled)
    : [];
  const isApprovalBlocked = unfulfilledMandatory.length > 0;

  const handleDecision = (decision: 'Approved' | 'Returned for Correction' | 'Rejected') => {
    if (!selectedSet) return;

    if (decision === 'Approved' && isApprovalBlocked) {
      setFeedbackMessage('Approval Blocked: Mandatory statutory requirements remain unverified or expired.');
      return;
    }

    setApproverDecision(selectedSet.id, decision, approverNotes || `Executive Decision: ${decision}`);
    setFeedbackMessage(`Assurance Set ${selectedSet.id} updated to ${decision}.`);
    setApproverNotes('');
  };

  /* filtered assurance sets for table view */
  const filteredSets = assignedSets.filter((set) => {
    const matchesSearch =
      set.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.vesselName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      set.imoNumber.includes(searchTerm) ||
      (set.assignedSubmitter && set.assignedSubmitter.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStage = stageFilter === 'All' || set.stage === stageFilter;

    return matchesSearch && matchesStage;
  });

  /* calculation of top summary stats */
  const totalCampaigns = assignedSets.length;
  const pendingApprovals = assignedSets.filter((s) => s.approverDecision === 'Pending' || s.stage === 'Approval').length;
  const approvedCount = assignedSets.filter((s) => s.approverDecision === 'Approved' || s.stage === 'Approved & Certified').length;
  const returnedCount = assignedSets.filter((s) => s.approverDecision === 'Returned for Correction' || s.approverDecision === 'Rejected').length;

  /* render detail page if currentEntityId is present */
  if (selectedSet) {
    const vessel = vessels.find((v) => v.id === selectedSet.vesselId || v.name === selectedSet.vesselName);

    return (
      <div className="d-flex flex-column gap-4">
        {/* top header banner for detail page */}
        <div className="d-flex flex-wrap align-items-center justify-between gap-3">
          <div>
            <h3 className="fw-bold mb-0 text-primary">{selectedSet.title}</h3>
            <span className="small text-secondary font-mono-code">
              {selectedSet.id} · {selectedSet.vesselName} (IMO {selectedSet.imoNumber})
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="badge bg-light text-dark border font-mono-code">
              Stage: {selectedSet.stage}
            </span>
            {selectedSet.approverDecision && (
              <span
                className={`badge font-mono-code ${selectedSet.approverDecision === 'Approved'
                  ? 'bg-success text-white'
                  : selectedSet.approverDecision === 'Returned for Correction'
                    ? 'bg-warning text-dark'
                    : 'bg-danger text-white'
                  }`}
              >
                {selectedSet.approverDecision}
              </span>
            )}
          </div>
        </div>

        {/* two-column layout: first column assurance set information, second column readiness dial & certification controls vertical stack */}
        <div className="row g-4">
          {/* first column (left): information of the assurance set */}
          <div className="col-lg-6">
            <div className="d-flex flex-column gap-4">
              {/* campaign particulars & stakeholder role assignments card */}
              <div className="card map-card-custom p-4">
                <div className="text-uppercase font-mono-code fw-bold text-secondary mb-3 small">
                  Campaign Particulars & Stakeholders — {selectedSet.id}
                </div>
                <div className="row g-3 font-mono-code small mb-3">
                  <div className="col-md-6 border-end pr-3">
                    <div className="text-secondary mb-1">Initiator Organisation:</div>
                    <div className="fw-bold text-dark mb-2">{selectedSet.initiatorOrg}</div>

                    <div className="text-secondary mb-1">Initiator Role:</div>
                    <div className="fw-bold text-dark mb-2">{selectedSet.initiatorRole}</div>

                    <div className="text-secondary mb-1">Charter Window:</div>
                    <div className="fw-bold text-dark">
                      {formatMaritimeDate(selectedSet.charterWindowStart)} - {formatMaritimeDate(selectedSet.charterWindowEnd)}
                    </div>
                  </div>

                  <div className="col-md-6 pl-3">
                    <div className="text-secondary mb-1">Vessel Type & Classification:</div>
                    <div className="fw-bold text-dark mb-2">
                      {vessel?.vesselType || 'Offshore Support Vessel'} ({vessel?.classificationSociety || 'DNV'})
                    </div>

                    <div className="text-secondary mb-1">Dynamic Positioning:</div>
                    <div className="fw-bold text-dark mb-2">{vessel?.dynamicPositioningClass || 'DP2'}</div>

                    <div className="text-secondary mb-1">Mandatory Inspection:</div>
                    <div className="fw-bold text-dark">
                      {selectedSet.mandatoryInspectionRequired ? 'Required & Verified' : 'Not Required'}
                    </div>
                  </div>
                </div>

                <div className="border-top pt-3">
                  <div className="text-uppercase font-mono-code fw-bold text-secondary mb-2 small">
                    Stakeholder Role Assignments
                  </div>
                  <div className="row g-2">
                    <div className="col-md-3 col-6">
                      <div className="p-2 rounded bg-light border">
                        <div className="text-secondary small">Submitter</div>
                        <div className="fw-bold text-dark text-truncate small">{selectedSet.assignedSubmitter || 'Unassigned'}</div>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-2 rounded bg-light border">
                        <div className="text-secondary small">Verifier</div>
                        <div className="fw-bold text-dark text-truncate small">{selectedSet.assignedVerifier || 'Unassigned'}</div>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-2 rounded bg-light border">
                        <div className="text-secondary small">Inspector</div>
                        <div className="fw-bold text-dark text-truncate small">
                          {selectedSet.mandatoryInspectionRequired
                            ? (selectedSet.assignedInspector || 'Unassigned')
                            : 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 col-6">
                      <div className="p-2 rounded bg-light border">
                        <div className="text-secondary small">Approver</div>
                        <div className="fw-bold text-dark text-truncate small">{selectedSet.assignedApprover || 'Unassigned'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* statutory requirements register table displaying verified documents only */}
              {(() => {
                const verifiedRequirements = selectedSet.requirements.filter(
                  (req) => req.verifierStatus === 'Verified' || req.isFulfilled
                );

                return (
                  <div className="card map-card-custom">
                    <div className="table-responsive">
                      <table className="table map-table-custom align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Requirement Title</th>
                            <th>OCR Conf</th>
                            <th>Status</th>
                            <th className="text-end">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {verifiedRequirements.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center text-secondary py-4 font-mono-code">
                                No verified documents available for executive approval yet.
                              </td>
                            </tr>
                          ) : (
                            verifiedRequirements.map((req) => {
                              const linkedDoc = documents.find((d) => d.id === req.documentId);
                              return (
                                <tr key={req.id}>
                                  <td>
                                    <span className="badge bg-light text-dark border small">{req.category}</span>
                                  </td>
                                  <td className="fw-semibold text-dark">
                                    {req.title}
                                    {req.isMandatory && <span className="text-danger ms-1">*</span>}
                                  </td>
                                  <td>
                                    <ConfidenceBadge score={req.ocrConfidence} />
                                  </td>
                                  <td>
                                    {(() => {
                                      const isSetApproved = selectedSet.stage === 'Approved & Certified' || selectedSet.approverDecision === 'Approved';
                                      return (
                                        <span className={`badge font-mono-code ${isSetApproved ? 'bg-success text-white' : 'bg-info text-dark'}`}>
                                          {isSetApproved ? 'Approved' : 'Verified'}
                                        </span>
                                      );
                                    })()}
                                  </td>
                                  <td className="text-end">
                                    {linkedDoc ? (
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary font-mono-code"
                                        onClick={() => setSelectedDocForReview({ doc: linkedDoc, notes: req.notes })}
                                      >
                                        Review
                                      </button>
                                    ) : (
                                      <span className="text-secondary small font-mono-code">No Document</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* second column (right): vertical stack containing executive readiness dial and certification controls */}
          <div className="col-lg-6">
            <div className="d-flex flex-column gap-4">
              {/* card 1: executive compliance readiness dial */}
              <div className="card map-card-custom p-4 text-center">
                <h5 className="fw-semibold mb-3 text-slate-900">Executive Compliance Readiness Dial</h5>
                <ReadinessGauge score={selectedSet.readinessScore} size="lg" />

                <div className="mt-4 p-3 bg-light border border-secondary rounded text-start small">
                  <h6 className="fw-bold text-uppercase text-secondary mb-2">
                    Approval Blocking Rule Engine Status
                  </h6>
                  {isApprovalBlocked ? (
                    <div className="text-danger fw-semibold">
                      [APPROVAL BLOCKED] {unfulfilledMandatory.length} mandatory requirement(s) pending verification or expired.
                    </div>
                  ) : (
                    <div className="text-success fw-semibold">
                      [ALL MANDATORY REQUIREMENTS FULFILLED] Ready for final certification sign-off.
                    </div>
                  )}
                </div>
              </div>

              {/* card 2: charter certification controls */}
              <div className="card map-card-custom p-4">
                <h5 className="fw-semibold mb-3 text-slate-900">Charter Certification Controls</h5>

                {feedbackMessage && (
                  <div className="alert alert-info py-2 small mb-3">{feedbackMessage}</div>
                )}

                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="approver-notes">
                    Executive Approver Decision Notes:
                  </label>
                  <textarea
                    id="approver-notes"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    rows={3}
                    placeholder={
                      activePersona === 'Approver'
                        ? 'Enter justification notes or return feedback...'
                        : 'Read-only view for non-approver personas...'
                    }
                    value={approverNotes}
                    onChange={(e) => setApproverNotes(e.target.value)}
                    disabled={activePersona !== 'Approver'}
                  />
                </div>

                {activePersona === 'Approver' && (
                  <div className="d-flex flex-column gap-2">
                    <button
                      type="button"
                      className="btn btn-success text-white py-2 fw-semibold"
                      onClick={() => handleDecision('Approved')}
                      disabled={isApprovalBlocked}
                    >
                      Approve & Certify Charter Readiness
                    </button>
                    <button
                      type="button"
                      className="btn btn-warning text-dark py-2 fw-semibold"
                      onClick={() => handleDecision('Returned for Correction')}
                      disabled={isApprovalBlocked}
                    >
                      Return for Correction
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger text-white py-2 fw-semibold"
                      onClick={() => handleDecision('Rejected')}
                      disabled={isApprovalBlocked}
                    >
                      Reject Assurance Set
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* reference photo lightbox modal */}
        {isLightboxOpen && (
          <div className="map-photo-lightbox-backdrop" onClick={() => setIsLightboxOpen(false)}>
            <div className="map-photo-lightbox-content" onClick={(e) => e.stopPropagation()}>
              <div className="p-3 border-bottom d-flex align-items-center justify-between">
                <h6 className="fw-bold mb-0 text-dark">
                  High-Resolution Reference Photo — {selectedSet.vesselName} ({selectedSet.id})
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsLightboxOpen(false)}
                />
              </div>
              <div className="p-3 bg-dark text-center">
                <svg
                  viewBox="0 0 800 450"
                  className="map-photo-lightbox-img"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="800" height="450" fill="#0f172a" />
                  <path d="M0 320 Q200 300 400 320 T800 320 L800 450 L0 450 Z" fill="#0369a1" opacity="0.6" />
                  <path d="M0 340 Q200 330 400 340 T800 340 L800 450 L0 450 Z" fill="#0284c7" opacity="0.4" />
                  <path
                    d="M 120 310 L 180 230 L 580 230 L 660 300 L 640 330 L 140 330 Z"
                    fill="#334155"
                    stroke="#94a3b8"
                    strokeWidth="3"
                  />
                  <rect x="220" y="140" width="160" height="90" fill="#cbd5e1" rx="4" />
                  <rect x="250" y="90" width="100" height="50" fill="#e2e8f0" rx="3" />
                  <rect x="270" y="60" width="60" height="30" fill="#f8fafc" rx="2" />
                  <rect x="280" y="70" width="40" height="10" fill="#0284c7" />
                  <rect x="260" y="105" width="80" height="12" fill="#0369a1" />
                  <path d="M 500 230 L 500 130 L 530 130 L 530 230 Z" fill="#f59e0b" />
                  <line x1="515" y1="130" x2="620" y2="180" stroke="#f59e0b" strokeWidth="6" />
                  <line x1="80" y1="325" x2="720" y2="325" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6 4" />
                  <text x="390" y="280" fill="#ffffff" fontSize="20" fontWeight="bold" fontFamily="monospace">
                    {selectedSet.vesselName.toUpperCase()}
                  </text>
                  <text x="390" y="302" fill="#94a3b8" fontSize="14" fontFamily="monospace">
                    IMO {selectedSet.imoNumber} · STATUTORY VERIFIED ASSET PHOTO
                  </text>
                </svg>
              </div>
              <div className="p-3 bg-light border-top d-flex align-items-center justify-between">
                <span className="small text-secondary font-mono-code">
                  Resolution: 1920x1080 HD · Verification Seal: AMSA Marine Audit Division
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary font-mono-code"
                  onClick={() => setIsLightboxOpen(false)}
                >
                  Close Photo Preview
                </button>
              </div>
            </div>
          </div>
        )}

        {/* document review drawer */}
        <DocumentReviewDrawer
          document={selectedDocForReview?.doc || null}
          requirementNotes={selectedDocForReview?.notes}
          onClose={() => setSelectedDocForReview(null)}
        />
      </div>
    );
  }

  /* render main approval requests list table view */
  return (
    <div className="d-flex flex-column gap-4">
      {/* top statistics summary row */}
      <div className="row g-3">
        <div className="col-md-3 col-6">
          <div className="map-approval-stat-card">
            <div className="text-secondary small font-mono-code mb-1">Total Approval Requests</div>
            <div className="h3 fw-bold text-dark mb-0">{totalCampaigns}</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="map-approval-stat-card">
            <div className="text-secondary small font-mono-code mb-1">Pending Sign-off</div>
            <div className="h3 fw-bold text-warning mb-0">{pendingApprovals}</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="map-approval-stat-card">
            <div className="text-secondary small font-mono-code mb-1">Approved & Certified</div>
            <div className="h3 fw-bold text-success mb-0">{approvedCount}</div>
          </div>
        </div>
        <div className="col-md-3 col-6">
          <div className="map-approval-stat-card">
            <div className="text-secondary small font-mono-code mb-1">Returned / Rejected</div>
            <div className="h3 fw-bold text-danger mb-0">{returnedCount}</div>
          </div>
        </div>
      </div>

      {/* main approval requests table card */}
      <div className="card map-card-custom">
        <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3">
          {/* filter controls inline row */}
          <div className="d-flex align-items-center gap-2 flex-nowrap">
            <input
              type="text"
              className="form-control form-control-sm font-mono-code"
              style={{ width: '260px' }}
              placeholder="Search ID, Vessel, Submitter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="form-select form-select-sm font-mono-code"
              style={{ width: '190px' }}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="All">All Stages</option>
              <option value="Initiated">Initiated</option>
              <option value="Validation">Validation</option>
              <option value="Verification">Verification</option>
              <option value="Approval">Approval</option>
              <option value="Approved & Certified">Approved & Certified</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Assurance Set ID</th>
                <th>Campaign Title</th>
                <th>Vessel Name & IMO</th>
                <th>Initiator / Submitter</th>
                <th>Readiness Index</th>
                <th>Stage</th>
                <th>Sign-off Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-secondary font-mono-code">
                    No matching approval requests found.
                  </td>
                </tr>
              ) : (
                filteredSets.map((set) => {
                  return (
                    <tr
                      key={set.id}
                      className="map-approval-table-row"
                      onClick={() => setCurrentHashView('approver', set.id)}
                    >
                      <td>
                        <span className="fw-bold text-primary font-mono-code">{set.id}</span>
                      </td>
                      <td className="fw-semibold text-dark">{set.title}</td>
                      <td>
                        <div className="fw-semibold text-dark">{set.vesselName}</div>
                        <div className="text-secondary small font-mono-code">IMO {set.imoNumber}</div>
                      </td>
                      <td className="small font-mono-code text-secondary">
                        {set.assignedSubmitter || set.initiatorOrg}
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <ReadinessGauge score={set.readinessScore} size="sm" />
                          <span className="fw-bold text-dark small">{set.readinessScore}%</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border font-mono-code">{set.stage}</span>
                      </td>
                      <td>
                        {set.approverDecision === 'Approved' ? (
                          <span className="badge bg-success text-white font-mono-code">Approved</span>
                        ) : set.approverDecision === 'Returned for Correction' ? (
                          <span className="badge bg-warning text-dark font-mono-code">Correction</span>
                        ) : set.approverDecision === 'Rejected' ? (
                          <span className="badge bg-danger text-white font-mono-code">Rejected</span>
                        ) : (
                          <span className="badge bg-info text-dark font-mono-code">Pending</span>
                        )}
                      </td>
                      <td className="text-end" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary text-white font-mono-code"
                          onClick={() => setCurrentHashView('approver', set.id)}
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
