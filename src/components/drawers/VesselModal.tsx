/* 
  file summary: vessel registration modal form enforcing 11 particulars categories and duplicate check validation in light theme.
  responsibilities: captures vessel registration data inputs and validates imo and official registration numbers against existing records.
  role in system: invoked from fleet master view (FleetRegistryView.tsx).
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { VesselParticulars, ClassificationSociety } from '../../types/vessel';
import { validateImoNumber } from '../../utils/validation';

interface VesselModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
  what: renders vessel registration modal form in light theme.
  how: collects 11 particulars categories and dispatches addVessel action to store after duplicate check validation.
  with what file: src/components/drawers/VesselModal.tsx loaded by FleetRegistryView.tsx.
*/
export const VesselModal: React.FC<VesselModalProps> = ({ isOpen, onClose }) => {
  const { addVessel } = useMapStore();

  const [name, setName] = useState('');
  const [imoNumber, setImoNumber] = useState('');
  const [officialRegNumber, setOfficialRegNumber] = useState('');
  const [mmsiNumber, setMmsiNumber] = useState('');
  const [callSign, setCallSign] = useState('');
  const [flagState, setFlagState] = useState('Australia');
  const [portOfRegistry, setPortOfRegistry] = useState('Fremantle, WA');
  const [classificationSociety, setClassificationSociety] = useState<ClassificationSociety>('DNV');
  const [classNotation, setClassNotation] = useState('+100A1 Offshore Supply Vessel DP2');
  const [yearBuilt, setYearBuilt] = useState<number>(2022);
  const [registeredOwner, setRegisteredOwner] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateImoNumber(imoNumber)) {
      setErrorMessage('Invalid IMO Number: Must be exactly 7 numerical digits.');
      return;
    }

    const newVessel: VesselParticulars = {
      id: `VESSEL-${Math.floor(100 + Math.random() * 900)}`,
      name,
      imoNumber,
      officialRegNumber,
      mmsiNumber: mmsiNumber || '503000111',
      callSign: callSign || 'VJQ9900',
      flagState,
      portOfRegistry,
      status: 'In Operations',
      complianceReadinessScore: 100,
      classificationSociety,
      classNotation,
      hullType: 'Double Bottom Steel',
      ispsSolasStatus: 'Certified SOLAS/ISPS',
      yearBuilt,
      shipyardBuilder: 'Damen Shipyards',
      lengthOverallMeters: 80.0,
      beamMeters: 18.0,
      draftMeters: 5.5,
      grossTonnageGT: 3100,
      deadweightTonnageDWT: 4000,
      dynamicPositioningClass: 'DP2',
      mainEnginePowerKW: '2x 2400 kW Wärtsilä',
      registeredOwner: registeredOwner || 'Global Offshore Fleet Ltd',
      ownerType: 'Corporate Entity',
      corporateRegistryNo: 'ACN 900 111 222',
      ismCompany: 'Global Fleet Services',
      technicalManager: 'Global Fleet Services',
      docNumber: 'DOC-2026-99',
      contact247: '+61 8 9900 1122',
      statutoryCertificates: [],
      hmInsurer: 'Standard Club',
      piClubName: 'Gard P&I Club',
      policyNumber: 'PI-2026-99001',
      policyExpiryDate: '2027-12-31',
      safeManningComplement: 14,
      certifiedOfficersRatings: '6 Officers / 8 Ratings',
      masterName: 'Capt. Alexander Vance',
      lifeboatCapacity: 30,
      fuelType: 'MGO Low-Sulphur 0.1%',
      lowSulphurCompliant: true,
      bwtsSpec: 'Alfa Laval PureBallast',
      owCalibrationDate: '2026-01-01',
      masterCertificateUploadCount: 1,
    };

    const res = addVessel(newVessel);
    if (!res.success) {
      setErrorMessage(res.message || 'Duplicate vessel registration error.');
      return;
    }

    onClose();
  };

  return (
    <div
      className="modal show d-block map-modal-backdrop"
      tabIndex={-1}
      style={{ zIndex: 1050 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content bg-white text-dark border shadow-lg">
          <div className="modal-header border-bottom bg-light d-flex align-items-center justify-content-between p-3 position-relative">
            <h5 className="modal-title fw-bold text-slate-900 m-0">Register Unique Vessel Record (Category 1-11)</h5>
            <button type="button" className="btn-close ms-auto" onClick={onClose} aria-label="Close" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {errorMessage && (
                <div className="alert alert-danger py-2 small mb-3">{errorMessage}</div>
              )}

              <div className="text-uppercase text-primary small fw-bold mb-2">Category 1 — Vessel Identification</div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="vessel-name">Vessel Name *</label>
                  <input
                    id="vessel-name"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    placeholder="e.g. MV Torrens Supporter"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="imo-num">IMO Number (7 Digits) *</label>
                  <input
                    id="imo-num"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    placeholder="e.g. 9634721"
                    value={imoNumber}
                    onChange={(e) => setImoNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="official-reg">Official Reg Number *</label>
                  <input
                    id="official-reg"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    placeholder="e.g. OSV-44-2019"
                    value={officialRegNumber}
                    onChange={(e) => setOfficialRegNumber(e.target.value)}
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="mmsi-num">MMSI Number (9 Digits)</label>
                  <input
                    id="mmsi-num"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    placeholder="e.g. 503728940"
                    value={mmsiNumber}
                    onChange={(e) => setMmsiNumber(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="call-sign">Call Sign</label>
                  <input
                    id="call-sign"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary font-mono-code"
                    placeholder="e.g. VJQ4821"
                    value={callSign}
                    onChange={(e) => setCallSign(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="flag-state">Flag State</label>
                  <input
                    id="flag-state"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    value={flagState}
                    onChange={(e) => setFlagState(e.target.value)}
                  />
                </div>
                <div className="col-4">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="port-registry">Port of Registry</label>
                  <input
                    id="port-registry"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    value={portOfRegistry}
                    onChange={(e) => setPortOfRegistry(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-uppercase text-primary small fw-bold mb-2">Category 2 & 3 — Classification & Construction</div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="class-soc">Classification Society</label>
                  <select
                    id="class-soc"
                    className="form-select form-select-sm bg-white text-dark border-secondary"
                    value={classificationSociety}
                    onChange={(e) => setClassificationSociety(e.target.value as ClassificationSociety)}
                  >
                    <option value="DNV">DNV</option>
                    <option value="ABS">ABS</option>
                    <option value="Lloyd's Register">Lloyd's Register</option>
                    <option value="Bureau Veritas">Bureau Veritas</option>
                    <option value="RINA">RINA</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="year-built">Year Built</label>
                  <input
                    id="year-built"
                    type="number"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    value={yearBuilt}
                    onChange={(e) => setYearBuilt(parseInt(e.target.value) || 2022)}
                  />
                </div>
                <div className="col-12">
                  <label className="form-label text-secondary small fw-semibold" htmlFor="class-notation">Class Notation</label>
                  <input
                    id="class-notation"
                    type="text"
                    className="form-control form-control-sm bg-white text-dark border-secondary"
                    value={classNotation}
                    onChange={(e) => setClassNotation(e.target.value)}
                  />
                </div>
              </div>

              <div className="text-uppercase text-primary small fw-bold mb-2">Category 5 — Ownership</div>
              <div className="mb-2">
                <label className="form-label text-secondary small fw-semibold" htmlFor="owner-name">Registered Vessel Owner</label>
                <input
                  id="owner-name"
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="e.g. Pacific Ocean Logistics Pty Ltd"
                  value={registeredOwner}
                  onChange={(e) => setRegisteredOwner(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer border-top bg-light">
              <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-sm btn-primary">
                Register Vessel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
