/* 
  file summary: dedicated vessel capa tracking and re-inspection management table view in light theme.
  responsibilities: presents vessel corrective actions (capa) queue as a clean, neat, sortable master table and launches CapaReinspectionDrawer for detailed findings and evidence.
  role in system: full-page view rendered when clicking capa tracker in sidebar or inspector workspace (/capa or /capa/vesselName).
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { getBackButtonInfo } from '../utils/rbacHelpers';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';
import { CapaItem, CapaStatus } from '../types/capa';
import { CapaReinspectionDrawer } from '../components/drawers/CapaReinspectionDrawer';

interface CapaManagementViewProps {
  vesselName?: string;
}

type CapaSortField = 'id' | 'vesselName' | 'title' | 'owner' | 'dueDate' | 'status';

/**
  what: renders clean, un-cramped vessel capa master table displaying essential columns and offloading detailed findings to CapaReinspectionDrawer.
  how: aggregates capaItems into a neat sortable table with status/vessel dropdown filters and launches CapaReinspectionDrawer on click.
  with what file: src/views/CapaManagementView.tsx loaded by App.tsx when currentHashView is capa or capas.
*/
export const CapaManagementView: React.FC<CapaManagementViewProps> = ({ vesselName }) => {
  const {
    capaItems,
    vessels,
    activePersona,
    setCurrentHashView,
    previousHashView,
    previousEntityId,
  } = useMapStore();

  const backInfo = getBackButtonInfo('inspector', 'Inspector Workspace', previousHashView, activePersona, previousEntityId);

  /* parse vesselName prop or target CAPA ID if passed as vesselName:capaId or CAPA ID */
  const rawProp = vesselName || '';
  let targetVesselName = rawProp;
  let targetCapaId: string | undefined = undefined;

  if (rawProp.includes(':')) {
    const parts = rawProp.split(':');
    targetVesselName = parts[0];
    targetCapaId = parts[1];
  } else if (rawProp.startsWith('CAPA-')) {
    targetCapaId = rawProp;
    const foundCapa = capaItems.find((c) => c.id === rawProp);
    if (foundCapa) {
      targetVesselName = foundCapa.vesselName;
    }
  }

  const isFleetOverview =
    !targetVesselName ||
    targetVesselName === '' ||
    targetVesselName === 'ALL' ||
    targetVesselName === 'ALL_FLEET' ||
    targetVesselName === 'All Vessels' ||
    targetVesselName === 'capa' ||
    targetVesselName === 'capas';

  const selectedVesselName = isFleetOverview
    ? 'All Fleet Vessels'
    : targetVesselName;

  const vesselCapas = isFleetOverview
    ? capaItems
    : capaItems.filter(
      (c) => c.vesselName.toLowerCase() === selectedVesselName.toLowerCase() || c.vesselId === selectedVesselName
    );

  /* filter, sort & search state */
  const [activeTab, setActiveTab] = useState<'All' | CapaStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [sortField, setSortField] = useState<CapaSortField>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  /* re-inspection drawer state */
  const [activeCapa, setActiveCapa] = useState<CapaItem | null>(null);

  /* auto-open target CAPA item re-inspection drawer if targetCapaId is specified */
  React.useEffect(() => {
    if (targetCapaId) {
      const found = capaItems.find((c) => c.id === targetCapaId);
      if (found) {
        setActiveCapa(found);
      }
    }
  }, [targetCapaId, capaItems]);

  /* compute capa KPI counts */
  const totalCount = vesselCapas.length;
  const openCount = vesselCapas.filter((c) => c.status === 'Open').length;
  const reInspectionCount = vesselCapas.filter((c) => c.status === 'Under Re-Inspection').length;
  const closedCount = vesselCapas.filter((c) => c.status === 'Verified & Closed').length;

  /* apply search & status filtering */
  const filteredCapas = vesselCapas.filter((item) => {
    const matchesTab = activeTab === 'All' || item.status === activeTab;
    const matchesSearch =
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.vesselName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.owner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.findingDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.checklistItemTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  /* apply column sorting */
  const sortedCapas = [...filteredCapas].sort((a, b) => {
    let valA = (a[sortField] || '').toString().toLowerCase();
    let valB = (b[sortField] || '').toString().toLowerCase();

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: CapaSortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortHeader = (label: string, field: CapaSortField) => (
    <th
      className="cursor-pointer user-select-none"
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer' }}
    >
      <div className="d-flex align-items-center justify-between gap-1">
        <span>{label}</span>
        <span className="text-muted small" style={{ fontSize: '0.7rem' }}>
          {sortField === field ? (sortOrder === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </div>
    </th>
  );

  const handleExportCsv = () => {
    const exportData = sortedCapas.map((c) => ({
      CapaId: c.id,
      Vessel: c.vesselName,
      ChecklistItem: c.checklistItemTitle,
      Title: c.title,
      FindingDescription: c.findingDescription,
      Status: c.status,
      Owner: c.owner,
      DueDate: c.dueDate,
      InspectorNotes: c.inspectorNotes || 'None',
      EvidenceCount: c.evidences.length,
    }));
    exportToCsv(`${selectedVesselName.replace(/\s+/g, '_')}_CAPA_Report`, exportData);
    setIsExportOpen(false);
  };

  const handleExportPdf = () => {
    const headers = ['CAPA ID', 'Vessel', 'Title & Checklist', 'Status', 'Owner', 'Due Date'];
    const rows = sortedCapas.map((c) => [
      c.id,
      c.vesselName,
      `${c.title}\n(${c.checklistItemTitle})`,
      c.status,
      c.owner,
      c.dueDate,
    ]);
    exportToPdf(`${selectedVesselName} CAPA Re-Inspection Summary`, headers, rows);
    setIsExportOpen(false);
  };

  const getStatusBadgeClass = (status: CapaStatus) => {
    switch (status) {
      case 'Verified & Closed':
        return 'bg-success text-white';
      case 'Under Re-Inspection':
        return 'bg-warning text-dark';
      case 'Rectification Required':
        return 'bg-danger text-white';
      case 'Open':
      default:
        return 'bg-secondary text-white';
    }
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Header & Context Banner */}
      <div className="card map-card-custom bg-white p-3">
        <div className="d-flex flex-wrap align-items-center justify-between gap-3">
          <div>
            <h5 className="fw-bold text-dark m-0" style={{ fontSize: '1.25rem' }}>
              Corrective Actions (CAPA) & Re-Inspection Registry
            </h5>
            <div className="font-mono-code small text-muted mt-0.5" style={{ fontSize: '0.75rem' }}>
              Vessel: <span className="fw-bold text-primary">{selectedVesselName}</span> · Active Survey CAPA Audit Queue
            </div>
          </div>
        </div>
      </div>

      {/* CAPA Metric KPI Cards */}
      <div className="row g-3">
        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Total Vessel CAPAs
            </div>
            <div className="display-6 fw-bold text-primary font-mono-code mt-1">{totalCount}</div>
            <div className="text-muted small mt-1">Total Logged Corrective Actions</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Open Findings
            </div>
            <div className="display-6 fw-bold text-danger font-mono-code mt-1">{openCount}</div>
            <div className="text-muted small mt-1">Awaiting Rectification</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Under Re-Inspection
            </div>
            <div className="display-6 fw-bold text-warning font-mono-code mt-1">{reInspectionCount}</div>
            <div className="text-muted small mt-1">Inspector Verification Pending</div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card map-card-custom p-3">
            <div className="text-secondary small text-uppercase fw-bold" style={{ letterSpacing: '0.05em' }}>
              Verified & Closed
            </div>
            <div className="display-6 fw-bold text-success font-mono-code mt-1">{closedCount}</div>
            <div className="text-muted small mt-1">Signed Off & Compliant</div>
          </div>
        </div>
      </div>

      {/* Main CAPA Master Table Card */}
      <div className="card map-card-custom">
        {/* Controls Header: Vessel Filter + Status Filter + Search + Export */}
        <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
          <div className="d-flex flex-wrap align-items-center gap-2">
            {/* Vessel Selector Dropdown */}
            <select
              className="form-select form-select-sm bg-white text-dark border-secondary"
              value={isFleetOverview ? 'ALL_FLEET' : selectedVesselName}
              onChange={(e) => setCurrentHashView('capas', e.target.value)}
              style={{ width: '220px' }}
            >
              <option value="ALL_FLEET">All Fleet Vessels ({capaItems.length})</option>
              {vessels.map((v) => {
                const vesselCapaCount = capaItems.filter(
                  (c) => c.vesselName.toLowerCase() === v.name.toLowerCase()
                ).length;
                return (
                  <option key={v.id} value={v.name}>
                    {v.name} ({vesselCapaCount})
                  </option>
                );
              })}
            </select>

            {/* Status Filter Dropdown */}
            <select
              className="form-select form-select-sm bg-white text-dark border-secondary"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as any)}
              style={{ width: '180px' }}
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Re-Inspection">Under Re-Inspection</option>
              <option value="Rectification Required">Rectification Required</option>
              <option value="Verified & Closed">Verified & Closed</option>
            </select>

            {/* Search Input */}
            <input
              type="text"
              className="form-control form-control-sm bg-white text-dark border-secondary"
              placeholder="Search CAPA ID, Title, Owner, Finding..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '250px' }}
            />
          </div>

          <div className="dropdown position-relative ms-auto">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-dark dropdown-toggle ms-2"
              onClick={() => setIsExportOpen(!isExportOpen)}
            >
              Export CAPA Report
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

        {/* Table Area */}
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                {renderSortHeader('CAPA ID', 'id')}
                {renderSortHeader('Vessel Name', 'vesselName')}
                {renderSortHeader('Title', 'title')}
                {renderSortHeader('Owner / Dept', 'owner')}
                {renderSortHeader('Due Date', 'dueDate')}
                {renderSortHeader('Status', 'status')}
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedCapas.map((capa) => (
                <tr key={capa.id} onClick={() => setActiveCapa(capa)} style={{ cursor: 'pointer' }}>
                  <td>
                    <span className="font-mono-code fw-bold text-primary small me-1.5">{capa.id}</span>
                    {capa.flaggedForReinspection && (
                      <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle font-mono-code" style={{ fontSize: '0.65rem' }}>
                        Flagged
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="fw-semibold text-dark font-mono-code small">{capa.vesselName}</span>
                  </td>
                  <td>
                    <span className="fw-bold text-dark" style={{ fontSize: '0.875rem' }}>{capa.title}</span>
                  </td>
                  <td className="small text-secondary">{capa.owner}</td>
                  <td className="font-mono-code small">{capa.dueDate}</td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(capa.status)}`}>
                      {capa.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCapa(capa);
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}

              {sortedCapas.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4 fst-italic">
                    No corrective action items match the selected search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive CAPA Re-Inspection & Evidence Drawer */}
      {activeCapa && (
        <CapaReinspectionDrawer
          capa={activeCapa}
          onClose={() => setActiveCapa(null)}
        />
      )}
    </div>
  );
};
