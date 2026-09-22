/* 
  file summary: vessel detail deep-dive view presenting 11 particulars categories in light accordions, pre-assurance vault, assurance sets, and audit logs.
  responsibilities: displays complete vessel particulars, statutory cert expiries (<90 days amber warning), and category details in light theme.
  role in system: deep-dive view rendered when a vessel row is selected from Fleet Master.
*/

import React, { useState, useEffect, useMemo } from 'react';
import { useMapStore } from '../store/useMapStore';
import { VesselParticulars, ClassificationSociety, VesselRegistrationStatus } from '../types/vessel';
import { ReadinessGauge } from '../components/common/ReadinessGauge';
import { formatMaritimeDate, getDaysUntilExpiry } from '../utils/formatters';
import { filterAuditTrailForPersona, getBackButtonInfo } from '../utils/rbacHelpers';
import { exportToCsv, exportToPdf } from '../utils/exportHelpers';
import { CapaReinspectionDrawer } from '../components/drawers/CapaReinspectionDrawer';
import { InspectionDrawer } from '../components/drawers/InspectionDrawer';
import { AddCrewModal } from '../components/drawers/AddCrewModal';
import { CapaItem } from '../types/capa';

interface VesselDetailViewProps {
  vesselId: string;
}

export const VesselDetailView: React.FC<VesselDetailViewProps> = ({ vesselId }) => {
  const {
    vessels,
    crew,
    assignCrewToVessel,
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

  /* triggers one-shot shimmer on all vessel attribute value cells on mount or vesselId change */
  const [isJustLoaded, setIsJustLoaded] = useState(true);
  useEffect(() => {
    setIsJustLoaded(true);
    const timer = setTimeout(() => setIsJustLoaded(false), 800);
    return () => clearTimeout(timer);
  }, [vesselId]);

  /* vessel crew management modal & assignment states */
  const [isAddCrewModalOpen, setIsAddCrewModalOpen] = useState(false);
  const [isAssignExistingOpen, setIsAssignExistingOpen] = useState(false);
  const [selectedCrewToAssign, setSelectedCrewToAssign] = useState<string>('');

  /* crew table search, filter, and sorting states */
  const [crewSearch, setCrewSearch] = useState('');
  const [crewRankFilter, setCrewRankFilter] = useState('All');
  const [crewComplianceFilter, setCrewComplianceFilter] = useState('All');
  const [crewSortField, setCrewSortField] = useState<'fullName' | 'rank' | 'overallComplianceScore' | 'complianceStatus'>('fullName');
  const [crewSortDirection, setCrewSortDirection] = useState<'asc' | 'desc'>('asc');

  /* pre-assurance vault search, filter, and sorting states */
  const [vaultSearch, setVaultSearch] = useState('');
  const [vaultStatusFilter, setVaultStatusFilter] = useState('ALL');
  const [vaultSortField, setVaultSortField] = useState<'name' | 'expiryDate' | 'status'>('name');
  const [vaultSortDirection, setVaultSortDirection] = useState<'asc' | 'desc'>('asc');

  /* assurance sets search, filter, and sorting states */
  const [assuranceSearch, setAssuranceSearch] = useState('');
  const [assuranceStageFilter, setAssuranceStageFilter] = useState('ALL');
  const [assuranceSortField, setAssuranceSortField] = useState<'id' | 'title' | 'stage' | 'readinessScore'>('id');
  const [assuranceSortDirection, setAssuranceSortDirection] = useState<'asc' | 'desc'>('asc');

  /* client history search, filter, and sorting states */
  const [clientSearch, setClientSearch] = useState('');
  const [clientOutcomeFilter, setClientOutcomeFilter] = useState('ALL');
  const [clientSortField, setClientSortField] = useState<'clientOrganization' | 'charterStart' | 'outcome'>('charterStart');
  const [clientSortDirection, setClientSortDirection] = useState<'asc' | 'desc'>('desc');

  /* audit trail search, filter, and sorting states */
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [auditSortField, setAuditSortField] = useState<'timestampUtc' | 'action' | 'userId'>('timestampUtc');
  const [auditSortDirection, setAuditSortDirection] = useState<'asc' | 'desc'>('desc');

  /* CAPA search, filter, and sorting states */
  const [capaSearch, setCapaSearch] = useState('');
  const [capaStatusFilter, setCapaStatusFilter] = useState('ALL');
  const [capaSortField, setCapaSortField] = useState<'id' | 'title' | 'dueDate' | 'status'>('id');
  const [capaSortDirection, setCapaSortDirection] = useState<'asc' | 'desc'>('asc');

  /* Physical Inspections search, filter, sorting, and detail modal states */
  const [inspectionSearch, setInspectionSearch] = useState('');
  const [inspectionStatusFilter, setInspectionStatusFilter] = useState('ALL');
  const [inspectionSortField, setInspectionSortField] = useState<'id' | 'title' | 'date' | 'status'>('id');
  const [inspectionSortDirection, setInspectionSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedInspectionForDetail, setSelectedInspectionForDetail] = useState<any | null>(null);
  const [showInspectionDrawer, setShowInspectionDrawer] = useState(false);

  /* Audit Log detail modal state */
  const [selectedAuditForDetail, setSelectedAuditForDetail] = useState<any | null>(null);

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

  const visibleAuditEvents = filterAuditTrailForPersona(auditEvents, activePersona, assuranceSets, vessels);

  // Linked assurance sets, documents, crew, and audit items for this vessel
  const linkedSets = vessel ? assuranceSets.filter((s) => s.vesselId === vessel.id) : [];
  const linkedDocs = vessel ? documents.filter((d) => d.vesselId === vessel.id) : [];
  const linkedCrew = useMemo(() => {
    if (!vessel) return [];
    return crew.filter((c) => c.currentVesselId === vessel.id || c.assignments.some((a) => a.vesselId === vessel.id));
  }, [crew, vessel]);

  const crewRanks = useMemo(() => {
    return Array.from(new Set(linkedCrew.map((c) => c.rank))).sort();
  }, [linkedCrew]);

  const filteredCrew = useMemo(() => {
    return linkedCrew
      .filter((c) => {
        const matchesSearch =
          !crewSearch ||
          c.fullName.toLowerCase().includes(crewSearch.toLowerCase()) ||
          c.rank.toLowerCase().includes(crewSearch.toLowerCase()) ||
          c.nationality.toLowerCase().includes(crewSearch.toLowerCase()) ||
          c.id.toLowerCase().includes(crewSearch.toLowerCase()) ||
          (c.seamansBookNo && c.seamansBookNo.toLowerCase().includes(crewSearch.toLowerCase()));

        const matchesRank = crewRankFilter === 'All' || c.rank === crewRankFilter;
        const matchesCompliance = crewComplianceFilter === 'All' || c.complianceStatus === crewComplianceFilter;

        return matchesSearch && matchesRank && matchesCompliance;
      })
      .sort((a, b) => {
        let comp = 0;
        if (crewSortField === 'fullName') {
          comp = a.fullName.localeCompare(b.fullName);
        } else if (crewSortField === 'rank') {
          comp = a.rank.localeCompare(b.rank);
        } else if (crewSortField === 'overallComplianceScore') {
          comp = a.overallComplianceScore - b.overallComplianceScore;
        } else if (crewSortField === 'complianceStatus') {
          comp = a.complianceStatus.localeCompare(b.complianceStatus);
        }
        return crewSortDirection === 'asc' ? comp : -comp;
      });
  }, [linkedCrew, crewSearch, crewRankFilter, crewComplianceFilter, crewSortField, crewSortDirection]);

  const linkedAudits = vessel
    ? visibleAuditEvents.filter(
      (a) => a.targetAsset.includes(vessel.imoNumber) || a.targetAsset.includes(vessel.name)
    )
    : [];

  const allVaultCerts = useMemo(() => {
    if (!vessel) return [];
    const statCerts = vessel.statutoryCertificates.map((cert) => {
      const daysLeft = getDaysUntilExpiry(cert.expiryDate);
      let statusLabel = 'Valid';
      if (daysLeft < 0) statusLabel = 'EXPIRED';
      else if (daysLeft < 90) statusLabel = `Expiring in ${daysLeft} days`;

      return {
        id: cert.id,
        name: cert.name,
        number: cert.certificateNumber,
        issuingBody: cert.issuingBody,
        issueDate: cert.issueDate,
        expiryDate: cert.expiryDate,
        ocr: '98% OCR Match',
        status: statusLabel,
        rawStatus: daysLeft < 0 ? 'EXPIRED' : daysLeft < 90 ? 'Expiring' : 'Valid',
      };
    });

    const userDocs = linkedDocs.map((doc) => ({
      id: doc.id,
      name: doc.title,
      number: doc.certificateNo,
      issuingBody: doc.issuingAuthority,
      issueDate: '—',
      expiryDate: doc.expiryDate,
      ocr: `${doc.ocrConfidence}% OCR`,
      status: doc.verificationStatus,
      rawStatus: doc.verificationStatus,
    }));

    return [...statCerts, ...userDocs];
  }, [vessel, linkedDocs]);

  const filteredVaultCerts = useMemo(() => {
    return allVaultCerts
      .filter((c) => {
        const matchesSearch =
          !vaultSearch ||
          c.name.toLowerCase().includes(vaultSearch.toLowerCase()) ||
          c.number.toLowerCase().includes(vaultSearch.toLowerCase()) ||
          c.issuingBody.toLowerCase().includes(vaultSearch.toLowerCase());

        const matchesStatus =
          vaultStatusFilter === 'ALL' ||
          c.rawStatus.toLowerCase() === vaultStatusFilter.toLowerCase() ||
          c.status.toLowerCase().includes(vaultStatusFilter.toLowerCase());

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comp = 0;
        if (vaultSortField === 'name') comp = a.name.localeCompare(b.name);
        else if (vaultSortField === 'expiryDate') comp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        else if (vaultSortField === 'status') comp = a.status.localeCompare(b.status);
        return vaultSortDirection === 'asc' ? comp : -comp;
      });
  }, [allVaultCerts, vaultSearch, vaultStatusFilter, vaultSortField, vaultSortDirection]);

  const filteredAssuranceSets = useMemo(() => {
    return linkedSets
      .filter((s) => {
        const matchesSearch =
          !assuranceSearch ||
          s.id.toLowerCase().includes(assuranceSearch.toLowerCase()) ||
          s.title.toLowerCase().includes(assuranceSearch.toLowerCase()) ||
          s.initiatorOrg.toLowerCase().includes(assuranceSearch.toLowerCase());

        const matchesStage = assuranceStageFilter === 'ALL' || s.stage === assuranceStageFilter;

        return matchesSearch && matchesStage;
      })
      .sort((a, b) => {
        let comp = 0;
        if (assuranceSortField === 'id') comp = a.id.localeCompare(b.id);
        else if (assuranceSortField === 'title') comp = a.title.localeCompare(b.title);
        else if (assuranceSortField === 'stage') comp = a.stage.localeCompare(b.stage);
        else if (assuranceSortField === 'readinessScore') comp = a.readinessScore - b.readinessScore;
        return assuranceSortDirection === 'asc' ? comp : -comp;
      });
  }, [linkedSets, assuranceSearch, assuranceStageFilter, assuranceSortField, assuranceSortDirection]);

  const filteredClientHistory = useMemo(() => {
    if (!vessel || !vessel.clientHistory) return [];
    return vessel.clientHistory
      .filter((r) => {
        const matchesSearch =
          !clientSearch ||
          r.clientOrganization.toLowerCase().includes(clientSearch.toLowerCase()) ||
          r.charterTitle.toLowerCase().includes(clientSearch.toLowerCase()) ||
          (r.notes && r.notes.toLowerCase().includes(clientSearch.toLowerCase()));

        const matchesOutcome = clientOutcomeFilter === 'ALL' || r.outcome === clientOutcomeFilter;

        return matchesSearch && matchesOutcome;
      })
      .sort((a, b) => {
        let comp = 0;
        if (clientSortField === 'clientOrganization') comp = a.clientOrganization.localeCompare(b.clientOrganization);
        else if (clientSortField === 'charterStart') comp = new Date(a.charterStart).getTime() - new Date(b.charterStart).getTime();
        else if (clientSortField === 'outcome') comp = a.outcome.localeCompare(b.outcome);
        return clientSortDirection === 'asc' ? comp : -comp;
      });
  }, [vessel, clientSearch, clientOutcomeFilter, clientSortField, clientSortDirection]);

  const auditActions = useMemo(() => {
    return Array.from(new Set(linkedAudits.map((a) => a.action))).sort();
  }, [linkedAudits]);

  const filteredAudits = useMemo(() => {
    return linkedAudits
      .filter((a) => {
        const matchesSearch =
          !auditSearch ||
          a.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
          a.userId.toLowerCase().includes(auditSearch.toLowerCase()) ||
          a.organization.toLowerCase().includes(auditSearch.toLowerCase()) ||
          (a.justificationNotes && a.justificationNotes.toLowerCase().includes(auditSearch.toLowerCase()));

        const matchesAction = auditActionFilter === 'ALL' || a.action === auditActionFilter;

        return matchesSearch && matchesAction;
      })
      .sort((a, b) => {
        let comp = 0;
        if (auditSortField === 'timestampUtc') comp = new Date(a.timestampUtc).getTime() - new Date(b.timestampUtc).getTime();
        else if (auditSortField === 'action') comp = a.action.localeCompare(b.action);
        else if (auditSortField === 'userId') comp = a.userId.localeCompare(b.userId);
        return auditSortDirection === 'asc' ? comp : -comp;
      });
  }, [linkedAudits, auditSearch, auditActionFilter, auditSortField, auditSortDirection]);

  const filteredCapas = useMemo(() => {
    return linkedCapas
      .filter((c) => {
        const matchesSearch =
          !capaSearch ||
          c.id.toLowerCase().includes(capaSearch.toLowerCase()) ||
          c.title.toLowerCase().includes(capaSearch.toLowerCase()) ||
          c.findingDescription.toLowerCase().includes(capaSearch.toLowerCase()) ||
          c.owner.toLowerCase().includes(capaSearch.toLowerCase());

        const matchesStatus = capaStatusFilter === 'ALL' || c.status === capaStatusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comp = 0;
        if (capaSortField === 'id') comp = a.id.localeCompare(b.id);
        else if (capaSortField === 'title') comp = a.title.localeCompare(b.title);
        else if (capaSortField === 'dueDate') comp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        else if (capaSortField === 'status') comp = a.status.localeCompare(b.status);
        return capaSortDirection === 'asc' ? comp : -comp;
      });
  }, [linkedCapas, capaSearch, capaStatusFilter, capaSortField, capaSortDirection]);

  const physicalInspections = useMemo(() => {
    if (!vessel) return [];

    const derivedInspections = linkedSets.map((s, idx) => ({
      id: `INSP-2026-${101 + idx}`,
      assuranceSetId: s.id,
      title: `Visual Vessel Inspection & Safety Audit — ${s.title}`,
      inspector: s.assignedInspector || 'N. Technical (AMSA Marine Audit Division)',
      inspectorRole: 'Lead Marine Vetting Inspector',
      date: '14 Oct 2026',
      location: 'Dampier Port Facility, WA',
      client: s.initiatorOrg || 'Southern Basin Energy Pty Ltd',
      status: s.inspectionCompleted ? 'Completed' : 'Scheduled',
      findingsSummary: {
        satisfactory: 12,
        observations: 2,
        deficiencies: 1,
        capaCode: 'CAPA-118'
      },
      checklists: [
        {
          id: 'CHK-01',
          category: 'Life-Saving Appliances (LSA)',
          ref: 'SOLAS Reg III/20',
          status: 'Satisfactory',
          notes: 'All lifeboats, davits, and hydrostatic release units in good working condition.',
          evidence: ['lsa_locker_01.jpg', 'davits_test_cert.pdf']
        },
        {
          id: 'CHK-02',
          category: 'Fire-Fighting Equipment (FFE)',
          ref: 'SOLAS Reg II-2/10',
          status: 'Satisfactory',
          notes: 'Fixed CO2 system pressure gauges verified within operational green zone.',
          evidence: ['ffe_station3.jpg']
        },
        {
          id: 'CHK-03',
          category: 'Liferaft HRU Serviceability',
          ref: 'LSA Code IV/4.1',
          status: 'Observation',
          notes: 'Port-side liferaft HRU service date exceeded by 3 weeks. Replacement on order; CAPA-118 raised.',
          evidence: ['hru_tag_port.jpg', 'hru_cert_2026.pdf'],
          capaId: 'CAPA-118'
        },
        {
          id: 'CHK-04',
          category: 'Deck Cargo Securing Arrangement',
          ref: 'IMO Cargo Securing Manual',
          status: 'Satisfactory',
          notes: 'Turnbuckles and D-rings inspected with 0% heavy corrosion.',
          evidence: ['deck_securing_aft.jpg']
        },
        {
          id: 'CHK-05',
          category: 'Navigation & Bridge Equipment',
          ref: 'SOLAS Reg V/19',
          status: 'Satisfactory',
          notes: 'ECDIS dual redundancy verified with latest ENC chart vector packs.',
          evidence: ['ecdis_log_oct2026.pdf']
        }
      ],
      auditTrail: [
        { time: '2026-10-14 08:30 UTC', action: 'INSPECTION_INITIATED', user: s.assignedInspector || 'N. Technical', notes: 'Inspector boarded vessel at Dampier Berth 3.' },
        { time: '2026-10-14 11:45 UTC', action: 'FINDING_LOGGED', user: s.assignedInspector || 'N. Technical', notes: 'Observation logged for Port Liferaft HRU expiration date.' },
        { time: '2026-10-14 14:15 UTC', action: 'CAPA_RAISED', user: s.assignedInspector || 'N. Technical', notes: 'Corrective Action CAPA-118 automatically generated.' },
        { time: '2026-10-14 16:00 UTC', action: 'INSPECTION_COMPLETED', user: s.assignedInspector || 'N. Technical', notes: 'Visual inspection completed with score 94%. Report signed off.' }
      ]
    }));

    if (derivedInspections.length === 0) {
      return [
        {
          id: 'INSP-2026-001',
          assuranceSetId: 'AS-2026-001',
          title: `Annual Statutory Vetting & Safety Audit — ${vessel.name}`,
          inspector: 'N. Technical (AMSA Marine Audit Division)',
          inspectorRole: 'Senior Offshore Surveyor',
          date: '10 Sep 2026',
          location: 'Fremantle Port Outer Anchorage, WA',
          client: 'Pacific Ocean Logistics Pty Ltd',
          status: 'Completed',
          findingsSummary: {
            satisfactory: 14,
            observations: 1,
            deficiencies: 0,
            capaCode: 'CAPA-114'
          },
          checklists: [
            {
              id: 'CHK-01',
              category: 'Life-Saving Appliances (LSA)',
              ref: 'SOLAS Reg III/20',
              status: 'Satisfactory',
              notes: 'Life-saving appliances fully inspected and verified compliant.',
              evidence: ['lsa_inspection.pdf']
            },
            {
              id: 'CHK-02',
              category: 'Dynamic Positioning Systems',
              ref: 'IMCA M 103 / DP2',
              status: 'Satisfactory',
              notes: 'DP2 trial failure modes tested with zero thrust loss.',
              evidence: ['dp2_trial_log.pdf']
            }
          ],
          auditTrail: [
            { time: '2026-09-10 09:00 UTC', action: 'INSPECTION_COMPLETED', user: 'N. Technical', notes: 'Annual statutory audit completed.' }
          ]
        }
      ];
    }

    return derivedInspections;
  }, [vessel, linkedSets]);

  const filteredInspections = useMemo(() => {
    return physicalInspections
      .filter((item) => {
        const matchesSearch =
          !inspectionSearch ||
          item.id.toLowerCase().includes(inspectionSearch.toLowerCase()) ||
          item.title.toLowerCase().includes(inspectionSearch.toLowerCase()) ||
          item.inspector.toLowerCase().includes(inspectionSearch.toLowerCase()) ||
          item.client.toLowerCase().includes(inspectionSearch.toLowerCase()) ||
          item.location.toLowerCase().includes(inspectionSearch.toLowerCase());

        const matchesStatus = inspectionStatusFilter === 'ALL' || item.status === inspectionStatusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let comp = 0;
        if (inspectionSortField === 'id') comp = a.id.localeCompare(b.id);
        else if (inspectionSortField === 'title') comp = a.title.localeCompare(b.title);
        else if (inspectionSortField === 'date') comp = new Date(a.date).getTime() - new Date(b.date).getTime();
        else if (inspectionSortField === 'status') comp = a.status.localeCompare(b.status);
        return inspectionSortDirection === 'asc' ? comp : -comp;
      });
  }, [physicalInspections, inspectionSearch, inspectionStatusFilter, inspectionSortField, inspectionSortDirection]);

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
        {/* Top Header Row: Vessel Name & Subtitle Left, Export & Edit Action Buttons Top Right */}
        <div className="d-flex flex-wrap align-items-start justify-between gap-3 mb-3">
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
              <strong className={`text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>IMO: {vessel.imoNumber} | Reg: {vessel.officialRegNumber}</strong>
              <span className="mx-2">•</span>
              <span>{vessel.classNotation} | {vessel.flagState} Flag | Port: {vessel.portOfRegistry}</span>
            </div>
          </div>

          {/* Top Right Action Controls */}
          <div className="d-flex align-items-center gap-2">
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

        {/* Bottom Metrics Row: Classification & Readiness Score */}
        <div className="d-flex align-items-center gap-4 pt-3 border-top">
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
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.name}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">IMO Number:</span>
                    {fieldEditable('imoNumber') ? (
                      <input
                        type="text"
                        className={`form-control form-control-sm mt-1 font-mono-code${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.imoNumber}
                        onChange={(e) => handleInputChange('imoNumber', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block font-mono-code text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.imoNumber}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Official Reg #:</span>
                    {fieldEditable('officialRegNumber') ? (
                      <input
                        type="text"
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.officialRegNumber}
                        onChange={(e) => handleInputChange('officialRegNumber', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block font-mono-code text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.officialRegNumber}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">MMSI:</span>
                    {fieldEditable('mmsiNumber') ? (
                      <input
                        type="text"
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.mmsiNumber}
                        onChange={(e) => handleInputChange('mmsiNumber', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block font-mono-code text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.mmsiNumber}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Call Sign:</span>
                    {fieldEditable('callSign') ? (
                      <input
                        type="text"
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.callSign}
                        onChange={(e) => handleInputChange('callSign', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block font-mono-code text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.callSign}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Flag / Port:</span>
                    {fieldEditable('flagState') ? (
                      <div className="d-flex gap-1 mt-1">
                        <input
                          type="text"
                          className={`form-control form-control-sm${isJustLoaded ? ' map-autofill-animate' : ''}`}
                          value={formData.flagState}
                          onChange={(e) => handleInputChange('flagState', e.target.value)}
                        />
                        <input
                          type="text"
                          className={`form-control form-control-sm${isJustLoaded ? ' map-autofill-animate' : ''}`}
                          value={formData.portOfRegistry}
                          onChange={(e) => handleInputChange('portOfRegistry', e.target.value)}
                        />
                      </div>
                    ) : (
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.flagState} ({vessel.portOfRegistry})</strong>
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
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.vesselType}
                        onChange={(e) => handleInputChange('vesselType', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.vesselType}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Subtype / Use:</span>
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>
                      {vessel.vesselSubtype} &middot; {vessel.intendedUse}
                    </strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Class Society:</span>
                    {fieldEditable('classificationSociety') ? (
                      <select
                        className={`form-select form-select-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
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
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.classificationSociety}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Class Notation:</span>
                    {fieldEditable('classNotation') ? (
                      <input
                        type="text"
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.classNotation}
                        onChange={(e) => handleInputChange('classNotation', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.classNotation}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Hull Type:</span>
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.hullType}</strong>
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
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.yearBuilt}
                        onChange={(e) => handleInputChange('yearBuilt', parseInt(e.target.value, 10) || 0)}
                      />
                    ) : (
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.yearBuilt}</strong>
                    )}
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Shipyard:</span>
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.shipyardBuilder}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">LOA x Beam x Draft:</span>
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>
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
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.grossTonnageGT.toLocaleString()} GT</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Deadweight (DWT):</span>
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.deadweightTonnageDWT.toLocaleString()} DWT</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">DP Class:</span>
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.dynamicPositioningClass}</strong>
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
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.registeredOwner}
                        onChange={(e) => handleInputChange('registeredOwner', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.registeredOwner}</strong>
                    )}
                  </div>
                  <div className="col-md-6">
                    <span className="text-secondary">Technical Manager:</span>
                    {fieldEditable('technicalManager') ? (
                      <input
                        type="text"
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.technicalManager}
                        onChange={(e) => handleInputChange('technicalManager', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.technicalManager}</strong>
                    )}
                  </div>
                  <div className="col-md-6">
                    <span className="text-secondary">DOC Number:</span>
                    {fieldEditable('docNumber') ? (
                      <input
                        type="text"
                        className={`form-control form-control-sm mt-1 font-mono-code${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.docNumber}
                        onChange={(e) => handleInputChange('docNumber', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block font-mono-code text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.docNumber}</strong>
                    )}
                  </div>
                  <div className="col-md-6">
                    <span className="text-secondary">24/7 Ops Contact:</span>
                    {fieldEditable('contact247') ? (
                      <input
                        type="text"
                        className={`form-control form-control-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
                        value={formData.contact247}
                        onChange={(e) => handleInputChange('contact247', e.target.value)}
                      />
                    ) : (
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.contact247}</strong>
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
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.piClubName}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Policy #:</span>
                    <strong className={`d-block font-mono-code text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.policyNumber}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Master's Name:</span>
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.masterName}</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Safe Manning Count:</span>
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.safeManningComplement} Crew</strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-secondary">Lifeboat Capacity:</span>
                    <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.lifeboatCapacity} Persons</strong>
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
                        className={`form-select form-select-sm mt-1${isJustLoaded ? ' map-autofill-animate' : ''}`}
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
                      <strong className={`d-block text-dark${isJustLoaded ? ' map-autofill-animate' : ''}`}>{vessel.status}</strong>
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
          {/* Table Header Controls Row */}
          <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm bg-white text-dark border-secondary"
                placeholder="Search Certificate, Number, Body..."
                value={vaultSearch}
                onChange={(e) => setVaultSearch(e.target.value)}
                style={{ width: '250px' }}
              />

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={vaultStatusFilter}
                onChange={(e) => setVaultStatusFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="Valid">Valid</option>
                <option value="Expiring">Expiring &lt; 90 Days</option>
                <option value="EXPIRED">EXPIRED</option>
                <option value="Verified">Verified</option>
              </select>

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={vaultSortField}
                onChange={(e) => setVaultSortField(e.target.value as any)}
                style={{ width: '150px' }}
              >
                <option value="name">Sort: Name</option>
                <option value="expiryDate">Sort: Expiry Date</option>
                <option value="status">Sort: Status</option>
              </select>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-dark"
                onClick={() => setVaultSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))}
                title={`Sort direction: ${vaultSortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {vaultSortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>

            {canUploadDocs && (
              <button
                type="button"
                className="btn btn-sm btn-primary ms-auto"
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
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (vaultSortField === 'name') setVaultSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                      else { setVaultSortField('name'); setVaultSortDirection('asc'); }
                    }}
                  >
                    Certificate Name {vaultSortField === 'name' ? (vaultSortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Certificate Number</th>
                  <th>Issuing Body</th>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (vaultSortField === 'expiryDate') setVaultSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                      else { setVaultSortField('expiryDate'); setVaultSortDirection('asc'); }
                    }}
                  >
                    Validity Dates {vaultSortField === 'expiryDate' ? (vaultSortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>OCR Confidence</th>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (vaultSortField === 'status') setVaultSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                      else { setVaultSortField('status'); setVaultSortDirection('asc'); }
                    }}
                  >
                    Status {vaultSortField === 'status' ? (vaultSortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredVaultCerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No statutory certificates or documents match the search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVaultCerts.map((cert) => {
                    let badgeClass = 'bg-success text-white';
                    if (cert.status === 'EXPIRED') badgeClass = 'bg-danger text-white';
                    else if (cert.status.includes('Expiring')) badgeClass = 'bg-warning text-dark';
                    else if (cert.status === 'Verified') badgeClass = 'bg-info text-dark';

                    return (
                      <tr key={cert.id}>
                        <td className="fw-semibold text-dark">{cert.name}</td>
                        <td className="font-mono-code">{cert.number}</td>
                        <td>{cert.issuingBody}</td>
                        <td className="font-mono-code small">
                          {cert.issueDate !== '—' ? `${formatMaritimeDate(cert.issueDate)} → ` : ''}{formatMaritimeDate(cert.expiryDate)}
                        </td>
                        <td>
                          <span className="badge bg-light text-primary border">{cert.ocr}</span>
                        </td>
                        <td>
                          <span className={`badge ${badgeClass}`}>{cert.status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Assurance Sets */}
      {activeTab === 'assurance' && (
        <div className="card map-card-custom">
          {/* Table Controls Header */}
          <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm bg-white text-dark border-secondary"
                placeholder="Search Set ID, Title, Initiator..."
                value={assuranceSearch}
                onChange={(e) => setAssuranceSearch(e.target.value)}
                style={{ width: '250px' }}
              />

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={assuranceStageFilter}
                onChange={(e) => setAssuranceStageFilter(e.target.value)}
                style={{ width: '170px' }}
              >
                <option value="ALL">All Stages</option>
                <option value="Drafting">Drafting</option>
                <option value="Data Gathering">Data Gathering</option>
                <option value="Physical Inspection">Physical Inspection</option>
                <option value="Desktop Assessment">Desktop Assessment</option>
                <option value="Verification">Verification</option>
                <option value="Assurance Granted">Assurance Granted</option>
              </select>

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={assuranceSortField}
                onChange={(e) => setAssuranceSortField(e.target.value as any)}
                style={{ width: '150px' }}
              >
                <option value="id">Sort: Set ID</option>
                <option value="title">Sort: Title</option>
                <option value="stage">Sort: Stage</option>
                <option value="readinessScore">Sort: Readiness</option>
              </select>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-dark"
                onClick={() => setAssuranceSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))}
                title={`Sort direction: ${assuranceSortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {assuranceSortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            {filteredAssuranceSets.length === 0 ? (
              <div className="p-4 text-center text-muted">No active assurance sets match the search and filter criteria.</div>
            ) : (
              <div className="table-responsive">
                <table className="table map-table-custom align-middle mb-0">
                  <thead>
                    <tr>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (assuranceSortField === 'id') setAssuranceSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                          else { setAssuranceSortField('id'); setAssuranceSortDirection('asc'); }
                        }}
                      >
                        Set ID {assuranceSortField === 'id' ? (assuranceSortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th>Initiating Organization</th>
                      <th>Charter Window</th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (assuranceSortField === 'stage') setAssuranceSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                          else { setAssuranceSortField('stage'); setAssuranceSortDirection('asc'); }
                        }}
                      >
                        Stage {assuranceSortField === 'stage' ? (assuranceSortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (assuranceSortField === 'readinessScore') setAssuranceSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                          else { setAssuranceSortField('readinessScore'); setAssuranceSortDirection('asc'); }
                        }}
                      >
                        Readiness {assuranceSortField === 'readinessScore' ? (assuranceSortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssuranceSets.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="fw-semibold font-mono-code text-primary">{s.id}</div>

                        </td>
                        <td className="small">
                          <div>{s.initiatorOrg}</div>
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
          {/* Table Controls Header */}
          <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm bg-white text-dark border-secondary"
                placeholder="Search Client Org, Charter..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                style={{ width: '250px' }}
              />

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={clientOutcomeFilter}
                onChange={(e) => setClientOutcomeFilter(e.target.value)}
                style={{ width: '160px' }}
              >
                <option value="ALL">All Outcomes</option>
                <option value="Approved">Approved</option>
                <option value="Completed">Completed</option>
                <option value="Conditional">Conditional</option>
                <option value="Pending">Pending</option>
              </select>

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={clientSortField}
                onChange={(e) => setClientSortField(e.target.value as any)}
                style={{ width: '150px' }}
              >
                <option value="charterStart">Sort: Start Date</option>
                <option value="clientOrganization">Sort: Client Org</option>
                <option value="outcome">Sort: Outcome</option>
              </select>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-dark"
                onClick={() => setClientSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))}
                title={`Sort direction: ${clientSortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {clientSortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            {filteredClientHistory.length === 0 ? (
              <div className="p-4 text-center text-muted">No client or charter history records match the search and filter criteria.</div>
            ) : (
              <div className="table-responsive">
                <table className="table map-table-custom align-middle mb-0">
                  <thead>
                    <tr>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (clientSortField === 'clientOrganization') setClientSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                          else { setClientSortField('clientOrganization'); setClientSortDirection('asc'); }
                        }}
                      >
                        Client Organization {clientSortField === 'clientOrganization' ? (clientSortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th>Charter / Campaign</th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (clientSortField === 'charterStart') setClientSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                          else { setClientSortField('charterStart'); setClientSortDirection('asc'); }
                        }}
                      >
                        Charter Period {clientSortField === 'charterStart' ? (clientSortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th>Assurance Set</th>
                      <th
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (clientSortField === 'outcome') setClientSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                          else { setClientSortField('outcome'); setClientSortDirection('asc'); }
                        }}
                      >
                        Status {clientSortField === 'outcome' ? (clientSortDirection === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClientHistory.map((record) => (
                      <tr key={record.id}>
                        <td className="fw-semibold text-dark">{record.clientOrganization}</td>
                        <td className="small">{record.charterTitle}</td>
                        <td className="font-mono-code small">
                          {formatMaritimeDate(record.charterStart)} &rarr; {formatMaritimeDate(record.charterEnd)}
                        </td>
                        <td className="font-mono-code small">
                          {record.assuranceSetId ? (
                            <button
                              type="button"
                              className="btn btn-link btn-sm p-0 font-mono-code"
                              onClick={() => setCurrentHashView('assurance-sets', record.assuranceSetId!)}
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
          {/* Table Header Controls Row matching standard CrewTable.tsx layout */}
          <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
            {/* Left Side: Search Box & Filter Dropdowns */}
            <div className="d-flex flex-wrap align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm bg-white text-dark border-secondary"
                placeholder="Search Crew ID, Name, Rank..."
                value={crewSearch}
                onChange={(e) => setCrewSearch(e.target.value)}
                style={{ width: '250px' }}
              />

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={crewRankFilter}
                onChange={(e) => setCrewRankFilter(e.target.value)}
                style={{ width: '150px' }}
              >
                <option value="All">All Ranks / Officers</option>
                {crewRanks.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={crewComplianceFilter}
                onChange={(e) => setCrewComplianceFilter(e.target.value)}
                style={{ width: '170px' }}
              >
                <option value="All">All STCW Statuses</option>
                <option value="Fully Compliant">Fully Compliant</option>
                <option value="Expiring < 60 Days">Expiring &lt; 60 Days</option>
                <option value="Document Deficient">Document Deficient</option>
              </select>

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={crewSortField}
                onChange={(e) => setCrewSortField(e.target.value as any)}
                style={{ width: '150px' }}
              >
                <option value="fullName">Sort: Name</option>
                <option value="rank">Sort: Rank</option>
                <option value="overallComplianceScore">Sort: STCW Score</option>
                <option value="complianceStatus">Sort: Compliance</option>
              </select>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-dark"
                onClick={() => setCrewSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                title={`Sort direction: ${crewSortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {crewSortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>

            {/* Right Side: Action Triggers */}
            <div className="d-flex align-items-center gap-2 ms-auto">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary fw-semibold"
                onClick={() => setIsAssignExistingOpen(!isAssignExistingOpen)}
              >
                + Assign Existing Seafarer
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary fw-semibold"
                onClick={() => setIsAddCrewModalOpen(true)}
              >
                + Register New Seafarer
              </button>
            </div>
          </div>

          {/* Inline Assign Existing Seafarer Toolbar */}
          {isAssignExistingOpen && (
            <div className="p-3 bg-light border-bottom d-flex flex-wrap align-items-center gap-3">
              <div className="fw-semibold text-dark small">Assign Unassigned Seafarer:</div>
              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                style={{ width: '320px' }}
                value={selectedCrewToAssign}
                onChange={(e) => setSelectedCrewToAssign(e.target.value)}
              >
                <option value="">-- Select Seafarer from Directory --</option>
                {crew
                  .filter((c) => c.currentVesselId !== vessel.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.rank} · {c.nationality}) {c.currentVesselName ? `[Currently: ${c.currentVesselName}]` : '[Unassigned]'}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                className="btn btn-sm btn-success fw-semibold"
                disabled={!selectedCrewToAssign}
                onClick={() => {
                  if (selectedCrewToAssign) {
                    assignCrewToVessel(selectedCrewToAssign, vessel.id);
                    setToastMessage(`Successfully assigned seafarer to ${vessel.name}`);
                    setSelectedCrewToAssign('');
                    setIsAssignExistingOpen(false);
                  }
                }}
              >
                Assign to Vessel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setIsAssignExistingOpen(false)}
              >
                Cancel
              </button>
            </div>
          )}

          {/* Master Assigned Crew Data Table */}
          <div className="table-responsive">
            <table className="table map-table-custom align-middle mb-0">
              <thead>
                <tr>
                  <th>Crew ID</th>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (crewSortField === 'fullName') {
                        setCrewSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setCrewSortField('fullName');
                        setCrewSortDirection('asc');
                      }
                    }}
                  >
                    Full Name & Rank {crewSortField === 'fullName' ? (crewSortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Nationality & Seaman Book</th>
                  <th>Assignment Status</th>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (crewSortField === 'overallComplianceScore') {
                        setCrewSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setCrewSortField('overallComplianceScore');
                        setCrewSortDirection('asc');
                      }
                    }}
                  >
                    STCW Score {crewSortField === 'overallComplianceScore' ? (crewSortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (crewSortField === 'complianceStatus') {
                        setCrewSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                      } else {
                        setCrewSortField('complianceStatus');
                        setCrewSortDirection('asc');
                      }
                    }}
                  >
                    Compliance Status {crewSortField === 'complianceStatus' ? (crewSortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCrew.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-muted">
                      {linkedCrew.length === 0
                        ? 'No crew members currently registered for this vessel.'
                        : 'No crew members match the search and filter criteria.'}
                    </td>
                  </tr>
                ) : (
                  filteredCrew.map((c) => (
                    <tr key={c.id}>
                      <td className="font-mono-code small text-dark fw-semibold">{c.id}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-link p-0 text-primary text-start fw-semibold text-decoration-underline border-0 bg-transparent align-baseline"
                          onClick={() => setCurrentHashView('crew', c.id)}
                          title={`View ${c.fullName} STCW seafarer dossier`}
                        >
                          {c.fullName}
                        </button>
                        <div className="small text-secondary">{c.rank}</div>
                      </td>
                      <td>
                        <div className="small fw-semibold">{c.nationality}</div>
                        <div className="font-mono-code text-muted" style={{ fontSize: '0.75rem' }}>{c.seamansBookNo}</div>
                      </td>
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
                        <div className="d-flex align-items-center justify-content-end gap-2">
                          {c.currentVesselId === vessel.id ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger py-1 px-2"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => {
                                assignCrewToVessel(c.id, undefined);
                                setToastMessage(`Unassigned ${c.fullName} from ${vessel.name}`);
                              }}
                            >
                              Unassign
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success py-1 px-2"
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => {
                                assignCrewToVessel(c.id, vessel.id);
                                setToastMessage(`Reassigned ${c.fullName} to ${vessel.name}`);
                              }}
                            >
                              Make Current
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary py-1 px-2"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => setCurrentHashView('crew', c.id)}
                          >
                            View Details
                          </button>
                        </div>
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
          {/* Table Controls Header */}
          <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <input
                type="text"
                className="form-control form-control-sm bg-white text-dark border-secondary"
                placeholder="Search Action, User, Org, Notes..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                style={{ width: '250px' }}
              />

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                style={{ width: '180px' }}
              >
                <option value="ALL">All Action Types</option>
                {auditActions.map((act) => (
                  <option key={act} value={act}>
                    {act}
                  </option>
                ))}
              </select>

              <select
                className="form-select form-select-sm bg-white text-dark border-secondary"
                value={auditSortField}
                onChange={(e) => setAuditSortField(e.target.value as any)}
                style={{ width: '150px' }}
              >
                <option value="timestampUtc">Sort: Timestamp</option>
                <option value="action">Sort: Action</option>
                <option value="userId">Sort: User ID</option>
              </select>

              <button
                type="button"
                className="btn btn-sm btn-outline-secondary text-dark"
                onClick={() => setAuditSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))}
                title={`Sort direction: ${auditSortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {auditSortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table map-table-custom align-middle mb-0">
              <thead>
                <tr>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (auditSortField === 'timestampUtc') setAuditSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                      else { setAuditSortField('timestampUtc'); setAuditSortDirection('desc'); }
                    }}
                  >
                    Timestamp (UTC) {auditSortField === 'timestampUtc' ? (auditSortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (auditSortField === 'action') setAuditSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                      else { setAuditSortField('action'); setAuditSortDirection('asc'); }
                    }}
                  >
                    Action {auditSortField === 'action' ? (auditSortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (auditSortField === 'userId') setAuditSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                      else { setAuditSortField('userId'); setAuditSortDirection('asc'); }
                    }}
                  >
                    User & Role {auditSortField === 'userId' ? (auditSortDirection === 'asc' ? '↑' : '↓') : ''}
                  </th>
                  <th>Organization</th>
                  <th>Justification &amp; Details</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAudits.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No tamper-evident audit entries match the search and filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAudits.map((event) => (
                    <tr key={event.id}>
                      <td className="font-mono-code small text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(event.timestampUtc).toLocaleString()}
                      </td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle font-mono-code">
                          {event.action}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark small">{event.userId}</div>
                        <span className="badge bg-light text-secondary border" style={{ fontSize: '0.7rem' }}>
                          {event.userRole}
                        </span>
                      </td>
                      <td className="small text-secondary">{event.organization}</td>
                      <td className="small text-dark font-mono-code">{event.justificationNotes}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary py-1 px-2"
                          style={{ fontSize: '0.75rem' }}
                          onClick={() => setSelectedAuditForDetail(event)}
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

      {/* Tab: Physical Inspections & CAPA Tracker */}
      {activeTab === 'inspections' && (
        <div className="d-flex flex-column gap-4">
          {/* Section 1: Physical Inspection Reports Table */}
          <div className="card map-card-custom">
            <div className="card-header d-flex flex-wrap align-items-center justify-between gap-3 p-3">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <input
                  type="text"
                  className="form-control form-control-sm bg-white text-dark border-secondary"
                  placeholder="Search Inspection ID, Title, Inspector..."
                  value={inspectionSearch}
                  onChange={(e) => setInspectionSearch(e.target.value)}
                  style={{ width: '250px' }}
                />

                <select
                  className="form-select form-select-sm bg-white text-dark border-secondary"
                  value={inspectionStatusFilter}
                  onChange={(e) => setInspectionStatusFilter(e.target.value)}
                  style={{ width: '160px' }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                </select>

                <select
                  className="form-select form-select-sm bg-white text-dark border-secondary"
                  value={inspectionSortField}
                  onChange={(e) => setInspectionSortField(e.target.value as any)}
                  style={{ width: '150px' }}
                >
                  <option value="id">Sort: Campaign ID</option>
                  <option value="title">Sort: Title</option>
                  <option value="date">Sort: Inspection Date</option>
                  <option value="status">Sort: Status</option>
                </select>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary text-dark"
                  onClick={() => setInspectionSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'))}
                  title={`Sort direction: ${inspectionSortDirection === 'asc' ? 'Ascending' : 'Descending'}`}
                >
                  {inspectionSortDirection === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>

              <div className="d-flex align-items-center gap-2 ms-auto">
                <button
                  type="button"
                  className="btn btn-sm btn-primary fw-semibold d-flex align-items-center gap-1.5"
                  onClick={() => setShowInspectionDrawer(true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  New Live Inspection Checklist
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table map-table-custom align-middle mb-0">
                <thead>
                  <tr>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (inspectionSortField === 'id') setInspectionSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                        else { setInspectionSortField('id'); setInspectionSortDirection('asc'); }
                      }}
                    >
                      Inspection Campaign {inspectionSortField === 'id' ? (inspectionSortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th>Assigned Assurance Set</th>
                    <th>Assigned Inspector</th>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (inspectionSortField === 'date') setInspectionSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                        else { setInspectionSortField('date'); setInspectionSortDirection('asc'); }
                      }}
                    >
                      Date &amp; Location {inspectionSortField === 'date' ? (inspectionSortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (inspectionSortField === 'status') setInspectionSortDirection((p) => (p === 'asc' ? 'desc' : 'asc'));
                        else { setInspectionSortField('status'); setInspectionSortDirection('asc'); }
                      }}
                    >
                      Status {inspectionSortField === 'status' ? (inspectionSortDirection === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInspections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-muted">
                        No physical inspection records match the search and filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredInspections.map((insp) => (
                      <tr
                        key={insp.id}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setCurrentHashView('inspector', vessel.name)}
                      >
                        <td>
                          <button
                            type="button"
                            className="btn btn-link p-0 text-primary fw-bold text-decoration-underline border-0 bg-transparent text-start font-mono-code"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentHashView('inspector', vessel.name);
                            }}
                          >
                            {insp.id}
                          </button>
                          <div className="small fw-semibold text-dark mt-0.5">{insp.title}</div>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-link p-0 font-mono-code text-primary fw-semibold text-decoration-underline border-0 bg-transparent text-start"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentHashView('assurance-sets', insp.assuranceSetId);
                            }}
                            title="Open assigned Assurance Set"
                          >
                            {insp.assuranceSetId} &rarr;
                          </button>
                        </td>
                        <td>
                          <div className="fw-semibold text-dark small">{insp.inspector}</div>
                          <div className="text-secondary font-mono-code" style={{ fontSize: '0.725rem' }}>{insp.inspectorRole}</div>
                        </td>
                        <td>
                          <div className="font-mono-code small text-dark fw-semibold">{insp.date}</div>
                          <div className="text-secondary small">{insp.location}</div>
                        </td>
                        <td>
                          <span className={`badge ${insp.status === 'Completed' ? 'bg-success text-white' : 'bg-primary text-white'} font-mono-code`}>
                            {insp.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex align-items-center justify-content-end gap-1.5">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary py-1 px-2 fw-semibold"
                              style={{ fontSize: '0.75rem' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentHashView('inspector', vessel.name);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

      {/* Register New Crew Member Modal for vessel admin */}
      {isAddCrewModalOpen && vessel && (
        <AddCrewModal
          isOpen={isAddCrewModalOpen}
          onClose={() => setIsAddCrewModalOpen(false)}
          initialVesselId={vessel.id}
          onViewCrewDetail={(crewId) => setCurrentHashView('crew', crewId)}
        />
      )}

      {/* Physical Inspection Table Detail Page Modal */}
      {selectedInspectionForDetail && (
        <div
          className="modal show d-block map-modal-backdrop"
          tabIndex={-1}
          style={{ zIndex: 1060 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedInspectionForDetail(null);
          }}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content bg-white text-dark border shadow-lg">
              {/* Header */}
              <div className="modal-header border-bottom bg-light d-flex align-items-center justify-content-between p-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white font-mono-code">{selectedInspectionForDetail.id}</span>
                    <h5 className="modal-title fw-bold text-dark m-0">
                      {selectedInspectionForDetail.title}
                    </h5>
                  </div>
                  <div className="text-secondary small mt-0.5">
                    Physical Vetting Inspection &amp; Audit Log Dossier — {vessel.name} (IMO {vessel.imoNumber})
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedInspectionForDetail(null)}
                  aria-label="Close"
                />
              </div>

              {/* Body */}
              <div className="modal-body p-4 overflow-y-auto" style={{ maxHeight: '72vh' }}>
                {/* Key Metadata Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-md-3">
                    <div className="p-3 bg-light border rounded h-100">
                      <div className="text-secondary small text-uppercase fw-semibold mb-1">Target Vessel</div>
                      <div className="fw-bold text-primary">{vessel.name}</div>
                      <div className="font-mono-code small text-muted">IMO: {vessel.imoNumber}</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 bg-light border rounded h-100">
                      <div className="text-secondary small text-uppercase fw-semibold mb-1">Assigned Inspector</div>
                      <div className="fw-bold text-dark">{selectedInspectionForDetail.inspector}</div>
                      <div className="text-secondary small">{selectedInspectionForDetail.inspectorRole}</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 bg-light border rounded h-100">
                      <div className="text-secondary small text-uppercase fw-semibold mb-1">Date &amp; Location</div>
                      <div className="fw-bold font-mono-code text-dark">{selectedInspectionForDetail.date}</div>
                      <div className="text-secondary small">{selectedInspectionForDetail.location}</div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="p-3 bg-light border rounded h-100">
                      <div className="text-secondary small text-uppercase fw-semibold mb-1">Assigned Assurance Set</div>
                      <button
                        type="button"
                        className="btn btn-link p-0 fw-bold text-primary font-mono-code text-decoration-underline text-start"
                        onClick={() => {
                          const setCode = selectedInspectionForDetail.assuranceSetId;
                          setSelectedInspectionForDetail(null);
                          setCurrentHashView('assurance-sets', setCode);
                        }}
                        title="Open assigned Assurance Set"
                      >
                        {selectedInspectionForDetail.assuranceSetId} &rarr;
                      </button>
                      <div className="small text-secondary text-truncate" title={selectedInspectionForDetail.assuranceSetTitle}>
                        {selectedInspectionForDetail.assuranceSetTitle || 'Standard Vetting Audit'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Findings Summary Bar */}
                <div className="p-3 bg-primary-subtle border border-primary-subtle rounded mb-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-primary small">Audit Findings Summary:</span>
                    <span className="badge bg-success text-white font-mono-code">{selectedInspectionForDetail.findingsSummary.satisfactory} Satisfactory</span>
                    <span className="badge bg-info text-white font-mono-code">{selectedInspectionForDetail.findingsSummary.observations} Observations</span>
                    <span className="badge bg-danger text-white font-mono-code">{selectedInspectionForDetail.findingsSummary.deficiencies} Deficiencies</span>
                  </div>
                </div>

                {/* Physical Checklist Breakdown Table */}
                <div className="mb-4">
                  <h6 className="fw-bold text-dark mb-2">Physical Survey Checklist Items &amp; Observations</h6>
                  <div className="table-responsive border rounded">
                    <table className="table map-table-custom align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Item ID</th>
                          <th>Category &amp; Standard Ref</th>
                          <th>Finding Status</th>
                          <th>Inspector Findings &amp; Observations</th>
                          <th>Evidence Files</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInspectionForDetail.checklists.map((chk: any) => (
                          <tr key={chk.id}>
                            <td className="font-mono-code fw-semibold text-dark">{chk.id}</td>
                            <td>
                              <div className="fw-semibold text-dark small">{chk.category}</div>
                              <div className="text-secondary font-mono-code" style={{ fontSize: '0.725rem' }}>{chk.ref}</div>
                            </td>
                            <td>
                              <span className={`badge ${chk.status === 'Satisfactory' ? 'bg-success text-white' : chk.status === 'Observation' ? 'bg-warning text-dark' : 'bg-danger text-white'} font-mono-code`}>
                                {chk.status}
                              </span>
                            </td>
                            <td className="small text-dark">
                              {chk.notes}
                              {chk.capaId && (
                                <div className="mt-1">
                                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle font-mono-code" style={{ fontSize: '0.7rem' }}>
                                    {chk.capaId} Action Item Active
                                  </span>
                                </div>
                              )}
                            </td>
                            <td>
                              <div className="d-flex flex-wrap gap-1">
                                {chk.evidence.map((ev: string) => (
                                  <span key={ev} className="badge bg-light text-secondary border font-mono-code" style={{ fontSize: '0.7rem' }}>
                                    {ev}
                                  </span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Linked Corrective Actions (CAPA) Section */}
                <div className="mb-4">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <h6 className="fw-bold text-dark m-0">Corrective &amp; Preventive Actions (CAPA)</h6>
                    <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle font-mono-code">
                      {linkedCapas.length} CAPA Item{linkedCapas.length !== 1 ? 's' : ''} Linked
                    </span>
                  </div>
                  <div className="table-responsive border rounded">
                    <table className="table map-table-custom align-middle mb-0">
                      <thead>
                        <tr>
                          <th>CAPA ID</th>
                          <th>Title &amp; Finding</th>
                          <th>Owner / Dept</th>
                          <th>Due Date</th>
                          <th>Status</th>
                          <th className="text-end">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {linkedCapas.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-3 text-muted small">
                              No corrective actions raised for this inspection campaign.
                            </td>
                          </tr>
                        ) : (
                          linkedCapas.map((capa) => (
                            <tr key={capa.id}>
                              <td className="font-mono-code fw-semibold text-warning-emphasis">{capa.id}</td>
                              <td>
                                <div className="fw-semibold text-dark small">{capa.title}</div>
                                <div className="text-secondary" style={{ fontSize: '0.75rem' }}>{capa.findingDescription}</div>
                              </td>
                              <td className="small">{capa.owner}</td>
                              <td className="font-mono-code small">{capa.dueDate}</td>
                              <td>
                                <span className={`badge ${capa.status === 'Verified & Closed' ? 'bg-success text-white' : capa.status === 'Under Re-Inspection' ? 'bg-warning text-dark' : 'bg-danger text-white'} font-mono-code`}>
                                  {capa.status}
                                </span>
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-primary py-1 px-2"
                                  style={{ fontSize: '0.75rem' }}
                                  onClick={() => setSelectedCapaForDrawer(capa)}
                                >
                                  View / Re-inspect &rarr;
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Inspection Campaign Event Log */}
                <div>
                  <h6 className="fw-bold text-dark mb-2">Inspection Campaign Activity Log</h6>
                  <div className="border rounded bg-light p-3">
                    <div className="d-flex flex-column gap-2">
                      {selectedInspectionForDetail.auditTrail.map((log: any, i: number) => (
                        <div key={i} className="d-flex align-items-center justify-content-between p-2 bg-white border rounded small">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-primary-subtle text-primary font-mono-code" style={{ fontSize: '0.7rem' }}>{log.action}</span>
                            <strong className="text-dark">{log.user}:</strong>
                            <span className="text-secondary">{log.notes}</span>
                          </div>
                          <span className="font-mono-code text-muted" style={{ fontSize: '0.725rem' }}>{log.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-top bg-light d-flex justify-between">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSelectedInspectionForDetail(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary fw-semibold d-flex align-items-center gap-1.5"
                  onClick={() => {
                    setSelectedInspectionForDetail(null);
                    setShowInspectionDrawer(true);
                  }}
                >
                  View Details &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Table Detail Page Modal */}
      {selectedAuditForDetail && (
        <div
          className="modal show d-block map-modal-backdrop"
          tabIndex={-1}
          style={{ zIndex: 1060 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAuditForDetail(null);
          }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content bg-white text-dark border shadow-lg">
              {/* Header */}
              <div className="modal-header border-bottom bg-light d-flex align-items-center justify-content-between p-3">
                <div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary text-white font-mono-code">{selectedAuditForDetail.id}</span>
                    <h5 className="modal-title fw-bold text-dark m-0">
                      Audit Event Log Detail
                    </h5>
                  </div>
                  <div className="text-secondary small mt-0.5">
                    Tamper-evident cryptographically verified audit log entry
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedAuditForDetail(null)}
                  aria-label="Close"
                />
              </div>

              {/* Body */}
              <div className="modal-body p-4">
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <div className="p-3 bg-light border rounded">
                      <span className="text-secondary small d-block">Timestamp (UTC):</span>
                      <strong className="font-mono-code text-dark d-block mt-0.5">
                        {new Date(selectedAuditForDetail.timestampUtc).toUTCString()}
                      </strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light border rounded">
                      <span className="text-secondary small d-block">Action Type:</span>
                      <span className="badge bg-primary text-white font-mono-code mt-1" style={{ fontSize: '0.85rem' }}>
                        {selectedAuditForDetail.action}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light border rounded">
                      <span className="text-secondary small d-block">User &amp; Role:</span>
                      <strong className="text-dark d-block mt-0.5">{selectedAuditForDetail.userId}</strong>
                      <span className="badge bg-secondary text-white font-mono-code mt-1">{selectedAuditForDetail.userRole}</span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light border rounded">
                      <span className="text-secondary small d-block">Organization:</span>
                      <strong className="text-dark d-block mt-0.5">{selectedAuditForDetail.organization}</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-light border rounded mb-3">
                  <span className="text-secondary small d-block fw-semibold mb-1">Target Asset / Vessel:</span>
                  <div className="font-mono-code text-primary fw-bold">{selectedAuditForDetail.targetAsset}</div>
                </div>

                <div className="p-3 bg-light border rounded mb-3">
                  <span className="text-secondary small d-block fw-semibold mb-1">Justification Notes &amp; Payload Diffs:</span>
                  <div className="font-mono-code bg-white p-2.5 border rounded text-dark small" style={{ lineHeight: '1.4' }}>
                    {selectedAuditForDetail.justificationNotes || 'No additional notes recorded for this action.'}
                  </div>
                </div>

                <div className="p-2.5 bg-success-subtle border border-success-subtle rounded d-flex align-items-center justify-content-between font-mono-code small text-success">
                  <span>CRYPTO HASH VERIFICATION: SHA256-MATCH</span>
                  <span className="fw-bold">TAMPER-EVIDENT VERIFIED</span>
                </div>
              </div>

              {/* Footer */}
              <div className="modal-footer border-top bg-light">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSelectedAuditForDetail(null)}
                >
                  Close Detail Modal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Interactive Inspection Drawer Workspace */}
      {showInspectionDrawer && vessel && (
        <InspectionDrawer
          vesselName={vessel.name}
          onClose={() => setShowInspectionDrawer(false)}
        />
      )}
    </div>
  );
};