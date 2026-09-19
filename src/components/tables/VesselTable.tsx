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

interface VesselTableProps {
  onSelectVessel: (vessel: VesselParticulars) => void;
  onRegisterVessel?: () => void;
}

/**
  what: renders master fleet registry data table with search filters and export/creation actions.
  how: filters vessels state and triggers csv/pdf exports or opens registration modal on action button clicks.
  with what file: src/components/tables/VesselTable.tsx loaded by FleetRegistryView.tsx.
*/
export const VesselTable: React.FC<VesselTableProps> = ({ onSelectVessel, onRegisterVessel }) => {
  const { vessels, setActiveVesselId, activePersona } = useMapStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [flagFilter, setFlagFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [isExportOpen, setIsExportOpen] = useState(false);

  const canRegister = activePersona === 'Administrator';

  const filteredVessels = vessels.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.imoNumber.includes(searchTerm) ||
      v.mmsiNumber.includes(searchTerm);
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
      {/* Table Header Controls Row: Grouped Search/Filter on Left, Grouped Export/Register on Right with Space In Between */}
      <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
        {/* Group 1 (Left): Search Box & Filter Dropdowns */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <input
            type="text"
            className="form-control form-control-sm bg-white text-dark border-secondary"
            placeholder="Search by Name, IMO, MMSI..."
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
          </select>
        </div>

        {/* Group 2 (Right): Export & Register Action Buttons */}
        <div className="d-flex align-items-center gap-2">
          {/* Export Dropdown */}
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

          {/* Register Vessel Action Button */}
          {canRegister && onRegisterVessel && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={onRegisterVessel}
            >
              Register Unique Vessel
            </button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="table map-table-custom align-middle mb-0">
          <thead>
            <tr>
              <th>Vessel Name</th>
              <th>IMO Number</th>
              <th>Subtype / Class Notation</th>
              <th>Flag State</th>
              <th>Class Society</th>
              <th>P&I Club</th>
              <th>Compliance Readiness</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredVessels.map((v) => (
              <tr
                key={v.id}
                onClick={() => {
                  setActiveVesselId(v.id);
                  onSelectVessel(v);
                }}
                style={{ cursor: 'pointer' }}
              >
                <td className="fw-semibold text-primary">{v.name}</td>
                <td className="font-mono-code">{v.imoNumber}</td>
                <td className="small text-secondary">{v.classNotation}</td>
                <td>{v.flagState}</td>
                <td>
                  <span className="badge bg-light text-dark border">{v.classificationSociety}</span>
                </td>
                <td className="small">{v.piClubName}</td>
                <td>
                  <ReadinessGauge score={v.complianceReadinessScore} size="sm" />
                </td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveVesselId(v.id);
                      onSelectVessel(v);
                    }}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
