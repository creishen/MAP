/* 
  file summary: unit test suite validating vessel admin / submitter own vessel isolation.
  responsibilities: verifies rbac filtering ensures submitters and vessel admins only access their own vessels and assurance sets while preventing access to other marine providers.
  role in system: automated regression testing executed via vitest.
*/

import { describe, expect, it } from 'vitest';
import { filterVesselsForPersona, isAssuranceSetAssignedToPersona } from '../utils/rbacHelpers';
import { MOCK_VESSELS, MOCK_ASSURANCE_SETS } from '../store/mockData';
import { VesselParticulars } from '../types/vessel';

describe('vessel admin / submitter fleet ownership isolation', () => {
  it('restricts submitter / vessel admin to only view their own vessels', () => {
    const submitterVessels = filterVesselsForPersona(
      MOCK_VESSELS,
      MOCK_ASSURANCE_SETS,
      'Submitter'
    );

    /* submitter belongs to pacific ocean logistics / northwind marine */
    expect(submitterVessels.length).toBeGreaterThan(0);
    expect(submitterVessels.length).toBeLessThan(MOCK_VESSELS.length);

    /* verify each returned vessel belongs to their company or assigned campaigns */
    submitterVessels.forEach((vessel) => {
      const isOwnedOrManaged =
        vessel.registeredOwner?.toLowerCase().includes('pacific ocean') ||
        vessel.registeredOwner?.toLowerCase().includes('northwind') ||
        vessel.technicalManager?.toLowerCase().includes('pacific ocean') ||
        vessel.technicalManager?.toLowerCase().includes('northwind');

      const isAssigned = MOCK_ASSURANCE_SETS.some(
        (set) =>
          set.vesselId === vessel.id &&
          isAssuranceSetAssignedToPersona(set, 'Submitter')
      );

      expect(isOwnedOrManaged || isAssigned).toBe(true);
    });

    /* verify competitor vessels are excluded */
    const competitorVesselIds = ['VESSEL-003', 'VESSEL-004', 'VESSEL-006', 'VESSEL-007'];
    competitorVesselIds.forEach((id) => {
      const found = submitterVessels.find((v) => v.id === id);
      expect(found).toBeUndefined();
    });
  });

  it('allows administrator to view all vessels in the fleet registry', () => {
    const adminVessels = filterVesselsForPersona(
      MOCK_VESSELS,
      MOCK_ASSURANCE_SETS,
      'Administrator'
    );

    expect(adminVessels.length).toBe(MOCK_VESSELS.length);
  });

  it('filters c admin to only chartered vessels with active assurance sets', () => {
    const cAdminVessels = filterVesselsForPersona(
      MOCK_VESSELS,
      MOCK_ASSURANCE_SETS,
      'C Admin'
    );

    /* verify c admin only gets vessels chartered by their organization */
    cAdminVessels.forEach((vessel) => {
      const hasCharterSet = MOCK_ASSURANCE_SETS.some(
        (set) =>
          set.vesselId === vessel.id &&
          isAssuranceSetAssignedToPersona(set, 'C Admin')
      );
      expect(hasCharterSet).toBe(true);
    });
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
  });
});
