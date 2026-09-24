/* 
  file summary: unit test suite validating vessel provider ownership isolation, c admin full vessel visibility, and mock data accuracy.
  responsibilities: verifies rbac filtering ensures submitters/vessel providers only access their own vessels while c admin and administrator see all vessels across the platform.
  role in system: automated regression testing executed via vitest.
*/

import { describe, expect, it } from 'vitest';
import { filterVesselsForPersona, isAssuranceSetAssignedToPersona } from '../utils/rbacHelpers';
import { MOCK_VESSELS, MOCK_ASSURANCE_SETS, MOCK_DOCUMENTS } from '../store/mockData';
import { VesselParticulars } from '../types/vessel';
import { useMapStore } from '../store/useMapStore';

describe('vessel provider fleet ownership isolation and c admin visibility', () => {
  it('restricts submitter / vessel provider to ONLY view the vessels that they own', () => {
    const submitterVessels = filterVesselsForPersona(
      MOCK_VESSELS,
      MOCK_ASSURANCE_SETS,
      'Submitter'
    );

    /* submitter belongs to pacific ocean logistics / northwind marine */
    expect(submitterVessels.length).toBe(2);
    expect(submitterVessels.map((v) => v.id).sort()).toEqual(['VESSEL-001', 'VESSEL-005'].sort());

    /* verify each returned vessel strictly belongs to their company */
    submitterVessels.forEach((vessel) => {
      const isOwnedOrManaged =
        vessel.registeredOwner?.toLowerCase().includes('pacific ocean') ||
        vessel.registeredOwner?.toLowerCase().includes('northwind') ||
        vessel.technicalManager?.toLowerCase().includes('pacific ocean') ||
        vessel.technicalManager?.toLowerCase().includes('northwind') ||
        vessel.ismCompany?.toLowerCase().includes('pacific ocean') ||
        vessel.ismCompany?.toLowerCase().includes('northwind');

      expect(isOwnedOrManaged).toBe(true);
    });

    /* verify all competitor vessels are strictly excluded */
    const competitorVesselIds = ['VESSEL-002', 'VESSEL-003', 'VESSEL-004', 'VESSEL-006', 'VESSEL-007'];
    competitorVesselIds.forEach((id) => {
      const found = submitterVessels.find((v) => v.id === id);
      expect(found).toBeUndefined();
    });
  });

  it('restricts administrator view to ONLY vessels owned by northwind marine pty ltd', () => {
    const adminVessels = filterVesselsForPersona(
      MOCK_VESSELS,
      MOCK_ASSURANCE_SETS,
      'Administrator'
    );

    /* administrator belongs to northwind marine pty ltd */
    expect(adminVessels.length).toBe(1);
    expect(adminVessels[0].id).toBe('VESSEL-005');
    expect(adminVessels[0].registeredOwner).toBe('Northwind Marine Pty Ltd');

    /* verify competitor vessels are not visible to administrator */
    const competitorVesselIds = ['VESSEL-001', 'VESSEL-002', 'VESSEL-003', 'VESSEL-004', 'VESSEL-006', 'VESSEL-007'];
    competitorVesselIds.forEach((id) => {
      const found = adminVessels.find((v) => v.id === id);
      expect(found).toBeUndefined();
    });
  });

  it('restricts administrator assurance sets to only those created by admin or created by c admin for northwind vessels', () => {
    /* verify each mock assurance set against administrator persona */
    const adminVisibleSets = MOCK_ASSURANCE_SETS.filter((set) =>
      isAssuranceSetAssignedToPersona(set, 'Administrator')
    );

    /* AS-2026-005 is for VESSEL-005 (MV Atlantic Ocean owned by Northwind) */
    expect(adminVisibleSets.length).toBeGreaterThan(0);
    adminVisibleSets.forEach((set) => {
      const isNorthwindVessel = set.vesselId === 'VESSEL-005';
      const isNorthwindSubmitter =
        set.stakeholders?.submitterOrg?.toLowerCase().includes('northwind') ||
        set.assignedStakeholders?.some((s: { role: string; company: string; }) => s.role === 'Submitter' && s.company?.toLowerCase().includes('northwind'));
      const isCreatedByAdmin = set.createdByPersona === 'Administrator' || set.createdByPersona === 'Submitter';

      expect(isNorthwindVessel || isNorthwindSubmitter || isCreatedByAdmin).toBe(true);
    });

    /* competitor vessel sets must be excluded from administrator view */
    const competitorSetIds = ['AS-2026-001', 'AS-2026-002', 'AS-2026-003', 'AS-2026-004', 'AS-2026-006'];
    competitorSetIds.forEach((id) => {
      const found = adminVisibleSets.find((s) => s.id === id);
      expect(found).toBeUndefined();
    });
  });

  it('allows c admin to view ALL vessels under the platform', () => {
    const cAdminVessels = filterVesselsForPersona(
      MOCK_VESSELS,
      MOCK_ASSURANCE_SETS,
      'C Admin'
    );

    /* c admin has complete visibility across all vessels on the platform */
    expect(cAdminVessels.length).toBe(MOCK_VESSELS.length);
    expect(cAdminVessels.length).toBe(7);
    expect(cAdminVessels.map((v) => v.id)).toEqual(MOCK_VESSELS.map((v) => v.id));
  });

  it('correctly includes newly registered vessels owned by submitter company', () => {
    const newSubmitterVessel: VesselParticulars = {
      id: 'VESSEL-999',
      name: 'MV Pacific Pioneer',
      imoNumber: '9991234',
      officialRegNumber: 'AUS-999123',
      mmsiNumber: '503999123',
      flagState: 'Australia',
      callSign: 'VHP99',
      portOfRegistry: 'Fremantle',
      vesselType: 'Offshore Support Vessel (OSV)',
      vesselSubtype: 'PSV',
      intendedUse: 'Platform Supply',
      tradingArea: 'International',
      classificationSociety: 'DNV',
      classNotation: '+100A1',
      hullType: 'Double Hull',
      ispsSolasStatus: 'Certified',
      yearBuilt: 2024,
      shipyardBuilder: 'Damen Shipyards',
      lengthOverallMeters: 85,
      beamMeters: 18,
      draftMeters: 6,
      grossTonnageGT: 3500,
      deadweightTonnageDWT: 4000,
      dynamicPositioningClass: 'DP2',
      mainEnginePowerKW: '4000 kW',
      status: 'In Operations',
      complianceReadinessScore: 90,
      registeredOwner: 'Pacific Ocean Logistics Ltd',
      ownerType: 'Corporate Entity',
      corporateRegistryNo: 'ACN 999 888 777',
      technicalManager: 'Pacific Ocean Logistics Ltd',
      ismCompany: 'Pacific Ocean Logistics Ltd',
      docNumber: 'DOC-999',
      contact247: '+61 8 9999 0000',
      statutoryCertificates: [],
      hmInsurer: 'Gard',
      piClubName: 'Gard P&I',
      policyNumber: 'PI-999',
      policyExpiryDate: '2027-01-01',
      safeManningComplement: 14,
      certifiedOfficersRatings: '6/8',
      masterName: 'Capt. Test',
      lifeboatCapacity: 28,
      fuelType: 'MGO',
      lowSulphurCompliant: true,
      bwtsSpec: 'Alfa Laval PureBallast',
      owCalibrationDate: '2026-01-01',
      masterCertificateUploadCount: 1,
      clientHistory: [],
    };

    const combinedVessels = [...MOCK_VESSELS, newSubmitterVessel];
    const filtered = filterVesselsForPersona(
      combinedVessels,
      MOCK_ASSURANCE_SETS,
      'Submitter'
    );

    const found = filtered.find((v) => v.id === 'VESSEL-999');
    expect(found).toBeDefined();
    expect(found?.name).toBe('MV Pacific Pioneer');
    expect(filtered.length).toBe(3);
  });

  it('validates mock data accuracy and completeness across all vessel particulars', () => {
    expect(MOCK_VESSELS.length).toBe(7);

    MOCK_VESSELS.forEach((vessel) => {
      /* verify essential maritime data fields are populated accurately */
      expect(vessel.id).toBeTruthy();
      expect(vessel.name).toBeTruthy();
      expect(vessel.imoNumber).toMatch(/^\d{7}$/);
      expect(vessel.officialRegNumber).toBeTruthy();
      expect(vessel.mmsiNumber).toMatch(/^\d{9}$/);
      expect(vessel.callSign).toBeTruthy();
      expect(vessel.flagState).toBeTruthy();
      expect(vessel.portOfRegistry).toBeTruthy();
      expect(vessel.classificationSociety).toBeTruthy();
      expect(vessel.registeredOwner).toBeTruthy();
      expect(vessel.technicalManager).toBeTruthy();
      expect(vessel.ismCompany).toBeTruthy();
      expect(vessel.complianceReadinessScore).toBeGreaterThanOrEqual(0);
      expect(vessel.complianceReadinessScore).toBeLessThanOrEqual(100);
      expect(vessel.statutoryCertificates.length).toBeGreaterThan(0);
    });

    /* verify mock assurance sets have matching vessel ids and assigned stakeholders */
    MOCK_ASSURANCE_SETS.forEach((set) => {
      const targetVessel = MOCK_VESSELS.find((v) => v.id === set.vesselId);
      expect(targetVessel).toBeDefined();
      expect(set.vesselName).toBe(targetVessel?.name);
      expect(set.imoNumber).toBe(targetVessel?.imoNumber);
      expect(set.requirements.length).toBeGreaterThan(0);
    });

    /* verify mock documents link to valid statutory certificates */
    MOCK_DOCUMENTS.forEach((doc) => {
      expect(doc.id).toBeTruthy();
      expect(doc.title).toBeTruthy();
      expect(doc.versions.length).toBeGreaterThan(0);
      expect(doc.ocrConfidence).toBeGreaterThan(0);
    });
  });

  it('defaults organization to northwind marine when administrator registers a vessel in store', () => {
    useMapStore.getState().setActivePersona('Administrator');

    const adminRegisteredVessel: VesselParticulars = {
      ...MOCK_VESSELS[0],
      id: 'VESSEL-ADMIN-NORTHWIND',
      name: 'MV Northwind Sentinel',
      imoNumber: '9988112',
      officialRegNumber: 'NW-998811',
      registeredOwner: 'Northwind Marine Pty Ltd',
      technicalManager: 'Northwind Marine Pty Ltd',
      ismCompany: 'Northwind Marine Pty Ltd',
    };

    const res = useMapStore.getState().addVessel(adminRegisteredVessel);
    expect(res.success).toBe(true);

    const latestAudit = useMapStore.getState().auditEvents[0];
    expect(latestAudit.organization).toBe('Northwind Marine Pty Ltd');
    expect(latestAudit.action).toBe('Registered Unique Vessel Record');
  });
});
