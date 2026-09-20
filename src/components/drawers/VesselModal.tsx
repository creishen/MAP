/* 
  file summary: comprehensive vessel registration wizard matching UI Screen 2 (UC-02) and all 11 BRD categories.
  responsibilities: captures full maritime specification across a 4-step wizard with validation and store dispatch.
  role in system: invoked from fleet master view (FleetRegistryView.tsx) when clicking "+ Register Vessel".
*/

import React, { useState } from 'react';
import { useMapStore } from '../../store/useMapStore';
import { VesselParticulars, ClassificationSociety } from '../../types/vessel';
import { validateImoNumber } from '../../utils/validation';

interface VesselModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered?: (vesselId: string) => void;
}

export const VesselModal: React.FC<VesselModalProps> = ({ isOpen, onClose, onRegistered }) => {
  const { addVessel } = useMapStore();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Vessel Identification
  const [name, setName] = useState('');
  const [previousNames, setPreviousNames] = useState('');
  const [proposedName, setProposedName] = useState('');
  const [imoNumber, setImoNumber] = useState('');
  const [officialRegNumber, setOfficialRegNumber] = useState('');
  const [mmsiNumber, setMmsiNumber] = useState('');
  const [callSign, setCallSign] = useState('');
  const [flagState, setFlagState] = useState('Australia');
  const [portOfRegistry, setPortOfRegistry] = useState('Fremantle, WA');
  const [vesselRegStatus, setVesselRegStatus] = useState<VesselParticulars['status']>('In Operations');
  const [hullIdSmallCraft, setHullIdSmallCraft] = useState('');

  // 2. Vessel Classification
  const [vesselType, setVesselType] = useState('Offshore Support Vessel (OSV)');
  const [vesselSubtype, setVesselSubtype] = useState('AHTS / PSV');
  const [intendedUse, setIntendedUse] = useState('Offshore Supply & Towing');
  const [tradingArea, setTradingArea] = useState('International');
  const [classificationSociety, setClassificationSociety] = useState<ClassificationSociety>('DNV');
  const [classNotation, setClassNotation] = useState('+100A1 Offshore Support Vessel DP2');
  const [classStatus, setClassStatus] = useState('Active / Full Class');
  const [solasMarpolApplicable, setSolasMarpolApplicable] = useState(true);

  // 3. Construction Details
  const [shipyardBuilder, setShipyardBuilder] = useState('');
  const [constructionCountry, setConstructionCountry] = useState('Netherlands');
  const [hullNumber, setHullNumber] = useState('');
  const [yearBuilt, setYearBuilt] = useState<number>(2023);
  const [hullType, setHullType] = useState('Double Hull / Double Bottom Steel');
  const [isNewBuild, setIsNewBuild] = useState('Existing Vessel');
  const [loa, setLoa] = useState<number>(84.5);
  const [beam, setBeam] = useState<number>(18.0);
  const [draft, setDraft] = useState<number>(5.8);
  const [gt, setGt] = useState<number>(3400);
  const [dwt, setDwt] = useState<number>(4200);

  // 4 & 5. Ownership, Operators & Management
  const [registeredOwner, setRegisteredOwner] = useState('');
  const [ownerType, setOwnerType] = useState('Corporate Entity');
  const [corporateRegNo, setCorporateRegNo] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [ismCompany, setIsmCompany] = useState('');
  const [technicalManager, setTechnicalManager] = useState('');
  const [commercialManager, setCommercialManager] = useState('');
  const [docNumber, setDocNumber] = useState('');
  const [contact247, setContact247] = useState('');

  // 6. Purchase & Title
  const [methodOfAcquisition, setMethodOfAcquisition] = useState('Outright Purchase');
  const [mortgageStatus, setMortgageStatus] = useState('Free from Encumbrance');

  // 8. Insurance & Security
  const [hmInsurer, setHmInsurer] = useState('Gard Marine Underwriters');
  const [piClubName, setPiClubName] = useState('Gard P&I Club');
  const [policyNumber, setPolicyNumber] = useState('PI-2026-9041');
  const [policyExpiryDate, setPolicyExpiryDate] = useState('2027-02-20');

  // 9. Crew & Safety Particulars
  const [safeManningComplement, setSafeManningComplement] = useState<number>(14);
  const [maxCrewCapacity, setMaxCrewCapacity] = useState<number>(28);
  const [masterName, setMasterName] = useState('');
  const [lifeboatCapacity, setLifeboatCapacity] = useState<number>(30);

  // 10. Environmental Information
  const [fuelType, setFuelType] = useState('MGO Low-Sulphur 0.1%');
  const [bwtsSpec, setBwtsSpec] = useState('Alfa Laval PureBallast 3.2');
  const [registrationDocName, setRegistrationDocName] = useState('');
  const [classCertDocName, setClassCertDocName] = useState('');
  const [uploadNotice, setUploadNotice] = useState('');

  if (!isOpen) return null;

  const validateCurrentStep = () => {
    setErrorMessage('');
    if (currentStep === 1) {
      if (!name.trim()) {
        setErrorMessage('Vessel Name is mandatory.');
        return false;
      }
      if (!validateImoNumber(imoNumber)) {
        setErrorMessage('IMO Number must be exactly 7 digits (e.g. 9123456).');
        return false;
      }
      if (!officialRegNumber.trim()) {
        setErrorMessage('Official Registration Number is mandatory.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!registeredOwner.trim()) {
        setErrorMessage('Registered Owner Name is required.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setErrorMessage('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    const newVessel: VesselParticulars = {
      id: `VESSEL-${Math.floor(100 + Math.random() * 900)}`,
      name,
      previousNames: previousNames || undefined,
      imoNumber,
      officialRegNumber,
      mmsiNumber: mmsiNumber || '503998124',
      callSign: callSign || 'VJQ8821',
      flagState,
      portOfRegistry,
      status: vesselRegStatus,
      complianceReadinessScore: registrationDocName || classCertDocName ? 92 : 85,
      vesselType,
      vesselSubtype,
      intendedUse,
      tradingArea,
      classificationSociety,
      classNotation,
      hullType,
      ispsSolasStatus: solasMarpolApplicable ? 'Certified SOLAS / ISPS' : 'Exempt',
      yearBuilt,
      shipyardBuilder: shipyardBuilder || 'Damen Shipyards',
      lengthOverallMeters: loa,
      beamMeters: beam,
      draftMeters: draft,
      grossTonnageGT: gt,
      deadweightTonnageDWT: dwt,
      dynamicPositioningClass: 'DP2 (Kongsberg)',
      mainEnginePowerKW: '2x 2600 kW Wärtsilä',
      registeredOwner,
      ownerType,
      corporateRegistryNo: corporateRegNo || 'ACN 912 345 678',
      ismCompany: ismCompany || registeredOwner,
      technicalManager: technicalManager || registeredOwner,
      docNumber: docNumber || 'DOC-DNV-2026-01',
      contact247: contact247 || '+61 8 9222 3344',
      statutoryCertificates: [
        {
          id: `SC-${Math.floor(100 + Math.random() * 900)}`,
          name: 'Certificate of Class',
          certificateNumber: `${classificationSociety}-STAT-${yearBuilt}-01`,
          issuingBody: classificationSociety,
          issueDate: '2024-01-15',
          expiryDate: '2029-01-14',
          status: 'Valid',
        },
      ],
      hmInsurer,
      piClubName,
      policyNumber,
      policyExpiryDate,
      safeManningComplement,
      certifiedOfficersRatings: '6 Officers / 8 Ratings',
      masterName: masterName || 'Capt. Andrew Fraser',
      lifeboatCapacity,
      fuelType,
      lowSulphurCompliant: true,
      bwtsSpec,
      owCalibrationDate: '2026-01-10',
      masterCertificateUploadCount: (registrationDocName ? 1 : 0) + (classCertDocName ? 1 : 0),
      clientHistory: [],
    };

    const res = addVessel(newVessel);
    if (!res.success) {
      setErrorMessage(res.message || 'Error registering vessel.');
      return;
    }

    onClose();
    if (res.vesselId && onRegistered) {
      onRegistered(res.vesselId);
    }
  };

  const handleMockFileSelect = (file: File | undefined, type: 'registration' | 'class') => {
    if (!file) return;
    if (type === 'registration') {
      setRegistrationDocName(file.name);
    } else {
      setClassCertDocName(file.name);
    }
    setUploadNotice(`${file.name} queued for Pre-Assurance Vault (mock upload).`);
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
      <div className="modal-dialog modal-xl modal-dialog-centered">
        <div className="modal-content bg-white text-dark border shadow-lg">
          {/* Header */}
          <div className="modal-header border-bottom bg-light d-flex align-items-center justify-content-between p-3">
            <div>
              <h5 className="modal-title fw-bold text-dark m-0">
                Register Unique Vessel (UC-02 - UI Screen 2)
              </h5>
              <div className="text-secondary small">
                Complete all 11 statutory categories for offshore compliance onboarding
              </div>
            </div>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>

          {/* Step Progress Bar */}
          <div className="bg-light px-4 py-2 border-bottom">
            <div className="d-flex justify-between small text-secondary fw-semibold">
              <span className={currentStep === 1 ? 'text-primary fw-bold' : ''}>
                1. Identification & Class (Cat 1-2)
              </span>
              <span className={currentStep === 2 ? 'text-primary fw-bold' : ''}>
                2. Construction & Ownership (Cat 3-6)
              </span>
              <span className={currentStep === 3 ? 'text-primary fw-bold' : ''}>
                3. Safety, Crew & Insurance (Cat 8-10)
              </span>
              <span className={currentStep === 4 ? 'text-primary fw-bold' : ''}>
                4. Statutory Certs & Uploads (Cat 7 & 11)
              </span>
            </div>
            <div className="progress mt-2" style={{ height: '5px' }}>
              <div
                className="progress-bar bg-primary"
                role="progressbar"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: '68vh' }}>
              {errorMessage && (
                <div className="alert alert-danger py-2 small mb-3">{errorMessage}</div>
              )}

              {/* STEP 1: Identification & Classification */}
              {currentStep === 1 && (
                <div className="d-flex flex-column gap-3">
                  <div className="text-uppercase text-primary small fw-bold">
                    Section 1: Vessel Identification
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Vessel Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. MV Pacific Supporter"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Previous Name(s)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="None or previous names"
                        value={previousNames}
                        onChange={(e) => setPreviousNames(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Proposed Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={proposedName}
                        onChange={(e) => setProposedName(e.target.value)}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">IMO Number (7 Digits) *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-mono-code"
                        placeholder="e.g. 9481234"
                        value={imoNumber}
                        onChange={(e) => setImoNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Official Reg Number *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-mono-code"
                        placeholder="e.g. OSV-99-2023"
                        value={officialRegNumber}
                        onChange={(e) => setOfficialRegNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">MMSI Number (9 Digits)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-mono-code"
                        placeholder="e.g. 503889120"
                        value={mmsiNumber}
                        onChange={(e) => setMmsiNumber(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Radio Call Sign</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-mono-code"
                        placeholder="e.g. VJQ5511"
                        value={callSign}
                        onChange={(e) => setCallSign(e.target.value)}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Flag State / Country</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={flagState}
                        onChange={(e) => setFlagState(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Port of Registry</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={portOfRegistry}
                        onChange={(e) => setPortOfRegistry(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Registration Status</label>
                      <select
                        className="form-select form-select-sm"
                        value={vesselRegStatus}
                        onChange={(e) => setVesselRegStatus(e.target.value as VesselParticulars['status'])}
                      >
                        <option value="In Operations">In Operations</option>
                        <option value="Under Charter">Under Charter</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Port Stay">Port Stay</option>
                        <option value="Dry Docking">Dry Docking</option>
                        <option value="Lay-up">Lay-up</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-uppercase text-primary small fw-bold mt-3">
                    Section 2: Vessel Classification & Notations
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Vessel Type</label>
                      <input
                        type="text"
                        className="form-control form-control-sm bg-light"
                        value={vesselType}
                        readOnly
                        title="MVP scope: Offshore Support Vessel (OSV) only"
                      />
                      <div className="form-text">MVP scope: OSV only</div>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Vessel Subtype</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. AHTS, PSV, Crew Boat"
                        value={vesselSubtype}
                        onChange={(e) => setVesselSubtype(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Classification Society</label>
                      <select
                        className="form-select form-select-sm"
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

                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Class Notation</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-mono-code"
                        value={classNotation}
                        onChange={(e) => setClassNotation(e.target.value)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Trading Area</label>
                      <select
                        className="form-select form-select-sm"
                        value={tradingArea}
                        onChange={(e) => setTradingArea(e.target.value)}
                      >
                        <option value="International">International</option>
                        <option value="Domestic / Coastal">Domestic / Coastal</option>
                        <option value="Harbour / Port Limits">Harbour / Port Limits</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">SOLAS / MARPOL</label>
                      <select
                        className="form-select form-select-sm"
                        value={solasMarpolApplicable ? 'Yes' : 'No'}
                        onChange={(e) => setSolasMarpolApplicable(e.target.value === 'Yes')}
                      >
                        <option value="Yes">Applicable</option>
                        <option value="No">Exempt</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Construction, Ownership, Management & Title */}
              {currentStep === 2 && (
                <div className="d-flex flex-column gap-3">
                  <div className="text-uppercase text-primary small fw-bold">
                    Section 3: Construction & Dimensions
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Shipyard / Builder</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Damen Shipyards Group"
                        value={shipyardBuilder}
                        onChange={(e) => setShipyardBuilder(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Country of Construction</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={constructionCountry}
                        onChange={(e) => setConstructionCountry(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Year Built / Completed</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={yearBuilt}
                        onChange={(e) => setYearBuilt(parseInt(e.target.value) || 2023)}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">LOA (Meters)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control form-control-sm"
                        value={loa}
                        onChange={(e) => setLoa(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Beam (Meters)</label>
                      <input
                        type="number"
                        step="0.1"
                        className="form-control form-control-sm"
                        value={beam}
                        onChange={(e) => setBeam(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Gross Tonnage (GT)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={gt}
                        onChange={(e) => setGt(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Deadweight (DWT)</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={dwt}
                        onChange={(e) => setDwt(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div className="text-uppercase text-primary small fw-bold mt-3">
                    Section 4 & 5: Ownership, ISM & Operating Management
                  </div>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Registered Owner Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Pacific Ocean Logistics Pty Ltd"
                        value={registeredOwner}
                        onChange={(e) => setRegisteredOwner(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Owner Type</label>
                      <select
                        className="form-select form-select-sm"
                        value={ownerType}
                        onChange={(e) => setOwnerType(e.target.value)}
                      >
                        <option value="Corporate Entity">Company / Corporate</option>
                        <option value="Individual">Individual</option>
                        <option value="Government">Government / State</option>
                      </select>
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Company Reg / ACN</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-mono-code"
                        placeholder="e.g. ACN 894 123 765"
                        value={corporateRegNo}
                        onChange={(e) => setCorporateRegNo(e.target.value)}
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">ISM Management Company</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Ocean Fleet Management Ltd"
                        value={ismCompany}
                        onChange={(e) => setIsmCompany(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Technical Manager</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Pacific Ship Management"
                        value={technicalManager}
                        onChange={(e) => setTechnicalManager(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">DOC Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-mono-code"
                        placeholder="e.g. DOC-DNV-2024-88"
                        value={docNumber}
                        onChange={(e) => setDocNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="text-uppercase text-primary small fw-bold mt-3">
                    Section 6: Purchase & Title Encumbrance
                  </div>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Method of Acquisition</label>
                      <select
                        className="form-select form-select-sm"
                        value={methodOfAcquisition}
                        onChange={(e) => setMethodOfAcquisition(e.target.value)}
                      >
                        <option value="Outright Purchase">Outright Purchase</option>
                        <option value="New Build Delivery">New Build Delivery</option>
                        <option value="Bareboat Charter with Purchase Option">Bareboat Charter / Lease</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Mortgage / Encumbrance</label>
                      <select
                        className="form-select form-select-sm"
                        value={mortgageStatus}
                        onChange={(e) => setMortgageStatus(e.target.value)}
                      >
                        <option value="Free from Encumbrance">Free from Encumbrance (Clean Title)</option>
                        <option value="Mortgaged to Commercial Bank">Mortgaged / Bank Financing</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Insurance, Crew, Safety & Environmental */}
              {currentStep === 3 && (
                <div className="d-flex flex-column gap-3">
                  <div className="text-uppercase text-primary small fw-bold">
                    Section 8: Insurance & Financial Security
                  </div>
                  <div className="row g-2">
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Protection & Indemnity (P&I) Club</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={piClubName}
                        onChange={(e) => setPiClubName(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">P&I Policy Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm font-mono-code"
                        value={policyNumber}
                        onChange={(e) => setPolicyNumber(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label text-secondary small fw-semibold">Policy Expiry Date</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        value={policyExpiryDate}
                        onChange={(e) => setPolicyExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="text-uppercase text-primary small fw-bold mt-3">
                    Section 9: Crew & Safety Particulars
                  </div>
                  <div className="row g-2">
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Minimum Safe Manning</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={safeManningComplement}
                        onChange={(e) => setSafeManningComplement(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Max Crew / Berth Capacity</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={maxCrewCapacity}
                        onChange={(e) => setMaxCrewCapacity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Lifeboat Capacity</label>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={lifeboatCapacity}
                        onChange={(e) => setLifeboatCapacity(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label text-secondary small fw-semibold">Master's Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Capt. James Stirling"
                        value={masterName}
                        onChange={(e) => setMasterName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="text-uppercase text-primary small fw-bold mt-3">
                    Section 10: Environmental Information
                  </div>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Bunker Fuel Specification</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={fuelType}
                        onChange={(e) => setFuelType(e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-secondary small fw-semibold">Ballast Water Treatment System (BWTS)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={bwtsSpec}
                        onChange={(e) => setBwtsSpec(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Initial Statutory Certificates & File Attachments */}
              {currentStep === 4 && (
                <div className="d-flex flex-column gap-3">
                  <div className="text-uppercase text-primary small fw-bold">
                    Section 7 & 11: Statutory Certificates & Initial Files
                  </div>
                  <p className="text-secondary small mb-2">
                    Pre-attach foundational statutory certificates for immediate OCR extraction and compliance readiness scoring (BR-5).
                  </p>

                  <div className="border rounded p-3 bg-light map-vessel-upload-zone">
                    <div className="fw-semibold text-dark mb-1">Upload Registration Document / Builder's Certificate</div>
                    <div className="text-muted small mb-2">Supported formats: PDF, JPG, PNG (Max 15MB)</div>
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleMockFileSelect(e.target.files?.[0], 'registration')}
                    />
                    {registrationDocName && (
                      <div className="map-vessel-upload-success small mt-2">Selected: {registrationDocName}</div>
                    )}
                  </div>

                  <div className="border rounded p-3 bg-light map-vessel-upload-zone">
                    <div className="fw-semibold text-dark mb-1">Upload Certificate of Class / Registry</div>
                    <div className="text-muted small mb-2">Initial proof for automatic OCR confidence matching (&ge; 95%)</div>
                    <input
                      type="file"
                      className="form-control form-control-sm"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleMockFileSelect(e.target.files?.[0], 'class')}
                    />
                    {classCertDocName && (
                      <div className="map-vessel-upload-success small mt-2">Selected: {classCertDocName}</div>
                    )}
                  </div>

                  {uploadNotice && (
                    <div className="alert alert-success py-2 small mt-2 mb-0">{uploadNotice}</div>
                  )}

                  <div className="alert alert-info py-2 small mt-2">
                    <strong>Note:</strong> Additional statutory certificates (Safety Equipment, Load Line, IOPP) can be uploaded at any time in the <strong>Pre-Assurance Vault</strong> inside the vessel detail page.
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="modal-footer border-top bg-light d-flex justify-between">
              <div>
                <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>

              <div className="d-flex gap-2">
                {currentStep > 1 && (
                  <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handlePrevious}>
                    &larr; Back
                  </button>
                )}
                {currentStep < 4 ? (
                  <button type="button" className="btn btn-sm btn-primary" onClick={handleNext}>
                    Next Step &rarr;
                  </button>
                ) : (
                  <button type="submit" className="btn btn-sm btn-success">
                    Confirm & Complete Registration
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};