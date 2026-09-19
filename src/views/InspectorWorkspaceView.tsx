/* 
  file summary: inspector workspace page displaying physical survey queue and survey checklist triggers in light theme.
  responsibilities: presents vessel survey inspection items and opens InspectionDrawer for recording findings.
  role in system: primary operational workspace for Inspectors (/inspector).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { InspectionDrawer } from '../components/drawers/InspectionDrawer';

/**
  what: renders inspector operational workspace view in light theme.
  how: lists vessels needing physical visual audit and launches InspectionDrawer checklist.
  with what file: src/views/InspectorWorkspaceView.tsx loaded by App.tsx.
*/
export const InspectorWorkspaceView: React.FC = () => {
  const { vessels } = useMapStore();
  const [selectedVesselName, setSelectedVesselName] = useState<string | null>(null);

  return (
    <div className="d-flex flex-column gap-4">
      {/* Survey Schedule Table */}
      <div className="card map-card-custom">
        <div className="card-header d-flex align-items-center justify-between">
          <span>Physical Survey Schedule ({vessels.length} Vessels)</span>
          <span className="badge bg-info text-dark font-mono-code">On-Site Auditor Queue</span>
        </div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Vessel Name</th>
                <th>IMO Number</th>
                <th>Flag State</th>
                <th>Port Location</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vessels.map((v) => (
                <tr key={v.id}>
                  <td className="fw-semibold text-primary">{v.name}</td>
                  <td className="font-mono-code">{v.imoNumber}</td>
                  <td>{v.flagState}</td>
                  <td>{v.portOfRegistry}</td>
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
              ))}
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
