/* 
  file summary: inspector workspace page displaying physical survey queue and survey checklist triggers in light theme.
  responsibilities: presents vessel survey inspection items assigned to active persona and opens InspectionDrawer for recording findings.
  role in system: primary operational workspace for Inspectors (/inspector).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { InspectionDrawer } from '../components/drawers/InspectionDrawer';
import { VesselParticulars } from '../types/vessel';
import { filterVesselsForPersona } from '../utils/rbacHelpers';

/**
  what: renders inspector operational workspace view in light theme.
  how: lists vessels assigned for physical visual audit and launches InspectionDrawer checklist.
  with what file: src/views/InspectorWorkspaceView.tsx loaded by App.tsx.
*/
export const InspectorWorkspaceView: React.FC = () => {
  const { vessels, assuranceSets, activePersona } = useMapStore();
  const [selectedVesselName, setSelectedVesselName] = useState<string | null>(null);

  const assignedVessels = filterVesselsForPersona(vessels, assuranceSets, activePersona);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Survey Schedule Table */}
      <div className="card map-card-custom">
        <div className="card-header d-flex align-items-center justify-between">
          <span>Physical Survey Schedule ({assignedVessels.length} Assigned Vessels)</span>
          <span className="badge bg-info text-dark font-mono-code">On-Site Auditor Queue</span>
        </div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Vessel Name</th>
                <th>IMO Number</th>
                <th>Assurance Campaign</th>
                <th>Assigned Stakeholders</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {assignedVessels.map((v: VesselParticulars) => {
                const linkedSet = assuranceSets.find((s) => s.vesselId === v.id || s.vesselName === v.name);
                return (
                  <tr key={v.id}>
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
                      {linkedSet ? (
                        <div className="d-flex flex-column gap-1 small text-slate-700" style={{ fontSize: '0.775rem' }}>
                          <div><strong className="text-dark">Submitter:</strong> {linkedSet.assignedSubmitter || 'Unassigned'}</div>
                          <div><strong className="text-dark">Verifier:</strong> {linkedSet.assignedVerifier || 'Unassigned'}</div>
                          <div>
                            <strong className="text-dark">Inspector:</strong>{' '}
                            <span className="text-primary fw-semibold">
                              {linkedSet.mandatoryInspectionRequired ? (linkedSet.assignedInspector || 'Unassigned') : 'N/A'}
                            </span>
                          </div>
                          <div><strong className="text-dark">Approver:</strong> {linkedSet.assignedApprover || 'Unassigned'}</div>
                        </div>
                      ) : (
                        <span className="text-secondary small">-</span>
                      )}
                    </td>
                    <td>
                      <span className="badge bg-light text-dark border">{v.status}</span>
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-sm btn-warning text-dark font-weight-500"
                        onClick={() => setSelectedVesselName(v.name)}
                      >
                        Open Survey Checklist & CAPA Logger
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Drawer */}
      {selectedVesselName && (
        <InspectionDrawer
          vesselName={selectedVesselName}
          onClose={() => setSelectedVesselName(null)}
        />
      )}
    </div>
  );
};
