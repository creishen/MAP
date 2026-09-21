/* 
  file summary: master fleet registry table component featuring grouped search/filters on left, interactive column sorting, and grouped export/register buttons on right.
  responsibilities: renders list of vessels with search filters, multi-column sorting by header clicks, and export/register action buttons.
  role in system: main data table for FleetRegistryView.tsx.
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { VesselParticulars } from '../../types/vessel';
import { ReadinessGauge } from '../common/ReadinessGauge';
import { exportToCsv, exportToPdf } from '../../utils/exportHelpers';
import { getDaysUntilExpiry } from '../../utils/formatters';

import { filterVesselsForPersona } from '../../utils/rbacHelpers';

type VesselSortField =
  | 'name'
  | 'classNotation'
  | 'flagState'
  | 'registeredOwner'
  | 'status'
  | 'certAlerts'
  | 'complianceReadinessScore';

function vesselHasExpiringCert(vessel: VesselParticulars): boolean {
  return vessel.statutoryCertificates.some((cert) => {
    const daysLeft = getDaysUntilExpiry(cert.expiryDate);
    return daysLeft >= 0 && daysLeft < 90;
  });
}

interface VesselTableProps {
  onSelectVessel: (vessel: VesselParticulars) => void;
  onRegisterVessel?: () => void;
  filterMode?: 'all' | 'chartered';
}

/**
  what: renders master fleet registry table with search filters, column sorting, and export/register actions.
  how: filters and sorts base vessels by persona and sortField, rendering interactive table rows and header controls.
  with what file: src/components/tables/VesselTable.tsx loaded by FleetRegistryView.tsx.
*/
export const VesselTable: React.FC<VesselTableProps> = ({ onSelectVessel, onRegisterVessel, filterMode }) => {
  const { vessels, assuranceSets, setActiveVesselId, activePersona } = useMapStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [flagFilter, setFlagFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortField, setSortField] = useState<VesselSortField>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isExportOpen, setIsExportOpen] = useState(false);

  // BR-4: Client Admin (C Admin) or Inspector cannot register new vessels
  const canRegister = activePersona === 'Administrator';

  const baseVessels = filterMode === 'all'
    ? vessels
    : filterMode === 'chartered'
      ? filterVesselsForPersona(vessels, assuranceSets, 'C Admin')
      : filterVesselsForPersona(vessels, assuranceSets, activePersona);

  const filteredVessels = baseVessels.filter((v) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      v.name.toLowerCase().includes(term) ||
      v.imoNumber.includes(term) ||
      v.mmsiNumber.includes(term) ||
      v.registeredOwner.toLowerCase().includes(term);

    const matchesFlag = flagFilter === 'ALL' || v.flagState === flagFilter;
    const matchesClass = classFilter === 'ALL' || v.classificationSociety === classFilter;
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesFlag && matchesClass && matchesStatus;
  });

  const handleSort = (field: VesselSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: VesselSortField) => {
    if (sortField !== field) return <span className="text-muted ms-1 small opacity-50">↕</span>;
    return <span className="text-primary ms-1 small fw-bold">{sortDirection === 'asc' ? '▲' : '▼'}</span>;
  };

  const sortedVessels = [...filteredVessels].sort((a, b) => {
    let valA: any = '';
    let valB: any = '';

    if (sortField === 'certAlerts') {
      valA = vesselHasExpiringCert(a) ? 1 : 0;
      valB = vesselHasExpiringCert(b) ? 1 : 0;
    } else if (sortField === 'complianceReadinessScore') {
      valA = Number(a.complianceReadinessScore) || 0;
      valB = Number(b.complianceReadinessScore) || 0;
    } else {
      valA = a[sortField] ?? '';
      valB = b[sortField] ?? '';
    }

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB as string).toLowerCase();
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleExportCsv = () => {
    const exportData = sortedVessels.map((v) => ({
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
    const rows = sortedVessels.map((v) => [
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

          <select
            className="form-select form-select-sm bg-white text-dark border-secondary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="In Operations">In Operations</option>
            <option value="Under Charter">Under Charter</option>
            <option value="In Transit">In Transit</option>
            <option value="Dry Docking">Dry Docking</option>
            <option value="Lay-up">Lay-up</option>
            <option value="Port Stay">Port Stay</option>
          </select>
        </div>

        {/* Right: Export & Register Buttons on corner right of the row */}
        <div className="d-flex align-items-center gap-2 ms-auto">
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
              Register Vessel
            </button>
          )}
        </div>
      </div>

      {/* Vessels Data Table */}
      <div className="table-responsive">
        <table className="table map-table-custom align-middle mb-0">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Vessel Name &amp; IMO {renderSortIndicator('name')}
              </th>
              <th onClick={() => handleSort('classNotation')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Class Notation / Type {renderSortIndicator('classNotation')}
              </th>
              <th onClick={() => handleSort('flagState')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Flag State / Port {renderSortIndicator('flagState')}
              </th>
              <th onClick={() => handleSort('registeredOwner')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Registered Owner &amp; ISM {renderSortIndicator('registeredOwner')}
              </th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Status {renderSortIndicator('status')}
              </th>
              <th onClick={() => handleSort('certAlerts')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Cert Alerts {renderSortIndicator('certAlerts')}
              </th>
              <th onClick={() => handleSort('complianceReadinessScore')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                Assurance Readiness {renderSortIndicator('complianceReadinessScore')}
              </th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedVessels.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-5">
                  <div className="map-vessel-empty-state">
                    <div className="map-vessel-empty-title">No vessels match your search</div>
                    <div className="map-vessel-empty-hint text-muted small">
                      Try adjusting filters or register a new OSV vessel.
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedVessels.map((v) => (
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
                  </td>
                  <td>
                    <span className="badge bg-primary text-uppercase">{v.status}</span>
                  </td>
                  <td>
                    {vesselHasExpiringCert(v) ? (
                      <span className="badge map-vessel-cert-warning">Expiring &lt; 90d</span>
                    ) : (
                      <span className="badge bg-light text-success border">All clear</span>
                    )}
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
  );
};
