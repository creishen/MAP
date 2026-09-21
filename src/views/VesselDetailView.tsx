/* 
  file summary: vessel detail deep-dive view presenting 11 particulars categories in light accordions, pre-assurance vault, assurance sets, and audit logs.
  responsibilities: displays complete vessel particulars, statutory cert expiries (<90 days amber warning), and category details in light theme.
  role in system: deep-dive view rendered when a vessel row is selected from Fleet Master.
*/

import React, { useState, useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import { VesselParticulars, ClassificationSociety, VesselRegistrationStatus } from '../types/vessel';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { formatMaritimeDate, getDaysUntilExpiry } from '../utils/formatters';
import { filterAuditTrailForPersona, getBackButtonInfo } from '../utils/rbacHelpers';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';
import { CapaReinspectionDrawer } from '../components/drawers/CapaReinspectionDrawer';
import { CapaItem } from '../types/capa';

interface VesselDetailViewProps {
  vesselId: string;
}

export const VesselDetailView: React.FC<VesselDetailViewProps> = ({ vesselId }) => {
  const {
    vessels,
    crew,
    capaItems,
    updateVessel,
    setCurrentHashView,
    previousHashView,
    previousEntityId,
    activePersona,
    assuranceSets,
    documents,
    auditEvents
  } = useMapStore();

  const vessel = vessels.find((v) => v.id === vesselId);

  const [activeTab, setActiveTab] = useState<'particulars' | 'vault' | 'assurance' | 'clients' | 'crew' | 'audit' | 'inspections'>('particulars');

  const linkedCapas = vessel
    ? capaItems.filter((c) => c.vesselId === vessel.id || c.vesselName.toLowerCase() === vessel.name.toLowerCase())
    : [];
  const [activeAccordion, setActiveAccordion] = useState<number | null>(1);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<VesselParticulars | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedCapaForDrawer, setSelectedCapaForDrawer] = useState<CapaItem | null>(null);

  useEffect(() => {
    const found = vessels.find((v) => v.id === vesselId);
    if (found) {
      setFormData(found);
      setIsEditing(false);
    }
  }, [vesselId, vessels]);

  /* rbac: admin and c admin can export vessel data, admin and submitter can edit particulars/status */
  const isAdmin = activePersona === 'Administrator';
  const isSubmitter = activePersona === 'Submitter';
  const isCAdmin = activePersona === 'C Admin';
  const isReadOnly = isCAdmin || activePersona === 'Inspector';
  const canEditFull = isAdmin;
  const canEditStatus = isAdmin || isSubmitter;
  const canShowEditButton = canEditFull || canEditStatus;
  const canUploadDocs = isAdmin || isSubmitter;
  const canExport = isAdmin || isCAdmin;

  /*
    what: exports vessel 11-category particulars and statutory details to csv format.
    how: constructs key-value records for all technical particulars and triggers browser csv file download.
    with what file: src/views/VesselDetailView.tsx using src/utils/exportHelpers.ts.
  */
  const handleExportCsv = () => {
    if (!vessel) return;
    const vesselDetails = [
      { Category: 'Vessel Identification', Field: 'Vessel Name', Value: vessel.name },
      { Category: 'Vessel Identification', Field: 'IMO Number', Value: vessel.imoNumber },
      { Category: 'Vessel Identification', Field: 'Official Reg Number', Value: vessel.officialRegNumber },
      { Category: 'Vessel Identification', Field: 'MMSI Number', Value: vessel.mmsiNumber },
      { Category: 'Vessel Identification', Field: 'Call Sign', Value: vessel.callSign },
      { Category: 'Vessel Identification', Field: 'Flag State', Value: vessel.flagState },
      { Category: 'Vessel Identification', Field: 'Port of Registry', Value: vessel.portOfRegistry },
      { Category: 'Classification', Field: 'Vessel Type', Value: vessel.vesselType },
      { Category: 'Classification', Field: 'Vessel Subtype', Value: vessel.vesselSubtype },
      { Category: 'Classification', Field: 'Class Society', Value: vessel.classificationSociety },
      { Category: 'Classification', Field: 'Class Notation', Value: vessel.classNotation },
      { Category: 'Classification', Field: 'Hull Type', Value: vessel.hullType },
      { Category: 'Construction & Dimensions', Field: 'Year Built', Value: vessel.yearBuilt },
      { Category: 'Construction & Dimensions', Field: 'Shipyard Builder', Value: vessel.shipyardBuilder },
      { Category: 'Construction & Dimensions', Field: 'LOA (m)', Value: vessel.lengthOverallMeters },
      { Category: 'Construction & Dimensions', Field: 'Beam (m)', Value: vessel.beamMeters },
      { Category: 'Construction & Dimensions', Field: 'Draft (m)', Value: vessel.draftMeters },
      { Category: 'Tonnage & Propulsion', Field: 'Gross Tonnage (GT)', Value: vessel.grossTonnageGT },
      { Category: 'Tonnage & Propulsion', Field: 'Deadweight (DWT)', Value: vessel.deadweightTonnageDWT },
      { Category: 'Tonnage & Propulsion', Field: 'DP Class', Value: vessel.dynamicPositioningClass },
      { Category: 'Ownership & Management', Field: 'Registered Owner', Value: vessel.registeredOwner },
      { Category: 'Ownership & Management', Field: 'Technical Manager', Value: vessel.technicalManager },
      { Category: 'Ownership & Management', Field: 'DOC Number', Value: vessel.docNumber },
      { Category: 'Ownership & Management', Field: '24/7 Ops Contact', Value: vessel.contact247 },
      { Category: 'Insurance & Crew', Field: 'P&I Club', Value: vessel.piClubName },
      { Category: 'Insurance & Crew', Field: 'Policy Number', Value: vessel.policyNumber },
      { Category: 'Insurance & Crew', Field: 'Master Name', Value: vessel.masterName },
      { Category: 'Insurance & Crew', Field: 'Safe Manning Complement', Value: vessel.safeManningComplement },
      { Category: 'Insurance & Crew', Field: 'Lifeboat Capacity', Value: vessel.lifeboatCapacity },
      { Category: 'Status', Field: 'Operating Status', Value: vessel.status },
      { Category: 'Compliance', Field: 'Readiness Score', Value: `${vessel.complianceReadinessScore}%` },
    ];

    exportToCsv(`${vessel.name.replace(/\s+/g, '_')}_Particulars`, vesselDetails);
  };

  /*
    what: exports vessel 11-category particulars and statutory details to pdf printable report.
    how: constructs table headers and rows for vessel technical specs and invokes window print pdf generator.
    with what file: src/views/VesselDetailView.tsx using src/utils/exportHelpers.ts.
  */
  const handleExportPdf = () => {
    if (!vessel) return;
    const headers = ['Category', 'Specification Field', 'Value'];
    const rows = [
      ['Vessel Identification', 'Vessel Name', vessel.name],
      ['Vessel Identification', 'IMO Number', vessel.imoNumber],
      ['Vessel Identification', 'Official Reg Number', vessel.officialRegNumber],
      ['Vessel Identification', 'MMSI Number', vessel.mmsiNumber],
      ['Vessel Identification', 'Call Sign', vessel.callSign],
      ['Vessel Identification', 'Flag State / Port', `${vessel.flagState} (${vessel.portOfRegistry})`],
      ['Classification', 'Vessel Type / Subtype', `${vessel.vesselType} - ${vessel.vesselSubtype}`],
      ['Classification', 'Class Society & Notation', `${vessel.classificationSociety} - ${vessel.classNotation}`],
      ['Classification', 'Hull Type', vessel.hullType],
      ['Construction & Dimensions', 'Year Built & Builder', `${vessel.yearBuilt} by ${vessel.shipyardBuilder}`],
      ['Construction & Dimensions', 'LOA x Beam x Draft', `${vessel.lengthOverallMeters}m x ${vessel.beamMeters}m x ${vessel.draftMeters}m`],
      ['Tonnage & Propulsion', 'GT / DWT / DP Class', `${vessel.grossTonnageGT} GT / ${vessel.deadweightTonnageDWT} DWT / ${vessel.dynamicPositioningClass}`],
      ['Ownership & Management', 'Registered Owner', vessel.registeredOwner],
      ['Ownership & Management', 'Technical Manager', vessel.technicalManager],
      ['Ownership & Management', 'DOC Number', vessel.docNumber],
      ['Ownership & Management', '24/7 Ops Contact', vessel.contact247],
      ['Insurance & Crew', 'P&I Club & Policy #', `${vessel.piClubName} (#${vessel.policyNumber})`],
      ['Insurance & Crew', 'Master & Manning', `${vessel.masterName} (${vessel.safeManningComplement} Crew / Cap: ${vessel.lifeboatCapacity})`],
      ['Operating Status', 'Current Status', vessel.status],
      ['Compliance', 'Readiness Score', `${vessel.complianceReadinessScore}%`],
    ];

    exportToPdf(`${vessel.name} Technical Dossier`, headers, rows);
  };

  if (!vessel || !formData) {
    return <div className="p-4 text-center">Vessel not found.</div>;
  }

  const canEditField = (field: keyof VesselParticulars): boolean => {
    if (isReadOnly) return false;
    if (canEditFull) return true;
    if (isSubmitter && field === 'status') return true;
    return false;
  };

  const fieldEditable = (field: keyof VesselParticulars) => isEditing && canEditField(field);

  const visibleAuditEvents = filterAuditTrailForPersona(auditEvents, activePersona, assuranceSets, vessels);

  // Linked assurance sets, documents, crew, and audit items for this vessel
  const linkedSets = assuranceSets.filter((s) => s.vesselId === vessel.id);
  const linkedDocs = documents.filter((d) => d.vesselId === vessel.id);
  const linkedCrew = crew.filter((c) => c.currentVesselId === vessel.id || c.assignments.some((a) => a.vesselId === vessel.id));
  const linkedAudits = visibleAuditEvents.filter(
    (a) => a.targetAsset.includes(vessel.imoNumber) || a.targetAsset.includes(vessel.name)
  );

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  const handleInputChange = (field: keyof VesselParticulars, val: VesselParticulars[keyof VesselParticulars]) => {
    setFormData((prev) => (prev ? { ...prev, [field]: val } : prev));
  };

  const handleSave = () => {
    if (canEditFull) {
      updateVessel(formData);
      setToastMessage('Vessel specifications updated successfully & recorded in audit trail.');
    } else if (isSubmitter) {
      updateVessel({ ...vessel, status: formData.status });
      setToastMessage('Operating status updated successfully & recorded in audit trail.');
    }
    setIsEditing(false);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const renderClientOutcomeBadge = (outcome: VesselParticulars['clientHistory'][0]['outcome']) => {
    switch (outcome) {
      case 'Approved':
      case 'Completed':
        return <span className="badge bg-success text-white">{outcome}</span>;
      case 'Rejected':
        return <span className="badge bg-danger text-white">{outcome}</span>;
      case 'Returned for Correction':
        return <span className="badge bg-warning text-dark">{outcome}</span>;
      case 'In Progress':
        return <span className="badge bg-primary text-white">{outcome}</span>;
      default:
        return <span className="badge bg-secondary">{outcome}</span>;
    }
  };

  return (
    <div className="d-flex flex-column gap-3">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="alert alert-success d-flex align-items-center justify-between shadow-sm p-2 mb-0">
          <span>{toastMessage}</span>
          <button type="button" className="btn-close" onClick={() => setToastMessage(null)} />
        </div>
      )}

      {/* Header KPI Summary Card with Name, Details, Classification, Readiness, Export & Edit Controls */}
      <div className="card map-card-custom p-4">
        <div className="d-flex flex-wrap align-items-center justify-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="fw-bold mb-1 text-primary m-0">{vessel.name}</h2>
              {fieldEditable('status') ? (
                <select
                  className="form-select form-select-sm"
                  style={{ width: 'auto' }}
                  value={formData.status}
                  onChange={(e) =>
                    handleInputChange('status', e.target.value as VesselRegistrationStatus)
                  }
                >
                  <option value="In Operations">In Operations</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Dry Docking">Dry Docking</option>
                  <option value="Lay-up">Lay-up</option>
                  <option value="Port Stay">Port Stay</option>
                  <option value="Under Charter">Under Charter</option>
                </select>
              ) : (
                <span className="badge bg-primary text-uppercase">{vessel.status}</span>
              )}
            </div>
            <div className="text-secondary small mt-1 font-mono-code">
              <strong className="text-dark">IMO: {vessel.imoNumber} | Reg: {vessel.officialRegNumber}</strong>
              <span className="mx-2">•</span>
              <span>{vessel.classNotation} | {vessel.flagState} Flag | Port: {vessel.portOfRegistry}</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-4">
            <div>
              <div className="text-secondary small text-uppercase fw-bold">Classification</div>
              <span className="badge bg-light text-dark border mt-1">{vessel.classificationSociety}</span>
            </div>
            <div>
              <div className="text-secondary small text-uppercase fw-bold">Readiness Score</div>
              <div className="mt-1">
                <ReadinessGauge score={vessel.complianceReadinessScore} size="md" />
              </div>
            </div>

            {/* Export & Edit Action Controls in Header Card Container */}
            <div className="d-flex align-items-center gap-2 ms-2 border-start ps-3">
              {canExport && (
                <div className="position-relative">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                    onClick={() => setIsExportOpen(!isExportOpen)}
                  >
                    <span>Export Data</span>
                    <span style={{ fontSize: '10px' }}>▼</span>
                  </button>
                  {isExportOpen && (
                    <div
                      className="dropdown-menu show position-absolute end-0 mt-1 shadow border p-1 z-3 bg-white"
                      style={{ minWidth: '140px' }}
                    >
                      <button
                        type="button"
                        className="dropdown-item small py-1 px-2 border-0 bg-transparent text-start w-100"
                        onClick={() => {
                          handleExportCsv();
                          setIsExportOpen(false);
                        }}
                      >
                        Export as CSV
                      </button>
                      <button
                        type="button"
                        className="dropdown-item small py-1 px-2 border-0 bg-transparent text-start w-100"
                        onClick={() => {
                          handleExportPdf();
                          setIsExportOpen(false);
                        }}
                      >
                        Export as PDF
                      </button>
                    </div>
                  )}
                </div>
              )}

              {canShowEditButton && (
                <div>
                  {isEditing ? (
                    <div className="d-flex gap-1">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          setFormData(vessel);
                          setIsEditing(false);
                        }}
                      >
                        Cancel
                      </button>
                      <button type="button" className="btn btn-sm btn-success" onClick={handleSave}>
                        Save
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      {canEditFull ? 'Edit Particulars' : 'Update Operating Status'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <ul className="nav nav-tabs border-bottom">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'particulars' ? 'active fw-bold text-primary' : 'text-secondary'}`}
            onClick={() => setActiveTab('particulars')}
          >
            11 Category Particulars
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'vault' ? 'active fw-bold text-primary' : 'text-secondary'}`}
            onClick={() => setActiveTab('vault')}
          >
            Pre-Assurance Vault ({vessel.statutoryCertificates.length + linkedDocs.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'assurance' ? 'active fw-bold text-primary' : 'text-secondary'}`}
            onClick={() => setActiveTab('assurance')}
          >
            Assurance Sets ({linkedSets.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'inspections' ? 'active fw-bold text-primary' : 'text-secondary'}`}
            onClick={() => setActiveTab('inspections')}
          >
            Physical Inspections ({linkedSets.length})
          </button>
        </li>
        {isAdmin && (
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === 'clients' ? 'active fw-bold text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('clients')}
            >
              Client History ({vessel.clientHistory?.length ?? 0})
            </button>
          </li>
        )}
        {isAdmin && (
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === 'crew' ? 'active fw-bold text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('crew')}
            >
              Assigned Crew ({linkedCrew.length})
            </button>
          </li>
        )}
        {isAdmin && (
          <li className="nav-item">
            <button
              type="button"
              className={`nav-link ${activeTab === 'audit' ? 'active fw-bold text-primary' : 'text-secondary'}`}
              onClick={() => setActiveTab('audit')}
            >
              Audit Trail ({linkedAudits.length})
            </button>
          </li>
        )}
      </ul>

      {/* Tab 1: 11 Categories Particulars */}
      {activeTab === 'particulars' && (
        <div className="card map-card-custom">
          <div className="card-header d-flex justify-between align-items-center">
            <span>Complete 11-Category Technical Breakdown</span>
            {isEditing && canEditFull && <span className="badge bg-warning text-dark">Edit Mode Active</span>}
            {isEditing && isSubmitter && <span className="badge bg-warning text-dark">Status Edit Only</span>}
          </div>
          <div className="card-body p-3">
            {/* Category 1 */}
            <div className="border rounded mb-2 overflow-hidden">
              <div
                className="p-3 bg-light d-flex justify-between align-items-center"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleAccordion(1)}
              >
                <span className="fw-bold text-dark">1. Vessel Identification</span>
                <span>{activeAccordion === 1 ? '▲' : '▼'}</span>
              </div>
              {activeAccordion === 1 && (
                <div className="p-3 bg-white row g-3 small border-top">
                  <div className="col-md-4">
                    <span className="text-secondary">Vessel Name:</span>
                    {fieldEditable('name') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block text-dark">{vessel.name}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">IMO Number:</span>
                    {fieldEditable('imoNumber') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1 font-mono-code"
                        value={formData.imoNumber}
                        onChange={(e) => handleInputChange('imoNumber', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block font-mono-code text-dark">{vessel.imoNumber}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Official Reg #:</span>
                    {fieldEditable('officialRegNumber') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1"
                        value={formData.officialRegNumber}
                        onChange={(e) => handleInputChange('officialRegNumber', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block font-mono-code text-dark">{vessel.officialRegNumber}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">MMSI:</span>
                    {fieldEditable('mmsiNumber') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1"
                        value={formData.mmsiNumber}
                        onChange={(e) => handleInputChange('mmsiNumber', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block font-mono-code text-dark">{vessel.mmsiNumber}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Call Sign:</span>
                    {fieldEditable('callSign') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1"
                        value={formData.callSign}
                        onChange={(e) => handleInputChange('callSign', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block font-mono-code text-dark">{vessel.callSign}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Flag / Port:</span>
                    {fieldEditable('flagState') ? (
                      <div className="d-flex gap-1 mt-1">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.flagState}
                          onChange={(e) => handleInputChange('flagState', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.portOfRegistry}
                          onChange={(e) => handleInputChange('portOfRegistry', e.target.value)}
                        />
                      </div>
                    ) : (
                      <strong className="d-block text-dark">{vessel.flagState} ({vessel.portOfRegistry})</strong>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Category 2 */}
            <div className="border rounded mb-2 overflow-hidden">
              <div
                className="p-3 bg-light d-flex justify-between align-items-center"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleAccordion(2)}
              >
                <span className="fw-bold text-dark">2. Classification & Notation</span>
                <span>{activeAccordion === 2 ? '▲' : '▼'}</span>
              </div>
              {activeAccordion === 2 && (
                <div className="p-3 bg-white row g-3 small border-top">
                  <div className="col-md-4">
                    <span className="text-secondary">Vessel Type:</span>
                    {fieldEditable('vesselType') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1"
                        value={formData.vesselType}
                        onChange={(e) => handleInputChange('vesselType', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block text-dark">{vessel.vesselType}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Subtype / Use:</span>
                    <strong className="d-block text-dark">
                      {vessel.vesselSubtype} &middot; {vessel.intendedUse}
                    </strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Class Society:</span>
                    {fieldEditable('classificationSociety') ? (
                      <select
                        className="form-select form-select-sm mt-1"
                        value={formData.classificationSociety}
                        onChange={(e) =>
                          handleInputChange('classificationSociety', e.target.value as ClassificationSociety)
                        }
                      >
                        <option value="DNV">DNV</option>
                        <option value="ABS">ABS</option>
                        <option value="Lloyd's Register">Lloyd's Register</option>
                        <option value="Bureau Veritas">Bureau Veritas</option>
                        <option value="RINA">RINA</option>
                      </select>
                    ) : (
                      <strong className="d-block text-dark">{vessel.classificationSociety}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Class Notation:</span>
                    {fieldEditable('classNotation') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1"
                        value={formData.classNotation}
                        onChange={(e) => handleInputChange('classNotation', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block text-dark">{vessel.classNotation}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Hull Type:</span>
                    <strong className="d-block text-dark">{vessel.hullType}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Category 3 */}
            <div className="border rounded mb-2 overflow-hidden">
              <div
                className="p-3 bg-light d-flex justify-between align-items-center"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleAccordion(3)}
              >
                <span className="fw-bold text-dark">3. Construction & Dimensions</span>
                <span>{activeAccordion === 3 ? '▲' : '▼'}</span>
              </div>
              {activeAccordion === 3 && (
                <div className="p-3 bg-white row g-3 small border-top">
                  <div className="col-md-4">
                    <span className="text-secondary">Year Built:</span>
                    {fieldEditable('yearBuilt') ? (
                      <input
                        type="number"
                        className="form-control form-control-sm mt-1"
                        value={formData.yearBuilt}
                        onChange={(e) => handleInputChange('yearBuilt', parseInt(e.target.value, 10) || 0)}
                      />
                    ) : (
                      <strong className="d-block text-dark">{vessel.yearBuilt}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Shipyard:</span>
                    <strong className="d-block text-dark">{vessel.shipyardBuilder}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">LOA x Beam x Draft:</span>
                    <strong className="d-block text-dark">
                      {vessel.lengthOverallMeters}m x {vessel.beamMeters}m x {vessel.draftMeters}m
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Category 4 */}
            <div className="border rounded mb-2 overflow-hidden">
              <div
                className="p-3 bg-light d-flex justify-between align-items-center"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleAccordion(4)}
              >
                <span className="fw-bold text-dark">4. Tonnage & Propulsion</span>
                <span>{activeAccordion === 4 ? '▲' : '▼'}</span>
              </div>
              {activeAccordion === 4 && (
                <div className="p-3 bg-white row g-3 small border-top">
                  <div className="col-md-4">
                    <span className="text-secondary">Gross Tonnage (GT):</span>
                    <strong className="d-block text-dark">{vessel.grossTonnageGT.toLocaleString()} GT</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Deadweight (DWT):</span>
                    <strong className="d-block text-dark">{vessel.deadweightTonnageDWT.toLocaleString()} DWT</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">DP Class:</span>
                    <strong className="d-block text-dark">{vessel.dynamicPositioningClass}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Category 5 */}
            <div className="border rounded mb-2 overflow-hidden">
              <div
                className="p-3 bg-light d-flex justify-between align-items-center"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleAccordion(5)}
              >
                <span className="fw-bold text-dark">5. Ownership & Management</span>
                <span>{activeAccordion === 5 ? '▲' : '▼'}</span>
              </div>
              {activeAccordion === 5 && (
                <div className="p-3 bg-white row g-3 small border-top">
                  <div className="col-md-6">
                    <span className="text-secondary">Registered Owner:</span>
                    {fieldEditable('registeredOwner') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1"
                        value={formData.registeredOwner}
                        onChange={(e) => handleInputChange('registeredOwner', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block text-dark">{vessel.registeredOwner}</strong>
                    )}
                  </div>
                  <div className="col-md-6">
                    <span className="text-secondary">Technical Manager:</span>
                    {fieldEditable('technicalManager') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1"
                        value={formData.technicalManager}
                        onChange={(e) => handleInputChange('technicalManager', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block text-dark">{vessel.technicalManager}</strong>
                    )}
                  </div>
                  <div className="col-md-6">
                    <span className="text-secondary">DOC Number:</span>
                    {fieldEditable('docNumber') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1 font-mono-code"
                        value={formData.docNumber}
                        onChange={(e) => handleInputChange('docNumber', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block font-mono-code text-dark">{vessel.docNumber}</strong>
                    )}
                  </div>
                  <div className="col-md-6">
                    <span className="text-secondary">24/7 Ops Contact:</span>
                    {fieldEditable('contact247') ? (
                      <input
                        type="text"
                        className="form-control form-control-sm mt-1"
                        value={formData.contact247}
                        onChange={(e) => handleInputChange('contact247', e.target.value)}
                      />
                    ) : (
                      <strong className="d-block text-dark">{vessel.contact247}</strong>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Category 7 & 8 */}
            <div className="border rounded mb-2 overflow-hidden">
              <div
                className="p-3 bg-light d-flex justify-between align-items-center"
                style={{ cursor: 'pointer' }}
                onClick={() => toggleAccordion(7)}
              >
                <span className="fw-bold text-dark">7 & 8. Insurance & Crew Complement</span>
                <span>{activeAccordion === 7 ? '▲' : '▼'}</span>
              </div>
              {activeAccordion === 7 && (
                <div className="p-3 bg-white row g-3 small border-top">
                  <div className="col-md-4">
                    <span className="text-secondary">P&I Club:</span>
                    <strong className="d-block text-dark">{vessel.piClubName}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Policy #:</span>
                    <strong className="d-block font-mono-code text-dark">{vessel.policyNumber}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Master's Name:</span>
                    <strong className="d-block text-dark">{vessel.masterName}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Safe Manning Count:</span>
                    <strong className="d-block text-dark">{vessel.safeManningComplement} Crew</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Lifeboat Capacity:</span>
                    <strong className="d-block text-dark">{vessel.lifeboatCapacity} Persons</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Category 10 — Operating Status (editable by Admin + Submitter per UC-02 / PDF) */}
            <div className="border rounded mb-2 overflow-hidden">
              <div
                className="p-3 bg-light d-flex justify-between align-items-center map-vessel-accordion-header"
                onClick={() => toggleAccordion(10)}
              >
                <span className="fw-bold text-dark">10. Vessel Operating Status</span>
                <span>{activeAccordion === 10 ? '▲' : '▼'}</span>
              </div>
              {activeAccordion === 10 && (
                <div className="p-3 bg-white row g-3 small border-top">
                  <div className="col-md-6">
                    <span className="text-secondary">Current Status:</span>
                    {fieldEditable('status') ? (
                      <select
                        className="form-select form-select-sm mt-1"
                        value={formData.status}
                        onChange={(e) =>
                          handleInputChange('status', e.target.value as VesselRegistrationStatus)
                        }
                      >
                        <option value="In Operations">In Operations</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Dry Docking">Dry Docking</option>
                        <option value="Lay-up">Lay-up</option>
                        <option value="Port Stay">Port Stay</option>
                        <option value="Under Charter">Under Charter</option>
                      </select>
                    ) : (
                      <strong className="d-block text-dark">{vessel.status}</strong>
                    )}
                  </div>
                  {!canEditStatus && isReadOnly && (
                    <div className="col-12 text-muted small">
                      Read-only view — vessel registration particulars are managed by the Vessel Provider Administrator.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Pre-Assurance Document Vault (BR-5) */}
      {activeTab === 'vault' && (
        <div className="card map-card-custom">
          <div className="card-header d-flex justify-between align-items-center">
            <div>
              <span className="fw-bold">Pre-Assurance Statutory Certificate Vault</span>
              <div className="text-muted small">Upload and verify statutory certificates directly on the asset before assurance audits (BR-5).</div>
            </div>
            {canUploadDocs && (
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() => setCurrentHashView('documents')}
              >
                + Upload Certificate
              </button>
            )}
          </div>
          <div className="table-responsive">
            <table className="table map-table-custom align-middle mb-0">
              <thead>
                <tr>
                  <th>Certificate Name</th>
                  <th>Certificate Number</th>
                  <th>Issuing Body</th>
                  <th>Validity Dates</th>
                  <th>OCR Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vessel.statutoryCertificates.map((cert) => {
                  const daysLeft = getDaysUntilExpiry(cert.expiryDate);
                  let badgeClass = 'bg-success text-white';
                  let warningLabel = 'Valid';
                  if (daysLeft < 0) {
                    badgeClass = 'bg-danger text-white';
                    warningLabel = 'EXPIRED';
                  } else if (daysLeft < 90) {
                    badgeClass = 'bg-warning text-dark';
                    warningLabel = `Expiring in ${daysLeft} days`;
                  }

                  return (
                    <tr key={cert.id}>
                      <td className="fw-semibold text-dark">{cert.name}</td>
                      <td className="font-mono-code">{cert.certificateNumber}</td>
                      <td>{cert.issuingBody}</td>
                      <td className="font-mono-code small">
                        {formatMaritimeDate(cert.issueDate)} &rarr; {formatMaritimeDate(cert.expiryDate)}
                      </td>
                      <td>
                        <span className="badge bg-light text-success border">98% OCR Match</span>
                      </td>
                      <td>
                        <span className={`badge ${badgeClass}`}>{warningLabel}</span>
                      </td>
                    </tr>
                  );
                })}

                {linkedDocs.map((doc) => (
                  <tr key={doc.id}>
                    <td className="fw-semibold text-dark">{doc.title}</td>
                    <td className="font-mono-code">{doc.certificateNo}</td>
                    <td>{doc.issuingAuthority}</td>
                    <td className="font-mono-code small">Expires: {doc.expiryDate}</td>
                    <td>
                      <span className="badge bg-light text-primary border">{doc.ocrConfidence}% OCR</span>
                    </td>
                    <td>
                      <span className="badge bg-info text-dark">{doc.verificationStatus}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Assurance Sets */}
      {activeTab === 'assurance' && (
        <div className="card map-card-custom">
          <div className="card-header fw-bold">Associated Assurance Workflows</div>
          <div className="card-body p-0">
            {linkedSets.length === 0 ? (
              <div className="p-4 text-center text-muted">No active assurance sets linked to this vessel.</div>
            ) : (
              <div className="table-responsive">
                <table className="table map-table-custom align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Set ID & Title</th>
                      <th>Initiating Organization</th>
                      <th>Charter Window</th>
                      <th>Stage</th>
                      <th>Readiness</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedSets.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="fw-semibold font-mono-code text-primary">{s.id}</div>
                          <div className="small text-dark">{s.title}</div>
                        </td>
                        <td className="small">
                          <div>{s.initiatorOrg}</div>
                          <span className="badge bg-light text-secondary border">{s.initiatorRole}</span>
                        </td>
                        <td className="font-mono-code small">
                          {s.charterWindowStart} &rarr; {s.charterWindowEnd}
                        </td>
                        <td>
                          <span className="badge bg-secondary">{s.stage}</span>
                        </td>
                        <td>
                          <ReadinessGauge score={s.readinessScore} size="sm" />
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setCurrentHashView('assurance-sets', s.id)}
                          >
                            Open Set &rarr;
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Client / Charter History */}
      {activeTab === 'clients' && isAdmin && (
        <div className="card map-card-custom">
          <div className="card-header">
            <div className="fw-bold">Client & Charter History</div>
            <div className="text-muted small">
              Previous and current clients who chartered or used this vessel for assurance activities.
            </div>
          </div>
          <div className="card-body p-0">
            {(vessel.clientHistory?.length ?? 0) === 0 ? (
              <div className="p-4 text-center text-muted">No client or charter history recorded for this vessel yet.</div>
            ) : (
              <div className="table-responsive">
                <table className="table map-table-custom align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Client Organization</th>
                      <th>Charter / Campaign</th>
                      <th>Charter Period</th>
                      <th>Assurance Set</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...(vessel.clientHistory ?? [])]
                      .sort(
                        (a, b) =>
                          new Date(b.charterStart).getTime() - new Date(a.charterStart).getTime()
                      )
                      .map((record) => (
                        <tr key={record.id}>
                          <td className="fw-semibold text-dark">{record.clientOrganization}</td>
                          <td className="small">{record.charterTitle}</td>
                          <td className="font-mono-code small">
                            {formatMaritimeDate(record.charterStart)} &rarr;{' '}
                            {formatMaritimeDate(record.charterEnd)}
                          </td>
                          <td className="font-mono-code small">
                            {record.assuranceSetId ? (
                              <button
                                type="button"
                                className="btn btn-link btn-sm p-0 font-mono-code"
                                onClick={() =>
                                  setCurrentHashView('assurance-sets', record.assuranceSetId!)
                                }
                              >
                                {record.assuranceSetId} &rarr;
                              </button>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td>{renderClientOutcomeBadge(record.outcome)}</td>
                          <td className="small text-secondary">{record.notes || '—'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Assigned Crew Directory */}
      {activeTab === 'crew' && isAdmin && (
        <div className="card map-card-custom">
          <div className="card-header p-3 border-bottom d-flex align-items-center justify-between">
            <div className="fw-bold text-dark fs-6">
              Registered Crew Members Assigned to {vessel.name} ({linkedCrew.length} Seafarers)
            </div>
          </div>
          <div className="table-responsive">
            <table className="table map-table-custom align-middle mb-0">
              <thead>
                <tr>
                  <th>Seafarer Name</th>
                  <th>Rank / Position</th>
                  <th>Nationality</th>
                  <th>Assignment Status</th>
                  <th>STCW Score</th>
                  <th>Compliance Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {linkedCrew.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      No crew members currently registered for this vessel.
                    </td>
                  </tr>
                ) : (
                  linkedCrew.map((c) => (
                    <tr key={c.id}>
                      <td className="fw-semibold text-primary">
                        <button
                          type="button"
                          className="btn btn-link p-0 text-primary text-start fw-semibold text-decoration-underline border-0 bg-transparent align-baseline"
                          onClick={() => setCurrentHashView('crew', c.id)}
                          title={`View ${c.fullName} STCW seafarer dossier`}
                        >
                          {c.fullName}
                        </button>
                      </td>
                      <td>{c.rank}</td>
                      <td><span className="badge bg-light text-dark border">{c.nationality}</span></td>
                      <td>
                        <span className={`badge ${c.currentVesselId === vessel.id ? 'bg-success text-white' : 'bg-secondary text-white'}`}>
                          {c.currentVesselId === vessel.id ? 'Current Assignment' : 'Historical Assignment'}
                        </span>
                      </td>
                      <td className="font-mono-code fw-semibold">{c.overallComplianceScore}%</td>
                      <td>
                        <span className={`badge ${c.complianceStatus === 'Fully Compliant' ? 'bg-success text-white' : c.complianceStatus === 'Expiring < 60 Days' ? 'bg-warning text-dark' : 'bg-danger text-white'}`}>
                          {c.complianceStatus}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary py-1 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setCurrentHashView('crew', c.id)}
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
      )}

      {/* Tab 6: Audit Trail */}
      {activeTab === 'audit' && isAdmin && (
        <div className="card map-card-custom">
          <div className="card-header fw-bold">Tamper-Evident Asset Audit Trail (BR-2)</div>
          <div className="card-body p-3">
            {linkedAudits.length === 0 ? (
              <div className="text-muted text-center py-3">No specific audit entries logged for this asset.</div>
            ) : (
              <div className="d-flex flex-column gap-2">
                {linkedAudits.map((event) => (
                  <div key={event.id} className="p-2 border rounded bg-light small font-mono-code d-flex justify-between">
                    <div>
                      <strong className="text-primary">[{event.action}]</strong> {event.justificationNotes}
                      <div className="text-muted mt-1" style={{ fontSize: '11px' }}>
                        User: {event.userId} | Role: {event.userRole} | Org: {event.organization}
                      </div>
                    </div>
                    <span className="text-muted" style={{ fontSize: '11px' }}>
                      {new Date(event.timestampUtc).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Physical Inspections & CAPA Tracker */}
      {activeTab === 'inspections' && (
        <div className="d-flex flex-column gap-4">
          {/* Section 1: Physical Inspection Reports */}
          <div className="card map-card-custom">
            <div className="card-header d-flex flex-wrap align-items-center justify-between p-3 gap-2">
              <div>
                <span className="fw-bold text-primary m-0" style={{ fontSize: '0.95rem' }}>
                  Physical Vessel Inspections & Audit Logs
                </span>
                <div className="text-secondary small">
                  Inspection records, finding notes, supporting evidence, and CAPAs logged for {vessel.name}
                </div>
              </div>
            </div>
            <div className="card-body p-3">
              {linkedSets.length === 0 ? (
                <div className="text-muted text-center py-4">No physical inspection campaigns recorded for this vessel yet.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {linkedSets.map((s) => (
                    <div key={s.id} className="p-3.5 border rounded-3 bg-white shadow-2xs">
                      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold text-dark font-mono-code" style={{ fontSize: '0.95rem' }}>
                            Visual Vessel Inspection & Safety Audit
                          </span>
                          <span className="badge bg-primary-subtle text-primary border" style={{ fontSize: '0.7rem' }}>
                            {s.id}
                          </span>
                        </div>
                        <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle font-mono-code" style={{ fontSize: '0.75rem' }}>
                          Completed
                        </span>
                      </div>

                      <div className="row g-3 my-1 p-2.5 bg-light rounded-2 font-mono-code small">
                        <div className="col-md-4">
                          <span className="text-secondary d-block" style={{ fontSize: '0.725rem' }}>Assigned Inspector:</span>
                          <strong className="text-dark">{s.assignedInspector || 'N. Technical (AMSA Marine Audit Division)'}</strong>
                        </div>
                        <div className="col-md-4">
                          <span className="text-secondary d-block" style={{ fontSize: '0.725rem' }}>Inspection Date & Location:</span>
                          <strong className="text-dark">14 Oct 2026 · Dampier Port Facility</strong>
                        </div>
                        <div className="col-md-4">
                          <span className="text-secondary d-block" style={{ fontSize: '0.725rem' }}>Charterer / Client:</span>
                          <strong className="text-dark">{s.initiatorOrg || 'Southern Basin Energy Pty Ltd'}</strong>
                        </div>
                      </div>

                      <div className="d-flex flex-wrap align-items-center justify-between gap-3 mt-3 pt-2 border-top">
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                          <span className="badge bg-success text-white font-mono-code">12 Satisfactory</span>
                          <span className="badge bg-info text-white font-mono-code">2 Observations</span>
                          <span className="badge bg-danger text-white font-mono-code">1 Deficiency</span>
                          <span className="badge bg-warning text-dark font-mono-code">CAPA-118 Linked</span>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary d-flex align-items-center gap-1.5"
                          style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                          onClick={() => setCurrentHashView('inspection', vessel.name)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Vessel Corrective Actions (CAPA) Queue */}
          <div className="card map-card-custom">
            <div className="card-header d-flex align-items-center justify-between p-3">
              <div>
                <span className="fw-bold text-primary m-0" style={{ fontSize: '0.95rem' }}>
                  Corrective Action Plans (CAPA) for {vessel.name} ({linkedCapas.length})
                </span>
                <div className="text-secondary small">
                  Action items and re-inspection records logged for findings on this vessel
                </div>
              </div>
            </div>
            <div className="card-body p-3">
              {linkedCapas.length === 0 ? (
                <div className="text-muted text-center py-4">No open or recorded CAPA items for this vessel.</div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {linkedCapas.map((c) => (
                    <div key={c.id} className="p-3 border rounded-3 bg-white shadow-2xs">
                      <div className="d-flex flex-wrap align-items-center justify-between gap-2 mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-warning text-dark font-mono-code">{c.id}</span>
                          <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>{c.title}</span>
                          {c.flaggedForReinspection && (
                            <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle font-mono-code" style={{ fontSize: '0.7rem' }}>
                              Flagged for Re-Inspection
                            </span>
                          )}
                        </div>
                        <span className={`badge ${c.status === 'Verified & Closed' ? 'bg-success text-white' : c.status === 'Under Re-Inspection' ? 'bg-warning text-dark' : 'bg-danger text-white'} font-mono-code`}>
                          {c.status}
                        </span>
                      </div>
                      <div className="small text-secondary mb-2" style={{ fontSize: '0.775rem' }}>
                        Finding: {c.findingDescription}
                      </div>
                      <div className="d-flex flex-wrap align-items-center justify-between gap-2 pt-2 border-top small font-mono-code">
                        <div>Owner: <strong className="text-dark">{c.owner}</strong> | Due: <strong className="text-dark">{c.dueDate}</strong></div>
                        <button
                          type="button"
                          className="btn btn-xs btn-outline-secondary font-mono-code"
                          style={{ fontSize: '0.725rem' }}
                          onClick={() => setSelectedCapaForDrawer(c)}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inline CAPA Re-Inspection Drawer Overlay for Physical Inspections Page */}
      {selectedCapaForDrawer && (
        <CapaReinspectionDrawer
          capa={selectedCapaForDrawer}
          onClose={() => setSelectedCapaForDrawer(null)}
        />
      )}
    </div>
  );
};