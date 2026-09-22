/* 
  file summary: stcw crew member drill-down detail view presenting historical sea service vessel assignments and layered stcw compliance registers.
  responsibilities: renders stcw layer 1 core documents, layer 2 vessel-specific endorsements, historical sea service assignments, and enforces admin/submitter document viewing, uploading, and updating permissions.
  role in system: deep-dive view rendered when a crew directory row is selected or navigated to (/crew/CREW-101).
*/

import React, { useEffect, useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { STCWDocumentItem } from '../types/crew';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { formatMaritimeDate } from '../utils/formatters';
import { getBackButtonInfo } from '../utils/rbacHelpers';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';
import { CrewDocumentUploadModal } from '../components/drawers/CrewDocumentUploadModal';
import { CrewDocumentViewerModal } from '../components/drawers/CrewDocumentViewerModal';

interface CrewDetailViewProps {
  crewId: string;
}

/**
  what: renders STCW crew member drill-down detail view in light theme.
  how: displays crew particulars, sea service vessel history, layer 1 core STCW documents, layer 2 endorsements, document viewer modal, and handles document uploads/reuploads/updates.
  with what file: src/views/CrewDetailView.tsx loaded by App.tsx router.
*/
export const CrewDetailView: React.FC<CrewDetailViewProps> = ({ crewId }) => {
  const { crew, activePersona, setCurrentHashView, previousHashView, previousEntityId, deleteCrewDocument } = useMapStore();

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<STCWDocumentItem | null>(null);

  const [isViewerModalOpen, setIsViewerModalOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<STCWDocumentItem | null>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);

  /* triggers one-shot shimmer on all crew attribute value cells on mount or crewId change */
  const [isJustLoaded, setIsJustLoaded] = useState(true);
  useEffect(() => {
    setIsJustLoaded(true);
    const timer = setTimeout(() => setIsJustLoaded(false), 800);
    return () => clearTimeout(timer);
  }, [crewId]);

  const backInfo = getBackButtonInfo('crew', 'Crew Directory', previousHashView, activePersona, previousEntityId);
  const canManageDocuments = activePersona === 'Administrator' || activePersona === 'Submitter';

  const crewMember = crew.find((c) => c.id === crewId) || crew[0];

  if (!crewMember) return <div className="p-4">Crew profile not found.</div>;

  const handleExportCsv = () => {
    const coreData = crewMember.layer1CoreDocuments.map((d) => ({
      Category: 'Layer 1 Universal Core',
      DocumentTitle: d.title,
      STCWRegulation: d.stcwRegulation,
      CertificateNo: d.certificateNo,
      IssuingAuthority: d.issuingAuthority,
      ExpiryDate: d.expiryDate,
      VerificationStatus: d.verificationStatus,
    }));

    const endorsementData = crewMember.layer2Endorsements.map((d) => ({
      Category: 'Layer 2 Vessel Specific & Endorsement',
      DocumentTitle: d.title,
      STCWRegulation: d.stcwRegulation,
      CertificateNo: d.certificateNo,
      IssuingAuthority: d.issuingAuthority,
      ExpiryDate: d.expiryDate,
      VerificationStatus: d.verificationStatus,
    }));

    exportToCsv(`${crewMember.id}_${crewMember.fullName.replace(/\s+/g, '_')}_STCW_Profile`, [...coreData, ...endorsementData]);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['Category', 'Document Title', 'STCW Regulation', 'Certificate No', 'Issuing Body', 'Expiry Date', 'Status'];

    const coreRows = crewMember.layer1CoreDocuments.map((d) => [
      'Layer 1 Core',
      d.title,
      d.stcwRegulation,
      d.certificateNo,
      d.issuingAuthority,
      d.expiryDate,
      d.verificationStatus,
    ]);

    const endorsementRows = crewMember.layer2Endorsements.map((d) => [
      'Layer 2 Endorsement',
      d.title,
      d.stcwRegulation,
      d.certificateNo,
      d.issuingAuthority,
      d.expiryDate,
      d.verificationStatus,
    ]);

    exportToPdf(`${crewMember.fullName} STCW Layered Compliance Dossier`, headers, [...coreRows, ...endorsementRows]);
    setIsExportOpen(false);
  };

  const handleOpenUploadNew = () => {
    setEditingDoc(null);
    setIsUploadModalOpen(true);
  };

  const handleOpenUpdateDoc = (doc: STCWDocumentItem) => {
    setEditingDoc(doc);
    setIsUploadModalOpen(true);
  };

  const handleOpenViewDoc = (doc: STCWDocumentItem) => {
    setViewingDoc(doc);
    setIsViewerModalOpen(true);
  };

  const handleDeleteDoc = (docId: string) => {
    if (!canManageDocuments) return;
    deleteCrewDocument(crewMember.id, docId);
  };

  const renderStatusBadge = (status: STCWDocumentItem['verificationStatus']) => {
    switch (status) {
      case 'Verified': return <span className="badge bg-success text-white">Verified</span>;
      case 'Expiring': return <span className="badge bg-warning text-dark">Expiring Soon</span>;
      case 'Expired': return <span className="badge bg-danger text-white">Expired</span>;
      case 'Pending':
      default: return <span className="badge bg-secondary text-white">Pending Audit</span>;
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Main Profile Particulars & STCW Compliance Header Card */}
      <div className="card map-card-custom p-4">
        <div className="d-flex flex-wrap align-items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="fw-bold mb-1 text-primary">{crewMember.fullName}</h3>
            <div className="text-secondary small font-mono-code d-flex align-items-center gap-2 flex-wrap">
              <span>Current Vessel:</span>
              {crewMember.currentVesselId ? (
                <button
                  type="button"
                  className="btn btn-link p-0 text-primary fw-bold border-0 bg-transparent text-decoration-underline font-mono-code align-baseline"
                  onClick={() => setCurrentHashView('vessels', crewMember.currentVesselId)}
                  title={`View ${crewMember.currentVesselName} details`}
                >
                  {crewMember.currentVesselName}
                </button>
              ) : (
                <strong>{crewMember.currentVesselName || 'Unassigned / Ashore'}</strong>
              )}
            </div>
          </div>

          {/* Opposite Corner Controls: STCW Score Gauge + Export Data Button */}
          <div className="d-flex align-items-center gap-4 ms-auto">
            <div className="d-flex flex-column align-items-center">
              <div className="text-secondary small fw-bold text-uppercase" style={{ fontSize: '0.65rem', letterSpacing: '0.05em' }}>
                STCW Readiness Score
              </div>
              <ReadinessGauge score={crewMember.overallComplianceScore} size="sm" />
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

        {/* Particulars Summary Box */}
        <div className="p-3 bg-light border rounded-3 font-mono-code small">
          <div className="row g-3">
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Crew ID</span>
              <strong className={`text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{crewMember.id}</strong>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Rank</span>
              <strong className={`text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{crewMember.rank}</strong>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Compliance Status</span>
              <span className={`badge ${crewMember.complianceStatus === 'Fully Compliant' ? 'bg-success text-white' : crewMember.complianceStatus === 'Expiring < 60 Days' ? 'bg-warning text-dark' : 'bg-danger text-white'}`}>
                {crewMember.complianceStatus}
              </span>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Organization</span>
              <strong className={`text-dark text-truncate d-block${isJustLoaded ? ' map-autofill-animate' : ''}`}>{crewMember.organization || 'Northwind Marine Pty Ltd'}</strong>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Nationality</span>
              <strong className={`text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{crewMember.nationality}</strong>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Seaman's Book No</span>
              <strong className={`text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{crewMember.seamansBookNo}</strong>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Passport No</span>
              <strong className={`text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{crewMember.passportNo}</strong>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Date of Birth</span>
              <strong className={`text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{crewMember.dateOfBirth}</strong>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Emergency Contact</span>
              <strong className={`text-dark text-truncate d-block${isJustLoaded ? ' map-autofill-animate' : ''}`}>{crewMember.emergencyContact}</strong>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Last Compliance Audit</span>
              <strong className={`text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{formatMaritimeDate(crewMember.lastAuditedDate)}</strong>
            </div>
            <div className="col-md-3 col-6">
              <span className="text-secondary d-block" style={{ fontSize: '0.7rem' }}>Management Permissions</span>
              <span className={`badge ${canManageDocuments ? 'bg-info text-dark' : 'bg-secondary text-white'}`}>
                {canManageDocuments ? 'Admin / Submitter Full Access' : 'Read-Only Mode'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Historical Sea Service & Vessel Assignments Register */}
      <div className="card map-card-custom">
        <div className="card-header p-3 border-bottom d-flex align-items-center justify-between">
          <div className="fw-bold text-dark fs-6">
            Assigned Vessels and Roles History
          </div>
        </div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Vessel Name</th>
                <th>IMO Number</th>
                <th>Vessel Type</th>
                <th>Rank Held</th>
                <th>Embarkation Date</th>
                <th>Disembarkation Date</th>
                <th>Assignment Status</th>
              </tr>
            </thead>
            <tbody>
              {crewMember.assignments.map((asg) => (
                <tr key={asg.id}>
                  <td className="fw-semibold text-primary">
                    <button
                      type="button"
                      className="btn btn-link p-0 text-primary text-start fw-semibold text-decoration-underline border-0 bg-transparent align-baseline"
                      onClick={() => setCurrentHashView('vessels', asg.vesselId)}
                      title={`Click to view ${asg.vesselName} vessel details`}
                    >
                      {asg.vesselName}
                    </button>
                  </td>
                  <td className="font-mono-code">{asg.imoNumber}</td>
                  <td>
                    <span className="badge bg-light text-dark border">{asg.vesselType}</span>
                  </td>
                  <td>{asg.rankHeld}</td>
                  <td className="font-mono-code small">{formatMaritimeDate(asg.embarkDate)}</td>
                  <td className="font-mono-code small">
                    {asg.disembarkDate ? formatMaritimeDate(asg.disembarkDate) : <span className="text-success fw-bold">Active On Board</span>}
                  </td>
                  <td>
                    <span className={`badge ${asg.isCurrent ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                      {asg.isCurrent ? 'Current Assignment' : 'Completed Tour'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: Layer 1 — Universal STCW Core Documents Register */}
      <div className="card map-card-custom">
        <div className="card-header p-3 border-bottom d-flex align-items-center justify-between">
          <div>
            <div className="fw-bold text-dark fs-6">
              Layer 1 — Universal STCW Core Documents Register
            </div>
            <div className="text-secondary small">
              Mandatory universal credentials required for all crew members (Passport, Seaman's Book, BST, ENG1 Medical, Security Awareness)
            </div>
          </div>
          {canManageDocuments && (
            <button
              type="button"
              className="btn btn-sm btn-primary ms-auto"
              onClick={handleOpenUploadNew}
            >
              + Upload Core Certificate
            </button>
          )}
        </div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>STCW Regulation</th>
                <th>Certificate No</th>
                <th>Issuing Authority & Flag</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {crewMember.layer1CoreDocuments.map((doc) => (
                <tr key={doc.id}>
                  <td className="fw-semibold text-primary">{doc.title}</td>
                  <td className="font-mono-code small">{doc.stcwRegulation}</td>
                  <td className="font-mono-code">{doc.certificateNo}</td>
                  <td className="small">
                    <div>{doc.issuingAuthority}</div>
                    {doc.flagState && <span className="text-muted">Flag: {doc.flagState}</span>}
                  </td>
                  <td className="font-mono-code small">{formatMaritimeDate(doc.issueDate)}</td>
                  <td className="font-mono-code small">{formatMaritimeDate(doc.expiryDate)}</td>
                  <td>{renderStatusBadge(doc.verificationStatus)}</td>
                  <td className="text-end">
                    <div className="d-flex align-items-center justify-content-end gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary py-1 px-2"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleOpenViewDoc(doc)}
                      >
                        View
                      </button>
                      {canManageDocuments && (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger py-1 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleDeleteDoc(doc.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: Layer 2 — Vessel-Specific Certificates & Advanced Endorsements Register */}
      <div className="card map-card-custom">
        <div className="card-header p-3 border-bottom d-flex align-items-center justify-between">
          <div>
            <div className="fw-bold text-dark fs-6">
              Layer 2 — Vessel-Specific Certificates & Advanced Endorsements Register
            </div>
            <div className="text-secondary small">
              Vessel, propulsion & cargo-specific credentials (CoC, Flag Endorsement, Advanced Tanker, IGF Code, DP Operator, Crowd Management)
            </div>
          </div>
          {canManageDocuments && (
            <button
              type="button"
              className="btn btn-sm btn-primary ms-auto"
              onClick={handleOpenUploadNew}
            >
              + Add Layer 2 Endorsement
            </button>
          )}
        </div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Endorsement / Certificate Title</th>
                <th>STCW Layer 2 Scope</th>
                <th>Certificate No</th>
                <th>Issuing Body</th>
                <th>Flag State</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {crewMember.layer2Endorsements.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    No Layer 2 vessel-specific endorsements uploaded.
                  </td>
                </tr>
              ) : (
                crewMember.layer2Endorsements.map((doc) => (
                  <tr key={doc.id}>
                    <td className="fw-semibold text-primary">{doc.title}</td>
                    <td className="font-mono-code small">{doc.stcwRegulation}</td>
                    <td className="font-mono-code">{doc.certificateNo}</td>
                    <td className="small">{doc.issuingAuthority}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{doc.flagState || 'Universal'}</span>
                    </td>
                    <td className="font-mono-code small">{formatMaritimeDate(doc.expiryDate)}</td>
                    <td>{renderStatusBadge(doc.verificationStatus)}</td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-1 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => handleOpenViewDoc(doc)}
                        >
                          View
                        </button>
                        {canManageDocuments && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-1 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleDeleteDoc(doc.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* STCW Document Viewer Modal */}
      <CrewDocumentViewerModal
        isOpen={isViewerModalOpen}
        crewName={crewMember.fullName}
        document={viewingDoc}
        canManage={canManageDocuments}
        onClose={() => setIsViewerModalOpen(false)}
        onOpenReupload={(doc) => handleOpenUpdateDoc(doc)}
      />

      {/* STCW Document Upload / Reupload / Renewal Modal */}
      <CrewDocumentUploadModal
        isOpen={isUploadModalOpen}
        crewId={crewMember.id}
        crewName={crewMember.fullName}
        existingDocument={editingDoc}
        onClose={() => {
          setIsUploadModalOpen(false);
          setEditingDoc(null);
        }}
      />
    </div>
  );
};
