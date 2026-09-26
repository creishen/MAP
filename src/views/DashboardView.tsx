/* 
  file summary: executive overview dashboard view for the marine assurance platform (map) in light theme.
  responsibilities: presents fleet compliance readiness stats or client created assurance sets, active vetting campaigns summary, and role context banner.
  role in system: primary home view rendered on default navigation.
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { formatMaritimeDate } from '../utils/formatters';
import { VerifierWorkspaceView } from './VerifierWorkspaceView';
import { InspectorWorkspaceView } from './InspectorWorkspaceView';
import { ApproverDashboardView } from './ApproverDashboardView';
import { Vessel } from '../types/vessel';
import { AssuranceStage } from '../types/assurance';
import { isAssuranceSetAssignedToPersona, filterVesselsForPersona } from '../utils/rbacHelpers';
import { calculateAssuranceSetReadiness, calculateVesselReadiness } from '../utils/readinessHelpers';

/**
  what: renders the executive dashboard workspace view in light theme.
  how: aggregates stats from zustand vessels, assuranceSets, and documents state arrays, rendering role-aligned KPI cards and tables for Approver, Submitter, C Admin, or default roles.
  with what file: src/views/DashboardView.tsx loaded by App.tsx.
*/
export const DashboardView: React.FC = () => {
  const { vessels, assuranceSets, documents, activePersona, setCurrentHashView } = useMapStore();
  const [cAdminSearchTerm, setCAdminSearchTerm] = useState('');
  const [cAdminSortField, setCAdminSortField] = useState<'id' | 'title' | 'vesselName' | 'charterWindowStart' | 'stage' | 'readinessScore'>('id');
  const [cAdminSortDirection, setCAdminSortDirection] = useState<'asc' | 'desc'>('asc');
  const [fleetSortField, setFleetSortField] = useState<'name' | 'imoNumber' | 'flagState' | 'classificationSociety' | 'status' | 'readiness'>('name');
  const [fleetSortDirection, setFleetSortDirection] = useState<'asc' | 'desc'>('asc');

  if (activePersona === 'Verifier') {
    return <VerifierWorkspaceView />;
  }

  if (activePersona === 'Inspector') {
    return <InspectorWorkspaceView />;
  }

  if (activePersona === 'Approver') {
    return <ApproverDashboardView />;
  }

  const visibleVessels: Vessel[] = filterVesselsForPersona(vessels, assuranceSets, activePersona);

  const totalVessels = visibleVessels.length;
  const avgReadiness = Math.round(
    visibleVessels.reduce(
      (acc: number, v: Vessel) => acc + calculateVesselReadiness(v, assuranceSets, documents),
      0
    ) / (totalVessels || 1)
  );
  const activeAssurances = assuranceSets.filter((s) => s.stage !== 'Certified' && s.stage !== 'Approved').length;

  /* c admin specific assurance sets */
  const cAdminAssuranceSets = assuranceSets.filter((s) => isAssuranceSetAssignedToPersona(s, 'C Admin'));

  const renderSortIndicator = (currentField: string, field: string, direction: 'asc' | 'desc') => {
    if (currentField !== field) return <span className="text-muted ms-1 small opacity-50">↕</span>;
    return <span className="text-primary ms-1 small fw-bold">{direction === 'asc' ? '▲' : '▼'}</span>;
  };

  const filteredCAdminSets = cAdminAssuranceSets.filter((s) => {
    const term = cAdminSearchTerm.toLowerCase();
    return (
      s.id.toLowerCase().includes(term) ||
      s.title.toLowerCase().includes(term) ||
      s.vesselName.toLowerCase().includes(term) ||
      s.imoNumber.includes(term) ||
      (s.initiatorOrg && s.initiatorOrg.toLowerCase().includes(term))
    );
  });

  const sortedCAdminSets = [...filteredCAdminSets].sort((a, b) => {
    let comp = 0;
    if (cAdminSortField === 'id') comp = a.id.localeCompare(b.id);
    else if (cAdminSortField === 'title') comp = a.title.localeCompare(b.title);
    else if (cAdminSortField === 'vesselName') comp = a.vesselName.localeCompare(b.vesselName);
    else if (cAdminSortField === 'charterWindowStart') comp = (a.charterWindowStart || '').localeCompare(b.charterWindowStart || '');
    else if (cAdminSortField === 'stage') comp = a.stage.localeCompare(b.stage);
    else if (cAdminSortField === 'readinessScore') comp = calculateAssuranceSetReadiness(a) - calculateAssuranceSetReadiness(b);
    return cAdminSortDirection === 'asc' ? comp : -comp;
  });

  const handleCAdminSort = (field: 'id' | 'title' | 'vesselName' | 'charterWindowStart' | 'stage' | 'readinessScore') => {
    if (cAdminSortField === field) {
      setCAdminSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setCAdminSortField(field);
      setCAdminSortDirection('asc');
    }
  };

  const sortedFleetVessels = [...visibleVessels].sort((a, b) => {
    let comp = 0;
    if (fleetSortField === 'name') comp = a.name.localeCompare(b.name);
    else if (fleetSortField === 'imoNumber') comp = a.imoNumber.localeCompare(b.imoNumber);
    else if (fleetSortField === 'flagState') comp = a.flagState.localeCompare(b.flagState);
    else if (fleetSortField === 'classificationSociety') comp = a.classificationSociety.localeCompare(b.classificationSociety);
    else if (fleetSortField === 'status') comp = a.status.localeCompare(b.status);
    else if (fleetSortField === 'readiness') comp = calculateVesselReadiness(a, assuranceSets, documents) - calculateVesselReadiness(b, assuranceSets, documents);
    return fleetSortDirection === 'asc' ? comp : -comp;
  });

  const handleFleetSort = (field: 'name' | 'imoNumber' | 'flagState' | 'classificationSociety' | 'status' | 'readiness') => {
    if (fleetSortField === field) {
      setFleetSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
    } else {
      setFleetSortField(field);
      setFleetSortDirection('asc');
    }
  };

  const getStageBadgeClass = (stage: AssuranceStage) => {
    switch (stage) {
      case 'Approved':
      case 'Certified':
        return 'bg-success text-white';
      case 'Approval':
        return 'bg-info text-dark';
      case 'Inspection':
        return 'bg-primary text-white';
      case 'Verification':
        return 'bg-warning text-dark';
      case 'Validation':
        return 'bg-secondary text-white';
      default:
        return 'bg-light text-dark border';
    }
  };

  /* compute role-specific top summary metrics for activePersona */
  const renderDashboardCards = () => {
    if (activePersona === 'Submitter') {
      const assignedSets = assuranceSets.filter((s) => isAssuranceSetAssignedToPersona(s, 'Submitter'));
      const pendingUploads = documents.filter((d) => d.verificationStatus === 'Pending').length;
      const revisionsRequested = documents.filter(
        (d) => d.verificationStatus === 'Correction Requested' || d.verificationStatus === 'Rejected'
      ).length;
      const verifiedCerts = documents.filter((d) => d.verificationStatus === 'Verified').length;

      return (
        <div className="row g-3">
          <div className="col-md-3">
            <div className="card map-card-custom p-3">
              <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Assigned Submissions
              </div>
              <div className="display-6 fw-bold text-primary font-mono-code mt-1">{assignedSets.length}</div>
              <div className="text-muted small mt-1">Active Vetting Campaigns</div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card map-card-custom p-3">
              <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Pending Document Uploads
              </div>
              <div className="display-6 fw-bold text-warning font-mono-code mt-1">{pendingUploads}</div>
              <div className="text-muted small mt-1">Statutory Evidence Required</div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card map-card-custom p-3">
              <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Revisions Requested
              </div>
              <div className="display-6 fw-bold text-danger font-mono-code mt-1">{revisionsRequested}</div>
              <div className="text-muted small mt-1">Returned for Resubmission</div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card map-card-custom p-3">
              <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Verified Certificates
              </div>
              <div className="display-6 fw-bold text-success font-mono-code mt-1">{verifiedCerts}</div>
              <div className="text-muted small mt-1">Approved Statutory Evidence</div>
            </div>
          </div>
        </div>
      );
    }

    if (activePersona === 'C Admin') {
      const totalCreated = cAdminAssuranceSets.length;
      const activeCampaigns = cAdminAssuranceSets.filter((s) => s.stage !== 'Certified' && s.stage !== 'Approved').length;
      const certifiedCampaigns = cAdminAssuranceSets.filter((s) => s.stage === 'Certified' || s.stage === 'Approved' || s.approverDecision === 'Approved').length;
      const avgCampaignReadiness = Math.round(
        cAdminAssuranceSets.reduce((acc: number, s) => acc + calculateAssuranceSetReadiness(s), 0) / (totalCreated || 1)
      );

      return (
        <div className="row g-3">
          <div className="col-md-3">
            <div className="card map-card-custom p-3">
              <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Created Assurance Sets
              </div>
              <div className="display-6 fw-bold text-primary font-mono-code mt-1">{totalCreated}</div>
              <div className="text-muted small mt-1">Client Initiated Campaigns</div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card map-card-custom p-3">
              <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Average Campaign Readiness
              </div>
              <div className="display-6 fw-bold text-success font-mono-code mt-1">{avgCampaignReadiness}%</div>
              <div className="text-muted small mt-1">Vetting Compliance Index</div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card map-card-custom p-3">
              <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Active Vetting Campaigns
              </div>
              <div className="display-6 fw-bold text-warning font-mono-code mt-1">{activeCampaigns}</div>
              <div className="text-muted small mt-1">In Verification / Review</div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card map-card-custom p-3">
              <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
                Approved
              </div>
              <div className="display-6 fw-bold text-primary font-mono-code mt-1">{certifiedCampaigns}</div>
              <div className="text-muted small mt-1">Completed Client Sign-offs</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="row g-3">
        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Active Fleet Vessels
            </div>
            <div className="display-6 fw-bold text-primary font-mono-code mt-1">{totalVessels}</div>
            <div className="text-muted small mt-1">OSVs Registered in MAP</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Average Fleet Readiness
            </div>
            <div className="display-6 fw-bold text-success font-mono-code mt-1">{avgReadiness}%</div>
            <div className="text-muted small mt-1">IMO / Statutory Compliant</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Active Assurance Sets
            </div>
            <div className="display-6 fw-bold text-warning font-mono-code mt-1">{activeAssurances}</div>
            <div className="text-muted small mt-1">Ongoing Vetting Campaigns</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Expiring ≤ 90 Days
            </div>
            <div className="display-6 fw-bold text-danger font-mono-code mt-1">4</div>
            <div className="text-muted small mt-1">Certificates Requiring Renewal</div>
          </div>
        </div>
      </div>
    );
  };

  const submitterRevisions =
    activePersona === 'Submitter'
      ? documents.filter(
          (d) => d.verificationStatus === 'Correction Requested' || d.verificationStatus === 'Rejected'
        ).length
      : 0;

  return (
    <div className="d-flex flex-column gap-4">
      {/* top banner kpi summary cards */}
      {renderDashboardCards()}

      {/* submitter action ping notification alert */}
      {activePersona === 'Submitter' && submitterRevisions > 0 && (
        <div className="alert alert-warning border-warning shadow-xs py-3 px-4 d-flex align-items-center justify-between gap-3">
          <div>
            <div className="fw-bold text-dark mb-0.5 font-mono-code">
              [ACTION REQUIRED] Submitter Ping: {submitterRevisions} Document Revision(s) Requested
            </div>
            <div className="small text-secondary">
              The Approver or Verifier has returned or rejected statutory evidence. Please review the defect comments and upload replacement revisions.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-warning text-dark fw-semibold font-mono-code text-nowrap"
            onClick={() => setCurrentHashView('documents')}
          >
            View Returned Documents →
          </button>
        </div>
      )}

      {/* main content area: c admin displays their own created assurance sets with no audit card; other personas display fleet overview and audit feed */}
      {activePersona === 'C Admin' ? (
        <div className="row g-4">
          <div className="col-12">
            <div className="card map-card-custom">
              <div className="card-header d-flex flex-wrap align-items-center justify-between gap-2">
                <div className="d-flex align-items-center justify-between w-100 gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search campaigns, vessels..."
                    value={cAdminSearchTerm}
                    onChange={(e) => setCAdminSearchTerm(e.target.value)}
                    style={{ width: '220px' }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-primary d-flex align-items-center gap-1"
                    onClick={() => setCurrentHashView('create-assurance-set')}
                  >
                    + Create Assurance Set
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table map-table-custom align-middle mb-0">
                    <thead>
                      <tr>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleCAdminSort('id')}
                        >
                          Set ID {renderSortIndicator(cAdminSortField, 'id', cAdminSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleCAdminSort('title')}
                        >
                          Campaign Title {renderSortIndicator(cAdminSortField, 'title', cAdminSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleCAdminSort('vesselName')}
                        >
                          Target Vessel {renderSortIndicator(cAdminSortField, 'vesselName', cAdminSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleCAdminSort('charterWindowStart')}
                        >
                          Charter Period {renderSortIndicator(cAdminSortField, 'charterWindowStart', cAdminSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleCAdminSort('stage')}
                        >
                          Stage {renderSortIndicator(cAdminSortField, 'stage', cAdminSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleCAdminSort('readinessScore')}
                        >
                          Readiness Index {renderSortIndicator(cAdminSortField, 'readinessScore', cAdminSortDirection)}
                        </th>
                        <th className="text-end" style={{ whiteSpace: 'nowrap' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedCAdminSets.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4 text-muted">
                            No created assurance sets found matching your search.
                          </td>
                        </tr>
                      ) : (
                        sortedCAdminSets.map((s) => (
                          <tr
                            key={s.id}
                            onClick={() => setCurrentHashView('assurance-sets', s.id)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td className="fw-semibold text-primary font-mono-code">{s.id}</td>
                            <td>
                              <div className="fw-semibold text-slate-900">{s.title}</div>
                              <div className="small text-muted">{s.initiatorOrg}</div>
                            </td>
                            <td>
                              <div className="fw-semibold">{s.vesselName}</div>
                              <div className="font-mono-code small text-muted">IMO {s.imoNumber}</div>
                            </td>
                            <td className="small font-mono-code text-muted">
                              {s.charterWindowStart && s.charterWindowEnd
                                ? `${formatMaritimeDate(s.charterWindowStart)} – ${formatMaritimeDate(s.charterWindowEnd)}`
                                : 'Not specified'}
                            </td>
                            <td>
                              <span className={`badge ${getStageBadgeClass(s.stage)} font-mono-code`}>
                                {s.stage}
                              </span>
                            </td>
                            <td>
                              <ReadinessGauge score={calculateAssuranceSetReadiness(s)} size="sm" />
                            </td>
                            <td className="text-end" onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setCurrentHashView('assurance-sets', s.id)}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12">
            <div className="card map-card-custom">
              <div className="card-header d-flex align-items-center justify-between">
                <span>Fleet Assurance Overview</span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setCurrentHashView('vessels')}
                >
                  View Details
                </button>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table map-table-custom align-middle mb-0">
                    <thead>
                      <tr>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleFleetSort('name')}
                        >
                          Vessel Name {renderSortIndicator(fleetSortField, 'name', fleetSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleFleetSort('imoNumber')}
                        >
                          IMO Number {renderSortIndicator(fleetSortField, 'imoNumber', fleetSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleFleetSort('flagState')}
                        >
                          Flag State {renderSortIndicator(fleetSortField, 'flagState', fleetSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleFleetSort('classificationSociety')}
                        >
                          Class {renderSortIndicator(fleetSortField, 'classificationSociety', fleetSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleFleetSort('status')}
                        >
                          Status {renderSortIndicator(fleetSortField, 'status', fleetSortDirection)}
                        </th>
                        <th
                          style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                          onClick={() => handleFleetSort('readiness')}
                        >
                          Readiness Index {renderSortIndicator(fleetSortField, 'readiness', fleetSortDirection)}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedFleetVessels.map((v) => (
                        <tr
                          key={v.id}
                          onClick={() => setCurrentHashView('vessels', v.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="fw-semibold text-primary">{v.name}</td>
                          <td className="font-mono-code">{v.imoNumber}</td>
                          <td>{v.flagState}</td>
                          <td>
                            <span className="badge bg-light text-dark border">{v.classificationSociety}</span>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">{v.status}</span>
                          </td>
                          <td>
                            <ReadinessGauge score={calculateVesselReadiness(v, assuranceSets, documents)} size="sm" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
