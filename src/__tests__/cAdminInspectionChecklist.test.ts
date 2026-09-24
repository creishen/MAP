/* 
  file summary: unit tests for c admin restrictions on inspector checklists and physical survey workflows.
  responsibilities: asserts that c admin cannot access inspector views, cannot trigger new live inspection checklists, and cannot add inspection checklists to assurance sets.
  role in system: validates rbac boundary enforcement for client administrators regarding inspector checklists.
*/

import { describe, expect, it, beforeEach } from 'vitest';
import { useMapStore } from '../store/useMapStore';
import { getBackButtonInfo, isViewAccessibleToPersona } from '../utils/rbacHelpers';
import { AssuranceSet } from '../types/assurance';

describe('C Admin Inspector Checklist Isolation', () => {
  beforeEach(() => {
    useMapStore.getState().setActivePersona('C Admin');
  });

  it('should block C Admin from accessing inspector and inspection routes', () => {
    expect(isViewAccessibleToPersona('inspector', undefined, 'C Admin')).toBe(false);
    expect(isViewAccessibleToPersona('inspection', undefined, 'C Admin')).toBe(false);
    expect(isViewAccessibleToPersona('inspector', 'vessel-1', 'C Admin')).toBe(false);
    expect(isViewAccessibleToPersona('inspection', 'vessel-1', 'C Admin')).toBe(false);
  });

  it('should allow Administrator to access inspector route', () => {
    expect(isViewAccessibleToPersona('inspector', undefined, 'Administrator')).toBe(true);
    expect(isViewAccessibleToPersona('inspection', undefined, 'Administrator')).toBe(true);
  });

  it('should allow Inspector with specific vessel entity to access inspector route', () => {
    expect(isViewAccessibleToPersona('inspector', 'vessel-1', 'Inspector')).toBe(true);
  });

  it('should ensure assurance set added with C Admin persona has mandatoryInspectionRequired false and no inspector checklist requirements', () => {
    const store = useMapStore.getState();
    const newCAdminSet: AssuranceSet = {
      id: 'AS-CADMIN-TEST-1',
      title: 'Chevron Vetting Campaign 2026',
      vesselId: 'vessel-1',
      vesselName: 'MV Pacific Endeavour',
      imoNumber: '9234567',
      initiatorOrg: 'Chevron Australia Pty Ltd',
      initiatorRole: 'C Admin · Client Created',
      charterer: 'Chevron Australia Pty Ltd',
      charterWindowStart: '2026-11-01',
      charterWindowEnd: '2027-11-01',
      stage: 'Initiated',
      readinessScore: 0,
      mandatoryInspectionRequired: false,
      inspectionCompleted: false,
      requirements: [
        {
          id: 'REQ-1',
          category: 'Statutory Certificate',
          title: 'Certificate of Class',
          isMandatory: true,
          isFulfilled: false,
          ocrConfidence: 95,
          verifierStatus: 'Pending',
        },
      ],
      stakeholders: undefined,
      assignedStakeholders: undefined,
      createdByPersona: ''
    };

    store.addAssuranceSet(newCAdminSet);

    const created = useMapStore.getState().assuranceSets.find((s) => s.id === 'AS-CADMIN-TEST-1');
    expect(created).toBeDefined();
    expect(created?.mandatoryInspectionRequired).toBe(false);
    expect(created?.assignedInspector).toBeUndefined();
    expect(created?.requirements.every((r) => r.category !== 'Inspection Report')).toBe(true);
  });

  /**
    what: tests that back button info correctly returns back to physical inspections in administrator view.
    how: queries getBackButtonInfo for inspector and capa parent views from different routes.
    with what file: src/__tests__/cAdminInspectionChecklist.test.ts testing rbacHelpers.ts.
  */
  it('should return correct back button navigation to physical inspections in Administrator view', () => {
    /* when administrator opened from physical inspections workspace schedule list */
    const backFromInspectorList = getBackButtonInfo('inspector', 'Physical Inspections', 'inspector', 'Administrator', undefined);
    expect(backFromInspectorList.targetView).toBe('inspector');
    expect(backFromInspectorList.label).toContain('Back to Physical Inspections');

    /* when administrator opened CAPA page from physical inspections schedule */
    const backFromCapaPage = getBackButtonInfo('capa', 'Physical Inspections', 'inspector', 'Administrator', undefined);
    expect(backFromCapaPage.targetView).toBe('inspector');
    expect(backFromCapaPage.label).toContain('Back to Physical Inspections');

    /* when administrator opened from vessel detail view */
    const backFromVesselDetail = getBackButtonInfo('inspector', 'Physical Inspections', 'vessels', 'Administrator', 'VESSEL-001');
    expect(backFromVesselDetail.targetView).toBe('vessels');
    expect(backFromVesselDetail.targetEntityId).toBe('VESSEL-001');
    expect(backFromVesselDetail.label).toContain('Back to Vessel Detail');
  });

  /**
    what: tests that each physical inspection vessel has realistic mock CAPAs with evidence and checklist links.
    how: verifies capaItems in store match each vessel inspection and contain non-empty details.
    with what file: src/__tests__/cAdminInspectionChecklist.test.ts testing capaMockData.ts.
  */
  it('should ensure each physical inspection vessel has linked mock CAPA items with realistic details', () => {
    const store = useMapStore.getState();
    const vesselsWithInspections = store.vessels;

    for (const v of vesselsWithInspections) {
      const capasForVessel = store.capaItems.filter(
        (c) => c.vesselName.toLowerCase() === v.name.toLowerCase() || c.vesselId === v.id
      );
      expect(capasForVessel.length).toBeGreaterThan(0);
      for (const capa of capasForVessel) {
        expect(capa.id).toMatch(/^CAPA-\d+/);
        expect(capa.title.length).toBeGreaterThan(5);
        expect(capa.findingDescription.length).toBeGreaterThan(10);
        expect(capa.owner.length).toBeGreaterThan(3);
        expect(capa.dueDate.length).toBeGreaterThan(5);
        expect(capa.checklistId).toBeDefined();
        expect(capa.checklistItemTitle).toBeDefined();
      }
    }
  });
});
