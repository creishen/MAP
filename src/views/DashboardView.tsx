/* 
  file summary: executive overview dashboard view for the marine assurance platform (map) in light theme.
  responsibilities: presents fleet compliance readiness stats, active vetting campaigns summary, role context banner, and audit log feed.
  role in system: primary home view rendered on default navigation.
*/

import React from 'react';
import { useMapStore } from '../store/useMapStore';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { formatMaritimeDate } from '../utils/formatters';

/**
  what: renders the executive dashboard workspace view in light theme.
  how: aggregates stats from zustand vessels, assuranceSets, and auditEvents state arrays.
  with what file: src/views/DashboardView.tsx loaded by App.tsx.
*/
export const DashboardView: React.FC = () => {
  const { vessels, assuranceSets, auditEvents, activePersona, setCurrentHashView } = useMapStore();

  const totalVessels = vessels.length;
  const avgReadiness = Math.round(
    vessels.reduce((acc, v) => acc + v.complianceReadinessScore, 0) / totalVessels
  );
  const activeAssurances = assuranceSets.filter((s) => s.stage !== 'Certified').length;

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Banner KPI summary cards */}
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

      {/* Main Grid: Fleet Compliance Status & Recent Audit Feed */}
      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card map-card-custom">
            <div className="card-header d-flex align-items-center justify-between">
              <span>Fleet Assurance Overview</span>
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={() => setCurrentHashView('vessels')}
              >
                View Master Fleet
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table map-table-custom align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Vessel Name</th>
                      <th>IMO Number</th>
                      <th>Flag State</th>
                      <th>Class</th>
                      <th>Status</th>
                      <th>Readiness Index</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vessels.map((v) => (
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
                          <ReadinessGauge score={v.complianceReadinessScore} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card map-card-custom">
            <div className="card-header">Recent Audit Activity</div>
            <div className="card-body p-3">
              <div className="d-flex flex-column gap-3">
                {auditEvents.slice(0, 4).map((ev) => (
                  <div key={ev.id} className="p-2 border-bottom pb-2">
                    <div className="fw-bold text-primary small">{ev.action}</div>
                    <div className="text-secondary small">{ev.targetAsset}</div>
                    <div className="d-flex align-items-center justify-between mt-1" style={{ fontSize: '0.75rem' }}>
                      <span className="badge bg-light text-dark border">{ev.userRole}</span>
                      <span className="font-mono-code text-muted">{formatMaritimeDate(ev.timestampUtc)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
