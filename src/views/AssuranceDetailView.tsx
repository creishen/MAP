/* 
  file summary: assurance set command center deep-dive view presenting stage pipeline stepper and requirements register in light theme.
  responsibilities: manages requirement verification statuses, displays pipeline stage progress, and enforces C Admin read-only rules.
  role in system: deep-dive view rendered when an assurance set row is selected.
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { PipelineStepper } from '../components/common/PipelineStepper';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { ConfidenceBadge } from '../components/common/ConfidenceBadge';
import { DocumentReviewDrawer } from '../components/drawers/DocumentReviewDrawer';
import { formatMaritimeDate } from '../utils/formatters';
import { MasterDocument } from '../types/document';
import { AssuranceRequirement } from '../types/assurance';

import { VersionHistoryDrawer } from '../components/drawers/VersionHistoryDrawer';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';
import { DocumentUploadModal } from '../components/drawers/DocumentUploadModal';
import { userHasRole } from '../utils/userRoleHelpers';

interface AssuranceDetailViewProps {
  setId: string;
}

/**
  what: renders assurance set command center deep-dive view in light theme.
  how: displays pipeline stepper header, requirement register table with export controls, and opens DocumentReviewDrawer, VersionHistoryDrawer, or DocumentUploadModal based on persona RBAC.
  with what file: src/views/AssuranceDetailView.tsx loaded by App.tsx.
*/
export const AssuranceDetailView: React.FC<AssuranceDetailViewProps> = ({ setId }) => {
  const { assuranceSets, updateRequirementStatus, updateAssuranceInspector, documents, activePersona, users, setCurrentHashView } = useMapStore();
  const [selectedDocForReview, setSelectedDocForReview] = useState<{ doc: MasterDocument; notes?: string } | null>(null);
  const [selectedDocForVersionHistory, setSelectedDocForVersionHistory] = useState<MasterDocument | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTargetRequirement, setUploadTargetRequirement] = useState<AssuranceRequirement | null>(null);
  const [replaceExistingDoc, setReplaceExistingDoc] = useState<MasterDocument | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAssigningInspector, setIsAssigningInspector] = useState(false);

  const assuranceSet = assuranceSets.find((s) => s.id === setId) || assuranceSets[0];

  if (!assuranceSet) return <div>Assurance Set not found.</div>;

  const isCAdmin = activePersona === 'C Admin';
  const canUpload = activePersona === 'Submitter' || activePersona === 'Administrator';

  const verifiedCount = assuranceSet.requirements.filter((r) => r.verifierStatus === 'Verified').length;
  const totalCount = assuranceSet.requirements.length;

  const renderRequirementStatus = (req: AssuranceRequirement) => {
    if (!req.documentId) {
      return (
        <span className="badge bg-secondary text-white font-mono-code px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>
          Awaiting Upload
        </span>
      );
    }
    if (req.verifierStatus === 'Verified' || req.isFulfilled) {
      return <span className="badge bg-success text-white font-mono-code px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>Approved</span>;
    }
    if (req.verifierStatus === 'Correction Requested') {
      return <span className="badge bg-warning text-dark font-mono-code px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>Correction Requested</span>;
    }
    if (req.verifierStatus === 'Rejected') {
      return <span className="badge bg-danger text-white font-mono-code px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>Rejected</span>;
    }
    const isInspectionDoc =
      (req.category as string).toLowerCase().includes('inspection') ||
      (req.category as string).toLowerCase().includes('audit') ||
      req.title.toLowerCase().includes('inspection') ||
      req.title.toLowerCase().includes('audit');

    if (isInspectionDoc) {
      return <span className="badge bg-warning text-dark font-mono-code px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>To Inspect</span>;
    }

    if (req.verifierStatus === 'Pending') {
      return (
        <span className="badge bg-info text-dark font-mono-code px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>
          Pending Verification
        </span>
      );
    }

    return <span className="badge bg-primary text-white font-mono-code px-2.5 py-1.5" style={{ fontSize: '0.75rem' }}>To Verify</span>;
  };

  const closeUploadModal = () => {
    setIsUploadModalOpen(false);
    setUploadTargetRequirement(null);
    setReplaceExistingDoc(null);
  };

  const openRequirementUpload = (req: AssuranceRequirement, existingDoc?: MasterDocument) => {
    setUploadTargetRequirement(req);
    setReplaceExistingDoc(existingDoc || null);
    setIsUploadModalOpen(true);
  };

  const handleExportCsv = () => {
    const exportData = assuranceSet.requirements.map((req) => ({
      Category: req.category,
      RequirementTitle: req.title,
      OcrConfidence: `${req.ocrConfidence}%`,
      VerifierStatus: req.verifierStatus || (req.isFulfilled ? 'Approved' : 'Pending'),
      Notes: req.notes || '',
    }));
    exportToCsv(`${assuranceSet.id}_Requirements_Register`, exportData);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['Category', 'Requirement Title', 'OCR Conf', 'Status', 'Notes'];
    const rows = assuranceSet.requirements.map((req) => [
      req.category,
      req.title,
      `${req.ocrConfidence}%`,
      req.verifierStatus || (req.isFulfilled ? 'Approved' : 'Pending'),
      req.notes || '-',
    ]);
    exportToPdf(`${assuranceSet.id} Statutory Requirements Register`, headers, rows);
    setIsExportOpen(false);
  };

  return (
    <div className="d-flex flex-column gap-4">

      {/* Top Row: Campaign Summary Particulars Card + Compact Stage Pipeline */}
      <div className="row g-4 align-items-stretch">
        {/* Left: Campaign Particulars & Stakeholder Role Assignments Card */}
        <div className="col-lg-8 col-md-7">
          <div className="card map-card-custom p-4 h-100">
            <div className="d-flex flex-wrap align-items-center justify-between gap-3 mb-3">
              <h3 className="fw-bold mb-0 text-primary">{assuranceSet.title}</h3>
              {/* Export Data button in opposite corner of campaign title */}
              <div className="dropdown position-relative ms-auto">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle"
                  onClick={() => setIsExportOpen(!isExportOpen)}
                >
                  Export Data
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

            <div className="p-3.5 bg-light border rounded-3 font-mono-code small">
              <div className="row g-4">
                {/* Campaign Particulars */}
                <div className="col-md-6 d-flex flex-column gap-2.5">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="text-uppercase fw-bold text-secondary" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                      Campaign Particulars
                    </span>
                  </div>
                  <div className="border-bottom pb-1.5">
                    <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Set ID:</div>
                    <div className="fw-bold text-dark">{assuranceSet.id}</div>
                  </div>
                  <div className="border-bottom pb-1.5">
                    <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Initiator:</div>
                    <div className="fw-bold text-dark">{assuranceSet.initiatorOrg}</div>
                  </div>
                  <div className="border-bottom pb-1.5">
                    <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Vessel:</div>
                    <div className="fw-bold text-dark">{assuranceSet.vesselName} (IMO {assuranceSet.imoNumber})</div>
                  </div>
                  <div>
                    <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Charter Window:</div>
                    <div className="fw-bold text-dark">{formatMaritimeDate(assuranceSet.charterWindowStart)} - {formatMaritimeDate(assuranceSet.charterWindowEnd)}</div>
                  </div>
                </div>

                {/* Stakeholder Role Assignments */}
                <div className="col-md-6 d-flex flex-column gap-2.5">
                  <div className="text-uppercase fw-bold text-secondary mb-1" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                    Stakeholder Role Assignments
                  </div>
                  <div className="border-bottom pb-1.5">
                    <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Submitter:</div>
                    <div className="fw-bold text-dark">{assuranceSet.assignedSubmitter || 'M. Chen (Pacific Ocean Logistics Operations)'}</div>
                  </div>
                  <div className="border-bottom pb-1.5">
                    <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Verifier:</div>
                    <div className="fw-bold text-dark">{assuranceSet.assignedVerifier || 'A. Fontaine (DNV Compliance Services)'}</div>
                  </div>
                  <div className="border-bottom pb-1.5">
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Inspector:</div>
                      {(isCAdmin || activePersona === 'Submitter' || activePersona === 'Administrator') && (
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none small font-mono-code ms-auto"
                          style={{ fontSize: '0.7rem', color: '#0284c7' }}
                          onClick={() => setIsAssigningInspector(!isAssigningInspector)}
                        >
                          {isAssigningInspector ? 'Cancel' : 'Assign / Change'}
                        </button>
                      )}
                    </div>
                    {isAssigningInspector ? (
                      <div className="mt-1 d-flex flex-column gap-1">
                        <select
                          className="form-select form-select-sm font-mono-code"
                          style={{ fontSize: '0.75rem' }}
                          value={assuranceSet.assignedInspector || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              updateAssuranceInspector(assuranceSet.id, e.target.value);
                              setIsAssigningInspector(false);
                            }
                          }}
                        >
                          <option value="">Select Inspector...</option>
                          {users
                            .filter((u) => userHasRole(u, 'Inspector'))
                            .map((u) => (
                              <option key={u.id} value={`${u.name} (${u.organization})`}>
                                {u.name} - {u.organization}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-primary font-mono-code align-self-start mt-1"
                          style={{ fontSize: '0.675rem' }}
                          onClick={() => setCurrentHashView('users')}
                        >
                          + Invite New Inspector in User Management
                        </button>
                      </div>
                    ) : (
                      <div className="fw-bold text-dark">
                        {assuranceSet.mandatoryInspectionRequired
                          ? (assuranceSet.assignedInspector || 'N. Technical (AMSA Marine Audit Division)')
                          : 'N/A (Not Required)'}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-secondary" style={{ fontSize: '0.725rem' }}>Approver:</div>
                    <div className="fw-bold text-dark">{assuranceSet.assignedApprover || 'P. Nardelli (Chevron Australia Pty Ltd)'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Compact Stage Pipeline Stepper & Readiness Gauge */}
        <div className="col-lg-4 col-md-5">
          <div className="card map-card-custom p-3.5 h-100 d-flex flex-column justify-content-between gap-3">
            <div className="p-3 bg-light border rounded-3 flex-grow-1">
              <div className="text-uppercase font-mono-code fw-bold text-secondary mb-2" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                Assurance Campaign Stage Pipeline
              </div>
              <PipelineStepper currentStage={assuranceSet.stage} orientation="vertical" />
            </div>

            <div className="p-3 bg-light border rounded-3">
              <div className="text-secondary small text-uppercase font-mono-code fw-bold mb-1.5" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
                Assurance Readiness Index
              </div>
              <div className="d-flex align-items-center justify-content-center p-2 bg-white border rounded-2">
                <ReadinessGauge score={assuranceSet.readinessScore} size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Requirements Register Table taking full 100% width across two columns */}
      <div className="card map-card-custom">
        <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
          <div className="fw-bold text-dark">
            Statutory Requirements Register ({totalCount} Items)
          </div>
          <div className="dropdown position-relative">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle"
              onClick={() => setIsExportOpen(!isExportOpen)}
            >
              Export Data
            </button>
            {isExportOpen && (
              <ul className="dropdown-menu dropdown-menu-light show position-absolute end-0 mt-1 shadow border">
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
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Category</th>
                <th>Requirement Title</th>
                <th>OCR Confidence</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assuranceSet.requirements.map((req) => {
                const linkedDoc = documents.find((d) => d.id === req.documentId);

                return (
                  <tr key={req.id}>
                    <td>
                      <span className="badge bg-light text-dark border" style={{ fontSize: '0.75rem' }}>
                        {req.category}
                      </span>
                    </td>
                    <td className="fw-semibold text-dark">
                      {req.title}
                      {(linkedDoc?.currentVersion || req.documentVersion) && (
                        <span className="badge bg-light text-secondary border font-mono-code ms-2" style={{ fontSize: '0.7rem' }}>
                          {linkedDoc?.currentVersion || req.documentVersion}
                        </span>
                      )}
                    </td>
                    <td>
                      <ConfidenceBadge score={req.ocrConfidence} />
                    </td>
                    <td>
                      {renderRequirementStatus(req)}
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2 flex-wrap">
                        {linkedDoc ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary font-mono-code"
                              onClick={() => setSelectedDocForReview({ doc: linkedDoc, notes: req.notes })}
                            >
                              Review Document
                            </button>
                            {canUpload && linkedDoc.verificationStatus !== 'Verified' && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary font-mono-code"
                                onClick={() => openRequirementUpload(req, linkedDoc)}
                              >
                                Replace Revision
                              </button>
                            )}
                          </>
                        ) : canUpload ? (
                          <button
                            type="button"
                            className="btn btn-sm btn-primary text-white font-mono-code"
                            onClick={() => openRequirementUpload(req)}
                          >
                            Upload Document
                          </button>
                        ) : (
                          <span className="text-secondary small font-mono-code">No Document</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Review Drawer */}
      <DocumentReviewDrawer
        document={selectedDocForReview?.doc || null}
        requirementNotes={selectedDocForReview?.notes}
        onClose={() => setSelectedDocForReview(null)}
      />

      {/* Version History Drawer for Submitter / Admin Reupload */}
      <VersionHistoryDrawer
        document={selectedDocForVersionHistory}
        onClose={() => setSelectedDocForVersionHistory(null)}
      />

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        existingDocument={replaceExistingDoc}
        assuranceSetId={uploadTargetRequirement ? assuranceSet.id : undefined}
        requirementId={uploadTargetRequirement?.id}
        requirementTitle={uploadTargetRequirement?.title}
        defaultVesselId={assuranceSet.vesselId}
        onUploadComplete={closeUploadModal}
      />
    </div>
  );
};
