/* 
  file summary: vessel detail deep-dive view presenting 11 particulars categories in light accordions and statutory certificates sub-table.
  responsibilities: displays complete vessel particulars, statutory cert expiries (<90 days amber warning), and category details in light theme.
  role in system: deep-dive view rendered when a vessel row is selected from Fleet Master.
*/

import React, { useState } from 'react';
import { useMapStore } from '../store/useMapStore';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { formatMaritimeDate, getDaysUntilExpiry } from '../utils/formatters';

interface VesselDetailViewProps {
  vesselId: string;
}

/**
  what: renders deep-dive details view for a specific vessel in light theme.
  how: fetches vessel particulars from store by vesselId and renders 11 categories in collapsible accordions.
  with what file: src/views/VesselDetailView.tsx loaded by App.tsx.
*/
export const VesselDetailView: React.FC<VesselDetailViewProps> = ({ vesselId }) => {
  const { vessels, setCurrentHashView } = useMapStore();
  const [activeAccordion, setActiveAccordion] = useState<number | null>(1);

  const vessel = vessels.find((v) => v.id === vesselId) || vessels[0];

  if (!vessel) return <div>Vessel not found.</div>;

  const toggleAccordion = (index: number) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <div className="d-flex flex-column gap-4">
      {/* Top Navigation & Header */}
      <div className="d-flex align-items-center justify-between">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setCurrentHashView('vessels')}
        >
          ← Back to Fleet Registry
        </button>
        <div className="badge bg-light text-dark border font-mono-code p-2">
          IMO: {vessel.imoNumber} | Reg: {vessel.officialRegNumber}
        </div>
      </div>

      {/* Header KPI Summary Card */}
      <div className="card map-card-custom p-4">
        <div className="d-flex flex-wrap align-items-center justify-between gap-3">
          <div>
            <h2 className="fw-bold mb-1 text-primary">{vessel.name}</h2>
            <div className="text-secondary small">
              {vessel.classNotation} | {vessel.flagState} Flag | Port: {vessel.portOfRegistry}
            </div>
          </div>
          <div className="d-flex align-items-center gap-4">
            <div>
              <div className="text-secondary small text-uppercase font-weight-bold">Operating Status</div>
              <span className="badge bg-primary text-uppercase mt-1">{vessel.status}</span>
            </div>
            <div>
              <div className="text-secondary small text-uppercase font-weight-bold">Compliance Index</div>
              <div className="mt-1">
                <ReadinessGauge score={vessel.complianceReadinessScore} size="md" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Table of Active Statutory Certificates */}
      <div className="card map-card-custom">
        <div className="card-header">Statutory Certificates & Expiry Warnings</div>
        <div className="table-responsive">
          <table className="table map-table-custom align-middle mb-0">
            <thead>
              <tr>
                <th>Certificate Name</th>
                <th>Certificate Number</th>
                <th>Issuing Body</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>Status / Warning</th>
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
                    <td className="font-mono-code small">{formatMaritimeDate(cert.issueDate)}</td>
                    <td className="font-mono-code small">{formatMaritimeDate(cert.expiryDate)}</td>
                    <td>
                      <span className={`badge ${badgeClass}`}>{warningLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 11 Particulars Categories Accordions */}
      <div className="card map-card-custom">
        <div className="card-header">Complete 11 Category Particulars Breakdown</div>
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
                  <span className="text-secondary">Vessel Name:</span> <strong className="text-dark">{vessel.name}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">IMO Number:</span> <strong className="font-mono-code text-dark">{vessel.imoNumber}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Official Reg #:</span> <strong className="font-mono-code text-dark">{vessel.officialRegNumber}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">MMSI:</span> <strong className="font-mono-code text-dark">{vessel.mmsiNumber}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Call Sign:</span> <strong className="font-mono-code text-dark">{vessel.callSign}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Flag / Port:</span> <strong className="text-dark">{vessel.flagState} ({vessel.portOfRegistry})</strong>
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
                  <span className="text-secondary">Class Society:</span> <strong className="text-dark">{vessel.classificationSociety}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Class Notation:</span> <strong className="text-dark">{vessel.classNotation}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Hull Type:</span> <strong className="text-dark">{vessel.hullType}</strong>
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
                  <span className="text-secondary">Year Built:</span> <strong className="text-dark">{vessel.yearBuilt}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Shipyard:</span> <strong className="text-dark">{vessel.shipyardBuilder}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">LOA x Beam x Draft:</span> <strong className="text-dark">{vessel.lengthOverallMeters}m x {vessel.beamMeters}m x {vessel.draftMeters}m</strong>
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
                  <span className="text-secondary">Gross Tonnage (GT):</span> <strong className="text-dark">{vessel.grossTonnageGT} GT</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Deadweight (DWT):</span> <strong className="text-dark">{vessel.deadweightTonnageDWT} DWT</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">DP Class:</span> <strong className="text-dark">{vessel.dynamicPositioningClass}</strong>
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
                  <span className="text-secondary">Registered Owner:</span> <strong className="text-dark">{vessel.registeredOwner}</strong>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary">Technical Manager:</span> <strong className="text-dark">{vessel.technicalManager}</strong>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary">DOC Number:</span> <strong className="font-mono-code text-dark">{vessel.docNumber}</strong>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary">24/7 Contact:</span> <strong className="text-dark">{vessel.contact247}</strong>
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
                  <span className="text-secondary">P&I Club:</span> <strong className="text-dark">{vessel.piClubName}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Policy #:</span> <strong className="font-mono-code text-dark">{vessel.policyNumber}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Master's Name:</span> <strong className="text-dark">{vessel.masterName}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Safe Manning Count:</span> <strong className="text-dark">{vessel.safeManningComplement} Crew</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-secondary">Lifeboat Capacity:</span> <strong className="text-dark">{vessel.lifeboatCapacity} Persons</strong>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
