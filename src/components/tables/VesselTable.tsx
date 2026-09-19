/* 
  file summary: master fleet registry table component featuring grouped search/filters on left and grouped export/register buttons on right.
  responsibilities: renders list of vessels with search filters on left and export/register action buttons on right.
  role in system: main data table for FleetRegistryView.tsx.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { VesselParticulars } from '../../types/vessel';
import { ReadinessGauge } from '../common/ReadinessGauge';
import { exportToCsv, exportToPdf } from '../../utils/exportHelpers';

import { filterVesselsForPersona } from '../../utils/rbacHelpers';

interface VesselTableProps {
  onSelectVessel: (vessel: VesselParticulars) => void;
  onRegisterVessel?: () => void;
}

export const VesselTable: React.FC<VesselTableProps> = ({ onSelectVessel, onRegisterVessel }) => {
  const { vessels, assuranceSets, setActiveVesselId, activePersona } = useMapStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [flagFilter, setFlagFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [isExportOpen, setIsExportOpen] = useState(false);

  // BR-4: Client Admin (C Admin) or Inspector cannot register new vessels
  const canRegister = activePersona === 'Administrator';

  const filteredVessels = vessels.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      v.name.toLowerCase().includes(term) ||
      v.imoNumber.includes(term) ||
      v.mmsiNumber.includes(term) ||
      v.registeredOwner.toLowerCase().includes(term);

    const matchesFlag = flagFilter === 'ALL' || v.flagState === flagFilter;
    const matchesClass = classFilter === 'ALL' || v.classificationSociety === classFilter;
    return matchesSearch && matchesFlag && matchesClass;
  });

  const handleExportCsv = () => {
    const exportData = filteredVessels.map((v) => ({
      VesselName: v.name,
      ImoNumber: v.imoNumber,
      OfficialRegNumber: v.officialRegNumber,
      MmsiNumber: v.mmsiNumber,
      CallSign: v.callSign,
      FlagState: v.flagState,
      ClassificationSociety: v.classificationSociety,
      Status: v.status,
      ReadinessScore: `${v.complianceReadinessScore}%`,
    }));
    exportToCsv('Master_Fleet_Registry', exportData);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['Vessel Name', 'IMO Number', 'Reg Number', 'Flag State', 'Class', 'Status', 'Readiness'];
    const rows = filteredVessels.map((v) => [
      v.name,
      v.imoNumber,
      v.officialRegNumber,
      v.flagState,
      v.classificationSociety,
      v.status,
      `${v.complianceReadinessScore}%`,
    ]);
    exportToPdf('Master Fleet Registry', headers, rows);
    setIsExportOpen(false);
  };

  return (
    <div className="card map-card-custom">
      {/* Table Controls Header */}
      <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
        {/* Left: Search & Filter */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <input
            type="text"
            className="form-control form-control-sm bg-white text-dark border-secondary"
            placeholder="Search by Name, IMO, Owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />

          <select
            className="form-select form-select-sm bg-white text-dark border-secondary"
            value={flagFilter}
            onChange={(e) => setFlagFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="ALL">All Flags</option>
            <option value="Australia">Australia</option>
          </select>

          <select
            className="form-select form-select-sm bg-white text-dark border-secondary"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            style={{ width: '160px' }}
          >
            <option value="ALL">All Class Societies</option>
            <option value="DNV">DNV</option>
            <option value="ABS">ABS</option>
            <option value="Lloyd's Register">Lloyd's Register</option>
            <option value="Bureau Veritas">Bureau Veritas</option>
          </select>
        </div>

        {/* Right: Export & Register Buttons */}
        <div className="d-flex align-items-center gap-2">
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

          {canRegister && onRegisterVessel && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onRegisterVessel}
            >
              + Register Vessel
            </button>
          )}
        </div>
      </div>

      {/* Vessels Data Table */}
      <div className="table-responsive">
        <table className="table map-table-custom align-middle mb-0">
          <thead>
            <tr>
              <th>Vessel Name & IMO</th>
              <th>Class Notation / Type</th>
              <th>Flag State / Port</th>
              <th>Registered Owner & ISM</th>
              <th>Status</th>
              <th>Assurance Readiness</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVessels.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-muted">
                  No vessels match your search criteria.
                </td>
              </tr>
            ) : (
              filteredVessels.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => {
                    setActiveVesselId(v.id);
                    onSelectVessel(v);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div className="fw-semibold text-primary">{v.name}</div>
                    <div className="small font-mono-code text-muted">IMO {v.imoNumber}</div>
                  </td>
                  <td className="small">
                    <div>{v.classNotation}</div>
                    <span className="badge bg-light text-dark border mt-1">{v.classificationSociety}</span>
                  </td>
                  <td>
                    <div>{v.flagState}</div>
                    <div className="small text-muted">{v.portOfRegistry}</div>
                  </td>
                  <td className="small">
                    <div className="fw-semibold text-dark">{v.registeredOwner}</div>
                    <div className="text-muted">Tech Mgr: {v.technicalManager}</div>
                  </td>
                  <td>
                    <span className="badge bg-primary text-uppercase">{v.status}</span>
                  </td>
                  <td>
                    <ReadinessGauge score={v.complianceReadinessScore} size="sm" />
                  </td>
                  <td className="text-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setActiveVesselId(v.id);
                        onSelectVessel(v);
                      }}
                    >
                      View Details &rarr;
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};