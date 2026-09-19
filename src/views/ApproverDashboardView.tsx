/* 
  file summary: approver executive dashboard view presenting compliance readiness gauges and final sign-off controls.
  responsibilities: enforces approval blocking logic if expired/unverified certs exist and executes multi-decision sign-offs.
  role in system: primary operational workspace for Approvers (/approver).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { ReadinessGauge } from '../components/common/ReadinessGauge';

/**
  what: renders marine assurance manager approver dashboard.
  how: checks mandatory statutory certificate validation state to enable/block final approval sign-off.
  with what file: src/views/ApproverDashboardView.tsx loaded by App.tsx.
*/
export const ApproverDashboardView: React.FC = () => {
  const { assuranceSets, setApproverDecision, activePersona } = useMapStore();
  const [selectedSetId, setSelectedSetId] = useState<string>(assuranceSets[0]?.id || '');
  const [approverNotes, setApproverNotes] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const isCAdmin = activePersona === 'C Admin';

  const selectedSet = assuranceSets.find((s) => s.id === selectedSetId) || assuranceSets[0];

  if (!selectedSet) return <div>No Assurance Sets available for approval.</div>;

  /* check approval blocking logic: any unverified or missing mandatory requirement blocks approval */
  const unfulfilledMandatory = selectedSet.requirements.filter((r) => r.isMandatory && !r.isFulfilled);
  const isApprovalBlocked = unfulfilledMandatory.length > 0;

  const handleDecision = (decision: 'Approved' | 'Returned for Correction' | 'Rejected') => {
    if (decision === 'Approved' && isApprovalBlocked) {
      setFeedbackMessage('Approval Blocked: Mandatory statutory requirements remain unverified or expired.');
      return;
    }

    setApproverDecision(selectedSet.id, decision, approverNotes || `Decision: ${decision}`);
    setFeedbackMessage(`Assurance Set ${selectedSet.id} updated to ${decision}.`);
    setApproverNotes('');
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Prominent C Admin Read-Only Rule Restriction Banner */}
      {isCAdmin && (
        <div className="map-cadmin-readonly-banner">
          <div>
            <strong>Client Admin (C Admin) View Mode:</strong> Reviewing readiness dashboard in read-only mode.
          </div>
        </div>
      )}

      {/* Select Assurance Set Dropdown */}
      <div className="card map-card-custom p-3">
        <div className="row align-items-center">
          <div className="col-md-3 text-secondary small fw-semibold">Select Vetting Campaign:</div>
          <div className="col-md-9">
            <select
              className="form-select form-select-sm bg-white text-dark border-secondary font-mono-code"
              value={selectedSetId}
              onChange={(e) => {
                setSelectedSetId(e.target.value);
                setFeedbackMessage('');
              }}
            >
              {assuranceSets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.title} ({s.vesselName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Approval Grid */}
      <div className="row g-4">
        {/* Left Column: Readiness Dial & Blocking Check */}
        <div className="col-lg-6">
          <div className="card map-card-custom p-4 text-center">
            <h5 className="fw-semibold mb-3 text-slate-900">Executive Compliance Readiness Dial</h5>
            <ReadinessGauge score={selectedSet.readinessScore} size="lg" />

            <div className="mt-4 p-3 bg-light border border-secondary rounded text-start small">
              <h6 className="fw-bold text-uppercase text-secondary mb-2" style={{ letterSpacing: '0.05em' }}>
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
        </div>

        {/* Right Column: Multi-Decision Action Controls */}
        <div className="col-lg-6">
          <div className="card map-card-custom p-4">
            <h5 className="fw-semibold mb-3 text-slate-900">Charter Certification Controls</h5>

            {feedbackMessage && (
              <div className="alert alert-info py-2 small mb-3">{feedbackMessage}</div>
            )}

            <div className="mb-3">
              <label className="form-label text-secondary small fw-semibold" htmlFor="approver-notes">Executive Approver Decision Notes:</label>
              <textarea
                id="approver-notes"
                className="form-control form-control-sm bg-white text-dark border-secondary"
                rows={3}
                placeholder="Enter justification notes or return feedback..."
                value={approverNotes}
                onChange={(e) => setApproverNotes(e.target.value)}
                disabled={isCAdmin}
              />
            </div>

            {!isCAdmin && (
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
                >
                  Return for Correction
                </button>
                <button
                  type="button"
                  className="btn btn-danger text-white py-2 fw-semibold"
                  onClick={() => handleDecision('Rejected')}
                >
                  Reject Assurance Set
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

