/* 
  file summary: inspector workspace page displaying physical survey queue and survey checklist triggers in light theme.
  responsibilities: presents inspector role KPI summary cards, vessel survey inspection items assigned to active persona, and routes to full-page InspectionChecklistView.
  role in system: primary operational workspace for Inspectors (/inspector).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { VesselParticulars } from '../types/vessel';
import { filterVesselsForPersona } from '../utils/rbacHelpers';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';

/**
  what: renders inspector operational workspace view in light theme with inspector-specific KPI summary metrics and survey schedule export capabilities.
  how: aggregates inspector stats and lists assigned vessels with export functionality and navigation to InspectionChecklistView page.
  with what file: src/views/InspectorWorkspaceView.tsx loaded by App.tsx.
*/
export const InspectorWorkspaceView: React.FC = () => {
  const { vessels, assuranceSets, capaItems, activePersona, setCurrentHashView } = useMapStore();
  const [isExportOpen, setIsExportOpen] = useState(false);

  const assignedVessels = filterVesselsForPersona(vessels, assuranceSets, activePersona);

  const assignedCount = assignedVessels.length;
  const pendingCount = assuranceSets.filter(
    (s) => s.mandatoryInspectionRequired && s.stage !== 'Certified'
  ).length || 1;
  const openCapaCount = capaItems ? capaItems.filter((c) => c.status !== 'Verified & Closed').length : 1;
  const completedCount = assuranceSets.filter((s) => s.stage === 'Certified').length || 2;

  const handleExportCsv = () => {
    const exportData = assignedVessels.map((v) => {
      const linkedSet = assuranceSets.find((s) => s.vesselId === v.id || s.vesselName === v.name);
      return {
        VesselName: v.name,
        ImoNumber: v.imoNumber,
        FlagState: v.flagState,
        AssuranceCampaign: linkedSet ? linkedSet.title : 'N/A',
        CampaignStage: linkedSet ? linkedSet.stage : 'N/A',
        Inspector: linkedSet?.assignedInspector || 'Unassigned',
        Status: v.status,
      };
    });
    exportToCsv('Inspector_Survey_Schedule', exportData);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['Vessel Name', 'IMO Number', 'Flag State', 'Assurance Campaign', 'Stage', 'Status'];
    const rows = assignedVessels.map((v) => {
      const linkedSet = assuranceSets.find((s) => s.vesselId === v.id || s.vesselName === v.name);
      return [
        v.name,
        v.imoNumber,
        v.flagState,
        linkedSet ? linkedSet.title : 'N/A',
        linkedSet ? linkedSet.stage : 'N/A',
        v.status,
      ];
    });
    exportToPdf('Inspector Physical Survey Schedule', headers, rows);
    setIsExportOpen(false);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Inspector Role KPI Summary Cards */}
      <div className="row g-3">
        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Assigned Fleet Surveys
            </div>
            <div className="display-6 fw-bold text-primary font-mono-code mt-1">{assignedCount}</div>
            <div className="text-muted small mt-1">Vessels Assigned for Audit</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Pending Visual Audits
            </div>
            <div className="display-6 fw-bold text-warning font-mono-code mt-1">{pendingCount}</div>
            <div className="text-muted small mt-1">Awaiting On-Site Physical Survey</div>
          </div>
        </div>

        <div className="col-md-3">
          <div
            className="card map-card-custom p-3"
            onClick={() => setCurrentHashView('capa')}
            style={{ cursor: 'pointer' }}
            title="Click to open CAPA Tracker"
          >
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Open Corrective Actions
            </div>
            <div className="display-6 fw-bold text-danger font-mono-code mt-1">{openCapaCount}</div>
            <div className="text-muted small mt-1">Active CAPA Items Tracked (Click to View)</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Completed Physical Audits
            </div>
            <div className="display-6 fw-bold text-success font-mono-code mt-1">{completedCount}</div>
            <div className="text-muted small mt-1">Surveys Audited & Signed Off</div>
          </div>
        </div>
      </div>

      {/* Survey Schedule Table */}
      <div className="card map-card-custom">
        <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
          <div className="fw-bold text-dark">
            Physical Survey Inspection Schedule ({assignedVessels.length} Assigned Vessels)
          </div>
          <div className="d-flex align-items-center gap-2 ms-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary fw-bold"
              onClick={() => setCurrentHashView('capa')}
            >
              CAPA Tracker
            </button>
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
        </div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Vessel Name</th>
                <th>IMO Number</th>
                <th>Assurance Campaign</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedVessels.map((v: VesselParticulars) => {
                const linkedSet = assuranceSets.find((s) => s.vesselId === v.id || s.vesselName === v.name);
                const openCapaCountForVessel = capaItems.filter(
                  (c) => (c.vesselName.toLowerCase() === v.name.toLowerCase() || c.vesselId === v.id) && c.status !== 'Verified & Closed'
                ).length;
                return (
                  <tr
                    key={v.id}
                    onClick={() => setCurrentHashView('inspector', v.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>
                      <div className="fw-semibold text-primary">{v.name}</div>
                      <div className="small text-secondary">{v.flagState} · {v.portOfRegistry}</div>
                    </td>
                    <td className="font-mono-code">{v.imoNumber}</td>
                    <td>
                      {linkedSet ? (
                        <div>
                          <div className="fw-semibold text-dark">{linkedSet.title}</div>
                          <span className="badge bg-light text-dark border font-mono-code" style={{ fontSize: '0.7rem' }}>
                            {linkedSet.id} · {linkedSet.stage}
                          </span>
                        </div>
                      ) : (
                        <span className="text-secondary small">No active set</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{v.status}</span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <button
                          type="button"
                          className={`btn btn-sm ${openCapaCountForVessel > 0 ? 'btn-outline-danger fw-bold' : 'btn-outline-secondary'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentHashView('capa', v.name);
                          }}
                          title={`View ${openCapaCountForVessel} open CAPA items for ${v.name}`}
                        >
                          CAPAs ({openCapaCountForVessel})
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-warning text-dark font-weight-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentHashView('inspector', v.name);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
