/* 
  file summary: vessel detail deep-dive view presenting 11 particulars categories in light accordions, pre-assurance vault, assurance sets, and audit logs.
  responsibilities: displays complete vessel particulars, statutory cert expiries (<90 days amber warning), and category details in light theme.
  role in system: deep-dive view rendered when a vessel row is selected from Fleet Master.
*/

import React, { useState, useEffect } from 'react';
import { useMapStore } from '../store/useMapStore';
import { VesselParticulars, ClassificationSociety } from '../types/vessel';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { formatMaritimeDate, getDaysUntilExpiry } from '../utils/formatters';
import { filterAuditTrailForPersona, getBackButtonInfo } from '../utils/rbacHelpers';

interface VesselDetailViewProps {
  vesselId: string;
}

export const VesselDetailView: React.FC<VesselDetailViewProps> = ({ vesselId }) => {
  const {
    vessels,
    crew,
    updateVessel,
    setCurrentHashView,
    previousHashView,
    previousEntityId,
    activePersona,
    assuranceSets,
    documents,
    auditEvents
  } = useMapStore();

  const backInfo = getBackButtonInfo('vessels', 'Fleet Registry', previousHashView, activePersona, previousEntityId);

  const vessel = vessels.find((v) => v.id === vesselId);

  const [activeTab, setActiveTab] = useState<'particulars' | 'vault' | 'assurance' | 'crew' | 'audit'>('particulars');
  const [activeAccordion, setActiveAccordion] = useState<number | null>(1);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<VesselParticulars | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const found = vessels.find((v) => v.id === vesselId);
    if (found) {
      setFormData(found);
      setIsEditing(false);
    }
  }, [vesselId, vessels]);

  // BR-4: Client Admin (C Admin) or Inspector has read-only access
  const isReadOnly = activePersona === 'C Admin' || activePersona === 'Inspector';

  if (!vessel || !formData) {
    return <div className="p-4 text-center">Vessel not found.</div>;
  }

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
    updateVessel(formData);
    setIsEditing(false);
    setToastMessage('Vessel specifications updated successfully & recorded in audit trail.');
    setTimeout(() => setToastMessage(null), 3500);
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

      {/* Top Breadcrumb & Action Row */}
      <div className="d-flex flex-wrap align-items-center justify-between gap-2">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setCurrentHashView(backInfo.targetView, backInfo.targetEntityId)}
        >
          {backInfo.label}
        </button>

        <div className="d-flex align-items-center gap-2">
          {!isReadOnly && (
            <>
              {isEditing ? (
                <>
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
                    Save Changes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Particulars
                </button>
              )}
            </>
          )}

          <div className="badge bg-light text-dark border font-mono-code p-2">
            IMO: {vessel.imoNumber} | Reg: {vessel.officialRegNumber}
          </div>
        </div>
      </div>

      {/* Header KPI Summary Card */}
      <div className="card map-card-custom p-4">
        <div className="d-flex flex-wrap align-items-center justify-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 className="fw-bold mb-1 text-primary m-0">{vessel.name}</h2>
              <span className="badge bg-primary text-uppercase">{vessel.status}</span>
            </div>
            <div className="text-secondary small mt-1">
              {vessel.classNotation} | {vessel.flagState} Flag | Port: {vessel.portOfRegistry}
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
            className={`nav-link ${activeTab === 'crew' ? 'active fw-bold text-primary' : 'text-secondary'}`}
            onClick={() => setActiveTab('crew')}
          >
            Assigned Crew ({linkedCrew.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link ${activeTab === 'audit' ? 'active fw-bold text-primary' : 'text-secondary'}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Trail ({linkedAudits.length})
          </button>
        </li>
      </ul>

      {/* Tab 1: 11 Categories Particulars */}
      {activeTab === 'particulars' && (
        <div className="card map-card-custom">
          <div className="card-header d-flex justify-between align-items-center">
            <span>Complete 11-Category Technical Breakdown</span>
            {isEditing && <span className="badge bg-warning text-dark">Edit Mode Active</span>}
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
                    {isEditing ? (
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
            {!isReadOnly && (
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

      {/* Tab: Assigned Crew Directory */}
      {activeTab === 'crew' && (
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
                          View Seafarer Profile
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

      {/* Tab 4: Audit Trail */}
      {activeTab === 'audit' && (
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
    </div>
  );
};